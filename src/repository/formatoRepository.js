import { Repository } from "./baseRepository.js";

export class FormatoRepository extends Repository {
  constructor(id_tenant) {
    if (!id_tenant) {
      throw new Error("FormatoRepository: id_tenant es requerido");
    }
    super("formato", id_tenant);
  }
}
