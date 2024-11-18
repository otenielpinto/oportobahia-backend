import { MongoClient } from "mongodb";
let client = null;
var dateStarted = null;

async function connect() {
  if (!client) client = new MongoClient(process.env.MONGO_CONNECTION);
  await client.connect();
  return client.db(process.env.MONGO_DATABASE);
}

async function disconnect() {
  if (!client) return true;
  try {
    await client.close();
    client = null;
  } catch (error) {
    client = null;
    return true;
  }
  return true;
}

async function close() {
  let date = new Date();
  if (dateStarted == null) {
    dateStarted = date.getDate();
    return true;
  } else {
    if (date.getDate() != dateStarted) {
      console.log("Efetuando desconexão mongoDB");
      dateStarted = null;
      await disconnect();
      global.processandoNow = 0;
      global.stockWtaList = [];
      global.stockWtaListTime = new Date();
      return true;
    }
  }
}

async function newConnection() {
  //tem que fechar a conexão , depois de usar
  let localclient = new MongoClient(process.env.MONGO_CONNECTION);
  await localclient.connect();
  return localclient.db(process.env.MONGO_DATABASE);
}

//sim as configurações ficam dentro do mongo_db ? Porque ? Porque são varias lojas plugadas ao aplicativo .
async function getTenant(id_tenant) {
  const localClient = await connect();
  const tenant = await localClient
    .collection("tenant")
    .findOne({ id: id_tenant });
  if (!tenant || tenant == null || tenant === undefined) {
    console.log(`A consulta não retornou dados: ${id_tenant}`);
  }
  return tenant;
}

export const TMongo = {
  connect,
  disconnect,
  newConnection,
  close,
  getTenant,
};
