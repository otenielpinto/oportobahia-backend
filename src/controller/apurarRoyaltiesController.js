import { TMongo } from "../infra/mongoClient.js";
import { ApuracaoCurrentRepository } from "../repository/apuracaoCurrentRepository.js";
import { lib } from "../utils/lib.js";

// Collections utilizadas
const collectionPeriodo = "tmp_apuracao_periodo";
const collectionCurrent = "tmp_apuracao_current";

async function init() {
  await processarFila();
}

async function processarFila() {
  const apuracaoCurrentRepository = new ApuracaoCurrentRepository(
    await TMongo.connect()
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await apuracaoCurrentRepository.findAll({
    data_apuracao: { $gte: thirtyDaysAgo },
  });

  for (let row of rows) {
    if (row?.status != "aguardando") continue;
    let messages = await processarApuracao(row);
    let status = messages.length > 0 ? "erro" : "aberto";

    await apuracaoCurrentRepository.update(row.id, {
      status: status,
      data_processamento: new Date(),
      messages: messages,
    });
  }
}

async function processarApuracao(payload) {
  const { id, data_inicial: fromDate, data_final: toDate } = payload;
  //retorna nota_fiscal do tipo venda = "V"
  const notasFiscais = await getNotasFiscaisPorPeriodo({
    fromDate,
    toDate,
    tipoVenda: "V",
  });

  if (notasFiscais.length === 0) {
    console.log("Nenhuma nota fiscal encontrada para o período.");
    return;
  }
  const clientdb = await TMongo.connect();

  // Processar e salvar itens das notas fiscais na collection tmp_apuracao_periodo
  const itensParaInserir = [];

  // Obter a taxa de copyright
  const { tx_copyright } = await getTaxaCopyright();
  const messages = [];

  for (const notaFiscal of notasFiscais) {
    if (notaFiscal.itens && Array.isArray(notaFiscal.itens)) {
      for (const item of notaFiscal.itens) {
        try {
          let barcode = item.prod.cEAN;
          let catalogo = await clientdb
            .collection("tmp_catalog")
            .findOne({ barcode });

          //Obrigatório estar no catalogo
          if (!catalogo) {
            messages.push(
              `Produto não encontrado no catálogo para o GTIN: ${barcode}`
            );
            continue;
          }

          //preciso identificar o id do produto
          let produto = await clientdb
            .collection("product")
            .findOne({ gtin: barcode });

          if (!produto) {
            messages.push(`Produto não encontrado para o GTIN: ${barcode}`);
            continue;
          }

          //agora preciso achar o preco da tabela
          let listaPreco = await clientdb
            .collection("tmp_lista_preco_excecoes")
            .findOne({ id_produto: Number(produto.id) });

          if (!listaPreco) {
            messages.push(
              `Tabela de preço não encontrada para o id: ${produto.id}`
            );
            continue;
          }

          let tabela_descricao = listaPreco?.descricao;
          let tabela_codigo = listaPreco?.id_lista_preco;
          let tabela_preco = parseFloat(listaPreco.preco);

          let tx_copyright_item = tx_copyright;
          let numberOfTracks = catalogo.numberOfTracks || 0;
          let trackLimit = catalogo.trackLimit || 0;
          let trackDifference = trackLimit - numberOfTracks;
          let trackPercentage = catalogo.trackPercentage || 0;
          let extra_copyright = 0;
          if (trackDifference < 0) {
            extra_copyright = lib.round(
              Math.abs(trackDifference) * trackPercentage
            );
          }

          tx_copyright_item = tx_copyright_item + extra_copyright;
          let quantidade = parseFloat(item.prod.qCom);
          let valor_total = lib.round(quantidade * tabela_preco);

          // Extrair informações relevantes do item
          let row = {
            id: lib.newUUId(),
            id_grupo: id,
            data_movto: notaFiscal.data_movto,
            chave_acesso: notaFiscal.chave_acesso,
            tenant_id: notaFiscal.tenant_id,
            id_venda: notaFiscal.id,
            cliente: notaFiscal.nome,
            numero_nota: notaFiscal.numero,
            produto: item.prod.cProd,
            barcode: item.prod.cEAN,
            descricao: item.prod.xProd,
            quantidade: quantidade,
            tabela_descricao: tabela_descricao,
            tabela_preco: tabela_preco,
            tabela_codigo: tabela_codigo,
            valor_nf_total: lib.round(item.prod.vProd),
            valor_nf_unitario: parseFloat(item.prod.vUnCom),
            valor_nf_desconto: parseFloat(item.prod.vDesc),
            valor_nf_liquido: lib.round(
              parseFloat(item.prod.vProd) - parseFloat(item.prod.vDesc)
            ),
            valor_unitario: tabela_preco,
            valor_total: valor_total,
            valor_desconto: 0,
            valor_liquido: valor_total,
            tx_copyright: tx_copyright_item,
            catalogo: catalogo, // Pode ser null se não estiver no catálogo
          };
          const itemProcessado = await processarApuracaoItem({ item: row });

          // Adicionar ao array de itens para inserir (mesmo que não esteja no catálogo)
          itensParaInserir.push(itemProcessado);
        } catch (error) {
          console.error(
            `Erro ao processar o produto ${item.prod.cEAN}:`,
            error
          );
        }
      }
    }
  }

  // Inserir itens processados na collection
  if (itensParaInserir.length > 0) {
    await clientdb.collection(collectionPeriodo).insertMany(itensParaInserir);
  }

  //retornar mensagens de erro
  return messages;
}

export async function processarApuracaoItem({ item }) {
  try {
    // Verificar se o item tem catálogo ou não
    if (item.catalogo) {
      // Extrair informações do catálogo
      const percentual = item.catalogo.baseCalculationPercentage || 0;
      const numberOfTracks = item.catalogo.numberOfTracks || 1;

      // Adicionar campos na raiz do item
      item.baseCalculo = lib.round((item.valor_liquido * percentual) / 100);
      item.valorRoyalties = lib.round(
        (item.baseCalculo * item.tx_copyright) / 100
      );
      item.valorRoyaltiesPorFaixa = lib.round(
        item.valorRoyalties / numberOfTracks
      );

      let sum_valor_royalties = 0;

      // Processar publishers se existirem
      if (item.catalogo.tracks && Array.isArray(item.catalogo.tracks)) {
        for (const track of item.catalogo.tracks) {
          if (track.publishers && Array.isArray(track.publishers)) {
            for (const publisher of track.publishers) {
              // Adicionar campos diretamente no publisher
              publisher.valor_royalties = lib.round(
                (item.valorRoyaltiesPorFaixa *
                  publisher.participationPercentage) /
                  100
              );
              sum_valor_royalties += lib.round(publisher.valor_royalties);
            }
          }

          // Processar subTracks se existirem
          if (track.subTracks && Array.isArray(track.subTracks)) {
            for (const subTrack of track.subTracks) {
              if (subTrack.publishers && Array.isArray(subTrack.publishers)) {
                for (const publisher of subTrack.publishers) {
                  // Adicionar campos diretamente no publisher do subTrack
                  publisher.valor_royalties = lib.round(
                    (item.valorRoyaltiesPorFaixa *
                      publisher.participationPercentage) /
                      100
                  );
                  sum_valor_royalties += lib.round(publisher.valor_royalties);
                }
              }
            }
          }
        }
      }
      // Atualizar o valor total de royalties
      if (sum_valor_royalties > 0) {
        item.valorRoyalties = lib.round(sum_valor_royalties);
      }
    } else {
      // Produto não está no catálogo, mas ainda assim deve ser processado
      // Adicionar campos na raiz do item com valores zerados
      item.baseCalculo = 0;
      item.valorRoyalties = 0;
      item.valorRoyaltiesPorFaixa = 0;
    }

    // Retornar informações sobre a apuração processada
    return item;
  } catch (error) {
    console.error("Erro ao processar apuração:", error);
    throw error;
  }
}

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
      `Erro ao buscar notas fiscais: ${error?.message || "Erro desconhecido"}`
    );
  }
}

//Pode ser criado uma tabela para controlar isso
async function getTaxaCopyright() {
  return {
    tx_copyright: 8.5,
  };
}

export const apurarRoyaltiesController = {
  init,
};
