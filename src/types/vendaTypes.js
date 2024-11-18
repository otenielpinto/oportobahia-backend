const TIPO_VENDA = {
  VENDA: "V",
  COMPRA: "C",
  DEVOLUCAO: "D",
  GARANTIA: "G",
  PAGAR_S_REGISTRO: "P",
  RECEBER_S_REGISTRO: "R",
  TRANSFERENCIA: "T",
  TICKET_ADIANTAMENTO: "K",
};

const SITUACAO = {
  ATIVA: "A",
  CANCELADA: "C",
};

const MOV_ESTOQUE = {
  VENDA: 502,
};

const MOV_CAIXA = {
  VENDA: 1,
};

const NAT_OPERACAO = {
  VENDA: 5102,
};

export const TVendaTypes = {
  TIPO_VENDA,
  SITUACAO,
  MOV_ESTOQUE,
  MOV_CAIXA,
  NAT_OPERACAO,
};
