import { TMongo } from "../infra/mongoClient.js";
import { lib } from "../utils/lib.js";

import { tenantRepository } from "./tenantRepository.js";
import { ecommerceRepository } from "./ecommerceRepository.js";
import { vendedorRepository } from "./vendedorRepository.js";
import { logRepository } from "./logRepository.js";
import { CustomerRepository } from "./customerRepository.js";
import { TNfeTypes } from "../types/nfeTypes.js";
import { productController } from "../controller/productController.js";
import { TributacaoMappers } from "../mappers/tributacaoMappers.js";
import { tinyRepository } from "./tinyRepository.js";
import { xmlParser } from "../utils/xmlParser.js";

let LIST_OF_PRODUCTS = [];
let DATE_LIST_OF_PRODUCTS = null;
async function init() {
  //Mover comandos para ca
}

async function getSummaryItens(data) {
  let totalItens = {
    sum_qtd_itens: 0,
    sum_nfe_total_preco_custo: 0,
    sum_nfe_total_preco_custo_medio: 0,
    sum_nfe_total_preco: 0,
    sum_nfe_valor_bruto_produto: 0,
    sum_nfe_quantidade: 0,
    sum_nfe_valor_total: 0,
    sum_nfe_desconto: 0,
    sum_nfe_frete: 0,
    sum_nfe_outras: 0,
    sum_nfe_custo_canal: 0,
    sum_nfe_icms: 0,
    sum_nfe_ipi: 0,
    sum_nfe_pis: 0,
    sum_nfe_cofins: 0,
    sum_nfe_difal: 0,
    sum_nfe_fcp: 0,
    sum_nfe_total_imposto: 0,
    sum_nfe_valor_lucro_bruto: 0,
    sum_nfe_lucro_liquido: 0,
    sum_nfe_perc_lucro_bruto: 0,
    sum_nfe_perc_lucro_liquido: 0,
  };

  data?.forEach((el) => {
    totalItens.sum_qtd_itens++;

    (totalItens.sum_nfe_total_preco_custo += el.nfe_total_preco_custo),
      (totalItens.sum_nfe_total_preco_custo_medio +=
        el.nfe_total_preco_custo_medio),
      (totalItens.sum_nfe_total_preco += el.nfe_total_preco),
      (totalItens.sum_nfe_valor_bruto_produto += el.nfe_valor_bruto_produto),
      (totalItens.sum_nfe_quantidade += el.nfe_quantidade),
      (totalItens.sum_nfe_valor_total += el.nfe_valor_total),
      (totalItens.sum_nfe_desconto += el.nfe_desconto),
      (totalItens.sum_nfe_frete += el.nfe_frete),
      (totalItens.sum_nfe_outras += el.nfe_outras),
      (totalItens.sum_nfe_custo_canal += el.nfe_custo_canal),
      (totalItens.sum_nfe_icms += el.nfe_icms),
      (totalItens.sum_nfe_ipi += el.nfe_ipi),
      (totalItens.sum_nfe_pis += el.nfe_pis),
      (totalItens.sum_nfe_cofins += el.nfe_cofins),
      (totalItens.sum_nfe_difal += el.nfe_difal),
      (totalItens.sum_nfe_fcp += el.nfe_fcp),
      (totalItens.sum_nfe_total_imposto += el.nfe_total_imposto),
      (totalItens.sum_nfe_valor_lucro_bruto += el.nfe_valor_lucro_bruto),
      (totalItens.sum_nfe_lucro_liquido += el.nfe_lucro_liquido);

    totalItens.sum_nfe_perc_lucro_bruto = lib.obter_percentual(
      totalItens.sum_nfe_valor_total,
      totalItens.sum_nfe_valor_lucro_bruto
    );
    totalItens.sum_nfe_perc_lucro_liquido = lib.obter_percentual(
      totalItens.sum_nfe_valor_total,
      totalItens.sum_nfe_lucro_liquido
    );
  });

  return totalItens;
}

async function controlOfListProducts() {
  if (DATE_LIST_OF_PRODUCTS == null) {
    DATE_LIST_OF_PRODUCTS = new Date().getDate();
  } else if (LIST_OF_PRODUCTS.length > 500) {
    LIST_OF_PRODUCTS = [];
  } else if (new Date().getDate() != DATE_LIST_OF_PRODUCTS) {
    DATE_LIST_OF_PRODUCTS = new Date().getDate();
    LIST_OF_PRODUCTS = [];
  }
}

