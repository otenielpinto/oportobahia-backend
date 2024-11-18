//nome global da collection
const collection = "product";

export class ProductRepository {
  constructor(db) {
    this.db = db;
  }

  async create(payload) {
    const result = await this.db.collection(collection).insertOne(payload);
    return result.insertedId;
  }

  async update(id, payload) {
    const result = await this.db
      .collection(collection)
      .updateOne({ id: String(id) }, { $set: payload });
    return result.modifiedCount > 0;
  }

  async updateOrInsert(id, payload) {
    const result = await this.db
      .collection(collection)
      .updateOne({ id: String(id) }, { $set: payload }, { upsert: true });
    return result.modifiedCount > 0;
  }

  async delete(id) {
    const result = await this.db
      .collection(collection)
      .deleteOne({ id: String(id) });
    return result.deletedCount > 0;
  }

  async findAll(criterio = {}) {
    return await this.db.collection(collection).find(criterio).toArray();
  }

  async findById(id) {
    return await this.db.collection(collection).findOne({ id: id });
  }

  async findBySku(sku, id_tenant) {
    return await this.db
      .collection(collection)
      .findOne({ codigo: String(sku), id_tenant: id_tenant });
  }

  async findByGtin(gtin, id_tenant) {
    return await this.db
      .collection(collection)
      .findOne({ gtin: String(gtin), id_tenant: id_tenant });
  }

  async findByNome(nome, id_tenant) {
    return await this.db
      .collection(collection)
      .findOne({ nome: String(nome), id_tenant: id_tenant });
  }

  async insertMany(items) {
    if (!Array.isArray(items)) return null;
    try {
      return await this.db.collection(collection).insertMany(items);
    } catch (e) {
      console.log(e);
    }
  }

  async deleteMany(criterio = {}) {
    try {
      return await this.db.collection(collection).deleteMany(criterio);
    } catch (e) {
      console.log(e);
    }
  }
}
