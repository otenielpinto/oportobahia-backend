//aqui poderia importar o types se estiver usando typeScript para mappers
//payload poderia ser do type importado
//Exemplo    produto : TProduto ;

import { lib } from "../utils/lib.js";
import { TVendaTypes } from "../types/vendaTypes.js";

export class VendaMapper {
  //Explicacao static ( nao preciso de instanciar a classe )

  static toFirebird(payload) {
    let dtmovto = lib.dateBrToSql(payload?.data_emissao);

    return {
      id: 0,
      codclifor: 0,
      tipovenda: TVendaTypes.TIPO_VENDA.VENDA,
      empresa: payload?.id_tenant,
      documento: payload?.numero ? payload?.numero : payload?.id,
      situacao: TVendaTypes.SITUACAO.ATIVA,
      dtmovto: dtmovto,
      dtemissao: dtmovto,
      movestoque: TVendaTypes.MOV_ESTOQUE.VENDA,
      movcaixa: TVendaTypes.MOV_CAIXA.VENDA,
      natoperacao: payload?.nfe_cfop ? payload?.nfe_cfop : 0,
      desconto: payload.ICMSTot.vDesc,
      acrescimo: 0.0,
      agregar: payload.ICMSTot.vOutro,
      terceirizado: 0.0,
      despacessorias: 0.0,
      seguro: 0.0,
      bonus: 0.0,
      frete: payload.ICMSTot.vFrete,
      produto: payload.ICMSTot.vProd,
      valor: payload.ICMSTot.vNF,
      bcicms: payload.ICMSTot.vBC,
      icms: payload.ICMSTot.vICMS,
      bcicmsst: payload.ICMSTot.vBCST,
      icmsst: payload.ICMSTot.vST,
      ipi: payload.ICMSTot.vIPI,
      bcissqn: 0.0,
      issqn: 0.0,
      ant_icms: 0.0,
      pis: payload.ICMSTot.vPIS,
      vii: payload.ICMSTot.vII,
      cofins: payload.ICMSTot.vCOFINS,
      plano: "",
      pedido: payload?.id ? payload?.id : 0,
      vendedor: payload?.id_ecommerce ? payload?.id_ecommerce : 0,
      fornecedor: 0,
      transportador: 0,
      placaveiculo: "",
      motorista: "",
      totalm3: 0.0,
      pesoliquido: 0.0,
      qtVolumes: 0,
      especie: "",
      observacao: payload?.numero_ecommerce,
      fretedesemi: "",
      convenio: 0,
      autorizado: "",
      ponto: 0.0,
      tecnico: 0,
      nfproduto: payload?.id_nota_fiscal ? payload?.id_nota_fiscal : 0,
      nfservico: 0,
      chaveNfe: payload?.chave_acesso,
      protocolo: "",
      usuario: "",
      idpagar: 0,
      servico: 0.0,
      devolucao: "",
      ultatualizacao: new Date(),
      serie: payload?.serie,
    };
  }
}
