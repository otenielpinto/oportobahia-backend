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
