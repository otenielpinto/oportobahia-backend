import { lib } from "../utils/lib.js";
import { apiTiny } from "../api/tiny.js";
import { tenantRepository } from "./tenantRepository.js";

async function pedidosPesquisa(idTenant, page, params = []) {
  //necessito buscar o idTenant passado no parametro  para atualizar o token
  const token = await tenantRepository.getTokenByTenantId(idTenant);
  console.log("token: " + token);
  const data = [
    { key: "token", value: token },
    { key: "pagina", value: page },
    { key: "formato", value: "json" },
  ];
  for (let item of params) {
    data.push({ key: item.key, value: item.value });
  }
  const response = await apiTiny("pedidos.pesquisa.php", data, "POST");
  return response;
}

async function obterDadosEmpresa(id_tenant) {
  const token = await tenantRepository.getTokenByTenantId(id_tenant);
  const data = [
    { key: "token", value: token },
    { key: "formato", value: "json" },
  ];
  const response = await apiTiny("info.php", data, "POST");
  return response;
}

async function pedidoObter(idTenant, id) {
  const token = await tenantRepository.getTokenByTenantId(idTenant);
  const data = [
    { key: "token", value: token },
    { key: "id", value: id },
    { key: "formato", value: "json" },
  ];

  const response = await apiTiny("pedido.obter.php", data, "POST");
  return response;
}

async function produtoPesquisa(idTenant, page) {
  const token = await tenantRepository.getTokenByTenantId(idTenant);

  const data = [
    { key: "token", value: token },
    { key: "pesquisa", value: "" },
    { key: "pagina", value: page },
    { key: "formato", value: "json" },
  ];
  const response = await apiTiny("produtos.pesquisa.php", data, "POST");
  return response;
}

//usando pela matriz
async function produtoPesquisaByAny(token, pesquisa) {
  const data = [
    { key: "token", value: token },
    { key: "pesquisa", value: pesquisa },
    { key: "pagina", value: 1 },
    { key: "formato", value: "json" },
  ];
  const response = await apiTiny("produtos.pesquisa.php", data, "POST");
  return response;
}

async function produtoPesquisaByDataCriacao(id_tenant, dataCriacao) {
  const token = await tenantRepository.getTokenByTenantId(id_tenant);

  const data = [
    { key: "token", value: token },
    { key: "dataCriacao", value: dataCriacao },
    { key: "formato", value: "json" },
  ];
  const response = await apiTiny("produtos.pesquisa.php", data, "POST");
  return response;
}

async function produtoObter(idTenant, id) {
  const token = await tenantRepository.getTokenByTenantId(idTenant);
  const data = [
    { key: "token", value: token },
    { key: "id", value: id },
    { key: "formato", value: "json" },
  ];
  const response = await apiTiny("produto.obter.php", data, "POST");
  return response;
}

//idProduto = id Tiny do Produto
//tipo = E(Entrada)  S(saida)  B (balanço)
async function produtoAtualizarEstoque(
  id_tenant,
  token,
  idProduto,
  quantity,
  tipo
) {
  //nesse cliente sempre vamos adicionar ou retirar a quantidade de estoque
  const estoque = {
    idProduto: idProduto,
    tipo: tipo,
    quantidade: quantity,
    observacoes: "Transferência por requisicao",
  };

  // console.log('O resultado produto.atualizar.estoque.php api Tiny : ' + JSON.stringify(estoque) )

  const data = [
    { key: "token", value: token },
    { key: "estoque", value: { estoque } },
    { key: "formato", value: "json" },
  ];
  // console.log('O resultado produto.atualizar.estoque.php api Tiny : ' + JSON.stringify(data) )

  const response = await apiTiny("produto.atualizar.estoque.php", data, "POST");
  return response;
}

async function produtoIncluir(payload) {
  let id_tenant = payload.id_tenant;
  let produto = payload.produto;
  let lista = [];

  lista.push({ produto: produto });
  let produtos = { produtos: lista };

  const token = await tenantRepository.getTokenByTenantId(id_tenant);
  const data = [
    { key: "token", value: token },
    { key: "produto", value: { produtos } },
    { key: "formato", value: "json" },
  ];

  const response = await apiTiny("produto.incluir.php", data, "POST");
  return response;
}

