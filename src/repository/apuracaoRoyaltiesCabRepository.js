import { Repository } from "./baseRepository.js";

class ApuracaoRoyaltiesCabRepository extends Repository {
  constructor(id_tenant = null) {
    super("tmp_apuracao_royalties_cab", id_tenant);
  }

  /**
   * Busca cabeceras por status
   */
  async findByStatus(status) {
    return this.findAll({ status });
  }

  /**
   * Busca cabeceras pendientes
   */
  async findPendentes() {
    return this.findByStatus("pendente");
  }

  /**
   * Actualiza status de la cabecera
   */
  async atualizarStatus(id, status, extras = {}) {
    return this.update(id, {
      status,
      ...extras,
    });
  }

  /**
   * Marca como procesando
   */
  async marcarProcesando(id) {
    return this.atualizarStatus(id, "procesando");
  }

  /**
   * Marca como completada con total de movimientos
   */
  async marcarCompletada(id, totalMovimentos, logs = []) {
    return this.atualizarStatus(id, "completada", { totalMovimentos, logs });
  }

  /**
   * Marca como erro con mensaje
   */
  async marcarErro(id, erroMessage) {
    return this.atualizarStatus(id, "erro", { erroMessage });
  }
}

export { ApuracaoRoyaltiesCabRepository };