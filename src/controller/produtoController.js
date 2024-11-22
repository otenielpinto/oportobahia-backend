import { ProdutoRepository } from "../repository/produtoRepository.js";
import { fb5 } from "../infra/fb5.js";
import { lib } from "../utils/lib.js";
import { ProdutoMapper } from "../mappers/produtoMapper.js";
import { serviceRepository } from "../repository/serviceRepository.js";
import { tenantRepository } from "../repository/tenantRepository.js";
import { productController } from "../controller/productController.js";
import { json } from "express";

const MAX_UPDATE_RECORDS = 500;
const produto = new ProdutoRepository(fb5);

async function init() {
  let tenants = await tenantRepository.getAllTenantSystem();
  for (let tenant of tenants) {
    let id_tenant = tenant.tenant_pai;
    let key = "Atualiza Produtos e Preco " + id_tenant;
    if ((await serviceRepository.hasExec(id_tenant, key)) == 1) return;
    await serviceRepository.updateService(id_tenant, key);
    try {
      await setData(id_tenant);
    } catch (error) {
      console.log("Erro setData " + error);
    }
    try {
      await setUpdate(id_tenant);
    } catch (error) {
      console.log("Erro setUpdate " + error);
    }

    break; //executar apenas 1 , independe do tenant
  }
}

const getAllProdutosSQL = async () => {
  //muito mais rapido jogar todos os produtos na memoria
  return fb5.openQuery("PRODUTO", "ID", `1=?`, [1]);
};

const setData = async (id_tenant) => {
  let params = { id_tenant };

  let items = await productController.getAllProduct(params);
  let result = await getAllProdutosSQL();
  if (!result) result = [];
  let allProd = [];
  let payload;
  for (let r of result) allProd.push(String(r.id));

  for (let item of items) {
    if (allProd.includes(String(item?.id))) continue;

    if (item?.id) {
      payload = await productController.getProductDetailById(item?.id);
    }

    if (!payload) {
      payload = await productController.getProductDetailBySku(
        item?.id_tenant,
        item?.codigo
      );
    }
    if (!payload) {
      console.log("Produto não encontrado " + item.codigo);
      continue;
    }
    console.log(
      "Atualizando produto  " + item.codigo + " item Id : " + item.id
    );
    try {
      await cadastrarGruposSubgrupos(payload);
    } catch (error) {}

    const prod = ProdutoMapper.toFirebird(payload);
    let objIds = await obterIds(payload);
    let { id_marca, id_linha_produto, id_tipo_produto } = objIds;
    prod.tipoproduto = id_tipo_produto ? id_tipo_produto : 0;
    prod.linha = id_linha_produto ? id_linha_produto : 0;
    prod.marca = id_marca ? id_marca : 0;
    prod.empresa = id_tenant;
    try {
      await produto.create(prod);
    } catch (error) {}
  }
};

async function obterIds(payload) {
  let obj = await obterNomesGrupo(payload);
  let { descricao_marca, descricao_tipo_produto, descricao_linha_produto } =
    obj;
  let rows;
  let id_marca = 0;
  let id_tipo_produto = 0;
  let id_linha_produto = 0;

  if (descricao_tipo_produto) {
    rows = await fb5.openQuery("TIPO_PRODUTO", "id", `descricao=?`, [
      descricao_tipo_produto,
    ]);
    if (rows) id_tipo_produto = rows[0]?.id;
  }

  if (descricao_linha_produto) {
    rows = await fb5.openQuery("LINHA_PRODUTO", "id", `descricao=?`, [
      descricao_linha_produto,
    ]);
    if (rows) id_linha_produto = rows[0]?.id;
  }

  if (descricao_marca) {
    rows = await fb5.openQuery("MARCA", "id", `descricao=?`, [descricao_marca]);
    if (rows) id_marca = rows[0]?.id;
  }

  let objIds = { id_marca, id_linha_produto, id_tipo_produto };
  return objIds;
}

async function obterNomesGrupo(payload) {
  let descricao_marca = payload?.marca?.trim();

  //desmembra a categoria do tiny
  let categoria = payload?.categoria;
  const elementos = categoria?.split(">>");
  let descricao_tipo_produto = null;
  let descricao_linha_produto = null;

  if (elementos) {
    if (elementos.length > 0) descricao_tipo_produto = elementos[0]?.trim();
    if (elementos.length > 1) descricao_linha_produto = elementos[1]?.trim();
  }

  const obj = {
    descricao_tipo_produto,
    descricao_linha_produto,
    descricao_marca,
  };

  return obj;
}

