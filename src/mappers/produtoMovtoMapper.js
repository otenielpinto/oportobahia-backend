//aqui poderia importar o types se estiver usando typeScript para mappers
//payload poderia ser do type importado
//Exemplo    produto : TProduto ;

import { lib } from "../utils/lib.js";

export class ProdutoMovtoMapper {
  //Explicacao static ( nao preciso de instanciar a classe )
  //envie  um objeto com a mesma estrutura da nfe xml
  static toFirebird(payload) {
    //identficar se é uma empresa do simples nacional

    let { prod, imposto } = payload;
    let {
      ICMS,
      IPI,
      PIS: { PISAliq },
      COFINS: { COFINSAliq },
      ICMSUFDest,
    } = imposto;

    let _ICMS = {}; //ICMS00 ICMS10 ICMS20 ICMS30 ICMS40 ICMS51 ICMS60 ICMS70 ICMS90
    for (const [key, value] of Object.entries(ICMS)) {
      _ICMS = { ...value };
    }

    return {
      id: 0,
      documento: "",
      codclifor: 0,
      movestoque: 0,
      empresa: 0,
      dhmovto: new Date(),
      sequencia: 0,
      item: 0,
      situacao: "A",
      qtd: Number(prod?.qCom ? prod?.qCom : 0.0),
      unidade: prod?.uCom?.substring(0, 3),
      custo: 0.0,
      tabela: 0.0,
      plano: 0.0,
      desconto: Number(prod?.vDesc ? prod?.vDesc : 0.0),
      acrescimo: 0.0,
      valor: Number(prod?.vProd ? prod?.vProd : 0.0),
      frete: Number(prod?.vFrete ? prod?.vFrete : 0.0),
      seguro: 0.0,
      outro: 0.0,
      descricao: prod?.xProd?.substring(0, 80),
      pedido: 0,
      tipovenda: "",
      vendedor: 0,
      tecnico: 0,
      cfop: prod?.CFOP ? prod?.CFOP : "5102",
      ncm: prod?.NCM ? prod?.NCM : "00000000",
      usuario: "",
      ipi_bc: 0.0,
      ipi_tx: 0.0,
      ipi_vlr: 0.0,
      icms_bc: _ICMS?.vBC ? _ICMS?.vBC : 0.0,
      icms_tx: _ICMS?.pICMS ? _ICMS?.pICMS : 0.0,
      icms_vlr: _ICMS?.vICMS ? _ICMS?.vICMS : 0.0,
      icms_bcst: _ICMS?.vBCST ? _ICMS?.vBCST : 0.0,
      icms_st: _ICMS?.vICMSST ? _ICMS?.vICMSST : 0.0,
      icms_cst: "",
      icms_csosn: 0,
      icms_modbc: 0.0,
      icms_txredbc: ICMS?.pRedBC ? ICMS?.pRedBC : 0.0,
      icms_modbcst: 0.0,
      icms_txmvast: 0.0,
      icms_txredbcst: 0.0,
      icms_bcstret: 0,
      icms_icmsstret: 0.0,
      icms_txcredSN: 0.0,
      icms_credICMSSN: 0.0,
      pis_cst: PISAliq?.CST ? PISAliq.CST : 0,
      pis_bc: PISAliq?.vBC ? PISAliq.vBC : 0.0,
      pis_tx: PISAliq?.pPIS ? PISAliq.pPIS : 0.0,
      pis_vlr: PISAliq?.vPIS ? PISAliq?.vPIS : 0.0,
      cofins_cst: COFINSAliq?.CST ? COFINSAliq?.CST : 0,
      cofins_bc: COFINSAliq?.vBC ? COFINSAliq?.vBC : 0.0,
      cofins_tx: COFINSAliq?.pCOFINS ? COFINSAliq?.pCOFINS : 0.0,
      cofins_vlr: COFINSAliq?.vCOFINS ? COFINSAliq?.vCOFINS : 0.0,
      tag: 0,
      comissao: 0.0,
      idvenda: 0,
      unitario: prod?.vUnCom ? prod?.vUnCom : 0.0,
      difal_entrada_valor: 0.0,
      ultatualizacao: new Date(),
    };
  }
}
