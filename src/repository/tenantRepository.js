import { TMongo } from "../infra/mongoClient.js";

async function getAllTenantSystem() {
  const client = await TMongo.connect();
  return await client.collection("tenant").find().toArray();
}

async function getTokenByTenantId(idTenant) {
  const tenant = await getTenantById(idTenant);
  if (!tenant || tenant == null || tenant === undefined) {
    throw new Error(`A consulta não retornou dados: ${idTenant}`);
  }
  return tenant.tiny_token;
}

async function getTenantByClientId(client_id) {
  const client = await TMongo.connect();
  const tenant = await client
    .collection("tenant")
    .findOne({ vendizap_client_id: client_id.toString() });

  if (!tenant || tenant == null || tenant === undefined) {
    console.log(`A consulta não retornou dados: ${client_id}`);
  }
  return tenant;
}

async function getTenantById(id_tenant) {
  return await TMongo.getTenant(id_tenant);
}

async function getTenantPai(id_tenant) {
  let data = await getTenantById(id_tenant);
  return data.tenant_pai;
}

export const tenantRepository = {
  getAllTenantSystem,
  getTokenByTenantId,
  getTenantByClientId,
  getTenantById,
  getTenantPai,
};
