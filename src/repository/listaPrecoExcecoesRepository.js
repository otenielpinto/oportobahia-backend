//Classe tem letras maiuculoas
import { Repository } from "./baseRepository.js";

class ListaPrecoExcecoesRepository extends Repository {
  constructor(id_tenant = null) {
    super("tmp_lista_preco_excecoes", id_tenant);
  }
}

export { ListaPrecoExcecoesRepository };
