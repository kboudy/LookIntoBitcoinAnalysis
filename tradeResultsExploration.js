const _ = require("lodash"),
  moment = require("moment"),
  { downloadChartData, getChartData } = require("./dataUtils"),
  { categories, datasetNames } = require("./constants"),
  fs = require("fs"),
  cartesian = require("./cartesian"),
  {
    initialize,
    testTypes,
    bullishTestCriteriaCombinations,
    bearishTestCriteriaCombinations,
    runIndicatorTest,
    getDates,
  } = require("./indicatorTests");

const tradeResults = JSON.parse(fs.readFileSync("tradeResults.json"));
let maxIndicatorCount = 0;
let resultWithMaxIndicator = null;
for (const r of tradeResults.results) {
  let indicatorCount = 0;
  for (const f of Object.keys(r)) {
    if ((f.startsWith("B") || f.startsWith("S")) && f.length <= 3) {
      indicatorCount++;
    }
  }
  if (indicatorCount > maxIndicatorCount) {
    maxIndicatorCount = indicatorCount;
    resultWithMaxIndicator = r;
  }
}
console.log(maxIndicatorCount);
console.log(JSON.stringify(resultWithMaxIndicator));
debugger;
