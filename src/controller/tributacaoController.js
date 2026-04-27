import { Tiny, TinyInfo } from "../services/tinyService.js";
import { TributacaoRepository } from "../repository/tributacaoRepository.js";
import { lib } from "../utils/lib.js";

async function init() {
  await importarTributacao();
}

async function cargaInicialTributacao() {
  const tributacaoRepository = new TributacaoRepository();

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
    id_empresa: 1,
    id_tenant: 1, //tem que ser o mesmo codigo da id
  });

  for (let item of items) {
    await tributacaoRepository.update(item.id, item);
  }
}

async function importarTributacao() {
  const tributacaoRepository = new TributacaoRepository();
  let items = await tributacaoRepository.findAll({});

  if (!items || items.length == 0) {
    await cargaInicialTributacao();
  }
}

export const tributacaoController = {
  init,
};
