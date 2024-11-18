import { TMongo } from "../infra/mongoClient.js";
import { lib } from "../utils/lib.js";
import { fb5 } from "../infra/fb5.js";

import { tenantRepository } from "../repository/tenantRepository.js";
import { serviceRepository } from "../repository/serviceRepository.js";
import { EstoqueRepository } from "../repository/estoqueRepository.js";
import { productController } from "../controller/productController.js";
import { Tiny } from "../services/tinyService.js";
import { TinyInfo } from "../services/tinyService.js";

async function init() {
  const tarefas = [];

  let tenants = await tenantRepository.getAllTenantSystem();
  for (let tenant of tenants) {
    let key = "Recebe Estoque Tiny " + tenant.id;
    if ((await serviceRepository.hasExec(tenant.id, key)) == 1) return;
    await serviceRepository.updateService(tenant.id, key);

    await obterListaGeralEstoque(tenant);
    const tarefa = new Promise(async (resolve, reject) => {
      try {
        const _tenant = { ...tenant }; // criar uma nova variavel tenant
        await obterQuantidadeEstoqueGeral(_tenant);
        await setData(_tenant);
        resolve(_tenant);
      } catch (error) {
        reject(error);
      }
    });
    tarefas.push(tarefa);
  }

  Promise.allSettled(tarefas).then((result) => {
    console.log("Concluido", result.status);
  });
}

async function obterQuantidadeEstoqueGeral(_tenant) {
  console.log(_tenant);
  const TEstoque = new EstoqueRepository(await TMongo.connect());
  console.log("Obtendo quantidade de estoque  " + lib.currentDateTimeStr());
  let items = await TEstoque.list({ id_tenant: _tenant.id });
  let tiny = new Tiny({ token: _tenant.tiny_token, timeout: 1000 * 11 });

  let response = null;
  let result = null;

  let record = 1;
  let recordcount = items?.length;
  for (let item of items) {
    record++;
    for (let t = 1; t < 7; t++) {
      console.log(
        "Tentativa:" + t + "/7" + ` Recno: ${record}/${recordcount} `
      );
      let data = [{ key: "id", value: item?.id }];
      result = await tiny.post("produto.obter.estoque.php", data);
      response = await tiny.tratarRetorno(result, "produto");
      if (tiny.status() == "OK") break;
      response = null;
    }
    let saldo = Number(response?.saldo ? response?.saldo : 0);

    console.log(
      `[${_tenant?.id}]${response?.codigo} id:" ${response?.id} + " Saldo:" ${response?.saldo}`
    );
    await TEstoque.addQuantity(item?.id, item?.id_tenant, saldo);
  }
}

async function obterListaGeralEstoque(_tenant) {
  const estoque = new EstoqueRepository(await TMongo.connect());
  let deleteMany = 0;
  let tenants = [_tenant];

  for (let tenant of tenants) {
    if (deleteMany == 0) {
      deleteMany = 1;
      await estoque.deleteMany({ id_tenant: tenant.id });
    }
    let tiny = new Tiny({ token: tenant.tiny_token, timeout: 1000 * 10 });
    let info = new TinyInfo({ instance: tiny });
    let page_count = await info.getPaginasProdutos();

    for (let page = page_count; page > 0; page--) {
      console.log(
        `TenantId[${
          tenant.id
        }] - Atualizando lista estoque API Tiny ${page}/${page_count} as ${lib.currentDateTimeStr()}`
      );
      let response = null;
      let result;

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
        items.push({
          id_tenant: tenant.id,
          created_at: new Date(),
          saldo: 0,
          ...item?.produto,
        });
      }
      await estoque.insertMany(items);
    }
  }
  return true;
}

async function setData(_tenant) {
  const TEstoque = new EstoqueRepository(await TMongo.connect());
  console.log("Iniciando SQL " + lib.currentDateTimeStr());
  let items = await TEstoque.listQuantity({ id_tenant: _tenant.id });
  let max_items_lote = 1000;
  console.log("Quantidade de registros:" + items.length);

  let estoques = [];
  let records = 0;
  for (let item of items) {
    records++;
    estoques.push(item);

    if (records > max_items_lote) {
      records = 0;
      await procProdutoRedeSetSQL(estoques);
      estoques = [];
    }
  }
  await procProdutoRedeSetSQL(estoques);
  console.log("Concluindo SQL " + lib.currentDateTimeStr());
}

let getIdProdutoMatriz = async (item) => {
  let id_tenant_pai = 1;
  let response = await productController.getProductBySku(
    id_tenant_pai,
    item?.codigo
  );
  return response?.id;
};

async function procProdutoRedeSetSQL(items) {
  if (!Array.isArray(items)) return null;
  if (items.length == 0) return null;

  let cmd_sql = "";
  for (let item of items) {
    let id_produto_matriz = await getIdProdutoMatriz(item);
    if (!id_produto_matriz) {
      console.log(
        `[${item?.id_tenant}]Informação do produto não encontrada. Codigo: ${item?.codigo}`
      );
      continue;
    }

    cmd_sql += `EXECUTE PROCEDURE PRODUTO_REDE_SET
    (${item.id_tenant},${id_produto_matriz},  ${item.saldo});\n`;
  }

  let execute_block_sql = `EXECUTE BLOCK
    AS
    BEGIN 
      ${cmd_sql}
    END
  `;

  fb5.firebird.attach(fb5.dboptions, (err, db) => {
    if (err) {
      console.log(err);
      return;
    }

    db.query(execute_block_sql, [], (err, result) => {
      //console.log(execute_block_sql);
      db.detach();
      if (err) {
        console.log(err);
      }
      return result;
    });
  }); // fb5.firebird
}

async function findBySku(id_tenant, sku) {
  let estoqueRepository = new EstoqueRepository(await TMongo.connect());
  return await estoqueRepository.findBySku(id_tenant, sku);
}

export const estoqueController = {
  init,
  obterListaGeralEstoque,
  obterQuantidadeEstoqueGeral,
  setData,
  findBySku,
};
