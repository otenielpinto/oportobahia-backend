import { Repository } from "./baseRepository.js";

class ApuracaoRoyaltiesMovtoRepository extends Repository {
  constructor(id_tenant = null) {
    super("tmp_apuracao_royalties_movto", id_tenant);
  }

  // Métodos personalizados específicos para ApuracaoRoyaltiesMovto podem ser adicionados aqui
  // Os métodos básicos (create, update, delete, findAll, findById, etc.)
  // já estão disponíveis através da herança da Repository
}

export { ApuracaoRoyaltiesMovtoRepository };
