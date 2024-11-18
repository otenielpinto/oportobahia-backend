const CustomerRepository = require("../repository/customerRepository");
const mdb = require("../config/db");

const customer = new CustomerRepository(await TMongo.connect());

module.exports = { customer };
