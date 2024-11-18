export class EmpresaRepository {
  constructor(db) {
    this.db = db;
  }

  async create(empresa) {
    let cpfcnpj = empresa?.cpfcnpj;
    let response = await this.byCPFCNPJ(cpfcnpj);
    if (!response) {
      const result = await this.db.collection("empresa").insertOne(empresa);
      return result.insertedId;
    }
    return await this.update(response.id, empresa);
  }

  async read(id) {
    const customer = await this.db.collection("empresa").findOne({ id: id });
    return customer;
  }

  async update(id, empresa) {
    const result = await this.db
      .collection("empresa")
      .updateOne({ id: id }, { $set: empresa });
    return result.modifiedCount > 0;
  }

  async delete(id) {
    const result = await this.db.collection("empresa").deleteOne({ id: id });
    return result.deletedCount > 0;
  }

  async list() {
    const customers = await this.db.collection("empresa").find().toArray();
    return customers;
  }

  async byCPFCNPJ(cpfcnpj) {
    const customer = await this.db
      .collection("empresa")
      .findOne({ cpfcnpj: cpfcnpj });
    return customer;
  }
}
