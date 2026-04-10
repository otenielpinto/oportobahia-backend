import { TMongo } from "../infra/mongoClient.js";
import { lib } from "../utils/lib.js";
import { tenantRepository } from "../repository/tenantRepository.js";

// Collections utilizadas
const SOURCE_COLLECTION = "tmp_planilha_royalty";
const DESTINATION_COLLECTION = "tmp_produto_royalty";

// Collections auxiliares para filtros de frontend
const AUXILIARY_COLLECTIONS = [
  "tmp_royalty_listaPreco",
  "tmp_royalty_origem",
  "tmp_royalty_categoriaProduto",
  "tmp_royalty_marca",
  "tmp_royalty_nivelRoyalty",
  "tmp_royalty_tipo",
  "tmp_royalty_gravadora",
  "tmp_royalty_fornecedor",
];

// Batch size fixo
const BATCH_SIZE = 500;

/**
 * Map source document to destination format
 * @param {Object} source - Source document from tmp_planilha_royalty
 * @param {Object} config - Configuration with id_tenant, id_empresa
 * @returns {Object} - Mapped destination document
 */
function mapDocument(source, config) {
  return {
    sku: source.sku ?? null,
    gtinEan: source.gtinEan ?? null,
    descricaoTitulo: source.descricaoTitulo ?? null,
    release: source.release ? new Date(source.release) : null,
    listaPreco: source.listaPreco ?? null,
    precoOporto: source.precoOporto ?? null,
    precoDistribuidora: source.precoDistribuidora ?? null,
    ncm: source.ncm ?? null,
    origem: source.origem ?? null,
    precoCusto: source.precoCusto ?? null,
    fornecedor: source.fornecedor ?? null,
    categoriaProduto: source.categoriaProduto ?? null,
    marca: source.marca ?? null,
    nivelRoyalty: source.nivelRoyalty ?? null,
    percentual: source.percentual ?? null,
    tipo: source.tipo ?? null,
    numeroDiscos: source.numeroDiscos ?? null,
    numeroFaixas: source.numeroFaixas ?? null,
    gravadora: source.gravadora ?? null,
    peso: source.peso ?? null,
    importadoEm: source.importadoEm ?? null,
    loteImportacao: source.loteImportacao ?? null,
    // Configuration fields
    id_tenant: config.id_tenant,
    id_empresa: config.id_empresa,
  };
}

/**
 * Process auxiliary collections - extract distinct values with UPSERT (NO DELETE)
 * @param {Object} db - MongoDB database instance
 * @param {Array} sourceDocuments - Source documents to extract values from
 * @param {Object} config - Configuration with id_tenant, id_empresa
 */
async function processAuxiliaryCollections(db, sourceDocuments, config) {
  console.log("\n--- Processando collections auxiliares ---");

  // Map of collection names to their source field names
  const collectionFields = {
    tmp_royalty_listaPreco: "listaPreco",
    tmp_royalty_origem: "origem",
    tmp_royalty_categoriaProduto: "categoriaProduto",
    tmp_royalty_marca: "marca",
    tmp_royalty_nivelRoyalty: "nivelRoyalty",
    tmp_royalty_tipo: "tipo",
    tmp_royalty_gravadora: "gravadora",
    tmp_royalty_fornecedor: "fornecedor",
  };

  for (const [collectionName, fieldName] of Object.entries(collectionFields)) {
    try {
      // Extract distinct non-null values
      const distinctValues = [
        ...new Set(
          sourceDocuments
            .map((doc) => doc[fieldName])
            .filter(
              (value) => value !== null && value !== undefined && value !== "",
            ),
        ),
      ];

      if (distinctValues.length > 0) {
        // Use upsert instead of delete + insert (PRESERVE existing data)
        for (const value of distinctValues) {
          await db.collection(collectionName).updateOne(
            {
              value: value,
              id_tenant: config.id_tenant,
              id_empresa: config.id_empresa,
            },
            {
              $set: {
                id_tenant: config.id_tenant,
                id_empresa: config.id_empresa,
                value: value,
                updated_at: new Date(),
              },
              $setOnInsert: {
                id: lib.newUUId(),
                created_at: new Date(),
              },
            },
            { upsert: true },
          );
        }
        console.log(
          `  ${collectionName}: ${distinctValues.length} valores processados (upsert)`,
        );
      } else {
        console.log(`  ${collectionName}: nenhum valor distinto encontrado`);
      }
    } catch (error) {
      console.error(`  Erro ao processar ${collectionName}:`, error.message);
    }
  }
}

/**
 * Main migration function - called by init()
 */
