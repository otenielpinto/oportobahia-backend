Crie uma function que vai receber data inicial e data final como parametro .

Objetivo : apurar os royalties de todas as notas fiscais emitidas entre essas datas e salvar o resultado em uma collection chamada tmp_apuracao_royalties_movto ( ja existente) . mas
preciso salvar no formato conforme a planilha modelo (/home/oteniel/projetos/oportobahia/oportobahia-backend/src/docs/modelo_planilha.xlsx)

condicionais :
e os campos dataInicial e dataFinal precisam ser preenchidos com as datas passadas como parametro .

    utilize a function que ja existe  getNotasFiscaisPorPeriodo({ fromDate, toDate, tipoVenda }) do nfeController para buscar as notas fiscais emitidas entre as datas passadas como parametro e do tipo venda (V) .

Exemplo :
const notasFiscais = await getNotasFiscaisPorPeriodo({
fromDate,
toDate,
tipoVenda: "V",
});

cada linha precisa ter uma id unica (pode ser um uuid) ,

envie para o banco de dados somente quando for tudo processado e nao tiver nenhum erro , ou seja, se tiver algum erro durante o processamento de alguma nota fiscal , entao nada deve ser salvo no banco de dados e a function deve retornar o erro encontrado .

itere os produtos da nota fiscal e para cada produto eu preciso localizar ele na collection (tmp_produto_royalty) . utilize o campo cProd da collection nota_fiscal para localizar o produto
na collection (tmp_produto_royalty) campo gtinEan .

se caso nao exisitir o produto na collection tmp_produto_royalty , entao o produto deve ser ignorado e nao deve ser incluido no calculo de royalties .

deixe os calculos para que sejam calculados posteriormente , por enquanto apenas salve os dados na collection tmp_apuracao_royalties_movto seguindo o modelo da planilha modelo_planilha.xlsx, porem deixe os campos de calculo preenchidos com 0 (zero) .
Segue modelo de objeto da collection tmp_produto_royalty (esses campos ja podem ser preenchidos na planilha) :

{
"\_id": {
"$oid": "69ea8b2652e2d6a69ed9b0ff"
  },
  "gtinEan": "7897119460183",
  "id_empresa": 1,
  "id_tenant": 1,
  "categoriaProduto": "BLU-RAYs",
  "created_at": {
    "$date": "2026-04-23T21:12:05.544Z"
},
"descricaoTitulo": "A FILHA DO MEU MELHOR AMIGO - HUGH LAURIE",
"fornecedor": "CAMPINAS COMERCIO DE PUBLICACOES LTDA - EPP",
"gravadora": "UNIVERSO",
"id": "0e791a8c-690e-44ce-858c-234b324d42f1",
"importadoEm": {
"$date": "2026-04-23T21:00:30.898Z"
  },
  "listaPreco": "AA - SEM ROYALTIES - GÉNERICO",
  "loteImportacao": "c41a634e-0f5a-4dcc-9e3b-68627b41920f",
  "marca": "UNIVERSO",
  "ncm": "8523.49.90",
  "nivelRoyalty": "COMPRADO",
  "numeroDiscos": 1,
  "numeroFaixas": 14,
  "origem": "0 - Nacional, exceto as indicadas nos códigos 3 a 5",
  "percentual": 0,
  "peso": 0,
  "precoCusto": 12,
  "precoDistribuidora": 33.7,
  "precoOporto": 5,
  "release": {
    "$date": "2023-04-01T00:00:00.000Z"
},
"sku": "21420",
"tipo": "BLU-RAYs",
"updated_at": {
"$date": "2026-04-23T21:12:05.544Z"
}
}

Exemplo collection nota_fical :

