const _ = require("lodash"),
  { downloadChartData, getChartData } = require("./dataUtils"),
  { chartDataFetchInfo } = require("./constants"),
  indicatorTests = require("./indicatorTests");

(async () => {
  //await downloadChartData();
  await indicatorTests.initialize();
  const dates = indicatorTests.getDates().btcPrice;
  for (const d of dates)
    await indicatorTests.relativeUnrealized_crossed(
      d,
      indicatorTests.relativeUnrealizedCriteria.enteringCapitulation
    );
})();
