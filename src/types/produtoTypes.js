// const z = require("zod");

// const produtoSchema = z.object({
//   id: z.integer(),
//   gtin: z
//     .string()
//     .optional()
//     .min(14, { invalid_type_error: "gtin must have at least 14 characters" }),
//   descricao: z.string().max(250).optional(),
//   aplicacao: z.string().optional(),
//   descricao_full: z.string().max(600).optional(),
//   complemento: z.string().optional(),
//   tipo_produto: z.integer().optional(),
//   linha: z.integer().optional(),
//   categoria: z.integer().optional(),
//   marca: z.integer().optional(),
//   cor: z.integer().optional(),
//   sexo: z.string().max(1).optional(),
//   tamanho: z.string().max(10).optional(),
//   estacao: z.string().max(10).optional(),
//   faixa_etaria: z.string().max(10).optional(),
//   unidade: z.string().max(3).optional(),
//   referencia: z.string().max(15).optional(),
//   fornecedor: z.integer().optional(),
//   id_grupo_tributario: z.integer().optional(),
//   base_calculo_reduzida: z.integer().optional(),
//   imposto_st_uf: z.integer().optional(),
//   tipo_item_sped: z.string().max(2).optional(),
//   cst_icms_a: z.string().min(1).max(1),
//   ncmt: z.string().min(8).max(8).optional(),
//   ex_ipi: z.string().min(1).max(3).optional(),
//   codigo_lst: z.string().min(1).max(3).optional(),
//   classe_abc: z.string().min(1).max(1).optional(),
//   iat: z.string().min(1).max(1).optional(),
//   ippt: z.string().min(1).max(1).optional(),
//   dt_cadastro: z.date().optional(),
//   ult_compra: z.date().optional(),
//   observacao: z.string().max(250).optional(),
//   imprimir: z.string().max(1).optional(),
//   excluido: z.string().max(1).optional(),
//   ativo: z.string().max(1).optional(),
//   usuario_ins: z.string().max(10).optional(),
//   usuario_atu: z.string().max(10).optional(),
//   empresa: z.integer().optional(),
//   ref_fornecedor: z.string().max(15).optional(),
//   ponto: z.number().optional(),
//   cobrar: z.string().max(1).optional(),
//   mostarario: z.integer().optional(),
//   codigo_balanca: z.integer().optional(),
//   id_equivalente: z.integer().optional(),
//   ind_ordem: z.integer().optional(),
//   publicidade: z.string().max(2).optional(),
//   web: z.string().max(1).optional(),
//   cest: z.string().max(10).optional(),
//   cest_tag: z.integer().optional(),
//   variacao: z.integer().optional(),
//   composto: z.integer().optional(),
//   cbbenef: z.string().max(15).optional(),
//   sob_encomenda: z.string().max(1).optional(),
//   dias_preparacao: z.integer().optional(),
//   controla_estoque: z.string().max(1).optional(),
//   garantia: z.integer().optional(),
//   dt_atualizado: z.date().optional(),
//   ult_atualizacao: z.date().optional(),
// });
