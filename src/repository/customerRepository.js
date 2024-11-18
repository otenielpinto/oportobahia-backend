export class CustomerRepository {
  constructor(db) {
    this.db = db;
  }

  async create(customer) {
    if (!customer.created_at) customer.created_at = new Date();
    let cpf_cnpj = customer?.cpf_cnpj;
    let response = await this.byCPFCNPJ(cpf_cnpj);
    if (!response) {
      const result = await this.db.collection("customer").insertOne(customer);
      return result.insertedId;
    }
    return await this.update(response._id, customer);
  }

  async read(codigo) {
    const customer = await this.db
      .collection("customer")
      .findOne({ codigo: codigo });
    return customer;
  }

  async update(id, customer) {
    if (!customer.updated_at) customer.updated_at = new Date();
    const result = await this.db
      .collection("customer")
      .updateOne({ _id: id }, { $set: customer });
    return result.modifiedCount > 0;
  }

  async delete(id) {
    const result = await this.db.collection("customer").deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async list() {
    const customers = await this.db.collection("customer").find().toArray();
    return customers;
  }

  async byCPFCNPJ(cpf_cnpj) {
    const customer = await this.db
      .collection("customer")
      .findOne({ cpf_cnpj: cpf_cnpj });
    return customer;
  }
}
