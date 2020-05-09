const _ = require("lodash"),
  moment = require("moment"),
  fs = require("fs");

const tradeResults = JSON.parse(fs.readFileSync("tradeResults.json"));
const maxDate = _.maxBy(tradeResults.results, (r) => r.maxTradeDate)
  .maxTradeDate;
debugger;