async function cadastrarGruposSubgrupos(payload) {
  if (!payload) return;

  let obj = await obterNomesGrupo(payload);
  let { descricao_tipo_produto, descricao_linha_produto, descricao_marca } =
    obj;

  await addMarcaToFirebird(descricao_marca);
  await addTipoProdutoToFirebird(descricao_tipo_produto);
  await addLinhaToFirebird(descricao_linha_produto);
  await addProdutoPreco(payload);
}

async function addCorToFirebird(cor) {}

async function addMarcaToFirebird(descricao) {
  if (!descricao) return;
  let rows = await fb5.openQuery("marca", "descricao", `descricao=? `, [
    descricao,
  ]);
  if (rows.length > 0) return;

  let payload = {
    id: await fb5.getNextId("MARCA", 1),
    descricao: descricao,
    ultatualizacao: new Date(),
  };

  await fb5.insertQuery("MARCA", payload);
}

async function addLinhaToFirebird(descricao) {
  if (!descricao) return;
  let rows = await fb5.openQuery("LINHA_PRODUTO", "descricao", `descricao=?`, [
    descricao,
  ]);
  if (rows.length > 0) return;

  let payload = {
    id: await fb5.getNextId("LINHA_PRODUTO", 1),
    descricao: String(descricao),
    ultatualizacao: new Date(),
  };
  await fb5.insertQuery("LINHA_PRODUTO", payload);
}

async function addTipoProdutoToFirebird(descricao) {
  if (!descricao) return;
  let rows = await fb5.openQuery("TIPO_PRODUTO", "descricao", `descricao=?`, [
    descricao,
  ]);
  if (rows.length > 0) return;

  let payload = {
    id: await fb5.getNextId("TIPO_PRODUTO", 1),
    descricao: descricao,
    ultatualizacao: new Date(),
  };
  await fb5.insertQuery("TIPO_PRODUTO", payload);
}

async function addProdutoPreco(payload) {
  if (!payload) return;

  let body = {
    id: payload?.id,
    empresa: payload.id_tenant,
    custo: Number(payload?.preco_custo),
    venda: Number(payload?.preco),
    m_venda: lib.obter_percentual(payload?.preco, payload?.preco_custo),
    m_atacado: 0,
    desde: new Date(),
    ultatualizacao: new Date(),
  };

  if (!payload?.id) return;

  try {
    let response = await fb5.findById("PRODUTO_PRECO", payload?.id);
    if (response) {
      await fb5.updateQuery("PRODUTO_PRECO", payload?.id, body);
      return;
    }
    await fb5.insertQuery("PRODUTO_PRECO", body);
  } catch (error) {}
}

async function procProdutoUpdTinySQL(items) {
  if (!Array.isArray(items)) return null;
  if (items.length == 0) return null;

  let cmd_sql = "";
  for (let item of items) {
    //let nome = item?.nome?.normalize("NFD").replace(/\p{Mn}/gu, ""); //remover acentuacao
    //remover apostrofes
    let nome = item?.nome?.replace(/'/g, "''");
    let codigo = item?.codigo?.replace(/'/g, "''");

    cmd_sql += `EXECUTE PROCEDURE PRODUTO_UPD_TINY
    (${item.id},'${codigo}','${nome}', '${item.unidade}','${item.gtin}',${item.preco},${item.preco_promocional},${item.preco_custo} );\n`;
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
      db.detach();
      if (err) {
        console.log(err);
      }
    });
  }); // fb5.firebird
}

async function setUpdate(id_tenant) {
  let params = { id_tenant };
  let items = await productController.getAllProduct(params);
  console.log("Iniciando SQL - PRODUTO_UPD_TINY " + lib.currentDateTimeStr());

  let produtos = [];
  let records = 0;
  for (let item of items) {
    records++;
    produtos.push(item);

    if (records > MAX_UPDATE_RECORDS) {
      records = 0;
      await procProdutoUpdTinySQL(produtos);
      produtos = [];
      await lib.sleep(1000 * 5);
    }
  }
  await procProdutoUpdTinySQL(produtos);
  console.log("Concluindo SQL - PRODUTO_UPD_TINY  " + lib.currentDateTimeStr());
}

export const produtoController = {
  init,
  produto,
};
