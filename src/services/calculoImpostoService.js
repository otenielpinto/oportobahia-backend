import { lib } from "../utils/lib.js";

/**
 * Serviço de cálculo de impostos brasileiros (ICMS, COFINS, PIS, IPI).
 * Classe responsável por calcular os valores de impostos com base nos valores
 * do produto, frete, desconto e regras de tributação.
 *
 * @class CalculoImpostoService
 * @example
 * const service = new CalculoImpostoService(tributacaoRepository);
 * const resultado = await service.calcular({
 *   valor_produto: 1000,
 *   valor_frete: 50,
 *   valor_desconto: 100,
 *   uf_origem: "SP",
 *   uf_destino: "SP",
 *   tributacao: { icms_interno: 18, icms_externo: 12, cofins: 7.6, pis: 1.65, ipi: 0 }
 * });
 */
export class CalculoImpostoService {
  /**
   * Cria uma instância do serviço de cálculo de impostos.
   *
   * @param {Object} tributacaoRepository - Repositório de tributação para futura extensibilidade
   * @param {Function} tributacaoRepository.findById - Método para buscar tributação por ID
   */
  constructor(tributacaoRepository) {
    this.tributacaoRepo = tributacaoRepository;
  }

  /**
   * Calcula os impostos (ICMS, COFINS, PIS, IPI) com base nos valores informados.
   *
   * @param {Object} params - Parâmetros para cálculo
   * @param {number} params.valor_produto - Valor do produto (deve ser >= 0)
   * @param {number} params.valor_frete - Valor do frete (deve ser >= 0)
   * @param {number} params.valor_desconto - Valor do desconto (deve ser >= 0)
   * @param {string} params.uf_origem - UF de origem (2 caracteres, maiúsculo)
   * @param {string} params.uf_destino - UF de destino (2 caracteres, maiúsculo)
   * @param {Object} params.tributacao - Objeto com alíquotas de tributação
   * @param {number} params.tributacao.icms_interno - Alíquota de ICMS para operações internas
   * @param {number} params.tributacao.icms_externo - Alíquota de ICMS para operações interestaduais
   * @param {number} params.tributacao.cofins - Alíquota de COFINS
   * @param {number} params.tributacao.pis - Alíquota de PIS
   * @param {number} params.tributacao.ipi - Alíquota de IPI
   * @returns {Object} Objeto com valores calculados dos impostos
   * @returns {number} return.base_calculo - Base de cálculo dos impostos
   * @returns {Object} return.icms - Objeto com alíquota e valor do ICMS
   * @returns {number} return.icms.aliquota - Alíquota aplicada de ICMS
   * @returns {number} return.icms.valor - Valor calculado do ICMS
   * @returns {Object} return.cofins - Objeto com alíquota e valor do COFINS
   * @returns {number} return.cofins.aliquota - Alíquota aplicada de COFINS
   * @returns {number} return.cofins.valor - Valor calculado do COFINS
   * @returns {Object} return.pis - Objeto com alíquota e valor do PIS
   * @returns {number} return.pis.aliquota - Alíquota aplicada de PIS
   * @returns {number} return.pis.valor - Valor calculado do PIS
   * @returns {Object} return.ipi - Objeto com alíquota e valor do IPI
   * @returns {number} return.ipi.aliquota - Alíquota aplicada de IPI
   * @returns {number} return.ipi.valor - Valor calculado do IPI
   * @returns {number} return.total_impostos - Soma de todos os impostos
   * @throws {TypeError} Quando parâmetros obrigatórios estão ausentes ou inválidos
   */
  calcular({
    valor_produto,
    valor_frete,
    valor_desconto,
    uf_origem,
    uf_destino,
    tributacao,
  }) {
    // Validação de parâmetros obrigatórios
    if (typeof valor_produto !== "number" || valor_produto < 0) {
      throw new TypeError("valor_produto deve ser um número >= 0");
    }
    if (typeof valor_frete !== "number" || valor_frete < 0) {
      throw new TypeError("valor_frete deve ser um número >= 0");
    }
    if (typeof valor_desconto !== "number" || valor_desconto < 0) {
      throw new TypeError("valor_desconto deve ser um número >= 0");
    }
    if (typeof uf_origem !== "string" || uf_origem.length !== 2) {
      throw new TypeError("uf_origem deve ser uma string de 2 caracteres");
    }
    if (typeof uf_destino !== "string" || uf_destino.length !== 2) {
      throw new TypeError("uf_destino deve ser uma string de 2 caracteres");
    }
    if (!tributacao || typeof tributacao !== "object") {
      throw new TypeError("tributacao deve ser um objeto");
    }

    // Cálculo da base de cálculo
    let base_calculo = lib.round(valor_produto + valor_frete - valor_desconto);

    // Se a base for negativa, retorna 0
    if (base_calculo < 0) {
      base_calculo = 0;
    }

    // Determina a alíquota de ICMS com base na origem/destino
    // Normaliza UFs para maiúsculas para garantir comparação correta
    const uf_origem_upper = uf_origem.toUpperCase();
    const uf_destino_upper = uf_destino.toUpperCase();
    const icms_interno = tributacao.icms_interno || 0;
    const icms_externo = tributacao.icms_externo || 0;
    const aliquota_icms =
      uf_origem_upper === uf_destino_upper ? icms_interno : icms_externo;

    // Cálculo dos impostos usando lib.round()
    const cofins_aliquota = tributacao.cofins || 0;
    const pis_aliquota = tributacao.pis || 0;
    const ipi_aliquota = tributacao.ipi || 0;

    const icms_valor = lib.round((base_calculo * aliquota_icms) / 100);
    const cofins_valor = lib.round((base_calculo * cofins_aliquota) / 100);
    const pis_valor = lib.round((base_calculo * pis_aliquota) / 100);
    const ipi_valor = lib.round((base_calculo * ipi_aliquota) / 100);

    // Cálculo do total de impostos
    const total_impostos = lib.round(
      icms_valor + cofins_valor + pis_valor + ipi_valor
    );

    return {
      base_calculo,
      icms: {
        aliquota: aliquota_icms,
        valor: icms_valor,
      },
      cofins: {
        aliquota: cofins_aliquota,
        valor: cofins_valor,
      },
      pis: {
        aliquota: pis_aliquota,
        valor: pis_valor,
      },
      ipi: {
        aliquota: ipi_aliquota,
        valor: ipi_valor,
      },
      total_impostos,
    };
  }
}
