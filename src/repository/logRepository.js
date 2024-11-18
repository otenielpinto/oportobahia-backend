import { TMongo } from "../infra/mongoClient.js";

async function saveLog(payload) {
  let body = {
    ...payload,
    created_at: new Date().toISOString(),
  };
  const client = await TMongo.connect();
  return await client.collection("tmp_log").insertOne(body);
}

export const logRepository = {
  saveLog,
};