async function updateProdutoNotaFiscal(id_tenant, items) {
  await controlOfListProducts();
  if (!items) return null;
  for (let item of items) {
    if (LIST_OF_PRODUCTS.includes(item.codigo)) continue;

    let prod = await productController.getProductDetailBySku(
      id_tenant,
      item.codigo
    );

    if (prod && prod?.id) {
      await lib.sleep(1000 * 3);
      await productController.updateProductDetailOne(id_tenant, prod?.id);
      LIST_OF_PRODUCTS.push(item.codigo);
    }
  }
}

async function recalcular_total_nfe() {
  console.log("Recalculando total_nfe");
  let limits = 1000;
  let page_count = 1000;

  for (let page = 1; page < page_count; page++) {
    console.log(" Pagina : " + page);
    let skip = limits * (page - 1);

    let filter = {};

    let client = await TMongo.connect();
    let notas = await client
      .collection("nota_fiscal")
      .find(filter)
      .skip(skip)
      .limit(limits)
      .toArray();

    console.log(
      "Obtendo pagina e total de registros : " + page + " - " + notas.length
    );

    if (notas.length == 0) break;

    for (let nota of notas) {
      //***************************************************************************** */
      //Localizar nome ecommerce.
      //***************************************************************************** */

      let obj = null;
      let nomeEcommerce = nota.order?.ecommerce?.nomeEcommerce;

      if (nomeEcommerce != "")
        obj = await ecommerceRepository.obterEcommerce(
          nota.id_tenant,
          nomeEcommerce
        );
      let nome_ecommerce = obj?.nomeEcommerce
        ? obj?.nomeEcommerce
        : "Loja Fisica";
      let id_ecommerce = obj?.id ? obj?.id : null;
      nota.nome_ecommerce = nome_ecommerce;
      nota.id_ecommerce = id_ecommerce;
      //***************************************************************************** */
      nota.data_movto = lib.dateBrToIso8601(nota.data_emissao);

      let itens = [];
      for (let item of nota.itens) {
        item.data_movto = nota.data_movto;
        item.id_ecommerce = nota.id_ecommerce;
        item.nome_ecommerce = nota.nome_ecommerce;
        item.data_emissao = nota.data_emissao;
        item.id_tenant = nota.id_tenant;
        item.nfe_valor_total = lib.round(
          item.nfe_valor_unitario * item.nfe_quantidade -
            item.nfe_desconto +
            item.nfe_outras +
            item.nfe_frete
        );

        item.nfe_lucro_liquido = lib.round(
          item.nfe_valor_total -
            item.nfe_frete - // confirmado com Anderson 23-01-2024
            item.nfe_total_imposto -
            item.nfe_custo_canal -
            item.nfe_total_preco_custo
        );

        item.nfe_total_preco_custo = lib.round(
          item.nfe_preco_custo * item.nfe_quantidade
        );

        item.nfe_valor_lucro_bruto = lib.round(
          item.nfe_valor_total - item.nfe_total_preco_custo
        );

        //aqui para achar os %**************************************************
        let valor_venda = Number(
          item.nfe_valor_total ? item.nfe_valor_total : "0"
        );
        let lucro_liquido = Number(
          item.nfe_lucro_liquido ? item.nfe_lucro_liquido : "0"
        );

        item.nfe_perc_lucro_liquido = lib.obter_percentual(
          valor_venda,
          lucro_liquido
        );
        item.nfe_perc_lucro_bruto = lib.obter_percentual(
          valor_venda,
          item.nfe_valor_lucro_bruto
        );
        //Fim para achar os %**************************************************
        itens.push(item);
      }
      nota.itens = itens;
      let summaryItens = await getSummaryItens(itens);

      nota = {
        ...nota,
        ...summaryItens,
      };

      console.log(nota.data_emissao);
      await client
        .collection("nota_fiscal")
        .updateOne({ _id: nota._id }, { $set: nota });
    }
  }
}

