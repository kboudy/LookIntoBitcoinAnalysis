const _ = require("lodash"),
  { downloadChartData, getChartData } = require("./dataUtils"),
  { chartDataFetchInfo } = require("./constants"),
  {
    initialize,
    testTypes,
    testCriteriaCombinations,
    runIndicatorTest,
    getDates,
  } = require("./indicatorTests");

//returns the test results, per day, for every test/criteria combo
// in the format of the "days since test passed", for flexibility
const getDaysSinceTestResults = async () => {
  //  all indicator tests run on each day, and a "# of days since test passed" tally is kept
  const daysSince_testResults = {};

  const dates = getDates().btcPrice;
  let previousDate = null;
  for (const d of dates) {
    daysSince_testResults[d] = {};
    for (const tccKey in testCriteriaCombinations) {
      const positiveResult = await runIndicatorTest(
        d,
        testCriteriaCombinations[tccKey][0].testType, // [0] element has the criteria, [1] is null
        testCriteriaCombinations[tccKey][0].criteria
      );
      let daysSincePositiveResult = 0;
      if (!positiveResult) {
        if (previousDate) {
          daysSincePositiveResult =
            daysSince_testResults[previousDate][tccKey] + 1;
        } else {
          daysSincePositiveResult = 1;
        }
      }
      daysSince_testResults[d][tccKey] = daysSincePositiveResult;
    }
    previousDate = d;
  }
  return daysSince_testResults;
};

(async () => {
  //await downloadChartData();
  await initialize();
  const daysSince_testResults = await getDaysSinceTestResults();
  console.log(JSON.stringify(daysSince_testResults));
  debugger;
})();
