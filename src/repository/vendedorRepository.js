import { TMongo } from "../infra/mongoClient.js";
import { lib } from "../utils/lib.js";

async function doSave(id_tenant, id_vendedor, nome_vendedor) {
  if (id_vendedor == null) {
    id_vendedor = "0";
  }

  if (nome_vendedor == null) {
    nome_vendedor = "***";
  }

  const client = await TMongo.connect();
  const vendedor = await client.collection("vendedor").findOne({ id_vendedor });

  let update = false;
  if (
    vendedor == null ||
    vendedor === undefined ||
    id_vendedor != vendedor.id_vendedor ||
    nome_vendedor != vendedor.nome_vendedor
  ) {
    update = true;
  }

  if (update) {
    let body = {};
    body.id_tenant = id_tenant; //idTenant
    body.id_vendedor = id_vendedor;
    body.nome_vendedor = nome_vendedor;

    client
      .collection("vendedor")
      .updateOne(
        { id_vendedor: { $eq: id_vendedor }, id_tenant: { $eq: id_tenant } },
        { $set: body },
        { upsert: true }
      );
  }
}

async function saveVendedorMongo(id_tenant, id_vendedor, nome_vendedor) {
  if (!id_vendedor || !nome_vendedor) return true;
  return await doSave(id_tenant, id_vendedor, nome_vendedor);
}

async function getVendedorByNome(id_tenant, nome) {
  const client = await TMongo.connect();
  const response = await client
    .collection("vendedor")
    .findOne({ nome_vendedor: nome, id_tenant: id_tenant });
  return response;
}

async function getVendedorByIdVendedor(id_tenant, id_vendedor) {
  const client = await TMongo.connect();
  const response = await client
    .collection("vendedor")
    .findOne({ id_vendedor: id_vendedor, id_tenant: id_tenant });
  return response;
}

async function getListaVendedor() {
  const client = await TMongo.connect();
  return await client.collection("vendedor").find().toArray();
}

export const vendedorRepository = {
  saveVendedorMongo,
  getVendedorByNome,
  getVendedorByIdVendedor,
  getListaVendedor,
};
