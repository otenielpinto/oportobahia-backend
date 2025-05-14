import { Tiny, TinyInfo } from "../services/tinyService.js";
import { TMongo } from "../infra/mongoClient.js";
import { tenantRepository } from "../repository/tenantRepository.js";
import { ListaPrecoRepository } from "../repository/listaPrecoRepository.js";
import { serviceRepository } from "../repository/serviceRepository.js";
import { lib } from "../utils/lib.js";
import { ListaPrecoExcecoesRepository } from "../repository/listaPrecoExcecoesRepository.js";

async function init() {
  let tenants = await tenantRepository.getAllTenantSystem();

  let key = "Importar lista de preços excecoes";
  for (let tenant of tenants) {
    let id_tenant = tenant.id;
    if ((await serviceRepository.hasExec(id_tenant, key)) == 1) return null;
    await serviceRepository.updateService(id_tenant, key);
    await importarListaPreco(tenant);
  }
}

async function importarListaPreco(tenant) {
  let listaRepository = new ListaPrecoRepository(await TMongo.connect());
  let listaPreco = await listaRepository.findAll({ tenant_id: tenant.id });

  const listaPrecoExcecoesRepository = new ListaPrecoExcecoesRepository(
    await TMongo.connect()
  );

  let tiny = new Tiny({ token: tenant.tiny_token, timeout: 1000 * 12 });
  let info = new TinyInfo({ instance: tiny });
  let result = null;
  let response = null;

  for (let lista of listaPreco) {
    let numero_paginas = await info.getPaginasListaPrecosExcecoes(lista.id);

    for (let pagina = 1; pagina <= numero_paginas; pagina++) {
      console.log(
        `Importando lista [${lista.id}] de preços excecoes  ${pagina} de ${numero_paginas}`
      );

      response = null;
      for (let t = 0; t < 12; t++) {
        result = await tiny.post("listas.precos.excecoes.php", [
          { key: "idListaPreco", value: lista.id },
          { key: "pagina", value: pagina },
        ]);
        response = await tiny.tratarRetorno(result, "registros");
        if (tiny.status() == "OK") break;
      }

      if (!Array.isArray(response)) continue;

      for (let item of response) {
        console.log(
          `Importando lista [${item.registro.id_lista_preco}] de preços excecoes ${item.registro.id}`
        );
        let obj = {
          ...item.registro,
          acrescimo_desconto: lista.acrescimo_desconto,
          descricao: lista.descricao,
          tenant_id: tenant.id,
          updateAt: new Date(),
        };
        await listaPrecoExcecoesRepository.update(obj.id, obj);
        await lib.sleep(500);
      }
    }
  }
}

export const listaPrecoExcecoesController = {
  init,
};
