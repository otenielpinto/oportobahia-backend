import { ApuracaoRoyaltiesCabRepository } from "../repository/apuracaoRoyaltiesCabRepository.js";
import { _processarCab } from "./apurarRoyaltiesController.js";

async function processarFila() {
  const cabRepoGlobal = new ApuracaoRoyaltiesCabRepository();
  const pendentes = await cabRepoGlobal.findPendentes();

  if (!pendentes || pendentes.length === 0) {
    return;
  }

  for (const cab of pendentes) {
    const cabRepo = new ApuracaoRoyaltiesCabRepository(cab.id_tenant);

    try {
      await cabRepo.marcarProcesando(cab.id);
      const { insertedCount, logs } = await _processarCab(cab);
      await cabRepo.marcarCompletada(cab.id, insertedCount, logs);
    } catch (error) {
      const erroMessage = error?.message || String(error) || "Erro desconhecido";
      console.error(`[processarFila] Erro ao processar cab ${cab.id}:`, error);
      try {
        await cabRepo.marcarErro(cab.id, erroMessage);
      } catch (dbError) {
        console.error(`[processarFila] Falha ao marcar erro para cab ${cab.id}:`, dbError);
      }
    }
  }
}

async function init() {
  try {
    await processarFila();
  } catch (error) {
    console.error("Erro ao processar fila de apuração de royalties:", error);
  }
}

export const apuracaoRoyaltiesCabController = { init };
