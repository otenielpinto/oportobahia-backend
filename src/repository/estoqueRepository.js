export class EstoqueRepository {
  constructor(db) {
    this.db = db;
  }

  async create(payload) {
    const result = await this.db.collection("tmp_estoque").insertOne(payload);
    return result.insertedId;
  }

  async read(id) {
    const obj = await this.db.collection("tmp_estoque").findOne({ id: id });
    return obj;
  }

  async update(id, obj) {
    const result = await this.db
      .collection("tmp_estoque")
      .updateOne({ id: id }, { $set: obj }, { upsert: true });
    return result.modifiedCount > 0;
  }

  async delete(id) {
    const result = await this.db
      .collection("tmp_estoque")
      .deleteOne({ id: id });
    return result.deletedCount > 0;
  }

  async list(criterio) {
    return await this.db.collection("tmp_estoque").find(criterio).toArray();
  }

  async findBySku(id_tenant, sku) {
    return await this.db
      .collection("tmp_estoque")
      .findOne({ id_tenant: id_tenant, codigo: String(sku) });
  }

  async insertMany(items) {
    if (!Array.isArray(items)) return null;
    try {
      return await this.db.collection("tmp_estoque").insertMany(items);
    } catch (e) {
      console.log(e);
    }
  }

  async deleteMany(criterio) {
    try {
      return await this.db.collection("tmp_estoque").deleteMany(criterio);
    } catch (e) {
      console.log(e);
    }
  }

  async addQuantity(id, id_tenant, saldo) {
    let obj = { id, id_tenant, saldo, updated_at: new Date() };
    const result = await this.db
      .collection("tmp_estoque")
      .updateOne({ id: String(id) }, { $set: obj }, { upsert: true });
    return result.modifiedCount > 0;
  }

  async listQuantity(criterio = {}) {
    return await this.db.collection("tmp_estoque").find(criterio).toArray();
  }
}
