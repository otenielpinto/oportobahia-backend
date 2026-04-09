import { Repository } from "./baseRepository.js";

class ProdutoRoyaltyRepository extends Repository {
  constructor(id_tenant = null) {
    super("tmp_produto_royalty", id_tenant);
  }

  // Métodos personalizados específicos para ProdutoRoyalty podem ser adicionados aqui
  // Os métodos básicos (create, update, delete, findAll, findById, etc.)
  // já estão disponíveis através da herança da Repository
}

export { ProdutoRoyaltyRepository };
