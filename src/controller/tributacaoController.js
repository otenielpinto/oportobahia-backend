import { Tiny, TinyInfo } from "../services/tinyService.js";
import { TMongo } from "../infra/mongoClient.js";
import { TributacaoRepository } from "../repository/tributacaoRepository.js";
import { lib } from "../utils/lib.js";

async function init() {
  await importarTributacao();
}

async function cargaInicialTributacao() {
  const tributacaoRepository = new TributacaoRepository(await TMongo.connect());

  let items = [];
  items.push({
    id: 1,
    descricao: "Regra Unica",
    desconto: 0,
    taxa_custo_operacional: 9,
    icms_interno: 18,
    icms_externo: 12,
    ipi: 0,
    pis: 1.65,
    cofins: 7.6,
    simples_aliquota: 0,
  });

  for (let item of items) {
    await tributacaoRepository.update(item.id, item);
  }
}

async function importarTributacao() {
  const tributacaoRepository = new TributacaoRepository(await TMongo.connect());
  let items = await tributacaoRepository.findAll({});

  if (!items || items.length == 0) {
    cargaInicialTributacao();
  }
}

export const tributacaoController = {
  init,
};
