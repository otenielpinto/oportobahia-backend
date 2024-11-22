import { Tiny, TinyInfo } from "../services/tinyService.js";
import { TMongo } from "../infra/mongoClient.js";
import { CfopRepository } from "../repository/cfopRepository.js";

import { lib } from "../utils/lib.js";

async function init() {
  await importarCfop();
}

async function cargaInicialCfop() {
  const cfopRepository = new CfopRepository(await TMongo.connect());

  let items = [];
  items.push({ id: 5102, codigo: "5102" });
  items.push({ id: 5104, codigo: "5104" });
  items.push({ id: 5110, codigo: "5110" });
  items.push({ id: 5403, codigo: "5403" });
  items.push({ id: 5405, codigo: "5405" });
  items.push({ id: 6102, codigo: "6102" });
  items.push({ id: 6403, codigo: "6403" });
  items.push({ id: 6404, codigo: "6404" });
  items.push({ id: 6108, codigo: "6108" });
  items.push({ id: 6104, codigo: "6104" });
  items.push({ id: 6110, codigo: "6110" });
  items.push({ id: 5910, codigo: "5910" });
  items.push({ id: 6910, codigo: "6910" });
  items.push({ id: 5911, codigo: "5911" });
  items.push({ id: 6911, codigo: "6911" });

  for (let item of items) {
    await cfopRepository.update(item.id, item);
  }
}

async function importarCfop() {
  const cfopRepository = new CfopRepository(await TMongo.connect());
  let items = await cfopRepository.findAll({});

  if (!items || items.length == 0) {
    cargaInicialCfop();
  }
}

export const cfopController = {
  init,
};
