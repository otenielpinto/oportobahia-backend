//Classe tem letras maiuculoas
import { Repository } from "./baseRepository.js";
import { lib } from "../utils/lib.js";

export class NfeRepository extends Repository {
  constructor(id_tenant = null) {
    super("nota_fiscal", id_tenant);
  }

  async update(id, payload) {
    const collection = await this.getCollection();

    payload.updated_at = new Date();
    if (!payload.sys_status) payload.sys_status = 1;
    if (!payload.sys_xml) payload.sys_xml = 0;
    if (payload.data_emissao) {
      payload.data_movto = lib.dateBrToIso8601(payload.data_emissao);
    }

    let filter = { id: String(id) };
    filter = this._addTenantToQuery(filter);

    const result = await collection.updateOne(
      filter,
      { $set: payload },
      { upsert: true }
    );
    return result;
  }
}
