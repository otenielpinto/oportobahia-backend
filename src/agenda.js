import { TMongo } from "./infra/mongoClient.js";
import { lib } from "./utils/lib.js";
import nodeSchedule from "node-schedule";

import { notaFiscalRepository } from "./repository/notafiscalRepository.js";
import { productController } from "./controller/productController.js";
import { serviceRepository } from "./repository/serviceRepository.js";
import { listaPrecoController } from "./controller/listaPrecoController.js";
import { listaPrecoExcecoesController } from "./controller/listaPrecoExcecoesController.js";
import { nfeController } from "./controller/nfeController.js";
import { cfopController } from "./controller/cfopController.js";
import { tributacaoController } from "./controller/tributacaoController.js";
import { apurarCopyrightController } from "./controller/apurarCopyrightController.js";
import { produtoRoyaltyController } from "./controller/produtoRoyaltyController.js";
import { apurarRoyaltiesController } from "./controller/apurarRoyaltiesController.js";

global.processandoNow = 0;

async function task() {
  if ((await lib.isManutencao()) == 1) {
    console.log("Esta em horario de manutenção até ( 20 hrs até 6:00 hrs");
    return;
  }

  global.processandoNow = 1;
  await productController.init(); //mongodb
  await listaPrecoController.init();
  await listaPrecoExcecoesController.init();
  await nfeController.init();
  await apurarCopyrightController.init();
  await produtoRoyaltyController.init(); // Migracao de royalties - ativar quando necessario

  //executar 1 x por dia
  let key = "Tarefa diaria";
  let id_tenant = 1;
  if ((await serviceRepository.hasExec(id_tenant, key)) == 0) {
    await serviceRepository.updateService(id_tenant, key);
    await cfopController.init();
    await tributacaoController.init();
  }

  global.processandoNow = 0;
  console.log(" Job Finished [task] " + lib.currentDateTimeStr());
}

async function init() {
  //await productController.init(); //mongodb
  //await nfeController.init();
  //await listaPrecoController.init();
  //await listaPrecoExcecoesController.init();

  //await produtoRoyaltyController.init(); // Migracao de royalties - ativar quando necessario
  //testando relatorio de apuracao de royalties
  // await apurarRoyaltiesController.apurarRoyalties({
  //   fromDate: new Date("2026-03-01"),
  //   toDate: new Date("2026-03-31"),
  //   cotacaoDollar: 5.25,
  //   id_tenant: 1,
  // });

  // console.log("Tarefa finalizada em " + lib.currentDateTimeStr());
  // return;

  try {
    const time = 12; //tempo em minutos
    const job = nodeSchedule.scheduleJob(`*/${time} * * * *`, async () => {
      console.log(" Job start as " + lib.currentDateTimeStr());
      await TMongo.close();

      if (global.processandoNow == 1) {
        console.log(
          " Job can't started [processing] " + lib.currentDateTimeStr(),
        );
      } else {
        try {
          await task();
        } finally {
          global.processandoNow = 0;
        }
      }
    });
  } catch (err) {
    throw new Error(`Can't start agenda! Err: ${err.message}`);
  }
}

export const agenda = { init };
