import { Tiny, TinyInfo } from "../services/tinyService.js";
import { tenantRepository } from "../repository/tenantRepository.js";
import { NfeRepository } from "../repository/nfeRepository.js";
import { xmlParser } from "../utils/xmlParser.js";
import { lib } from "../utils/lib.js";

async function init() {
  let tenants = await tenantRepository.getAllTenantSystem();
  for (let tenant of tenants) {
    await importarNotaFiscais(tenant);
    await importarXml(tenant);
  }
}

async function importarNotaFiscais(tenant) {
  let tiny = new Tiny({ token: tenant.tiny_token, timeout: 1000 * 12 });
  let info = new TinyInfo({ instance: tiny });
  let result = null;
  let response = null;
  let tipoNota = "S"; //Saida
  let dataInicial = await info.getDataInicial();
  let dataFinal = await info.getDataFinal();
  // IMPORTANTE
  //estou importando apenas as notas fiscais de saida
  //para calcular a comissao so consideras as notas de venda .

  const numero_paginas = await info.getPaginasNotaFiscal(
    tipoNota,
    dataInicial,
    dataFinal,
  );

  const nfeRepository = new NfeRepository();

  for (let pagina = 1; pagina <= numero_paginas; pagina++) {
    console.log(`Importando Notas Fiscais ${pagina} de ${numero_paginas}`);

    response = null;
    for (let t = 0; t < 12; t++) {
      result = await tiny.post("notas.fiscais.pesquisa.php", [
        { key: "tipoNota", value: tipoNota },
        { key: "dataInicial", value: dataInicial },
        { key: "dataFinal", value: dataFinal },
        { key: "pagina", value: pagina },
      ]);
      response = await tiny.tratarRetorno(result, "notas_fiscais");
      if (tiny.status() == "OK") break;
    }

    if (!Array.isArray(response)) continue;

    for (let item of response) {
      let nota_fiscal = item.nota_fiscal;
      let situacao = nota_fiscal.descricao_situacao || "";
      let nfe = await nfeRepository.findById(nota_fiscal.id);
      nota_fiscal.tipoVenda = "";

      if (nfe?.id) {
        console.log(`Nota Fiscal ${nota_fiscal.id} já importada`);
        let linhaApi = montarLinhaNotaFiscal(nota_fiscal);
        let linhaBanco = montarLinhaNotaFiscal(nfe);

        // Se valor+situacao mudaram entre API e banco, remove para reimportar.
        if (linhaBanco !== linhaApi) {
          await nfeRepository.delete(nota_fiscal.id);
          console.log(
            `Nota Fiscal ${nota_fiscal.id} excluida para reimportacao: ${linhaBanco} -> ${linhaApi}`,
          );
        } else {
          // Se já existe e a composição é a mesma, não reimportar.
          continue;
        }
      }

      // Não importar se a nota fiscal está invalidada (vinda da API)
      if (isNotaFiscalInvalidada(situacao)) {
        console.log(
          `Nota Fiscal ${nota_fiscal.id} não será importada - Situação: ${situacao}`,
        );
        continue;
      }

      console.log(
        `Importando nfe  ${nota_fiscal.id} - ${nota_fiscal.numero} - ${nota_fiscal.data_emissao}`,
      );

      let obj = { ...nota_fiscal, id_tenant: tenant.id, id_empresa: tenant.id };
      await nfeRepository.update(obj.id, obj);
    }
  }
}

async function importarXml(tenant) {
  let tiny = new Tiny({ token: tenant.tiny_token, timeout: 1000 * 12 });
  let xml = null;

  const nfeRepository = new NfeRepository();
  let rows = await nfeRepository.findAll({ id_tenant: tenant.id, sys_xml: 0 });

  for (let row of rows) {
    console.log(
      `Importando XML ${row.id} de ${row.numero} - ${row.data_emissao}`,
    );

    xml = null;
    for (let t = 0; t < 12; t++) {
      let res = await tiny.post("nota.fiscal.obter.xml.php", [
        { key: "id", value: row.id },
      ]);
      xml = res?.data;
      if (xml) break;
    }
    if (!xml) continue;

    try {
      xmlParser.parser.parseString(xml, async function (err, result) {
        if (err) {
          console.log(err);
          return;
        }
        let nfeXml = await lib.extrairXmlNotaFiscal(result);

        //extraindo os dados da nota fiscal
        const xmlOriginal = JSON.parse(JSON.stringify(nfeXml));
        let { infNFe: nfe } = nfeXml?.nfeProc?.NFe;
        if (!Array.isArray(nfe?.det)) nfe.det = [nfe.det];

        row.natOp = nfe?.ide?.natOp;
        row.ICMSTot = nfe?.total?.ICMSTot;
        row.itens = nfe?.det ? nfe.det : [];
        row.xml = xmlOriginal;
        row.sys_xml = 1;
        row.sys_status = 1;
        row.tipoVenda = await obterTipoVenda(row?.itens);
        await nfeRepository.update(row.id, row);
      });
    } catch (error) {
      console.log(error);
    }
    await lib.sleep(1000 * 1);
  }
}

function isNotaFiscalInvalidada(situacao) {
  const situacoesInvalidas = ["Denegada", "Cancelada", "Rejeitada"];
  return situacoesInvalidas.includes(situacao);
}

function obterSituacaoNotaFiscal(nfe = {}) {
  return nfe?.descricao_situacao || nfe?.situacao || "";
}

function obterValorNotaFiscal(nfe = {}) {
  return nfe?.valor_nota || nfe?.valor || nfe?.total || nfe?.valor_total || "";
}

function montarLinhaNotaFiscal(nfe = {}) {
  const situacao = obterSituacaoNotaFiscal(nfe);
  const valor = String(obterValorNotaFiscal(nfe) ?? "").trim();
  return `${valor}|${situacao}`;
}

async function obterTipoVenda(items = []) {
  let result = "D";
  if (!Array.isArray(items)) return result;
  for (let item of items) {
    let cfop = item?.prod?.CFOP;
    if (lib.isCFOPVenda(cfop)) {
      return "V";
    }
  }
  return result;
}

async function ajustarNotaFiscal(tenant) {
  let tiny = new Tiny({ token: tenant.tiny_token, timeout: 1000 * 12 });
  const nfeRepository = new NfeRepository();
  let rows = await nfeRepository.findAll({ id_tenant: tenant.id });

  for (let row of rows) {
    console.log(
      `Retificando nota fiscal ${row.id} de ${row.numero} - ${row.data_emissao}`,
    );

    row.tipoVenda = await obterTipoVenda(row?.itens);

    await nfeRepository.update(row.id, {
      tipoVenda: row.tipoVenda,
      sys_xml: row.sys_xml,
      sys_status: row.sys_status,
    });
  }
}

export const nfeController = {
  init,
};
