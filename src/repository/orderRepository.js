import { TMongo } from "../infra/mongoClient.js";
import { lib } from "../utils/lib.js";
import { xmlParser } from "../utils/xmlParser.js";

import { tenantRepository } from "./tenantRepository.js";
import { tinyRepository } from "./tinyRepository.js";
import { notaFiscalRepository } from "./notafiscalRepository.js";
import { ecommerceRepository } from "./ecommerceRepository.js";
import { customerIgnoreRepository } from "./customerIgnoreRepository.js";

import { Tiny } from "../services/tinyService.js";
import { TinyInfo } from "../services/tinyService.js";

async function init() {
  try {
    await receberPedidos();
  } catch (error) {}
  await receberNfe();
}

async function ajustarOrderNotaFiscal(diaInicial, prefixo) {
  let nfs = await notaFiscalRepository.notasFiscaisPorPeriodo(
    diaInicial,
    prefixo
  );

  for (let nf of nfs) {
    console.log(
      `Excluindo nf: ${nf.data_emissao} ` + nf.id + " order id = " + nf.order.id
    );
    await notaFiscalRepository.excluirNotaFiscalOne(nf.id);
    await setStatusOpen(nf.id_tenant, nf.order.id);
  }
}

async function getAllOrder(params = {}) {
  let id_tenant = params.id_tenant;
  let filter = { id_tenant };
  const client = await TMongo.connect();
  return await client.collection("order").find(filter).toArray();
}

async function getOrdersByStatus(filter = {}) {
  const client = await TMongo.connect();
  return await client.collection("order").find(filter).toArray();
}

async function getOrdersPending() {
  const filter = { status_nfe: 0 };
  return await getOrdersByStatus(filter);
}

async function getOrderById(id_tenant, id) {
  const client = await TMongo.connect();
  const response = await client
    .collection("order")
    .findOne({ id: String(id), id_tenant });
  return response;
}

async function setStatusNfe(id_tenant, id) {
  const client = await TMongo.connect();
  const response = await client
    .collection("order")
    .updateMany({ id: String(id), id_tenant }, { $set: { status_nfe: 1 } });
  return response;
}

async function setStatusNfeOutra(id_tenant, id) {
  const client = await TMongo.connect();
  const response = await client
    .collection("order")
    .updateMany({ id, id_tenant }, { $set: { status_nfe: 400 } });
  return response;
}

async function setStatusOpen(id_tenant, id) {
  const client = await TMongo.connect();
  const response = await client
    .collection("order")
    .updateMany({ id, id_tenant }, { $set: { status_nfe: 0 } });
  return response;
}

async function receberNfe() {
  let orders = await getOrdersPending();

  //******************************************************** */
  //ambiente de homologação
  //let _order = await getOrderById(2, "876802792");
  //let orders = [];
  //orders.push(_order);
  //console.log(orders);
  //******************************************************** */
  //Fim da homologação
  //******************************************************** */

  let dtLimite = lib.addDays(new Date(), -30);
  let customers = await customerIgnoreRepository.getAllCustomerIgnore(0);
  let blackList = [];
  for (let customer of customers)
    if (customer?.id && customer?.id?.length > 0) blackList.push(customer?.id);

  for (let order of orders) {
    let id_tenant = order?.id_tenant;
    let id_nota_fiscal = order?.id_nota_fiscal ? order.id_nota_fiscal : null;
    let cnpj = lib.onlyNumber(
      order?.cliente?.cpf_cnpj ? order.cliente.cpf_cnpj : ""
    );

    //******************************************************** */
    //opção para nao importar pedidos que foram cancelados
    //******************************************************** */
    try {
      let pular = 0;
      if (cnpj && blackList.includes(cnpj)) pular = 1;

      if (
        order.data_pedido < dtLimite ||
        order.situacao == "Cancelado" ||
        pular == 1
      ) {
        await setStatusNfeOutra(id_tenant, order.id);
        continue;
      }
    } catch (error) {}
    //******************************************************** */
    if (!id_nota_fiscal || id_nota_fiscal == "0") continue;

    let xml = "";
    let res = "";
    let nota_fiscal = "";
    try {
      res = await tinyRepository.notaFiscalObterXml(id_tenant, id_nota_fiscal);
      xml = res?.data;
    } catch (error) {}

    await lib.sleep(1000 * 3);
    try {
      nota_fiscal = await tinyRepository.parseToNotaFiscal(
        await tinyRepository.notaFiscalObter(id_tenant, id_nota_fiscal)
      );
    } catch (error) {}

    //Se nao achar o xml do pedido excluir o pedido para que o mesmo seja reprocessado .... 16-02-2023 ocorreu um erro assim
    if (!nota_fiscal || nota_fiscal == null || nota_fiscal == undefined) {
      console.log("Excluindo o pedido para reprocessar " + order.id);
      await deleteOrderMongo(id_tenant, order.id);
      continue;
    }

    let natureza_operacao = String(nota_fiscal?.natureza_operacao);
    if (natureza_operacao) {
      natureza_operacao = natureza_operacao.toUpperCase();
      if (!natureza_operacao.includes("VENDA")) {
        console.log("Excluindo a natureza de operacao " + natureza_operacao);
        await setStatusNfeOutra(id_tenant, order.id);
        continue;
      }
    }
    await enviarXml(id_tenant, id_nota_fiscal, order, nota_fiscal, xml);
  }
}

