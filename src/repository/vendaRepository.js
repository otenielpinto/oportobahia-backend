class VendaRepository {
  constructor(db) {
    this.db = db;
  }
  tabela = `VENDA`;

  async create(payload) {
    return await this.db.insertQuery(this.tabela, payload);
  }

  async findById(id) {
    return await this.db.findById(id);
  }

  async update(id, obj) {
    let result = await this.db.updateQuery(this.tabela, id, obj);
    return result;
  }

  async delete(id) {
    const result = await this.db.deleteQuery(this.tabela, id);
    return result;
  }

  async findAll(
    tabela,
    { page = 1, limit = 10, orderBy = "id", orderDir = "ASC" } = {}
  ) {
    return await this.db.findAll(tabela, { page, limit, orderBy, orderDir });
  }

  async insertMany(items) {}

  async deleteMany(items) {}

  async getGenId(nameGenerator = "") {
    return await this.db.getGenId(nameGenerator);
  }
}

export { VendaRepository };
