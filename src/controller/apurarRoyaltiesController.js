import { TMongo } from "../infra/mongoClient.js";
import { lib } from "../utils/lib.js";
import { ProdutoRoyaltyRepository } from "../repository/produtoRoyaltyRepository.js";
import { ProdutoRepository } from "../repository/produtoRepository.js";
import { ApuracaoRoyaltiesMovtoRepository } from "../repository/apuracaoRoyaltiesMovtoRepository.js";
import { EmpresaRepository } from "../repository/empresaRepository.js";
import { TributacaoRepository } from "../repository/tributacaoRepository.js";
import { ListaPrecoExcecoesRepository } from "../repository/listaPrecoExcecoesRepository.js";
import { CalculoImpostoService } from "../services/calculoImpostoService.js";

const TAXA_ROYALTIES = 9.0; // Exemplo de taxa de royalties (15%)

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

export async function _processarCab(cab) {
  const { id, dataInicial, dataFinal, cotacaoDollar, id_tenant } = cab;

  const movtoRepo = new ApuracaoRoyaltiesMovtoRepository(id_tenant);
  const tributacaoRepo = new TributacaoRepository(id_tenant);
  const impostoService = new CalculoImpostoService(tributacaoRepo);

  // Fetch empresa data for uf_origem field
  const empresaRepo = new EmpresaRepository(id_tenant);
  const empresa = await empresaRepo.findById(id_tenant);
  const uf_origem = empresa?.uf || "";

  // Buscar dados de tributação (regra padrão)
  const tributacao = await tributacaoRepo.findOne({ id: id_tenant });

  // 3. Buscar notas fiscales
  const notasFiscais = await getNotasFiscaisPorPeriodo({
    fromDate: dataInicial,
    toDate: dataFinal,
    tipoVenda: "V",
  });

  if (!notasFiscais || notasFiscais.length === 0) {
    return { insertedCount: 0 };
  }

  const produtoRepo = new ProdutoRepository(id_tenant);
  const produtos = await produtoRepo.findAll();
  const produtoMap = new Map(
    produtos.map((p) => [p.gtin, { id: p.id, codigo: p.codigo, gtin: p.gtin }]),
  );

  // Repository para buscar preços de lista
  const listaPrecoExcecoesRepo = new ListaPrecoExcecoesRepository(id_tenant);
  const produtoRoyaltyRepo = new ProdutoRoyaltyRepository(id_tenant);

  const itensParaInserir = [];

  // Log genérico para erros
  const logs = [];

  // Generar log genérico
  const gerarLog = (tipo, gtin, descricao, nota) => {
    return `[${tipo}] GTIN: ${gtin} | Produto: ${descricao} | Nota: ${nota}`;
  };

  for (const nf of notasFiscais) {
    if (!Array.isArray(nf.itens)) continue;

    for (const item of nf.itens) {
      const gtin = item.prod.cEAN;
      const descricaoProduto = item.prod.xProd || "";
      const numeroNota = nf.numero || "";
      const serieNota = nf.serie || "";

      // Buscar produto em tmp_produto (produtoMap) - obtiene ID
      const produto = produtoMap.get(gtin);
      if (!produto) {
        logs.push(
          gerarLog(
            "PRODUTO_NOT_FOUND",
            gtin,
            descricaoProduto,
            `${numeroNota}-${serieNota}`,
          ),
        );
        continue;
      }

      // Buscar dados em tmp_produto_royalty - obtiene listaPreco
      const produtoRoyalty = await produtoRoyaltyRepo.findOne({
        gtinEan: gtin,
      });
      if (!produtoRoyalty) {
        logs.push(
          gerarLog(
            "ROYALTY_NOT_FOUND",
            gtin,
            descricaoProduto,
            `${numeroNota}-${serieNota}`,
          ),
        );
        continue;
      }

      // Buscar preço de lista em ListaPrecoExcecoes
      const precoLista =
        await listaPrecoExcecoesRepo.findByProdutoAndListaPreco(
          Number(produto.id),
          produtoRoyalty.listaPreco,
        );

      // Log se não encontrar preço de lista
      if (!precoLista) {
        logs.push(
          gerarLog(
            "PRECO_NOT_FOUND",
            gtin,
            descricaoProduto,
            `${numeroNota}-${serieNota} | ID: ${produto.id} | Lista: ${produtoRoyalty.listaPreco}`,
          ),
        );
      }

      const valorUnitLista = precoLista ? precoLista.preco : 0;
      const totalLista = precoLista
        ? (parseFloat(item.prod.qCom) || 0) * precoLista.preco
        : 0;

      // Log se valorUnitLista for <= 0
      if (valorUnitLista <= 0) {
        logs.push(
          gerarLog(
            "VALOR_UNITARIO_ZERO",
            gtin,
            descricaoProduto,
            `${numeroNota}-${serieNota} | Valor: ${valorUnitLista}`,
          ),
        );
      }

      // Calcular percentuais de impostos usando o serviço
      const uf_destino = nf.cliente?.uf || "";
      const valor_produto = parseFloat(item.prod.vProd) || 0;
      const desconto = parseFloat(item.prod.vDesc) || 0;
      const valor_frete = parseFloat(nf.ICMSTot?.vFrete) || 0;

      let percentualIcms = 0;
      let percentualCofins = 0;
      let percentualPis = 0;
      let percentualIpi = 0;
      let valorIcms = 0;
      let valorCofins = 0;
      let valorPis = 0;
      let valorIpi = 0;
      let totalImpostos = 0;
      let baseCalculo = 0;
      let custoOperativo = 0;
      let percentualCustoOperativo = TAXA_ROYALTIES;
      let tipo = produtoRoyalty.tipo || "";

      if (valor_produto > 0) {
        custoOperativo = lib.round((valor_produto * TAXA_ROYALTIES) / 100, 2);
      }

      if (tributacao) {
        try {
          const resultadoImpostos = impostoService.calcular({
            valor_produto,
            valor_frete,
            valor_desconto: desconto,
            uf_origem,
            uf_destino,
            tributacao,
          });

          percentualIcms = resultadoImpostos.icms.aliquota;
          percentualCofins = resultadoImpostos.cofins.aliquota;
          percentualPis = resultadoImpostos.pis.aliquota;
          percentualIpi = resultadoImpostos.ipi.aliquota;
          valorIcms = resultadoImpostos.icms.valor;
          valorCofins = resultadoImpostos.cofins.valor;
          valorPis = resultadoImpostos.pis.valor;
          valorIpi = resultadoImpostos.ipi.valor;
          totalImpostos = resultadoImpostos.total_impostos;
          baseCalculo = resultadoImpostos.base_calculo;
        } catch (error) {
          console.warn("Erro ao calcular impostos:", error.message);
        }
      }

      let valorSemImpostos = lib.round(valor_produto - totalImpostos, 2);
      let baseCalculoRoyalties = lib.round(
        valorSemImpostos - custoOperativo,
        2,
      );
      let valorRoyalties = 0;
      let percentualRoyalties = produtoRoyalty.percentual || 0;

      if (baseCalculoRoyalties > 0 && percentualRoyalties > 0) {
        valorRoyalties = lib.round(
          (baseCalculoRoyalties * percentualRoyalties) / 100,
          2,
        );
      }

      itensParaInserir.push({
        // FK hacia cabecera
        id_royalty_cab: id,

        // Header
        id: lib.newUUId(),
        dataInicial: dataInicial,
        dataFinal: dataFinal,
        cotacaoDollar: cotacaoDollar,
        id_tenant: id_tenant,
        uf_origem: uf_origem,
        createdAt: new Date(),
        data_movto: nf.data_movto || null,

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

        // Tax fields (calculated from service)
        icms: valorIcms,
        cofins: valorCofins,
        pis: valorPis,
        ipi: valorIpi,

        // From produto royalty
        catalogo: produtoRoyalty.descricaoTitulo || "",
        serieAlbum: produtoRoyalty.marca || "",
        valorUnitLista: valorUnitLista,
        custoOperativo: custoOperativo || 0,
        percentualCustoOperativo: percentualCustoOperativo || 0,
        nivelRoyalties: produtoRoyalty.nivelRoyalty || "",
        percentualRoyalties: percentualRoyalties,
        tipo: tipo || "",
        numDiscos: produtoRoyalty.numeroDiscos || 0,
        numFaixas: produtoRoyalty.numeroFaixas || 0,
        sku: produtoRoyalty.sku || "",
        fornecedor: produtoRoyalty.fornecedor || "",
        gravadora: produtoRoyalty.gravadora || "",
        listaPreco: produtoRoyalty.listaPreco || "",
        ncm: produtoRoyalty.ncm || "",

        // Calculated fields
        totalLista: totalLista,
        totalImpostos: totalImpostos,
        percentualDesconto: 0,
        percentualIcms: percentualIcms,
        percentualCofins: percentualCofins,
        percentualPis: percentualPis,
        percentualIpi: percentualIpi,
        valorSemImpostos: valorSemImpostos,
        percentualCusto: 0,
        baseCalculoRoyalties: baseCalculoRoyalties,
        valorRoyalties: valorRoyalties,
        percentualFaixas: 0,
        limite: 0,
        baseCalculo: baseCalculo,
        copyrightNormal: 0,
        percentual: 0,
      });
    }
  }

  const totalMovimentos = itensParaInserir.length;

  if (totalMovimentos === 0) {
    return {
      insertedCount: 0,
      logs,
    };
  }

  // 4. Insertar movimientos con id_royalty_cab
  await movtoRepo.insertMany(itensParaInserir);

  return {
    insertedCount: totalMovimentos,
    logs,
  };
}

export const apurarRoyaltiesController = {};
