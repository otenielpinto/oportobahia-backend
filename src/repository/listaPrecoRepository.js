//Classe tem letras maiuculoas
import { Repository } from "./baseRepository.js";

export class ListaPrecoRepository extends Repository {
  constructor(id_tenant = null) {
    super("tmp_lista_preco", id_tenant);
  }
}
