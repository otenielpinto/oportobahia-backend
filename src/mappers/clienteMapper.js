//aqui poderia importar o types se estiver usando typeScript para mappers
//payload poderia ser do type importado
//Exemplo    produto : TProduto ;

import { lib } from "../utils/lib.js";

export class ClienteMapper {
  //Explicacao static ( nao preciso de instanciar a classe )
  static toFirebird(payload) {
    return {
      id: payload?.id ? payload?.id : 0,
      nome: payload?.nome ? payload?.nome.substring(0, 60) : "",
      fantasia: payload?.nome ? payload?.nome.substring(0, 60) : "",
      tipopessoa: payload?.tipo_pessoa ? payload?.tipo_pessoa : "F",
      cpfcnpj: payload?.cpf_cnpj ? lib.onlyNumber(payload?.cpf_cnpj) : "",
      ie: payload?.ie ? lib.onlyNumber(payload?.ie) : "",
      rua: payload?.endereco ? payload?.endereco.substring(0, 60) : "",
      complemento: payload?.complemento
        ? payload?.complemento.substring(0, 60)
        : "",
      nro: payload?.numero ? payload?.numero : "",
      bairro: payload?.bairro ? payload?.bairro?.substring(0, 60) : "",
      cidade: payload?.cidade ? payload?.cidade?.substring(0, 60) : "",
      cep: payload?.cep ? lib.onlyNumber(payload?.cep) : "",
      uf: payload?.uf ? payload?.uf?.substring(0, 2) : "",
      telefone: payload?.telefone
        ? lib.onlyNumber(payload?.telefone.substring(0, 15))
        : "",
      email: payload?.email ? payload?.email : "",
    };
  }
}
