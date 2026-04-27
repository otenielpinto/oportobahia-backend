//Classe tem letras maiuculoas
import { Repository } from "./baseRepository.js";

class ListaPrecoExcecoesRepository extends Repository {
  constructor(id_tenant = null) {
    super("tmp_lista_preco_excecoes", id_tenant);
  }

  /**
   * Busca preço de lista por id_produto e descrição da lista de preço
   * @param {number} id_produto - ID do produto
   * @param {string} descricao - Descrição da lista de preço (ex: "LISTA 2024")
   * @returns {Promise<Object|null>} Registro mais recente por updateAt ou null se não encontrar
   */
  async findByProdutoAndListaPreco(id_produto, descricao) {
    if (!id_produto || !descricao) {
      return null;
    }

    const result = await this.findAll({
      id_produto: Number(id_produto),
      descricao: descricao,
    }, {
      sort: { updateAt: -1 },
      limit: 1,
    });

    return result && result.length > 0 ? result[0] : null;
  }
}

export { ListaPrecoExcecoesRepository };