//Pode pesquisar por cpf_cnpj  no formato (18.345.115/0001-83)
async function contatoObter(id_tenant, cpf_cnpj) {
  const token = await tenantRepository.getTokenByTenantId(id_tenant);
  const data = [
    { key: "token", value: token },
    { key: "cpf_cnpj", value: cpf_cnpj },
    { key: "formato", value: "json" },
  ];
  const response = await apiTiny("contatos.pesquisa.php", data, "POST");
  return response;
}

async function contatoIncluir(payload) {
  let id_tenant = payload.id_tenant;
  let contato = payload.contato;
  let lista = [];

  lista.push({ contato: contato });
  let contatos = { contatos: lista };

  const token = await tenantRepository.getTokenByTenantId(id_tenant);
  const data = [
    { key: "token", value: token },
    { key: "contatos", value: { contatos } },
    { key: "formato", value: "json" },
  ];

  const response = await apiTiny("contato.incluir.php", data, "POST");
  return response;
}

async function pedidoIncluir(payload) {
  let id_tenant = payload.id_tenant;
  let pedido = payload.pedido;

  const token = await tenantRepository.getTokenByTenantId(id_tenant);
  const data = [
    { key: "token", value: token },
    { key: "pedido", value: { pedido } },
    { key: "formato", value: "json" },
  ];

  const response = await apiTiny("pedido.incluir.php", data, "POST");
  return response;
}

async function notaFiscalObter(id_tenant, id) {
  const token = await tenantRepository.getTokenByTenantId(id_tenant);
  const data = [
    { key: "token", value: token },
    { key: "id", value: id },
    { key: "formato", value: "json" },
  ];
  const response = await apiTiny("nota.fiscal.obter.php", data, "POST");
  return response;
}

async function notaFiscalPesquisa(id_tenant, page, params = []) {
  const token = await tenantRepository.getTokenByTenantId(id_tenant);
  const data = [
    { key: "token", value: token },
    { key: "pagina", value: page },
    { key: "formato", value: "json" },
  ];
  for (let item of params) {
    data.push({ key: item.key, value: item.value });
  }
  const response = await apiTiny("notas.fiscais.pesquisa.php", data, "POST");
  return response;
}

async function notaFiscalObterXml(id_tenant, id) {
  const token = await tenantRepository.getTokenByTenantId(id_tenant);
  const data = [
    { key: "token", value: token },
    { key: "id", value: id },
    { key: "formato", value: "json" },
  ];
  const response = await apiTiny("nota.fiscal.obter.xml.php", data, "POST");
  return response;
}

async function vendedorPesquisa(id_tenant, page) {
  const token = await tenantRepository.getTokenByTenantId(id_tenant);

  const data = [
    { key: "token", value: token },
    { key: "pesquisa", value: "" },
    { key: "pagina", value: page },
    { key: "formato", value: "json" },
  ];
  const response = await apiTiny("vendedores.pesquisa.php", data, "POST");
  return response;
}

async function parseToProduto(res) {
  let produto = null;
  try {
    produto = res?.data?.retorno?.produto;
  } catch (error) {
    console.log(error);
    produto = null;
  }
  return produto;
}

async function parseToProdutos(res) {
  let produtos = null;
  try {
    produtos = res?.data?.retorno?.produtos;
  } catch (error) {
    console.log(error);
    produtos = null;
  }
  return produtos;
}

async function parseToNotaFiscal(res) {
  let notaFiscal = null;
  try {
    notaFiscal = res?.data?.retorno?.nota_fiscal;
  } catch (error) {
    console.log(error);
    notaFiscal = null;
  }
  return notaFiscal;
}

export const tinyRepository = {
  obterDadosEmpresa,

  pedidosPesquisa,
  pedidoObter,

  pedidoIncluir,

  produtoPesquisa,
  produtoPesquisaByDataCriacao,
  produtoPesquisaByAny,
  produtoObter,
  produtoIncluir,

  produtoAtualizarEstoque,

  contatoObter,
  contatoIncluir,

  notaFiscalObter,
  notaFiscalPesquisa,
  notaFiscalObterXml,

  //todos os parses
  parseToProduto,
  parseToProdutos,
  parseToNotaFiscal,
};
