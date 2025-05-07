//Classe tem letras maiuculoas
import { lib } from "../utils/lib.js";

const collection = "nota_fiscal";

export class NfeRepository {
  constructor(db) {
    this.db = db;
  }

  async create(payload) {
    const result = await this.db.collection(collection).insertOne(payload);
    return result.insertedId;
  }

  async update(id, payload) {
    payload.updated_at = new Date();
    if (!payload.sys_status) payload.sys_status = 1;
    if (!payload.sys_xml) payload.sys_xml = 0;
    if (payload.data_emissao) {
      payload.data_movto = lib.dateBrToIso8601(payload.data_emissao);
    }

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
    return await this.db.collection(collection).findOne({ id: String(id) });
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
