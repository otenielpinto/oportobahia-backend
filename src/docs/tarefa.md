Crie um algoritmo em Node.js (MongoDB Driver oficial) para ler dados da collection tmp_planilha_royalty e gravar na collection destino tmp_produto_royalty com upsert eficiente e idempotente.

Requisitos obrigatórios:

1. Origem e mapeamento

- A origem e destino compartilham os mesmos campos de negocio.
- O campo gtinEanNumero deve ser desconsiderado totalmente.
- O campo release pode ser nulo e deve ser aceito como Date | null.

2. Estrutura da collection destino
   Use a estrutura abaixo para o objeto ProdutoRoyalty:

export interface ProdutoRoyalty {
sku: string;
gtinEan: string;
descricaoTitulo: string;
release: Date | null;
listaPreco: string;
precoOporto: number;
precoDistribuidora: number;
ncm: string;
origem: string;
precoCusto: number;
fornecedor: string;
categoriaProduto: string;
marca: string;
nivelRoyalty: string;
percentual: number;
tipo: string;
numeroDiscos: number;
numeroFaixas: number;
gravadora: string;
peso: number;
importadoEm: Date;
loteImportacao: string;

// Campos adicionais obrigatorios
id: string;
id_empresa: number;
id_tenant: number;
created_at: Date;
updated_at: Date;
}

3. Regra de upsert (sem duplicidade)

- O upsert deve usar chave composta:
  gtinEan + id_tenant + id_empresa
- Se existir documento com essa chave composta, atualizar com os dados mais recentes da origem.
- Se nao existir, inserir novo documento.

4. Regras de criacao/atualizacao

- Em insercao, gerar id no formato UUID v4.
- created_at deve ser definido somente na insercao.
- updated_at deve ser atualizado em toda insercao/atualizacao.

5. Performance e processamento

- Usar bulkWrite explicitamente em lotes (batch) de 500 ou 1000 operacoes.
- Processar todos os registros da tmp_planilha_royalty.
- Tratar erros por registro/lote: logar erro e continuar o processamento.

6. Collections auxiliares para filtros de frontend
   Criar (ou atualizar) collections com prefixo tmp*royalty* para os campos:

- listaPreco
- origem
- categoriaProduto
- marca
- nivelRoyalty
- tipo
- gravadora
- fornecedor

Para cada uma dessas collections, inserir os valores distintos vindos de tmp_planilha_royalty.

Exemplo:
db.createCollection("tmp_royalty_listaPreco");

7. Entrega esperada
   Gerar codigo completo e executavel com:

- conexao MongoDB
- funcao principal
- pipeline de leitura/processamento/upsert
- criacao/populacao das collections auxiliares
- logs de progresso e resumo final (total lido, inserido, atualizado, erros)
- tratamento de excecoes e fechamento seguro da conexao
