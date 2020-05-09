const _ = require("lodash"),
  { downloadChartData, getChartData } = require("./dataUtils"),
  { chartDataFetchInfo } = require("./constants"),
  indicatorTests = require("./indicatorTests");

const { testTypes } = indicatorTests;
const testCriteriaCombinations = [
  {
    testType: testTypes.bitcoinInvestor,
    criteria: indicatorTests.bitcoinInvestorCriteria.enteringOverbought,
  },
  {
    testType: testTypes.bitcoinInvestor,
    criteria: indicatorTests.bitcoinInvestorCriteria.exitingOverbought,
  },
  {
    testType: testTypes.bitcoinInvestor,
    criteria: indicatorTests.bitcoinInvestorCriteria.enteringOversold,
  },
  {
    testType: testTypes.bitcoinInvestor,
    criteria: indicatorTests.bitcoinInvestorCriteria.exitingOversold,
  },

  {
    testType: testTypes.heatmap200WeekMovingAverage,
    criteria: indicatorTests.heatmap200WeekCriteria.enteringOverbought,
  },
  {
    testType: testTypes.heatmap200WeekMovingAverage,
    criteria: indicatorTests.heatmap200WeekCriteria.enteringOversold,
  },
  {
    testType: testTypes.heatmap200WeekMovingAverage,
    criteria: indicatorTests.heatmap200WeekCriteria.exitingOverbought,
  },

  {
    testType: testTypes.mvrvZScore,
    criteria: indicatorTests.mvrvCriteria.enteringOverbought,
  },
  {
    testType: testTypes.mvrvZScore,
    criteria: indicatorTests.mvrvCriteria.exitingOverbought,
  },
  {
    testType: testTypes.mvrvZScore,
    criteria: indicatorTests.mvrvCriteria.enteringExtremeOverbought,
  },
  {
    testType: testTypes.mvrvZScore,
    criteria: indicatorTests.mvrvCriteria.exitingExtremeOverbought,
  },
  {
    testType: testTypes.mvrvZScore,
    criteria: indicatorTests.mvrvCriteria.enteringOversold,
  },
  {
    testType: testTypes.mvrvZScore,
    criteria: indicatorTests.mvrvCriteria.exitingOversold,
  },
  {
    testType: testTypes.mvrvZScore,
    criteria: indicatorTests.mvrvCriteria.enteringExtremeOversold,
  },
  {
    testType: testTypes.mvrvZScore,
    criteria: indicatorTests.mvrvCriteria.exitingExtremeOversold,
  },

  {
    testType: testTypes.goldenRatio,
    criteria: indicatorTests.goldenRatioCriteria.enteringOverbought,
  },
  {
    testType: testTypes.goldenRatio,
    criteria: indicatorTests.goldenRatioCriteria.reachingPotentialCycleHighZone,
  },

  {
    testType: testTypes.piCycleTop,
    criteria: null,
  },

  {
    testType: testTypes.puellMultiple,
    criteria: indicatorTests.puellCriteria.enteringOverbought,
  },
  {
    testType: testTypes.puellMultiple,
    criteria: indicatorTests.puellCriteria.enteringOversold,
  },
  {
    testType: testTypes.puellMultiple,
    criteria: indicatorTests.puellCriteria.exitingOverbought,
  },
  {
    testType: testTypes.puellMultiple,
    criteria: indicatorTests.puellCriteria.exitingOversold,
  },

  {
    testType: testTypes.logarithmic,
    criteria: indicatorTests.logarithmicCriteria.enteringOverbought,
  },
  {
    testType: testTypes.logarithmic,
    criteria: indicatorTests.logarithmicCriteria.exitingOverbought,
  },
  {
    testType: testTypes.logarithmic,
    criteria: indicatorTests.logarithmicCriteria.approachingResistance,
  },
  {
    testType: testTypes.logarithmic,
    criteria: indicatorTests.logarithmicCriteria.retracingResistance,
  },
  {
    testType: testTypes.logarithmic,
    criteria: indicatorTests.logarithmicCriteria.enteringOversold,
  },
  {
    testType: testTypes.logarithmic,
    criteria: indicatorTests.logarithmicCriteria.exitingOversold,
  },

  {
    testType: testTypes.relativeUnrealized,
    criteria: indicatorTests.relativeUnrealizedCriteria.enteringCapitulation,
  },
  {
    testType: testTypes.relativeUnrealized,
    criteria:
      indicatorTests.relativeUnrealizedCriteria.enteringHopeFearFromBelow,
  },
  {
    testType: testTypes.relativeUnrealized,
    criteria:
      indicatorTests.relativeUnrealizedCriteria.enteringHopeFearFromAbove,
  },
  {
    testType: testTypes.relativeUnrealized,
    criteria:
      indicatorTests.relativeUnrealizedCriteria.enteringOptimismDenialFromBelow,
  },
  {
    testType: testTypes.relativeUnrealized,
    criteria:
      indicatorTests.relativeUnrealizedCriteria.enteringOptimismDenialFromAbove,
  },
  {
    testType: testTypes.relativeUnrealized,
    criteria: indicatorTests.relativeUnrealizedCriteria.enteringGreed,
  },
];

(async () => {
  //await downloadChartData();

  //  all indicator tests run on each day, and a "# of days since test passed" tally is kept
  const daysSince_testResults = {};

  await indicatorTests.initialize();
  const dates = indicatorTests.getDates().btcPrice;
  let previousDate = null;
  for (const d of dates) {
    daysSince_testResults[d] = {};
    for (const tcc of testCriteriaCombinations) {
      const positiveResult = await indicatorTests.runIndicatorTest(
        d,
        tcc.testType,
        tcc.criteria
      );
      let daysSincePositiveResult = 0;
      const tKey = `${tcc.testType}_${tcc.criteria ? tcc.criteria : ""}`;
      if (!positiveResult) {
        if (previousDate) {
          daysSincePositiveResult =
            daysSince_testResults[previousDate][tKey] + 1;
        } else {
          daysSincePositiveResult = 1;
        }
      }
      daysSince_testResults[d][tKey] = daysSincePositiveResult;
    }
    previousDate = d;
  }
  // we've now have test results, per day, for every test/criteria combo
  // in the format of the "days since test passed", for flexibility
})();
