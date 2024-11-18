import { TMongo } from "../infra/mongoClient.js";
import { orderRepository } from "./orderRepository.js";

async function downloadStock(id_tenant) {
  let payload = {};
  payload.idtenant = id_tenant;
  let listOfItems = [];
  let listOfOrders = [];
  let items = await orderRepository.getAllOrder(payload);

  for (let item of items) {
    //console.log("Contagem item  : " + ++i);
    let pedido = item.pedido;
    if (!pedido || !pedido.itens) continue;
    for (let pi of pedido.itens) {
      let x = pi.item;
      listOfItems.push({ id: x.id_produto, quantity: 0, status: 2 });
    }
    if (!listOfOrders.includes(pedido.id)) listOfOrders.push(pedido.id);
  }

  for (let orderId of listOfOrders) {
    console.log(
      `[pedido] atualizar o estoque do produto porque houve movimentação :  ${orderId}`
    );
    await orderRepository.setStatusOrder({
      status: 2,
      idtenant: id_tenant,
      id: orderId,
      orderId: 0,
    });
  }
  await saveStockMongo(id_tenant, { items: listOfItems });
}

async function saveStockMongo(idTenant, payload) {
  if (!payload.items) return false;
  const client = await TMongo.connect();

  for (let item of payload.items) {
    let quantity = parseFloat(item.quantity);
    if (!quantity) quantity = 0;
    let id = item.id;
    if (!id) id = "0";
    console.log(`[estoque] atualizar o produto ${id}`);
    client.collection("product_stock").updateOne(
      { id: { $eq: id }, idtenant: { $eq: idTenant } },
      {
        $set: {
          id: id,
          quantity: quantity,
          status: 1,
          updatedat: new Date(),
          idtenant: idTenant,
        },
      },
      { upsert: true }
    );
  }

  return true;
}

async function getAllStock(params = {}) {
  let status = params.status;
  let idtenant = params.idtenant;

  let filter = { status, idtenant };
  const client = await TMongo.connect();
  return await client.collection("product_stock").find(filter).toArray();
}

async function setStatusStock(params = {}) {
  let new_status = params.status ? params.status : 2;
  let idtenant = params.idtenant;
  let id = params.id;

  const client = await TMongo.connect();
  client
    .collection("product_stock")
    .updateOne(
      { id: { $eq: id }, idtenant: { $eq: idtenant } },
      { $set: { status: new_status } },
      { upsert: true }
    );
  return true;
}

export const stockRepository = {
  downloadStock,
  //getStockById,
  getAllStock,
  setStatusStock,
  saveStockMongo,
};
