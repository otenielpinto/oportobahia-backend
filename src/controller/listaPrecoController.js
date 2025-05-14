import { Tiny, TinyInfo } from "../services/tinyService.js";
import { TMongo } from "../infra/mongoClient.js";
import { tenantRepository } from "../repository/tenantRepository.js";
import { ListaPrecoRepository } from "../repository/listaPrecoRepository.js";
import { serviceRepository } from "../repository/serviceRepository.js";
import { lib } from "../utils/lib.js";

async function init() {
  let tenants = await tenantRepository.getAllTenantSystem();
  let key = "Importar lista de preços";
  for (let tenant of tenants) {
    let id_tenant = tenant.id;
    if ((await serviceRepository.hasExec(id_tenant, key)) == 1) return null;
    await serviceRepository.updateService(id_tenant, key);
    await importarListaPreco(tenant);
  }
}

async function importarListaPreco(tenant) {
  let tiny = new Tiny({ token: tenant.tiny_token, timeout: 1000 * 12 });
  let info = new TinyInfo({ instance: tiny });
  let result = null;
  let response = null;
  const numero_paginas = await info.getPaginasListaPrecos();
  const listaRepository = new ListaPrecoRepository(await TMongo.connect());

  for (let pagina = 1; pagina <= numero_paginas; pagina++) {
    console.log(`Importando lista de preços ${pagina} de ${numero_paginas}`);

    response = null;
    for (let t = 0; t < 12; t++) {
      result = await tiny.post("listas.precos.pesquisa.php", [
        { key: "pagina", value: pagina },
      ]);
      response = await tiny.tratarRetorno(result, "registros");
      if (tiny.status() == "OK") break;
    }

    if (Array.isArray(response)) {
      for (let item of response) {
        console.log(`Importando lista de preços ${item.registro.id}`);
        let obj = {
          ...item.registro,
          tenant_id: tenant.id,
          updateAt: new Date(),
        };
        await listaRepository.update(obj.id, obj);
        await lib.sleep(500);
      }
    }
  }
}

export const listaPrecoController = {
  init,
};
