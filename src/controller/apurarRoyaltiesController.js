import { TMongo } from "../infra/mongoClient.js";
import { lib } from "../utils/lib.js";
import { ProdutoRoyaltyRepository } from "../repository/produtoRoyaltyRepository.js";
import { ApuracaoRoyaltiesMovtoRepository } from "../repository/apuracaoRoyaltiesMovtoRepository.js";

//Obs : Decidi criar a function aqui e estou consciente
async function getNotasFiscaisPorPeriodo({ fromDate, toDate, tipoVenda }) {
  try {
    const clientdb = await TMongo.connect();
    const query = {
      data_movto: {
        $gte: fromDate,
        $lte: toDate,
      },
      tipoVenda: tipoVenda,
    };
    const data = await clientdb.collection("nota_fiscal").find(query).toArray();

    return data;
  } catch (error) {
    console.error("Erro ao recuperar notas fiscais:", error);
    throw new Error(
      `Erro ao buscar notas fiscais: ${error?.message || "Erro desconhecido"}`,
    );
  }
}

async function apurarRoyalties({ fromDate, toDate, cotacaoDollar, id_tenant }) {
  if (!fromDate || !toDate || !cotacaoDollar || !id_tenant) {
    throw new Error(
      "Parâmetros obrigatórios: fromDate, toDate, cotacaoDollar, id_tenant",
    );
  }

  const notasFiscais = await getNotasFiscaisPorPeriodo({
    fromDate,
    toDate,
    tipoVenda: "V",
  });

  if (!notasFiscais || notasFiscais.length === 0) {
    return { insertedCount: 0 };
  }

  const produtoRepo = new ProdutoRoyaltyRepository(id_tenant);
  const movtoRepo = new ApuracaoRoyaltiesMovtoRepository(id_tenant);

  const itensParaInserir = [];

  for (const nf of notasFiscais) {
    if (!Array.isArray(nf.itens)) continue;

    for (const item of nf.itens) {
      const produtoRoyalty = await produtoRepo.findByGtinEan(item.prod.cEAN);

      if (!produtoRoyalty) continue;

      itensParaInserir.push({
        // Header
        id: lib.newUUId(),
        dataInicial: fromDate,
        dataFinal: toDate,
        cotacaoDollar: cotacaoDollar,
        id_tenant: id_tenant,
        createdAt: new Date(),

        // NF fields
        clienteCpfCnpj: nf.cliente?.cpf_cnpj || "",
        clienteNome: nf.cliente?.nome || nf.nome || "",
        clienteMunicipio: nf.cliente?.cidade || "",
        clienteUf: nf.cliente?.uf || "",
        natureza: nf.natOp || "",
        numeroNota: nf.numero || "",
        serie: nf.serie || "",
        dataEmissao: nf.data_emissao || "",

        // Item fields (item.prod)
        itemCfop: item.prod.CFOP || "",
        barraCode: item.prod.cEAN || "",
        itemDescricao: item.prod.xProd || "",
        quantFaturada: parseFloat(item.prod.qCom) || 0,
        valorUnitMercadoria: parseFloat(item.prod.vUnCom) || 0,
        valorMercadoria: parseFloat(item.prod.vProd) || 0,
        desconto: parseFloat(item.prod.vDesc) || 0,

        // Tax fields (from nf.ICMSTot)
        icms: parseFloat(nf.ICMSTot?.vICMS) || 0,
        cofins: parseFloat(nf.ICMSTot?.vCOFINS) || 0,
        pis: parseFloat(nf.ICMSTot?.vPIS) || 0,
        ipi: parseFloat(nf.ICMSTot?.vIPI) || 0,

        // From produto royalty
        catalogo: produtoRoyalty.descricaoTitulo || "",
        serieAlbum: produtoRoyalty.marca || "",
        valUnitLista: produtoRoyalty.precoOporto || 0,
        custoOperativo: produtoRoyalty.precoCusto || 0,
        nivelRoyalties: produtoRoyalty.nivelRoyalty || "",
        percentualRoyalties: produtoRoyalty.percentual || 0,
        tipo: produtoRoyalty.tipo || "",
        numDiscos: produtoRoyalty.numeroDiscos || 0,
        numFaixas: produtoRoyalty.numeroFaixas || 0,
        sku: produtoRoyalty.sku || "",
        fornecedor: produtoRoyalty.fornecedor || "",
        gravadora: produtoRoyalty.gravadora || "",
        listaPreco: produtoRoyalty.listaPreco || "",
        ncm: produtoRoyalty.ncm || "",

        // All calc fields zeroed
        totalLista: 0,
        percentualDesconto: 0,
        percentualIcms: 0,
        percentualCofins: 0,
        percentualPis: 0,
        percentualIpi: 0,
        valorSemImpostos: 0,
        percentualCusto: 0,
        baseCalculoRoyalties: 0,
        valorRoyalties: 0,
        percentualFaixas: 0,
        limite: 0,
        baseCalculo: 0,
        copyrightNormal: 0,
        percentual: 0,
      });
    }
  }

  if (itensParaInserir.length === 0) {
    return { insertedCount: 0 };
  }

  await movtoRepo.insertMany(itensParaInserir);

  return { insertedCount: itensParaInserir.length };
}

export const apurarRoyaltiesController = {
  apurarRoyalties,
};
