import { Repository } from "./baseRepository.js";

class TributacaoRepository extends Repository {
  constructor(id_tenant = null) {
    super("tmp_tributacao", id_tenant);
  }
}

export { TributacaoRepository };
