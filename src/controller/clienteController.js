import { fb5 } from "../infra/fb5.js";

async function setData(payload) {
  //precisa receber um objeto no formato do banco de dados do firebird
  if (!payload) return;
  let rows = await fb5.openQuery("CLIENTE", "id", `cpfcnpj=?`, [
    payload?.cpfcnpj,
  ]);

  if (rows.length == 0) {
    payload.id = await fb5.getNextId("CLIENTE");
    await fb5.insertQuery("CLIENTE", payload);
    return payload;
  } else {
    payload.id = rows[0]?.id;
    await fb5.updateQuery("CLIENTE", rows[0]?.id, payload);
    return payload;
  }
}

async function findByCPFCNPJ(value) {
  let rows = await fb5.openQuery("CLIENTE", "*", `cpfcnpj=?`, [value]);
  if (rows.length == 0) return;
  return rows[0];
}

export const clienteController = {
  setData,
  findByCPFCNPJ,
};