async function saveNfeXml(
  id_tenant,
  id_nota_fiscal,
  order,
  nfeXml,
  notafiscal
) {
  if (!nfeXml || !notafiscal || nfeXml == null || notafiscal == null) return;
  //Revisao em 25-07-2024 Developer Systems - Oteniel Pinto
  let situacaoNfe = notafiscal.situacao;
  let situacaoLista = ["2", "6", "7"];

  if (!situacaoLista.includes(situacaoNfe)) {
    return console.log(
      "NFe não autorizada " +
        `[${id_tenant}] NFe numero : ${id_nota_fiscal} - ${order.data_pedido.toLocaleString()}`
    );
  }

  console.log(
    `[${id_tenant}] NFe numero : ${id_nota_fiscal} - ${order.data_pedido.toLocaleString()}`
  );
  let tenant_pai = await tenantRepository.getTenantPai(id_tenant);
  if (tenant_pai == 0) tenant_pai = id_tenant;

  let orderEcommece = order.ecommerce
    ? order.ecommerce
    : {
        id: String(id_tenant),
        nomeEcommerce: "Loja Fisica",
      };
  await ecommerceRepository.validateEcommerce(id_tenant, orderEcommece);
  let nomeEcommerce = orderEcommece.nomeEcommerce
    ? orderEcommece.nomeEcommerce
    : "";
  let ecom_tac = 0;
  let ecom_comissao = 0;
  let ecom_valor_venda_minimo = 0;
  let ecom_tac_adicional = 0;
  let aux_tac_adicional = 0;
  let valor_nota = Number(notafiscal.valor_nota ? notafiscal.valor_nota : "0");

  let ecommerce = null;
  if (nomeEcommerce != "")
    ecommerce = await ecommerceRepository.obterEcommerce(
      id_tenant,
      nomeEcommerce
    );

  if (orderEcommece && !ecommerce) {
    await logRepository.saveLog({
      id_tenant,
      message: "Ecommerce '" + nomeEcommerce + "' não encontrado",
      orderEcommece,
    });
    return;
  }

  if (ecommerce) {
    ecom_tac = ecommerce.tac ? ecommerce.tac : 0;
    ecom_comissao = ecommerce.comissao ? ecommerce.comissao : 0;
    ecom_tac_adicional = ecommerce.tac_adicional ? ecommerce.tac_adicional : 0;
    ecom_valor_venda_minimo = ecommerce.valor_venda_minimo
      ? ecommerce.valor_venda_minimo
      : 0;

    if (ecommerce.situacao == 0) {
      await logRepository.saveLog({
        id_tenant,
        message: 'ecommerce desabilitado "' + nomeEcommerce + '"',
        orderEcommece,
      });
      return;
    }

    if (ecommerce.mercado_livre == 1) {
      //buscar a taxa da comissao do ecommerce
    }

    if (ecom_valor_venda_minimo > 0 && valor_nota < ecom_valor_venda_minimo) {
      aux_tac_adicional = ecom_tac_adicional;
    }
  }

  let id_vendedor = order?.id_vendedor ? order?.id_vendedor : 0;
  let nome_vendedor = order?.nome_vendedor ? order?.nome_vendedor : "";
  let nome_ecommerce = ecommerce?.nomeEcommerce;
  let id_ecommerce = ecommerce?.id;
  let cliente = notafiscal?.cliente;
  let nfe_numero = notafiscal?.numero;
  let id_pai = lib.newUUId();
  let data_emissao = notafiscal.data_emissao;
  let data_movto = lib.dateBrToIso8601(data_emissao);
  if (!data_movto) data_movto = new Date();

  try {
    await updateOrInsertCliente(id_tenant, cliente);
  } catch (error) {}

  try {
    await vendedorRepository.saveVendedorMongo(
      id_tenant,
      id_vendedor,
      nome_vendedor
    );
  } catch (error) {}

  //Precisa ser assim , preciso guardar exatamente como veio na nfe
  const xmlOriginal = JSON.parse(JSON.stringify(nfeXml));
  let { infNFe: nfe } = nfeXml?.nfeProc?.NFe;
  if (!Array.isArray(nfe?.det)) nfe.det = [nfe.det];

  let emit = nfe.emit;
  let isSimplesNacional = emit?.CRT == "1" ? 1 : 0;
  let icms, ipi, pis, cofins, prod, ICMSUFDest;

  let items = [];
  for (let det of nfe.det) {
    prod = det.prod;
    icms = TributacaoMappers.newIcms();
    ipi = TributacaoMappers.newIpi();
    pis = TributacaoMappers.newPis();
    cofins = TributacaoMappers.newCofins();
    ICMSUFDest = TributacaoMappers.newICMSUFDest();
    if (det?.imposto?.ICMSUFDest) ICMSUFDest = det?.imposto?.ICMSUFDest;

    if (isSimplesNacional == 1) {
      //empresa do simples nacional
    } else {
      if (det?.imposto?.ICMS) {
        for (const [key, value] of Object.entries(det?.imposto?.ICMS)) {
          icms = { ...value };
        }
      }
      if (det?.imposto?.IPI) ipi = det?.imposto?.IPI;
      if (det?.imposto?.PIS) {
        for (const [key, value] of Object.entries(det?.imposto?.PIS)) {
          pis = { ...value };
        }
      }
      if (det?.imposto?.COFINS) {
        for (const [key, value] of Object.entries(det?.imposto?.COFINS)) {
          cofins = { ...value };
        }
      }
    }

    items.push({
      ...prod,
      icms,
      ipi,
      pis,
      cofins,
      ...ICMSUFDest,
    });
  } // nfe.det

  let ICMSTot = nfe?.total?.ICMSTot;
  notafiscal.ICMSTot = ICMSTot;
  nfe.det = items;

  let newItem = [];
  let qtProduto = notafiscal?.itens.length ? notafiscal?.itens.length : 1;
  if (aux_tac_adicional > 0 && qtProduto > 0)
    aux_tac_adicional = lib.round(aux_tac_adicional / qtProduto);
  if (ecom_tac > 0 && qtProduto > 0) ecom_tac = lib.round(ecom_tac / qtProduto);

  //Atualização de custos diariamente   06-03-2024
  //------------------------------------------------------
  await updateProdutoNotaFiscal(tenant_pai, notafiscal?.itens);
  //------------------------------------------------------

  for (let x of notafiscal?.itens) {
    let item = x.item;
    let prod = await getProdutoByCodigo(tenant_pai, item.codigo);
    if (prod.descricao_complementar) prod.descricao_complementar = "";
    if (prod.seo_description) prod.seo_description = "";
    if (prod.seo_keywords) prod.seo_keywords = "";
    if (prod.slug) prod.slug = "";
    if (prod.obs) prod.obs = "";
    if (prod.link_video) prod.link_video = "";
    if (prod.seo_title) prod.seo_title = "";
    if (prod.anexos) prod.anexos = [];
    if (prod._id) delete prod._id; //remover _id do objeto
    if (prod.id_tenant) delete prod.id_tenant;

    let custo = parseFloat(prod.preco_custo ? prod.preco_custo : "0");
    if (custo <= 0) {
      custo = Number(item.valor_unitario - 0.01);
      try {
        await lib.sleep(1000 * 3);
        await productController.updateProductDetailOne(tenant_pai, prod?.id);
      } catch (error) {}
    }
    custo = lib.round(custo);
    let custo_medio = parseFloat(
      prod.preco_custo_medio ? prod.preco_custo_medio : "0"
    );

    if (custo_medio <= 0) {
      custo_medio = custo;
    }
    custo_medio = lib.round(custo_medio);
    let nfe_preco = Number(prod.preco ? prod.preco : "0");
    let nfe_preco_custo = custo;
    let nfe_preco_custo_medio = custo_medio;
    if (nfe_preco <= 0) nfe_preco = Number(item.valor_unitario);
    nfe_preco = lib.round(nfe_preco);
    let quantidade = parseFloat(item.quantidade ? item.quantidade : "0");
    let nfe_total_preco_custo = lib.round(nfe_preco_custo * quantidade);
    let nfe_total_preco_custo_medio = lib.round(
      nfe_preco_custo_medio * quantidade
    );
    let nfe_total_preco = lib.round(nfe_preco * quantidade);
    let nfe_id_produto = item.id_produto;
    let nfe_codigo = item.codigo;
    let nfe_descricao = item.descricao;
    let nfe_unidade = item.unidade;
    let nfe_ncm = item.ncm;
    let nfe_quantidade = Number(item.quantidade);
    let nfe_valor_unitario = Number(item.valor_unitario);
    let nfe_valor_total = Number(item.valor_total); // desse valor precisa incluir o desconto no calculo
    let nfe_valor_bruto_produto = Number(item.valor_total);
    let nfe_cfop = item.cfop;
    let nfe_natureza = item.natureza;
    let nfe_desconto = 0;
    let nfe_frete = 0;
    let nfe_outras = 0;
    let nfe_custo_canal = 0;
    //testar qdo. produto for repetido
    let trib = {};
    for (let det of nfe.det) {
      let vProd = det.vProd ? Number(det.vProd) : 0;

      if (det.cProd == item.codigo) {
        trib = det;
        break;
      } else if (qtProduto == 1) {
        trib = det;
        break;
      } else if (vProd == nfe_valor_total) {
        trib = det;
        break;
      }
    }

    if (trib.vFrete) nfe_frete = Number(trib.vFrete);
    if (trib.vDesc) nfe_desconto = Number(trib.vDesc);
    if (trib.vOutro) nfe_outras = Number(trib.vOutro);

    //Cuidado , logo abaixo tem calculos que consideram o nfe_valor_total
    nfe_valor_total = lib.round(
      nfe_valor_bruto_produto - nfe_desconto + nfe_frete + nfe_outras
    );
    let nfe_icms = Number(trib.icms.vICMS ? trib.icms.vICMS : 0);
    let nfe_perc_icms = Number(trib.icms.pICMS ? trib.icms.pICMS : 0);
    let nfe_ipi = Number(trib.ipi.vIPI ? trib.ipi.vIPI : 0);
    let nfe_pis = Number(trib.pis.vPIS ? trib.pis.vPIS : 0);
    let nfe_cofins = Number(trib.cofins.vCOFINS ? trib.cofins.vCOFINS : 0);
    let nfe_difal = Number(trib.vICMSUFDest ? trib.vICMSUFDest : 0);
    let nfe_fcp = Number(trib.vFCPUFDest ? trib.vFCPUFDest : 0);
    // pegar do parametro da empresa , penso que empresa do simples isso nao existe !!!  25-07-2024
    if (emit?.enderEmit?.UF != notafiscal?.cliente?.uf) {
      if (nfe_icms > 0) {
        nfe_perc_icms = 1.1;
        nfe_icms = lib.round((nfe_valor_total * nfe_perc_icms) / 100);
      }
    }

    let nfe_total_imposto = lib.round(
      nfe_icms + nfe_ipi + nfe_pis + nfe_cofins + nfe_difal + nfe_fcp
    );

    //Informo que o ecom_tac + aux_tac_adicional foi divido pela quantidade de produtos
    let aux_comissao = 0;
    if (ecom_comissao > 0) {
      aux_comissao = lib.round(nfe_valor_total * (ecom_comissao / 100));
    }
    nfe_custo_canal = lib.round(ecom_tac + aux_tac_adicional + aux_comissao);

    let nfe_lucro_liquido = lib.round(
      nfe_valor_total -
        nfe_total_imposto -
        nfe_custo_canal -
        nfe_total_preco_custo -
        nfe_frete // confirmado com Anderson  23-01-2024
    );
    let valor_venda = Number(nfe_valor_total ? nfe_valor_total : "0");
    let lucro_liquido = Number(nfe_lucro_liquido ? nfe_lucro_liquido : "0");
    let nfe_perc_lucro_liquido = lib.obter_percentual(
      valor_venda,
      lucro_liquido
    );

    let nfe_valor_lucro_bruto = lib.round(
      nfe_valor_total - nfe_total_preco_custo
    );

    let nfe_perc_lucro_bruto = lib.obter_percentual(
      valor_venda,
      nfe_valor_lucro_bruto
    );

    //Informacao duplicada ( sim , para agilizar as consultas )
    newItem.push({
      id_tenant,
      data_movto,
      data_emissao,
      nfe: item,
      trib,
      ...prod,
      id_pai,
      id_filho: lib.newUUId(),
      nfe_numero,
      nfe_preco,
      nfe_preco_custo,
      nfe_preco_custo_medio,
      nfe_total_preco_custo,
      nfe_total_preco_custo_medio,
      nfe_total_preco,
      nfe_valor_bruto_produto,
      nfe_id_produto,
      nfe_codigo,
      nfe_descricao,
      nfe_unidade,
      nfe_ncm,
      nfe_quantidade,
      nfe_valor_unitario,
      nfe_valor_total,
      nfe_cfop,
      nfe_natureza,
      nfe_desconto,
      nfe_frete,
      nfe_outras,
      nfe_custo_canal,
      nfe_icms,
      nfe_perc_icms,
      nfe_ipi,
      nfe_pis,
      nfe_cofins,
      nfe_difal,
      nfe_fcp,
      nfe_total_imposto,
      nfe_valor_lucro_bruto,
      nfe_perc_lucro_bruto,
      nfe_lucro_liquido,
      nfe_perc_lucro_liquido,
      id_vendedor,
      nome_vendedor,
      id_ecommerce,
      nome_ecommerce,
      ...cliente,
    });
  }
  notafiscal.itens = newItem;
  let summaryItens = await getSummaryItens(newItem);
  if (notafiscal.id_ecommerce) delete notafiscal.id_ecommerce;
  if (notafiscal.nome_ecommerce) delete notafiscal.nome_ecommerce;
  if (notafiscal.id_vendedor) delete notafiscal.id_vendedor;
  if (notafiscal.nome_vendedor) delete notafiscal.Nome_vendedor;

  notafiscal.id_vendedor = id_vendedor;
  notafiscal.nome_vendedor = nome_vendedor;
  notafiscal.id_ecommerce = id_ecommerce;
  notafiscal.nome_ecommerce = nome_ecommerce;

  let body = {
    id: id_nota_fiscal,
    id_tenant: id_tenant,
    id_pai,
    data_movto,
    order,
    emit,
    xml: xmlOriginal,
    ...notafiscal,
    ...summaryItens,
  };

  //console.log(body);

  const client = await TMongo.connect();
  let nfe_doc = await client
    .collection("nota_fiscal")
    .findOne({ id: id_nota_fiscal, id_tenant: id_tenant });

  if (!nfe_doc || nfe_doc == null || nfe_doc == undefined) {
    body.status_processamento = 0;
    client
      .collection("nota_fiscal")
      .updateOne(
        { id: { $eq: id_nota_fiscal }, id_tenant: { $eq: id_tenant } },
        { $set: body },
        { upsert: true }
      );
    console.log("Salvando NFe : " + id_nota_fiscal + " - " + data_emissao);
  }
  return 200;
}

