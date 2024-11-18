const db = require("../config/db");
const lib = require("../utils/lib");

async function doSave(idTenant, item) {
  if (!item) return true;
  let id = item.id;
  let nome = item.nome;
  let codigo = item.codigo;

  const client = await TMongo.connect();
  const product = await client
    .collection("categoria")
    .findOne({ id: id, idtenant: idTenant });

  let update = false;
  if (
    product == null ||
    product === undefined ||
    id != product.id ||
    nome != product.nome ||
    codigo != product.codigo
  ) {
    update = true;
  }

  if (update) {
    let body = {};
    body.idtenant = idTenant;
    body.id = id;
    body.nome = nome;
    body.codigo = codigo;

    client
      .collection("categoria")
      .updateOne(
        { id: { $eq: id }, idtenant: { $eq: idTenant } },
        { $set: body },
        { upsert: true }
      );
  }
}

async function saveCategoriaMongo(idTenant, item) {
  if (!item) return true;
  return await doSave(idTenant, item);
}

async function getCategoriaByNome(idTenant, nome) {
  const client = await TMongo.connect();
  const response = await client
    .collection("categoria")
    .findOne({ nome: nome, idtenant: idTenant });
  return response;
}

async function getCategoriaByCodigo(idTenant, codigo) {
  const client = await TMongo.connect();
  const response = await client
    .collection("categoria")
    .findOne({ codigo: codigo, idtenant: idTenant });
  return response;
}

async function getListaCategorias(idTenant, categorias) {
  if (categorias == null || categorias == undefined || categorias == "")
    return [];
  let list = [];
  let items = categorias.split(">>");
  for (let item of items) {
    if (item == undefined || item == null || item.length == 0) continue;
    let nome = item.trim();
    let response = await getCategoriaByNome(idTenant, nome);
    if (response == null || !response.id) continue;
    list.push(response.id);
  }
  return list;
}

module.exports = {
  saveCategoriaMongo,
  getCategoriaByNome,
  getCategoriaByCodigo,
  getListaCategorias,
};
