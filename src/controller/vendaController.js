import { lib } from "../utils/lib.js";
import { fb5 } from "../infra/fb5.js";

import { notaFiscalRepository } from "../repository/notafiscalRepository.js";
import { VendaMapper } from "../mappers/vendaMapper.js";
import { ClienteMapper } from "../mappers/clienteMapper.js";
import { ProdutoMovtoMapper } from "../mappers/produtoMovtoMapper.js";
import { productController } from "./productController.js";
import { clienteController } from "./clienteController.js";
import { tenantRepository } from "../repository/tenantRepository.js";

async function init() {
  let tenants = await tenantRepository.getAllTenantSystem();
  for (let tenant of tenants) {
    await setNotasFiscais(tenant.id);
  }
}

async function obterEmpresaPai(id_tenant) {
  return 1;
}

async function obterSku(id_tenant, det) {
  let cProd = det?.prod?.cProd;
  let cEAN = det?.prod?.cEAN;
  let xProd = det?.prod?.xProd;
  let response = null;

  if (cProd) {
    response = await productController.getProductBySku(id_tenant, cProd);
    if (response?.id) return response;
  }

  if (cEAN && cEAN != "SEM GTIN" && cEAN != "") {
    response = await productController.getProductByGtin(id_tenant, cEAN);
    if (response?.id) return response;
  }

  if (xProd) {
    response = await productController.getProductByNome(id_tenant, xProd);
    if (response?.id) return response;
  }
  return null;
}

async function setNotasFiscais(id_tenant) {
  let idCliente = 1;
  let id_tenant_pai = await obterEmpresaPai(1);

  const items = await notaFiscalRepository.getAllNFePendente(id_tenant);
  for (let item of items) {
    if (!item?.xml) {
      console.log("xml inexistente " + item.id);
      await notaFiscalRepository.retificaXmlOne(id_tenant, item, null);
      await lib.sleep(1000 * 3);
      continue;
    }

    console.log(
      item.id +
        "   " +
        item.data_emissao +
        " status:" +
        item.status_processamento
    );

    //venda
    let venda = VendaMapper.toFirebird(item);

    //cliente
    let cliente = ClienteMapper.toFirebird(item?.cliente);
    let _cliente = await clienteController.setData(cliente);
    if (_cliente) idCliente = _cliente?.id;

    //produtos

    let { infNFe: nfe } = item?.xml?.nfeProc?.NFe;
    if (!Array.isArray(nfe?.det)) nfe.det = [nfe.det];

    if (!nfe?.det || nfe?.det.length <= 0) {
      await notaFiscalRepository.setStatusProcessamento(item.id, 500);
      continue;
    }

    let produtos = [];
    let sequencia = 1;
    for (let det of nfe?.det) {
      let idProduto = 0;
      let response = await obterSku(id_tenant_pai, det);

      if (response) idProduto = response?.id;
      if (idProduto <= 0) {
        console.log("idProduto inexistente " + det?.prod?.cProd);
        await notaFiscalRepository.setStatusProcessamento(item.id, 500);
        break;
      }
      //console.log(JSON.stringify(det));
      let produto = ProdutoMovtoMapper.toFirebird(det);

      venda.codclifor = idCliente;
      venda.id = await getGenId();

      produto.idvenda = venda.id;
      produto.tipovenda = venda.tipovenda;
      produto.codclifor = venda.codclifor;
      produto.movestoque = venda.movestoque;
      produto.dhmovto = venda.dtmovto;
      produto.empresa = venda.empresa;
      produto.sequencia = sequencia++;
      produto.documento = venda.documento;
      produto.item = idProduto;
      produto.vendedor = venda.vendedor;
      produto.custo = 0;
      produto.tabela = 0;
      produto.plano = 0;
      produtos.push(produto);
    }
    await tratarRetorno(item?.id, await setData(venda, produtos));
    let resposta = venda.id > 0 ? "OK" : "Erro";
    console.log("Status processamento Venda  " + resposta);
  } //items
}

async function tratarRetorno(id, status_code) {
  if (!id) return;
  if (status_code == 200)
    return await notaFiscalRepository.setStatusProcessamento(id, 1);

  //erro
  await notaFiscalRepository.setStatusProcessamento(id, 500);
}

async function getGenId() {
  return await fb5.getGenId("GEN_VENDA_ID");
}

async function setData(venda, produtos) {
  /*
    Todo : Fazer tudo isso numa unica conexao 
  */
  //cliente já foi cadastrado

  //precisa vir com o id preenchido
  if (venda?.id <= 0) return 500;

  let venda_pedido = null;
  //preciso localizar se o pedido ja existe
  if (venda?.pedido > 0) {
    venda_pedido = {
      pedido: venda.pedido,
      id_venda: venda.id,
    };

    let rows = await fb5.openQuery("VENDA_PEDIDO", "ID", "PEDIDO=?", [
      venda.pedido,
    ]);

    if (rows && rows?.length > 0) {
      console.log("Pedido já cadastrado " + venda?.pedido);
      return 200;
    }
  }

  //validar itens
  for (let item of produtos) {
    if (item?.item <= 0) {
      console.log("Item inválido " + item?.item);
      return 500;
    }
  }

  try {
    await fb5.insertQuery("VENDA", venda);
  } catch (error) {
    console.log(error);
    return 500;
  }

  try {
    for (let produto of produtos) {
      try {
        await fb5.insertQuery("PRODUTO_MOVTO", produto);
      } catch (error) {}
    }
  } finally {
    try {
      if (venda_pedido) await fb5.insertQuery("VENDA_PEDIDO", venda_pedido);
    } catch (error) {}
  }
  return 200;
}

export const vendaController = {
  init,
  setData,
  getGenId,
};