//@dia inicial = 1      @prefixo = mm/yyyy
async function notasFiscaisPorPeriodo(diaInicial, mmyyyy) {
  let client = await TMongo.connect();
  let result = [];
  let day = "";
  for (let i = diaInicial; i < 31; i++) {
    if (i < 10) day = `0${i}`;
    else day = `${i}`;
    let periodo = `${day}${mmyyyy}`;
    let filter = { data_emissao: periodo };
    let nfs = await client.collection("nota_fiscal").find(filter).toArray();
    for (nf of nfs) result.push(nf);
  }
  return result;
}

async function excluirNotaFiscalOne(id) {
  const client = await TMongo.connect();
  await client.collection("nota_fiscal").deleteOne({ id: String(id) });
}

async function getAllNotasFiscais(id_tenant, pageNumber, pageSize) {
  const skip = (pageNumber - 1) * pageSize;
  const client = await TMongo.connect();
  const nf = await client
    .collection("nota_fiscal")
    .find({ id_tenant: id_tenant })
    .skip(skip)
    .limit(pageSize)
    .toArray();
  return nf;
}

async function importarClientesNotasFiscais(id_tenant) {
  console.log("Início da importação de clientes " + lib.currentDateTimeStr());
  let max_page = 1000;
  let pageSize = 1000;

  for (let pageNumber = 1; pageNumber <= max_page; pageNumber++) {
    let notas = await getAllNotasFiscais(id_tenant, pageNumber, pageSize);
    for (let nota of notas) {
      await updateOrInsertCliente(id_tenant, nota.cliente);
    }
  }
  console.log("Fim da importação de clientes " + lib.currentDateTimeStr());
}

