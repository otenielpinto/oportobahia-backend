import xml2js from "xml2js";

//uma unica chamada para xml2js

//https://www.npmjs.com/package/xml2js
const options = { explicitArray: false, ignoreAttrs: true };
const parser = new xml2js.Parser(options);

export const xmlParser = { parser };
