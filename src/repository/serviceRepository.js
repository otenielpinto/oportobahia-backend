import { TMongo } from "../infra/mongoClient.js";
import { lib } from "../utils/lib.js";

async function getServiceById(idtenant, name_service) {
  const client = await TMongo.connect();
  let response = await client
    .collection("service")
    .findOne({ id: idtenant, name: name_service });
  return response;
}

async function getService(id_tenant, name_service) {
  let response = await getServiceById(id_tenant, name_service);
  if (!response) {
    response = await updateService(id_tenant, name_service);
  }
  return response;
}

async function updateService(idtenant, name_service) {
  let last = new Date();
  let dateBr = lib.formatDateBr(new Date());

  const client = await TMongo.connect();
  const service = await getServiceById(idtenant, name_service);

  if (!service) {
    last = null;
    dateBr = null;
  }

  let config = {
    id: idtenant,
    name: name_service,
    last: last,
    dateBr: dateBr,
  };

  return client
    .collection("service")
    .updateOne(
      { id: { $eq: idtenant }, name: { $eq: name_service } },
      { $set: config },
      { upsert: true }
    );
}

async function hasExec(idtenant, name_service) {
  let service = await getService(idtenant, name_service);

  if (service.dateBr) {
    let dateBr = lib.formatDateBr(new Date());
    if (service.dateBr == dateBr) {
      return 1;
    }
  }
  return 0;
}

export const serviceRepository = {
  getService,
  updateService,
  hasExec,
};
