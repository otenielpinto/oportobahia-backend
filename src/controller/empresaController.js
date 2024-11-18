import { TMongo } from "../infra/mongoClient.js";
import { fb5 } from "../infra/fb5.js";

import { tenantRepository } from "../repository/tenantRepository.js";
import { tinyRepository } from "../repository/tinyRepository.js";
import { EmpresaMapper } from "../mappers/empresaMapper.js";
import { EmpresaRepository } from "../repository/empresaRepository.js";

async function init() {
  await syncronizarTodasTenants();
}

async function addEmpresaToFirebird(payload) {
  if (!payload) return;
  let rows = await fb5.openQuery("EMPRESA", "id", `id=?`, [payload.id_tenant]);
  let empresa = EmpresaMapper.toFirebird(payload);
  if (rows.length == 0) {
    await fb5.insertQuery("EMPRESA", empresa);
  } else {
    await fb5.updateQuery("EMPRESA", payload.id_tenant, empresa);
  }

  const empresaRep = new EmpresaRepository(await TMongo.connect());
  await empresaRep.create(empresa);
}

async function obterEmpresaByTenant(id_tenant) {
  let response = await tinyRepository.obterDadosEmpresa(id_tenant);
  let { conta } = response?.data?.retorno;
  return conta;
}

async function syncronizarTodasTenants() {
  let tenants = await tenantRepository.getAllTenantSystem();
  for (let tenant of tenants) {
    let payload = await obterEmpresaByTenant(tenant.id);
    await addEmpresaToFirebird({ id_tenant: tenant?.id, ...payload });
  }
}

export const empresaController = {
  init,
  addEmpresaToFirebird,
  obterEmpresaByTenant,
  syncronizarTodasTenants,
};
