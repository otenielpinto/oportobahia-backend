//aqui poderia importar o types se estiver usando typeScript para mappers
//payload poderia ser do type importado
//Exemplo    produto : TProduto ;

import { lib } from "../utils/lib.js";

class Mude_nome_classe_Mapper {
  //Explicacao static ( nao preciso de instanciar a classe )
  static toFirebird(payload) {
    return {};
  }
}

module.exports = { Mude_nome_classe_Mapper };
