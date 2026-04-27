import { ProductDetailRepository } from "../repository/productDetailRepository.js";

async function init() {}

async function create(id_tenant, payload) {
  const repo = new ProductDetailRepository(id_tenant);
  return await repo.create(payload);
}

async function update(id_tenant, id, payload) {
  const repo = new ProductDetailRepository(id_tenant);
  return await repo.update(id, payload);
}

async function deleteOne(id_tenant, id) {
  const repo = new ProductDetailRepository(id_tenant);
  return await repo.delete(id);
}

async function findAll(id_tenant, criterio = {}) {
  const repo = new ProductDetailRepository(id_tenant);
  return await repo.findAll(criterio);
}

async function findById(id_tenant, id) {
  const repo = new ProductDetailRepository(id_tenant);
  return await repo.findById(id);
}

async function findBySku(id_tenant, sku) {
  const repo = new ProductDetailRepository(id_tenant);
  return await repo.findBySku(sku);
}

async function insertMany(id_tenant, items) {
  const repo = new ProductDetailRepository(id_tenant);
  return await repo.insertMany(items);
}

async function deleteMany(id_tenant, criterio = {}) {
  const repo = new ProductDetailRepository(id_tenant);
  return await repo.deleteMany(criterio);
}

export const productDetailController = {
  init,
  create,
  update,
  delete: deleteOne,
  findAll,
  findById,
  findBySku,
  insertMany,
  deleteMany,
};