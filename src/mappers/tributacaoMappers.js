//aqui poderia importar o types se estiver usando typeScript para mappers
//payload poderia ser do type importado
//Exemplo    produto : TProduto ;

export class TributacaoMappers {
  //Explicacao static ( nao preciso de instanciar a classe )

  static newICMSUFDest() {
    return {
      vBCUFDest: 0,
      vBCFCPUFDest: 0,
      pFCPUFDest: 0,
      pICMSUFDest: 0,
      pICMSInter: 0,
      pICMSInterPart: 0,
      vFCPUFDest: 0,
      vICMSUFDest: 0,
      vICMSUFRemet: 0,
    };
  }

  static newIcms() {
    return {
      orig: "",
      modBC: "",
      vBC: 0,
      pRedBC: 0,
      pICMS: 0,
      vICMS: 0,
      modBCST: "",
      pMVAST: 0,
      pRedBCST: 0,
      vBCST: 0,
      pICMSST: 0,
      vICMSST: 0,
      pCredSN: 0,
      vCredICMSSN: 0,
    };
  }

  static newIpi() {
    return {
      CST: "",
      vBC: 0,
      pIPI: 0,
      vIPI: 0,
    };
  }

  static newPis() {
    return {
      CST: "",
      vBC: 0,
      pPIS: 0,
      vPIS: 0,
    };
  }

  static newCofins() {
    return {
      CST: "",
      vBC: 0,
      pCOFINS: 0,
      vCOFINS: 0,
    };
  }
}