{
"\_id": {
"$oid": "69e8b08952e2d6a69eb7c3e8"
  },
  "id": "860609308",
  "chave_acesso": "35260433268082000109550030000053271606093080",
  "cliente": {
    "nome": "OPORTO DA MUSICA LTDA",
    "tipo_pessoa": "J",
    "cpf_cnpj": "63.564.727/0001-11",
    "ie": "156699260111",
    "endereco": "AVENIDA ENG HEITOR ANTONIO EIRAS GARCIA",
    "numero": "1010",
    "complemento": "SUBSL 1",
    "bairro": "JARDIM ESMERALDA",
    "cep": "05.588-001",
    "cidade": "SAO PAULO",
    "uf": "SP",
    "fone": "",
    "email": "contato@oportodamusica.com.br"
  },
  "codigo_rastreamento": "",
  "data_emissao": "22/04/2026",
  "data_movto": {
    "$date": "2026-04-22T03:00:00.000Z"
},
"descricao_situacao": "Autorizada",
"endereco_entrega": {
"tipo_pessoa": "J",
"cpf_cnpj": "63.564.727/0001-11",
"endereco": "AVENIDA ENG HEITOR ANTONIO EIRAS GARCIA",
"numero": "1010",
"complemento": "SUBSL 1",
"bairro": "JARDIM ESMERALDA",
"cep": "05.588-001",
"cidade": "SAO PAULO",
"uf": "SP",
"fone": "",
"nome_destinatario": "OPORTO DA MUSICA LTDA"
},
"id_forma_envio": "",
"id_forma_frete": "",
"id_vendedor": "",
"nome": "OPORTO DA MUSICA LTDA",
"nome_vendedor": "",
"numero": "005327",
"numero_ecommerce": null,
"serie": "3",
"situacao": "6",
"sys_status": 1,
"sys_xml": 1,
"tenant_id": 1,
"tipo": "S",
"tipoVenda": "V",
"transportador": {
"nome": ""
},
"updated_at": {
"$date": "2026-04-22T11:27:24.012Z"
  },
  "url_rastreamento": null,
  "valor": "488.70",
  "valor_frete": "0.00",
  "valor_produtos": "488.70",
  "ICMSTot": {
    "vBC": "0.00",
    "vICMS": "0.00",
    "vICMSDeson": "0.00",
    "vFCPUFDest": "0.00",
    "vICMSUFDest": "0.00",
    "vICMSUFRemet": "0.00",
    "vFCP": "0.00",
    "vBCST": "0.00",
    "vST": "0.00",
    "vFCPST": "0.00",
    "vFCPSTRet": "0.00",
    "vProd": "488.70",
    "vFrete": "0.00",
    "vSeg": "0.00",
    "vDesc": "0.00",
    "vII": "0.00",
    "vIPI": "0.00",
    "vIPIDevol": "0.00",
    "vPIS": "3.18",
    "vCOFINS": "14.66",
    "vOutro": "0.00",
    "vNF": "488.70",
    "vTotTrib": "161.47"
  },
  "itens": [
    {
      "prod": {
        "cProd": "0190295426521",
        "cEAN": "0190295426521",
        "xProd": "MARILLION - AFRAID OF SUNLIGHT (DELUXE EDITION) - 0190295426521",
        "NCM": "85234910",
        "CEST": "2806300",
        "CFOP": "5102",
        "uCom": "Peca",
        "qCom": "10.0000",
        "vUnCom": "25.84",
        "vProd": "258.40",
        "cEANTrib": "0190295426521",
        "uTrib": "Peca",
        "qTrib": "10.0000",
        "vUnTrib": "25.84",
        "indTot": "1",
        "xPed": "000392 - 376/47"
      },
      "imposto": {
        "vTotTrib": "85.38",
        "ICMS": {
          "ICMSSN101": {
            "orig": "0",
            "CSOSN": "101",
            "pCredSN": "0.00",
            "vCredICMSSN": "0.00"
          }
        },
        "PIS": {
          "PISAliq": {
            "CST": "01",
            "vBC": "258.40",
            "pPIS": "0.65",
            "vPIS": "1.68"
          }
        },
        "COFINS": {
          "COFINSAliq": {
            "CST": "01",
            "vBC": "258.40",
            "pCOFINS": "3.00",
            "vCOFINS": "7.75"
          }
        }
      }
    },
    {
      "prod": {
        "cProd": "0016861794620",
        "cEAN": "0016861794620",
        "xProd": "DEATH - SYMBOLIC (REMASTER) - 0016861794620",
        "NCM": "85234910",
        "CFOP": "5102",
        "uCom": "PECA",
        "qCom": "5.0000",
        "vUnCom": "25.84",
        "vProd": "129.20",
        "cEANTrib": "0016861794620",
        "uTrib": "PECA",
        "qTrib": "5.0000",
        "vUnTrib": "25.84",
        "indTot": "1",
        "xPed": "000392 - 376/47"
      },
      "imposto": {
        "vTotTrib": "42.69",
        "ICMS": {
          "ICMSSN101": {
            "orig": "0",
            "CSOSN": "101",
            "pCredSN": "0.00",
            "vCredICMSSN": "0.00"
          }
        },
        "PIS": {
          "PISAliq": {
            "CST": "01",
            "vBC": "129.20",
            "pPIS": "0.65",
            "vPIS": "0.84"
          }
        },
        "COFINS": {
          "COFINSAliq": {
            "CST": "01",
            "vBC": "129.20",
            "pCOFINS": "3.00",
            "vCOFINS": "3.88"
          }
        }
      }
    },
    {
      "prod": {
        "cProd": "0639842820424",
        "cEAN": "0639842820424",
        "xProd": "FAITH NO MORE - THE REAL THING - 0639842820424",
        "NCM": "85234910",
        "CFOP": "5102",
        "uCom": "PECA",
        "qCom": "5.0000",
        "vUnCom": "20.22",
        "vProd": "101.10",
        "cEANTrib": "0639842820424",
        "uTrib": "PECA",
        "qTrib": "5.0000",
        "vUnTrib": "20.22",
        "indTot": "1",
        "xPed": "000392 - 376/47"
      },
      "imposto": {
        "vTotTrib": "33.40",
        "ICMS": {
          "ICMSSN101": {
            "orig": "0",
            "CSOSN": "101",
            "pCredSN": "0.00",
            "vCredICMSSN": "0.00"
          }
        },
        "PIS": {
          "PISAliq": {
            "CST": "01",
            "vBC": "101.10",
            "pPIS": "0.65",
            "vPIS": "0.66"
          }
        },
        "COFINS": {
          "COFINSAliq": {
            "CST": "01",
            "vBC": "101.10",
            "pCOFINS": "3.00",
            "vCOFINS": "3.03"
          }
        }
      }
    }
  ],
  "natOp": "VENDA DE MERCADORIA",
  "xml": {
    "nfeProc": {
      "NFe": {
        "infNFe": {
          "ide": {
            "cUF": "35",
            "cNF": "60609308",
            "natOp": "VENDA DE MERCADORIA",
            "mod": "55",
            "serie": "3",
            "nNF": "5327",
            "dhEmi": "2026-04-22T07:43:10-03:00",
            "dhSaiEnt": "2026-04-22T07:43:59-03:00",
            "tpNF": "1",
            "idDest": "1",
            "cMunFG": "3550308",
            "tpImp": "1",
            "tpEmis": "1",
            "cDV": "0",
            "tpAmb": "1",
            "finNFe": "1",
            "indFinal": "0",
            "indPres": "9",
            "indIntermed": "0",
            "procEmi": "0",
            "verProc": "Tiny ERP"
          },
          "emit": {
            "CNPJ": "33268082000109",
            "xNome": "OPORTO BAHIA COMERCIO DE PRODUTOS CULTURAIS LTDA",
            "xFant": "Oporto da Musica",
            "enderEmit": {
              "xLgr": "AV. ENG. HEITOR ANTONIO EIRAS GARCIA",
              "nro": "1010",
              "xBairro": "JARDIM ESMERALDA",
              "cMun": "3550308",
              "xMun": "Sao Paulo",
              "UF": "SP",
              "CEP": "05588001",
              "cPais": "1058",
              "xPais": "Brasil",
              "fone": "11998459273"
            },
            "IE": "123886761110",
            "IM": "6.228.005-8",
            "CNAE": "4649407",
            "CRT": "1"
          },
          "dest": {
            "CNPJ": "63564727000111",
            "xNome": "OPORTO DA MUSICA LTDA",
            "enderDest": {
              "xLgr": "AVENIDA ENG HEITOR ANTONIO EIRAS GARCIA",
              "nro": "1010",
              "xCpl": "SUBSL 1",
              "xBairro": "JARDIM ESMERALDA",
              "cMun": "3550308",
              "xMun": "SAO PAULO",
              "UF": "SP",
              "CEP": "05588001",
              "cPais": "1058",
              "xPais": "Brasil"
            },
            "indIEDest": "1",
            "IE": "156699260111",
            "email": "contato@oportodamusica.com.br"
          },
          "det": [
            {
              "prod": {
                "cProd": "0190295426521",
                "cEAN": "0190295426521",
                "xProd": "MARILLION - AFRAID OF SUNLIGHT (DELUXE EDITION) - 0190295426521",
                "NCM": "85234910",
                "CEST": "2806300",
                "CFOP": "5102",
                "uCom": "Peca",
                "qCom": "10.0000",
                "vUnCom": "25.84",
                "vProd": "258.40",
                "cEANTrib": "0190295426521",
                "uTrib": "Peca",
                "qTrib": "10.0000",
                "vUnTrib": "25.84",
                "indTot": "1",
                "xPed": "000392 - 376/47"
              },
              "imposto": {
                "vTotTrib": "85.38",
                "ICMS": {
                  "ICMSSN101": {
                    "orig": "0",
                    "CSOSN": "101",
                    "pCredSN": "0.00",
                    "vCredICMSSN": "0.00"
                  }
                },
                "PIS": {
                  "PISAliq": {
                    "CST": "01",
                    "vBC": "258.40",
                    "pPIS": "0.65",
                    "vPIS": "1.68"
                  }
                },
                "COFINS": {
                  "COFINSAliq": {
                    "CST": "01",
                    "vBC": "258.40",
                    "pCOFINS": "3.00",
                    "vCOFINS": "7.75"
                  }
                }
              }
            },
            {
              "prod": {
                "cProd": "0016861794620",
                "cEAN": "0016861794620",
                "xProd": "DEATH - SYMBOLIC (REMASTER) - 0016861794620",
                "NCM": "85234910",
                "CFOP": "5102",
                "uCom": "PECA",
                "qCom": "5.0000",
                "vUnCom": "25.84",
                "vProd": "129.20",
                "cEANTrib": "0016861794620",
                "uTrib": "PECA",
                "qTrib": "5.0000",
                "vUnTrib": "25.84",
                "indTot": "1",
                "xPed": "000392 - 376/47"
              },
              "imposto": {
                "vTotTrib": "42.69",
                "ICMS": {
                  "ICMSSN101": {
                    "orig": "0",
                    "CSOSN": "101",
                    "pCredSN": "0.00",
                    "vCredICMSSN": "0.00"
                  }
                },
                "PIS": {
                  "PISAliq": {
                    "CST": "01",
                    "vBC": "129.20",
                    "pPIS": "0.65",
                    "vPIS": "0.84"
                  }
                },
                "COFINS": {
                  "COFINSAliq": {
                    "CST": "01",
                    "vBC": "129.20",
                    "pCOFINS": "3.00",
                    "vCOFINS": "3.88"
                  }
                }
              }
            },
            {
              "prod": {
                "cProd": "0639842820424",
                "cEAN": "0639842820424",
                "xProd": "FAITH NO MORE - THE REAL THING - 0639842820424",
                "NCM": "85234910",
                "CFOP": "5102",
                "uCom": "PECA",
                "qCom": "5.0000",
                "vUnCom": "20.22",
                "vProd": "101.10",
                "cEANTrib": "0639842820424",
                "uTrib": "PECA",
                "qTrib": "5.0000",
                "vUnTrib": "20.22",
                "indTot": "1",
                "xPed": "000392 - 376/47"
              },
              "imposto": {
                "vTotTrib": "33.40",
                "ICMS": {
                  "ICMSSN101": {
                    "orig": "0",
                    "CSOSN": "101",
                    "pCredSN": "0.00",
                    "vCredICMSSN": "0.00"
                  }
                },
                "PIS": {
                  "PISAliq": {
                    "CST": "01",
                    "vBC": "101.10",
                    "pPIS": "0.65",
                    "vPIS": "0.66"
                  }
                },
                "COFINS": {
                  "COFINSAliq": {
                    "CST": "01",
                    "vBC": "101.10",
                    "pCOFINS": "3.00",
                    "vCOFINS": "3.03"
                  }
                }
              }
            }
          ],
          "total": {
            "ICMSTot": {
              "vBC": "0.00",
              "vICMS": "0.00",
              "vICMSDeson": "0.00",
              "vFCPUFDest": "0.00",
              "vICMSUFDest": "0.00",
              "vICMSUFRemet": "0.00",
              "vFCP": "0.00",
              "vBCST": "0.00",
              "vST": "0.00",
              "vFCPST": "0.00",
              "vFCPSTRet": "0.00",
              "vProd": "488.70",
              "vFrete": "0.00",
              "vSeg": "0.00",
              "vDesc": "0.00",
              "vII": "0.00",
              "vIPI": "0.00",
              "vIPIDevol": "0.00",
              "vPIS": "3.18",
              "vCOFINS": "14.66",
              "vOutro": "0.00",
              "vNF": "488.70",
              "vTotTrib": "161.47"
            }
          },
          "transp": {
            "modFrete": "9",
            "vol": {
              "pesoL": "2.060",
              "pesoB": "2.060"
            }
          },
          "pag": {
            "detPag": {
              "tPag": "99",
              "xPag": "Itau Unibanco - Agencia 8215",
              "vPag": "488.70"
            }
          },
          "infAdic": {
            "infCpl": "Permite o aproveitamento do credito de ICMS no valor de R$ 0,00, Correspondente a aliquota de 0,00% nos termos do Art. 23 da LC 123/2006<br /><br />Tributos aproximados: R$ 73,50 (Federal) e R$ 87,97 (Estadual). Fonte: IBPT B46141<br />OC: 000392 - 376/477<br />N Pedido: 6311"
},
"compra": {
"xPed": "000392 - 376/477"
},
"infRespTec": {
"CNPJ": "15088992000128",
"xContato": "Fernando",
"email": "integracao@tiny.com.br",
"fone": "05430558200"
}
},
"Signature": {
"SignedInfo": {
"CanonicalizationMethod": "",
"SignatureMethod": "",
"Reference": {
"Transforms": {
"Transform": [
"",
""
]
},
"DigestMethod": "",
"DigestValue": "F9Ucyb9tiqirKoayQWGRWV9OVas="
}
},
"SignatureValue": "OqAxfv/laRrEOuNnbxtG3ggGuM+EL8yYTybXc6ZGcnCsteHg3zV6OIa+40ewOFMZjJd+kDveiD8tuTH6jy8WCo+TZxNhIN/QvZPHYjRf1Q0U9KuVH9MEEm5j5qBhpEA4kAFRbif6BLomjy3oavHI4QmcZdzkA9WyiSLyR+IAN2u8Z0NT7GUd5VAQrGY3nrVk1SonEo3+CS04QHAuqu8OnneYyrJ0oaibtQR5Utn+sawbyma+ADP1DHucQ/dsuMewS6zLo+LsS7izzDYe5aC4kwlMNe5GXUTA0Y9s1ttpOO+6yx3L/+v0EenWcM+ex3ChGRIe9tb9NBUF4qatSb6RBA==",
"KeyInfo": {
"X509Data": {
"X509Certificate": "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"
}
}
}
},
"protNFe": {
"infProt": {
"tpAmb": "1",
"verAplic": "SP_NFE_PL009_V4",
"chNFe": "35260433268082000109550030000053271606093080",
"dhRecbto": "2026-04-22T07:44:17-03:00",
"nProt": "135261521257064",
"digVal": "F9Ucyb9tiqirKoayQWGRWV9OVas=",
"cStat": "100",
"xMotivo": "Autorizado o uso da NF-e"
}
}
}
}
}
