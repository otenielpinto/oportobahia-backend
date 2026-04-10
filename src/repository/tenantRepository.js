import { TMongo } from "../infra/mongoClient.js";

async function getAllTenantSystem() {
  const client = await TMongo.connect();
  return await client.collection("tenant").find({}).project({
    id: 1,
    tiny_token: 1,
    tenant_pai: 1,
    nome: 1,
    id_tenant: 1,
    id_empresa: 1
  }).toArray();
}

async function getTokenByTenantId(idTenant) {
  const tenant = await getTenantById(idTenant);
  if (!tenant || tenant == null || tenant === undefined) {
    throw new Error(`A consulta não retornou dados: ${idTenant}`);
  }
  return tenant.tiny_token;
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
  getTenantById,
  getTenantPai,
};