async function updateOrInsertCliente(id_tenant, cliente) {
  if (!cliente) return null;
  let doc = lib.onlyNumber(cliente?.cpf_cnpj);
  if (doc == null || doc.length <= 0) return null;
  let customer = new CustomerRepository(await TMongo.connect());
  return await customer.create({ ...cliente, id_tenant });
}

async function getProdutoByCodigo(id_tenant, codigo) {
  let prod = await productController.getProductDetailBySku(id_tenant, codigo);

  if (!prod || prod == null || prod == undefined) {
    let response = await productController.getProductBySku(id_tenant, codigo);
    if (response && response?.id) {
      await productController.updateProductDetailOne(
        id_tenant,
        String(response?.id)
      );
    }
    prod = await productController.getProductDetailBySku(id_tenant, codigo);
  }

  if (!prod || prod == null || prod == undefined) {
    prod = {};
  }

  return prod;
}

async function findById(id) {
  const client = await TMongo.connect();
  const response = await client
    .collection("nota_fiscal")
    .find({ id: String(id) })
    .toArray();
  return response;
}

async function getAllNFePendente(id_tenant) {
  const client = await TMongo.connect();
  const response = await client
    .collection("nota_fiscal")
    .find({
      id_tenant: id_tenant,
      status_processamento: TNfeTypes.STATUS_PROCESSAMENTO.PENDENTE,
    })
    .limit(TNfeTypes.MAX_RECORDS_NFE_PENDENTE)
    .toArray();
  return response;
}

