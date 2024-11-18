import { TMongo } from "./infra/mongoClient.js";
import { lib } from "./utils/lib.js";
import nodeSchedule from "node-schedule";

import { orderRepository } from "./repository/orderRepository.js";
import { stockRepository } from "./repository/stockRepository.js";
import { notaFiscalRepository } from "./repository/notafiscalRepository.js";
import { produtoController } from "./controller/produtoController.js";
import { productController } from "./controller/productController.js";
import { empresaController } from "./controller/empresaController.js";
import { estoqueController } from "./controller/estoqueController.js";
import { serviceRepository } from "./repository/serviceRepository.js";
import { vendaController } from "./controller/vendaController.js";

global.processandoNow = 0;

async function task() {
  global.processandoNow = 1;
  await productController.init(); //mongodb
  await produtoController.init(); //firebird
  await orderRepository.init();

  //executar 1 x por dia
  let key = "Tarefa diaria";
  let tenant_id = 1;
  if ((await serviceRepository.hasExec(tenant_id, key)) == 0) {
    await serviceRepository.updateService(tenant_id, key);
    await empresaController.init();
    await estoqueController.init();
  }
  await vendaController.init();

  global.processandoNow = 0;
  console.log(" Job Finished [task] " + lib.currentDateTimeStr());
}

async function init() {
  //await productController.init(); //mongodb
  //await estoqueController.init();
  //await vendaController.init();
  //await orderRepository.init();

  //return;

  try {
    const time = 13; //tempo em minutos
    const job = nodeSchedule.scheduleJob(`*/${time} * * * *`, async () => {
      console.log(" Job start as " + lib.currentDateTimeStr());
      await TMongo.close();

      if (global.processandoNow == 1) {
        console.log(
          " Job can't started [processing] " + lib.currentDateTimeStr()
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