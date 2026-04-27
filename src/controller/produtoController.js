import { lib } from "../utils/lib.js";
import { ProdutoRepository } from "../repository/produtoRepository.js";
import { TProductTypes } from "../types/productTypes.js";
import { tenantRepository } from "../repository/tenantRepository.js";
import { tinyRepository } from "../repository/tinyRepository.js";
import { serviceRepository } from "../repository/serviceRepository.js";
import { Tiny, TinyInfo } from "../services/tinyService.js";
import { ProductDetailRepository } from "../repository/productDetailRepository.js";
import { productDetailController } from "./productDetailController.js";
import { logRepository } from "../repository/logRepository.js";

async function init() {
  await receberProdutos();

  let items = [];
  let tenants = await tenantRepository.getAllTenantSystem();
  for (let tenant of tenants) {
    let id_tenant = tenant.tenant_pai;
    if (items.includes(id_tenant)) continue;
    items.push(id_tenant);
    await updateAllProductsDetails(id_tenant); //controle de processamento dentro da funcionalidade
  }
}

async function produtoObter(id_tenant, id) {
  let tenant = await tenantRepository.getTenantById(id_tenant);
  let tiny = new Tiny({ token: tenant.tiny_token, timeout: 1000 * 12 });
  let result = null;
  let response = null;
  for (let t = 0; t < 12; t++) {
    result = await tiny.post("produto.obter.php", [{ key: "id", value: id }]);
    response = await tiny.tratarRetorno(result, "produto");
    if (tiny.status() == "OK") break;
  }

  if (response == null) {
    console.log("Produto não encontrado na API Tiny");
  }

  return response;
}

async function getProductBySku(id_tenant, sku) {
  let productRepository = new ProdutoRepository(id_tenant);
  return await productRepository.findBySku(sku);
}

async function getProductByGtin(id_tenant, gtin) {
  let productRepository = new ProdutoRepository(id_tenant);
  return await productRepository.findByGtin(gtin);
}

async function getProductByNome(id_tenant, nome) {
  let productRepository = new ProdutoRepository(id_tenant);
  return await productRepository.findByNome(nome);
}

async function getProductById(id_tenant, id) {
  let productRepository = new ProdutoRepository(id_tenant);
  return await productRepository.findById(id);
}

async function receberProdutos() {
  let deleteMany = 0;
  let key = "Receber Produtos";
  let tenants = await tenantRepository.getAllTenantSystem();
  for (let tenant of tenants) {
    let id_tenant = tenant.id;
    if (tenant.tenant_pai != tenant.id) continue;
    if ((await serviceRepository.hasExec(id_tenant, key)) == 1) return null;
    await serviceRepository.updateService(id_tenant, key);

    const productRepository = new ProdutoRepository(id_tenant);

    if (deleteMany == 0) {
      deleteMany = 1;
      await productRepository.deleteMany({});
    }
    let tiny = new Tiny({ token: tenant.tiny_token, timeout: 1000 * 11 });
    let info = new TinyInfo({ instance: tiny });

    let page_count = await info.getPaginasProdutos();
    let response = null;
    let result = null;
    for (let page = page_count; page > 0; page--) {
      console.log(
        `TenantId[${id_tenant}] - Recebendo produto API Tiny ${page}/${page_count} as ${lib.currentDateTimeStr()}`,
      );

      for (let t = 0; t < 5; t++) {
        let data = [
          { key: "pesquisa", value: "" },
          { key: "pagina", value: page },
        ];
        result = await tiny.post("produtos.pesquisa.php", data);
        response = await tiny.tratarRetorno(result, "produtos");
        if (tiny.status() == "OK") break;
        response = null;
      }

      if (!Array.isArray(response)) continue;

      let items = [];
      for (let item of response) {
        item.produto.id_tenant = id_tenant;
        item.produto.id_empresa = id_tenant;
        item.produto.status = TProductTypes.STATUS.PENDENTE;
        item.produto.createdAt = new Date();
        item.produto.updatedAt = null;

        item.produto.gtin = item.produto.gtin
          ? item.produto.gtin.replace(/\s+/g, "")
          : item.produto.gtin;
        items.push(item.produto);
      }
      await productRepository.insertMany(items);
    }
    return true;
  }
}

async function updateProductDetailOne(id_tenant, id) {
  let produto = await produtoObter(id_tenant, id);
  if (!produto) return null;
  const productDetail = new ProductDetailRepository(id_tenant);

  produto.id_tenant = id_tenant;
  produto.id_empresa = id_tenant;
  return await productDetail.update(produto.id, response);
}

async function getAllProduct(params = {}) {
  let id_tenant = params.id_tenant;
  let filter = {};
  if (params?.status) {
    if (params?.status != null) filter = { status: params.status };
  }
  let productRepository = new ProdutoRepository(id_tenant);
  return await productRepository.findAll(filter);
}

async function setStatus(params = {}) {
  let new_status = params.status;
  let id = params.id;
  let id_tenant = params.id_tenant;
  if (!id) {
    console.log("Necessario informar o id do registro");
    return null;
  }

  let productRepository = new ProdutoRepository(id_tenant);
  return await productRepository.update(id, { status: new_status });
}

async function updateAllProductsDetails(id_tenant) {
  let key = "Atualiza Cadastro Produto " + id_tenant;
  if ((await serviceRepository.hasExec(id_tenant, key)) == 1) return null;
  await serviceRepository.updateService(id_tenant, key);

  let params = { id_tenant, status: TProductTypes.STATUS.PENDENTE };
  let products = await getAllProduct(params);

  let response = null;

  const productDetail = new ProductDetailRepository(id_tenant);
  const productRepository = new ProdutoRepository(id_tenant);

  for (let product of products) {
    response = await produtoObter(id_tenant, product.id);
    if (!response) continue;

    response.id_tenant = id_tenant;
    await productDetail.update(product.id, response);
    await productRepository.update(product.id, {
      status: TProductTypes.STATUS.PROCESSADO,
    });
  }

  return;
}

//--------------CRIA CLASSE PRODUCT_DETAIL-------------------------------------

//PRODUCT_DETAIL
async function getProductDetailBySku(id_tenant, codigo) {
  return await productDetailController.findBySku(id_tenant, codigo);
}

//CRIA CLASSE PRODUCT_DETAIL----------------------------------------------------------------

export const produtoController = {
  init,

  receberProdutos,

  produtoObter,

  getProductById,
  getProductBySku,
  getProductByGtin,
  getProductByNome,

  getAllProduct,
  setStatus,

  updateProductDetailOne,
  updateAllProductsDetails,
  getProductDetailBySku,
};
