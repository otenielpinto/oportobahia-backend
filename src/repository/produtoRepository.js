export class ProdutoRepository {
  constructor(db) {
    this.db = db;
  }

  async create(produto) {
    if (!produto) return undefined;
    try {
      await this.db.insertQuery("produto", produto);
      return produto;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  async findById(id) {
    if (!id) return undefined;

    try {
      const produto = await this.db.findById("produto", id);
      return produto;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  async findAll(page, limit) {
    try {
      const produtos = await this.db.findAll("produto", { page, limit });
      return produtos;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  async update(id, produto) {
    if (!id) return undefined;

    try {
      const updatedProduto = await this.db.updateQuery("produto", id, produto);
      return updatedProduto;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  async delete(id) {
    if (!id) return undefined;

    try {
      const response = await this.db.deleteQuery("produto", id);
      return response;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }
}
