import { TMongo } from "../infra/mongoClient.js";

async function createCustomerIgnore(id_tenant, customerIgnore) {
  const client = await TMongo.connect();
  const result = await client
    .collection("customer_ignore")
    .insertOne(customerIgnore);
  return result;
}

async function getCustomerIgnoreById(id_tenant, id) {
  const client = await TMongo.connect();
  return await client
    .collection("customer_ignore")
    .findOne({ id: id, id_tenant: id_tenant });
}

async function getAllCustomerIgnore(id_tenant) {
  let filter = {};
  if (id_tenant > 0) filter = { id_tenant: id_tenant };
  const client = await TMongo.connect();
  return await client.collection("customer_ignore").find(filter).toArray();
}

async function updateCustomerIgnore(id_tenant, id, customerIgnore) {
  const client = await TMongo.connect();
  const result = await client
    .collection("customer_ignore")
    .updateOne(
      { id: id, id_tenant: id_tenant },
      { $set: customerIgnore },
      { upsert: true }
    );
  return result.modifiedCount > 0;
}

async function deleteCustomerIgnore(id_tenant, id) {
  const client = await TMongo.connect();
  const result = await client
    .collection("customer_ignore")
    .deleteOne({ id: id, id_tenant: id_tenant });
  return result.deletedCount > 0;
}

export const customerIgnoreRepository = {
  createCustomerIgnore,
  getCustomerIgnoreById,
  getAllCustomerIgnore,
  updateCustomerIgnore,
  deleteCustomerIgnore,
};