async function processarFila(id_tenant, id_empresa) {
  const startTime = Date.now();

  // Configuration - obtém do tenant
  const config = {
    id_tenant: id_tenant,
    id_empresa: id_empresa,
  };

  console.log("========================================");
  console.log("  ProdutoRoyalty Migration - Início");
  console.log("========================================");
  console.log(`Configuração:`);
  console.log(`  id_tenant: ${config.id_tenant}`);
  console.log(`  id_empresa: ${config.id_empresa}`);
  console.log(`  batchSize: ${BATCH_SIZE}`);
  console.log("----------------------------------------");

  const db = await TMongo.connect();

  try {
    // Get source collection
    const sourceCollection = db.collection(SOURCE_COLLECTION);
    const destCollection = db.collection(DESTINATION_COLLECTION);

    // Check if source collection exists
    const sourceCount = await sourceCollection.countDocuments({});
    console.log(
      `\nTotal de registros na fonte (${SOURCE_COLLECTION}): ${sourceCount}`,
    );

    if (sourceCount === 0) {
      console.log("\nNenhum registro para migrar. Encerrando.");
      return;
    }

    // Read all source documents
    console.log("\nLendo registros da source collection...");
    const sourceDocuments = await sourceCollection.find({}).toArray();
    console.log(`Total de documentos lidos: ${sourceDocuments.length}`);

    // Statistics
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const errors = [];

    // Process in batches
    const totalBatches = Math.ceil(sourceDocuments.length / BATCH_SIZE);
    console.log(`\nProcessando em ${totalBatches} lotes de ${BATCH_SIZE}...`);
    console.log("---");

    for (let i = 0; i < sourceDocuments.length; i += BATCH_SIZE) {
      const batch = sourceDocuments.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      try {
        // Build bulk operations
        const operations = batch.map((doc) => {
          const mappedDoc = mapDocument(doc, config);
          return {
            updateOne: {
              filter: {
                gtinEan: mappedDoc.gtinEan,
                id_tenant: config.id_tenant,
                id_empresa: config.id_empresa,
              },
              update: {
                $set: {
                  ...mappedDoc,
                  updated_at: new Date(),
                },
                $setOnInsert: {
                  id: lib.newUUId(),
                  created_at: new Date(),
                },
              },
              upsert: true,
            },
          };
        });

        // Execute bulk write
        const result = await destCollection.bulkWrite(operations, {
          ordered: false,
        });

        // Track statistics
        if (result.upsertedCount) {
          totalInserted += result.upsertedCount;
        }
        if (result.modifiedCount) {
          totalUpdated += result.modifiedCount;
        }

        // Log progress every 10 batches or on last batch
        if (batchNumber % 10 === 0 || batchNumber === totalBatches) {
          console.log(
            `  Progresso: ${batchNumber}/${totalBatches} batches (${Math.round(
              (batchNumber / totalBatches) * 100,
            )}%)`,
          );
        }
      } catch (batchError) {
        console.error(`  Erro no batch ${batchNumber}:`, batchError.message);
        totalErrors += batch.length;
        errors.push({ batch: batchNumber, error: batchError.message });
      }
    }

    console.log("\n---");
    console.log("--- Processamento de dados concluído ---");
    console.log("---\n");

    // Process auxiliary collections (with upsert - NO DELETE)
    await processAuxiliaryCollections(db, sourceDocuments, config);

    // Excluir registros processados da source (tmp_planilha_royalty)
    console.log(
      `\nExcluindo registros da source (id_tenant: ${config.id_tenant}, id_empresa: ${config.id_empresa})...`,
    );
    const deleteResult = await sourceCollection.deleteMany({
      id_tenant: config.id_tenant,
      id_empresa: config.id_empresa,
    });
    const deletedCount = deleteResult.deletedCount;
    console.log(`  Registros excluídos: ${deletedCount}`);

    // Final summary
    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log("\n========================================");
    console.log("  RESUMO DA MIGRAÇÃO");
    console.log("========================================");
    console.log(`  Total lidos:     ${sourceDocuments.length}`);
    console.log(`  Total inseridos: ${totalInserted}`);
    console.log(`  Total atualizados: ${totalUpdated}`);
    console.log(`  Total erros:     ${totalErrors}`);
    console.log(`  Total excluidos: ${deletedCount}`);
    console.log(`  Duração:         ${durationSeconds}s`);
    console.log("========================================");

    if (errors.length > 0) {
      console.log("\nErros detalhados:");
      errors.forEach((err) => {
        console.log(`  Batch ${err.batch}: ${err.error}`);
      });
    }

    console.log("\nMigração concluída!");
  } catch (error) {
    console.error("\n!!! ERRO NA MIGRAÇÃO !!!");
    console.error("Mensagem:", error.message);
    console.error("Stack:", error.stack);
    throw error;
  }
}

/**
 * Entry point - called by agenda.js cron
 */
async function init() {
  let tenants = await tenantRepository.getAllTenantSystem();
  console.log(`\nEncontrados ${tenants.length} tenants para processar\n`);

  for (let tenant of tenants) {
    console.log(
      `=== Processando tenant: ${tenant.id} - ${tenant.nome || "sem nome"} ===`,
    );
    await processarFila(tenant.id, tenant.id_empresa);
  }

  console.log("\n=== Processamento de todos os tenants concluído ===");
}

export const produtoRoyaltyController = {
  init,
};
