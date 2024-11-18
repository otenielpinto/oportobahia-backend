import { TMongo } from "../infra/mongoClient.js";
import { lib } from "../utils/lib.js";

var listaEcommerce = [];

async function loadListaEcommerce() {
  listaEcommerce = await getAllEcommerce();
  return listaEcommerce;
}

async function validateEcommerce(id_tenant, ecommerce) {
  if (!ecommerce) return null;
  if (!ecommerce.nomeEcommerce) return null;
  let data = null;
  try {
    data = await obterEcommerce(id_tenant, ecommerce.nomeEcommerce);
    if (!data || data === null) {
      data = await saveEcommerceMongo(id_tenant, ecommerce);
    }
  } catch (error) {}
  return data;
}

async function obterEcommerce(id_tenant, nomeEcommerce) {
  if (listaEcommerce.length == 0) await loadListaEcommerce();
  for (let item of listaEcommerce) {
    if (item.nomeEcommerce == nomeEcommerce && item.id_tenant == id_tenant) {
      return item;
    }
  }
  listaEcommerce = [];
  return null;
}

async function doSave(id_tenant, item) {
  if (!item) return null;
  let id = item.id;
  let nomeEcommerce = item.nomeEcommerce;
  let tac = 0;
  let comissao = 0;
  let situacao = 0; // 0 = desabilitado, 1 = habilitado
  let mercado_livre = 0; // 0 = não, 1 = sim
  let valor_venda_minimo = 0;
  let tac_adicional = 0;

  if (
    id == null ||
    id == undefined ||
    nomeEcommerce == null ||
    nomeEcommerce == undefined
  ) {
    return null;
  }

  const client = await TMongo.connect();
  const ecommerce = await client
    .collection("ecommerce")
    .findOne({ id: id, id_tenant: id_tenant });

  let update = 0;
  if (
    ecommerce == null ||
    ecommerce === undefined ||
    id != ecommerce.id ||
    nomeEcommerce != ecommerce.nomeEcommerce
  ) {
    update = 1;
  }

  if (update == 1) {
    let body = {};
    body.id_tenant = id_tenant;
    body.id = id;
    body.nomeEcommerce = nomeEcommerce;

    if (ecommerce == null || ecommerce == undefined) {
      body.tac = tac;
      body.comissao = comissao;
      body.situacao = situacao;
      body.mercado_livre = mercado_livre;
      body.valor_venda_minimo = valor_venda_minimo;
      body.tac_adicional = tac_adicional;
    }

    client
      .collection("ecommerce")
      .updateOne(
        { id: { $eq: id }, id_tenant: { $eq: id_tenant } },
        { $set: body },
        { upsert: true }
      );
    return body;
  }
}

async function saveEcommerceMongo(id_tenant, item) {
  if (!item) return true;
  return await doSave(id_tenant, item);
}

async function getEcommerceByNome(id_tenant, nomeEcommerce) {
  const client = await TMongo.connect();
  const response = await client
    .collection("ecommerce")
    .findOne({ nomeEcommerce: nomeEcommerce, id_tenant });
  return response;
}

async function getEcommerceById(id_tenant, id) {
  const client = await TMongo.connect();
  const response = await client
    .collection("ecommerce")
    .findOne({ id: id, id_tenant });
  return response;
}

async function getAllEcommerce() {
  const client = await TMongo.connect();
  return await client.collection("ecommerce").find().toArray();
}

export const ecommerceRepository = {
  saveEcommerceMongo,
  getEcommerceByNome,
  getEcommerceById,
  getAllEcommerce,
  validateEcommerce,
  loadListaEcommerce,
  obterEcommerce,
};
