import { Repository } from "./baseRepository.js";

export class ProductDetailRepository extends Repository {
  constructor(id_tenant) {
    if (!id_tenant) {
      throw new Error("ProductDetailRepository: id_tenant es requerido");
    }
    super("product_detail", id_tenant);
  }

  /**
   * Busca producto por SKU (código)
   * @param {string} sku - Código/SKU del producto
   * @returns {Promise<object|null>} - Producto encontrado o null
   */
  async findBySku(sku) {
    return await this.findOne({ codigo: String(sku) });
  }
}