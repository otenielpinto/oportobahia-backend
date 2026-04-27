import { Repository } from "./baseRepository.js";

export class ProdutoRepository extends Repository {
  constructor(id_tenant) {
    if (!id_tenant) {
      throw new Error("ProdutoRepository: id_tenant es requerido");
    }
    super("tmp_produto", id_tenant);
  }

  /**
   * Update o Insert con upsert - mantiene compatibilidad legacy
   * @param {string} id - ID del producto
   * @param {object} payload - Datos a actualizar/insertar
   * @returns {Promise<boolean>} - true si se modificó/insertó
   */
  async updateOrInsert(id, payload) {
    const collection = await this.getCollection();
    const data = this._addTenantFilter({ ...payload });
    data.updatedAt = new Date();

    let filter = { id: String(id) };
    filter = this._addTenantToQuery(filter);

    const result = await collection.updateOne(
      filter,
      {
        $set: data,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }

  /**
   * Busca producto por SKU (código)
   * @param {string} sku - Código/SKU del producto
   * @returns {Promise<object|null>} - Producto encontrado o null
   */
  async findBySku(sku) {
    return await this.findOne({ codigo: String(sku) });
  }

  /**
   * Busca producto por GTIN (código de barras)
   * @param {string} gtin - Código GTIN
   * @returns {Promise<object|null>} - Producto encontrado o null
   */
  async findByGtin(gtin) {
    return await this.findOne({ gtin: String(gtin) });
  }

  /**
   * Busca producto por nombre
   * @param {string} nome - Nombre del producto
   * @returns {Promise<object|null>} - Producto encontrado o null
   */
  async findByNome(nome) {
    return await this.findOne({ nome: String(nome) });
  }
}
