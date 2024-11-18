//aqui poderia importar o types se estiver usando typeScript para mappers
//payload poderia ser do type importado
//Exemplo    produto : TProduto ;

import { lib } from "../utils/lib.js";

//dt_Cadastro: new Date(),

export class EmpresaMapper {
  //Explicacao static ( nao preciso de instanciar a classe )
  static toFirebird(payload) {
    return {
      id: payload?.id_tenant,
      nome: payload?.razao_social,
      fantasia: payload?.fantasia ? payload?.fantasia : payload?.razao_social,
      rua: payload?.endereco,
      nro: payload?.numero,
      bairro: payload?.bairro,
      cep: lib.onlyNumber(payload?.cep),
      cidade: payload?.cidade,
      uf: payload?.estado,
      ddd: 0,
      telefone: payload?.fone,
      fax: "",
      email: payload?.email?.toLowerCase(),
      website: "",
      cpfcnpj: lib.onlyNumber(payload?.cnpj_cpf),
      ie: payload?.inscricao_estadual,
      im: "",
      crt: payload?.regime_tributario == "Regime Normal" ? 3 : 1,
      multa: 0,
      multadias: 0,
      juros1: 0,
      juros2: 0,
      juros3: 0,
      jurosdias1: 0,
      jurosdias2: 0,
      jurosdias3: 0,
      tipojuro: "",
      carta1: 0,
      carta2: 0,
      carta3: 0,
      carta4: 0,
      ativo: "S",
      cnae: 0,
      txpis: 0,
      txcofins: 0,
      xibge: 0,
      usuario: "",
      filial: "",
      estoque_por_empresa: "S",
      revenda: "",
      tabela_preco: 1,
      ultatualizacao: new Date(),
    };
  }
}
