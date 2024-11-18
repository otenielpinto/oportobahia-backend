import { TMongo } from "../infra/mongoClient.js";
import { lib } from "../utils/lib.js";

import { ProductRepository } from "../repository/productRepository.js";
import { TProductTypes } from "../types/productTypes.js";
import { tenantRepository } from "../repository/tenantRepository.js";
import { tinyRepository } from "../repository/tinyRepository.js";
import { serviceRepository } from "../repository/serviceRepository.js";
import { Tiny, TinyInfo } from "../services/tinyService.js";

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

async function getProductBySku(id_tenant, sku) {
  let productRepository = new ProductRepository(await TMongo.connect());
  return await productRepository.findBySku(sku, id_tenant);
}

async function getProductByGtin(id_tenant, gtin) {
  let productRepository = new ProductRepository(await TMongo.connect());
  return await productRepository.findByGtin(gtin, id_tenant);
}

async function getProductByNome(id_tenant, nome) {
  let productRepository = new ProductRepository(await TMongo.connect());
  return await productRepository.findByNome(nome, id_tenant);
}

async function getProductById(id_tenant, id) {
  let productRepository = new ProductRepository(await TMongo.connect());
  return await productRepository.findById(id);
}

async function receberProdutos() {
  const productRepository = new ProductRepository(await TMongo.connect());
  let deleteMany = 0;
  let key = "Receber Produtos";
  let tenants = await tenantRepository.getAllTenantSystem();
  for (let tenant of tenants) {
    let id_tenant = tenant.id;
    if (tenant.tenant_pai != tenant.id) continue;
    if ((await serviceRepository.hasExec(id_tenant, key)) == 1) return null;
    await serviceRepository.updateService(id_tenant, key);

    if (deleteMany == 0) {
      deleteMany = 1;
      await productRepository.deleteMany({ id_tenant: tenant.id });
    }
    let tiny = new Tiny({ token: tenant.tiny_token, timeout: 1000 * 11 });
    let info = new TinyInfo({ instance: tiny });

    let page_count = await info.getPaginasProdutos();
    let response = null;
    let result = null;
    for (let page = page_count; page > 0; page--) {
      console.log(
        `TenantId[${id_tenant}] - Recebendo produto API Tiny ${page}/${page_count} as ${lib.currentDateTimeStr()}`
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
        item.produto.status = TProductTypes.STATUS.PENDENTE;
        item.produto.created_at = new Date();
        item.produto.updated_at = null;
        item.produto.sku = item.produto.codigo; //remove esse campo com o tempo 09/08/2024
        items.push(item.produto);
      }
      await productRepository.insertMany(items);
    }
  }
  return true;
}

async function updateProductDetailOne(id_tenant, id) {
  let produto = await tinyRepository.parseToProduto(
    await tinyRepository.produtoObter(id_tenant, id)
  );
  return await saveProdutoDetailMongo(id_tenant, produto);
}

async function getAllProduct(params = {}) {
  let id_tenant = params.id_tenant;
  let filter = { id_tenant };
  if (params?.status) {
    if (params?.status != null) filter = { id_tenant, status: params.status };
  }
  let productRepository = new ProductRepository(await TMongo.connect());
  return await productRepository.findAll(filter);
}

async function setStatus(params = {}) {
  let new_status = params.status;
  let id = params.id;
  if (!id) {
    console.log("Necessario informar o id do registro");
    return null;
  }

  let productRepository = new ProductRepository(await TMongo.connect());
  return await productRepository.update(id, { status: new_status });
}

async function updateAllProductsDetails(id_tenant) {
  let key = "Atualiza Cadastro Produto " + id_tenant;
  if ((await serviceRepository.hasExec(id_tenant, key)) == 1) return null;
  await serviceRepository.updateService(id_tenant, key);
  let params = { id_tenant, status: TProductTypes.STATUS.PENDENTE };
  let products = await getAllProduct(params);
  let sendStatus = {
    id_tenant,
    status: TProductTypes.STATUS.PROCESSADO,
    id: 0,
  };
  for (let product of products) {
    await lib.sleep(200);
    sendStatus.id = product.id;
    await updateProductDetailOne(id_tenant, product?.id);
    await setStatus(sendStatus);
  }
  return;
}

//--------------CRIA CLASSE PRODUCT_DETAIL-------------------------------------

//PRODUCT_DETAIL Precisa vir o produto limpo para como é gravado no mongodb .
async function saveProdutoDetailMongo(id_tenant, item) {
  if (!item) return null;
  let id = String(item?.id);
  let body = {
    id_tenant: Number(id_tenant),
    ...item,
    updated_at: new Date(),
  };

  const client = await TMongo.connect();
  client
    .collection("product_detail")
    .updateOne(
      { id: { $eq: id }, id_tenant: { $eq: Number(id_tenant) } },
      { $set: body },
      { upsert: true }
    );

  return true;
}
async function productDetaildeleteMany(criterio = {}) {
  const client = await TMongo.connect();
  const response = await client
    .collection("product_detail")
    .deleteMany(criterio);
  return response;
}

async function getProductDetailById(id) {
  const client = await TMongo.connect();
  const response = await client
    .collection("product_detail")
    .findOne({ id: String(id) });
  return response;
}

//PRODUCT_DETAIL
async function getProductDetailBySku(id_tenant, codigo) {
  const client = await TMongo.connect();
  const response = await client
    .collection("product_detail")
    .findOne({ codigo: String(codigo), id_tenant: id_tenant });
  return response;
}

//CRIA CLASSE PRODUCT_DETAIL----------------------------------------------------------------

export const productController = {
  init,

  receberProdutos,

  getProductById,
  getProductBySku,
  getProductByGtin,
  getProductByNome,

  getAllProduct,
  setStatus,

  updateProductDetailOne,
  updateAllProductsDetails,
  getProductDetailBySku,
  getProductDetailById,
  productDetaildeleteMany,

  saveProdutoDetailMongo,
};