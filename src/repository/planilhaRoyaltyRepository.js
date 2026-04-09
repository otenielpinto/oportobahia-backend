import { Repository } from "./baseRepository.js";

class PlanilhaRoyaltyRepository extends Repository {
  constructor(id_tenant = null) {
    super("tmp_planilha_royalty", id_tenant);
  }

  // Métodos personalizados específicos para PlanilhaRoyalty podem ser adicionados aqui
  // Os métodos básicos (create, update, delete, findAll, findById, etc.)
  // já estão disponíveis através da herança da Repository
}

export { PlanilhaRoyaltyRepository };