async function setStatusProcessamento(
  id = "",
  status = TNfeTypes.STATUS_PROCESSAMENTO.PROCESSADO
) {
  const client = await TMongo.connect();
  const response = await client
    .collection("nota_fiscal")
    .updateOne({ id: String(id) }, { $set: { status_processamento: status } });
  return response;
}

async function retificarDataMovto() {
  let tenants = await tenantRepository.getAllTenantSystem();
  const client = await TMongo.connect();
  let records = 0;
  let per_page = 1000;

  for (let tenant of tenants) {
    for (let page = 1; page < 1000; page++) {
      console.log("Page :" + page);
      let items = await getAllNotasFiscais(tenant.id, page, per_page);
      records = items?.length;
      if (records <= 0) break;
      let record = 0;
      for (let item of items) {
        console.log(`T${tenant.id}  Page ${page} -  ${record++} / ${records} `);
        let data = lib.dateBrToIso8601(item.data_emissao);
        await client
          .collection("nota_fiscal")
          .updateOne(
            { _id: item._id },
            { $set: { data_movto: data } },
            { upsert: true }
          );
        await lib.sleep(100);
      }
    }
  }
}

async function retificaXmlOne(id_tenant, item, client) {
  if (!client) client = await TMongo.connect();
  let xml;
  let res;

  try {
    res = await tinyRepository.notaFiscalObterXml(id_tenant, item.id);
    xml = res?.data;
  } catch (error) {}

  if (!xml) {
    item.status_processamento = 500; //ERRO
    await client
      .collection("nota_fiscal")
      .updateOne({ _id: { $eq: item._id } }, { $set: item });
    return;
  }

  xmlParser.parser.parseString(xml, async function (err, result) {
    if (err) console.log(err);
    let response = await lib.extrairXmlNotaFiscal(result);
    item.xml = response;
    item.status_processamento = 999; //PROCESSADO   so para mim conseguir
    await client
      .collection("nota_fiscal")
      .updateOne({ _id: { $eq: item._id } }, { $set: item });
  });
}

async function retificarXmlMany() {
  let tenants = await tenantRepository.getAllTenantSystem();
  const client = await TMongo.connect();

  for (let tenant of tenants) {
    let items = await notaFiscalRepository.getAllNFePendente(tenant.id);

    for (let page = 1; page < 1000; page++) {
      for (let item of items) {
        console.log("Retificando NFe pendente:  Page " + page + " " + item?.id);
        await retificaXmlOne(tenant.id, item, client);
      } //for items

      items = await notaFiscalRepository.getAllNFePendente(tenant.id);
      if (!items || items.length == 0) break;
    } //for
  } //tenants
}

export const notaFiscalRepository = {
  init,
  saveNfeXml,
  updateProdutoNotaFiscal,
  recalcular_total_nfe,
  updateOrInsertCliente,
  importarClientesNotasFiscais,
  getAllNotasFiscais,
  getProdutoByCodigo,
  notasFiscaisPorPeriodo,
  excluirNotaFiscalOne,
  findById,
  getAllNFePendente,
  setStatusProcessamento,
  retificaXmlOne,
};
