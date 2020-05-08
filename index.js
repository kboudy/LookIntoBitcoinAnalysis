const _ = require("lodash"),
  { downloadChartData, extractChartDataFromZip } = require("./dataUtils"),
  { chartDataFetchInfo } = require("./constants");

(async () => {
  //await downloadChartData();
  const chartData = await extractChartDataFromZip();
  debugger;
})();