async function enviarXml(id_tenant, id_nota_fiscal, order, nota_fiscal, xml) {
  //options configurado  para toda aplicacao , se mover para outra tela observar isso
  xmlParser.parser.parseString(xml, async function (err, result) {
    if (err) console.log(err);
    let docXml = await lib.extrairXmlNotaFiscal(result);
    let statusCode = await notaFiscalRepository.saveNfeXml(
      id_tenant,
      id_nota_fiscal,
      order,
      docXml,
      nota_fiscal
    );

    if (statusCode == 200) {
      await setStatusNfe(id_tenant, order.id);
      console.log("salvando o status de nfe para o pedido " + order.id);
    }
  });
}

async function receberPedidos() {
  let tenants = await tenantRepository.getAllTenantSystem();

  for (let tenant of tenants) {
    let id_tenant = tenant.id;

    let tiny = new Tiny({ token: tenant.tiny_token, timeout: 1000 * 11 });
    let info = new TinyInfo({ instance: tiny });
    let dataInicial = await info.getDataInicialPedidos();
    let page_count = await info.getPaginasPedidos(dataInicial);

    let response = null;
    let result = null;

    for (let page = page_count; page > 0; page--) {
      console.log(
        `TenantId[${id_tenant}] - Buscando pedidos API Tiny ${page}/${page_count} as ${lib.currentDateTimeStr()}`
      );

      for (let t = 0; t < 5; t++) {
        let data = [
          { key: "pesquisa", value: "" },
          { key: "pagina", value: page },
          { key: "dataInicial", value: dataInicial },
        ];
        result = await tiny.post("pedidos.pesquisa.php", data);
        response = await tiny.tratarRetorno(result, "pedidos");
        if (tiny.status() == "OK") break;
        response = null;
      }

      try {
        await saveOrderMongo(id_tenant, response);
      } catch (error) {}
    }
  }

  return true;
} // for tenants

async function saveOrderMongo(id_tenant, items) {
  if (!items || !Array.isArray(items)) {
    console.log("Não foram encontrados pedidos para o tenant " + id_tenant);
    return null;
  }
  console.log(
    "Encontrados " + items.length + " pedidos para o tenant " + id_tenant
  );

  const client = await TMongo.connect();
  let status_date = new Date();

  for (let item of items) {
    let id = String(item.pedido.id);

    let order = await client
      .collection("order")
      .findOne({ id: String(id), id_tenant: Number(id_tenant) });

    let id_nota_fiscal = order?.id_nota_fiscal ? order?.id_nota_fiscal : "0";
    if (order && id_nota_fiscal == "0") {
      order = null;
      //forco atualizacao do registro ( perdi tempo nessa porra aqui 17-01-2024 )
    }

    if (order == null || order == undefined) {
      let status_order = 0;
      let status_nfe = 0;
      let pedido = null;

      for (let i = 1; i < 3; i++) {
        await lib.sleep(1000 * 2);
        let response = await tinyRepository.pedidoObter(id_tenant, id);
        if (response || response?.data) {
          if (response?.data?.retorno?.pedido) {
            pedido = response.data.retorno.pedido;
            break;
          }
        }
      }

      if (!pedido) {
        console.log("A consulta não retornou o pedido");
        continue;
      }
      pedido.data_pedido = lib.dateBrToIso8601(pedido.data_pedido);

      pedido = {
        id_tenant: id_tenant,
        status_order,
        status_nfe,
        status_date,
        ...pedido,
      };
      client
        .collection("order")
        .updateOne(
          { id: String(id), id_tenant: Number(id_tenant) },
          { $set: pedido },
          { upsert: true }
        );

      try {
        await ecommerceRepository.validateEcommerce(
          id_tenant,
          pedido.ecommerce
        );
      } catch (error) {}
    }
  }
  return true;
}
async function setStatusOrder(params = {}) {
  let new_status = params.status;
  let id_tenant = params.id_tenant;
  let id = String(params.id);
  let orderId = params.orderId;

  let client = await TMongo.connect();
  client
    .collection("order")
    .updateOne(
      { id: { $eq: id }, id_tenant: { $eq: id_tenant } },
      { $set: { status: new_status, orderId: orderId } },
      { upsert: true }
    );
  return true;
}

async function setErrors(params = {}) {
  let id_tenant = params.id_tenant;
  let id = String(params.id);
  let wta_message = params.wta_message;

  const client = await TMongo.connect();
  const order = await client.collection("order").findOne({ id: id, id_tenant });

  if (order) {
    client
      .collection("order")
      .updateOne(
        { id: { $eq: id }, id_tenant: { $eq: id_tenant } },
        { $set: { wta_message } },
        { upsert: true }
      );
  }
  return true;
}

async function deleteOrderMongo(id_tenant, id) {
  const client = await TMongo.connect();
  await client.collection("order").deleteOne({ id: id, id_tenant: id_tenant });
  return true;
}

async function retificarDataPedido() {
  let tenants = await tenantRepository.getAllTenantSystem();
  const client = await TMongo.connect();

  for (let tenant of tenants) {
    let items = await getAllOrder({ id_tenant: tenant.id });
    let records = items.length;
    let record = 0;
    for (let item of items) {
      console.log("Pedido -> " + record++);
      let data_pedido = lib.formatDateBr(item.data_pedido);
      let data = lib.dateBrToIso8601(data_pedido);
      await client
        .collection("order")
        .updateOne(
          { _id: item._id },
          { $set: { data_pedido: data } },
          { upsert: true }
        );
      await lib.sleep(100);
    }
  }
}

export const orderRepository = {
  init,
  receberPedidos,
  getOrderById,
  getAllOrder,
  getOrdersByStatus,
  getOrdersPending,
  setStatusOrder,
  setErrors,

  saveOrderMongo,
  deleteOrderMongo,

  setStatusNfe,
  setStatusNfeOutra,
  setStatusOpen,
  receberNfe,
};
