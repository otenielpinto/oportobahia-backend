na function \_processarCab

Exemplo collection formato

{
"\_id": {
"$oid": "6744c1559aeb68383135bd0a"
},
"id": 1,
"name": "CD",
"status": "active",
"limite_faixas": 14,
"percentual_faixa": 0.61
}

abaixo da produtoMap .
preciso criar uma map para a collection formato , a chave deve ser o name , e preciso guardar o limite_faixas e percentual_faixa .

para cada registro eu preciso localizar o formato utilizando o campo tipo .
obrigatorio achar o tipo .

Se nao achar precisa gerar um log e seguir para ao proximo registro .

assim que localizar eu preciso salvar nos campos abaixo :
percentualFaixa: formato.percentual_faixa,
limiteFaixas: formato.limite_faixas,

De o seu melhor .




{
  "_id": {
    "$oid": "69f085415c8589e10b36efc9"
  },
  "id": "851402616",
  "data_criacao": "29/01/2026 14:00:07",
  "nome": "CD AVENGED SEVENFOLD -  AVENGED SEVENFOLD",
  "codigo": "0093624992011",
  "preco": 25.84,
  "preco_promocional": 0,
  "unidade": "PC",
  "gtin": "0093624992011",
  "tipoVariacao": "N",
  "localizacao": "",
  "preco_custo": 21.32,
  "preco_custo_medio": 21.32,
  "situacao": "A",
  "id_tenant": 1,
  "id_empresa": 1,
  "status": 1,
  "createdAt": {
    "$date": "2026-04-28T10:00:33.408Z"
  },
  "updatedAt": {
    "$date": "2026-04-28T10:53:25.199Z"
  }
}




{
  "_id": {
    "$oid": "69f085435c8589e10b36f0b1"
  },
  "id": "597675739",
  "data_criacao": "04/11/2021 10:24:01",
  "nome": "AVENGED SEVENFOLD - AVENGED SEVENFOLD - 0093624992011",
  "codigo": "9362499201",
  "preco": 40.44,
  "preco_promocional": 0,
  "unidade": "Peça",
  "gtin": "0093624992011",
  "tipoVariacao": "N",
  "localizacao": "",
  "preco_custo": 17.77,
  "preco_custo_medio": 17.77,
  "situacao": "I",
  "id_tenant": 1,
  "id_empresa": 1,
  "status": 1,
  "createdAt": {
    "$date": "2026-04-28T10:00:35.189Z"
  },
  "updatedAt": {
    "$date": "2026-04-28T10:57:21.882Z"
  }
}
