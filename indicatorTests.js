const _ = require("lodash"),
  { getChartData } = require("./dataUtils"),
  { categories, datasetNames } = require("./constants");

let chartData = null;
let dates = null;
let heatmap_percentChange28DaysAgo = {};

const testTypes = {
  bitcoinInvestor: "bitcoinInvestor",
  heatmap200WeekMovingAverage: "heatmap200WeekMovingAverage",
  mvrvZScore: "mvrvZScore",
  goldenRatio: "goldenRatio",
  piCycleTop: "piCycleTop",
  puellMultiple: "puellMultiple",
  logarithmic: "logarithmic",
  relativeUnrealized: "relativeUnrealized",
};
exports.testTypes = testTypes;

const calcPercentChangeFrom28DaysAgo = (date) => {
  // Exiting overbought zone
  const heatmapData = chartData[categories.heatmap200WeekMovingAverage];
  const ma_current =
    heatmapData[datasetNames.heatmap200WeekMovingAverage.twoHundredWeekMA][
      date
    ];
  if (!ma_current || dates.twoYearMovingAverage.indexOf(date) < 28) {
    return null;
  }
  const previousDate =
    dates.twoYearMovingAverage[dates.twoYearMovingAverage.indexOf(date) - 28];
  if (!previousDate) {
    return null;
  }

  const ma_28DaysAgo =
    heatmapData[datasetNames.heatmap200WeekMovingAverage.twoHundredWeekMA][
      previousDate
    ];
  if (!ma_28DaysAgo || ma_current === 0) {
    return null;
  }

  const percentChange = ((ma_current - ma_28DaysAgo) / ma_current) * 100;
  return percentChange;
};

exports.getDates = () => {
  return dates;
};

exports.initialize = async () => {
  dates = {};
  chartData = await getChartData();
  dates.btcPrice = Object.keys(
    chartData[categories.bitcoinInvestorTool][
      datasetNames.bitcoinInvestorTool.btcPrice
    ]
  ).sort();
  dates.twoYearMovingAverage = Object.keys(
    chartData[categories.heatmap200WeekMovingAverage][
      datasetNames.heatmap200WeekMovingAverage.twoHundredWeekMA
    ]
  ).sort();
  for (const d of dates.twoYearMovingAverage) {
    const pc = calcPercentChangeFrom28DaysAgo(d);
    if (pc) {
      heatmap_percentChange28DaysAgo[d] = pc;
    }
  }
};

exports.runIndicatorTest = (date, testType, criteria) => {
  switch (testType) {
    case testTypes.bitcoinInvestor:
      return bitcoinInvestor(date, criteria);
    case testTypes.heatmap200WeekMovingAverage:
      return heatmap200WeekMovingAverage(date, criteria);
    case testTypes.mvrvZScore:
      return mvrvZScore(date, criteria);
    case testTypes.goldenRatio:
      return goldenRatio(date, criteria);
    case testTypes.piCycleTop:
      return piCycleTop(date);
    case testTypes.puellMultiple:
      return puellMultiple(date, criteria);
    case testTypes.logarithmic:
      return logarithmic(date, criteria);
    case testTypes.relativeUnrealized:
      return relativeUnrealized(date, criteria);
  }
};

const getPreviousDate = (date) => {
  if (!dates.btcPrice.indexOf(date) || dates.btcPrice.indexOf(date) === 0) {
    return null;
  }
  return dates.btcPrice[dates.btcPrice.indexOf(date) - 1];
};

const bitcoinInvestorCriteria = {
  enteringOverbought: "enteringOverbought",
  exitingOverbought: "exitingOverbought",
  enteringOversold: "enteringOversold",
  exitingOversold: "exitingOversold",
};
exports.bitcoinInvestorCriteria = bitcoinInvestorCriteria;
const bitcoinInvestor = (date, criteria) => {
  const previousDate = getPreviousDate(date);
  if (!previousDate) {
    return false;
  }
  const investorToolData = chartData[categories.bitcoinInvestorTool];
  const previousPrice =
    investorToolData[datasetNames.bitcoinInvestorTool.btcPrice][previousDate];
  const currentPrice =
    investorToolData[datasetNames.bitcoinInvestorTool.btcPrice][date];
  if (!previousPrice || !currentPrice) {
    return false;
  }
  const twoYearMovingAverage =
    investorToolData[datasetNames.bitcoinInvestorTool.twoYearMovingAverage][
      date
    ];
  if (!twoYearMovingAverage) {
    return false;
  }
  const twoYearMovingAverage_x5 =
    investorToolData[datasetNames.bitcoinInvestorTool.twoYearMovingAverage_x5][
      date
    ];
  switch (criteria) {
    case bitcoinInvestorCriteria.enteringOverbought:
      return (
        previousPrice <= twoYearMovingAverage_x5 &&
        currentPrice > twoYearMovingAverage_x5
      );
    case bitcoinInvestorCriteria.exitingOverbought:
      return (
        previousPrice >= twoYearMovingAverage_x5 &&
        currentPrice < twoYearMovingAverage_x5
      );
    case bitcoinInvestorCriteria.enteringOversold:
      return (
        previousPrice >= twoYearMovingAverage &&
        currentPrice < twoYearMovingAverage
      );
    case bitcoinInvestorCriteria.exitingOversold:
      return (
        previousPrice <= twoYearMovingAverage &&
        currentPrice > twoYearMovingAverage
      );
  }
};

const heatmap200WeekCriteria = {
  enteringOverbought: "enteringOverbought",
  exitingOverbought: "exitingOverbought",
  enteringOversold: "enteringOversold",
};
exports.heatmap200WeekCriteria = heatmap200WeekCriteria;
const heatmap200WeekMovingAverage = (date, criteria) => {
  const previousDate = getPreviousDate(date);
  if (!previousDate) {
    return false;
  }
  if (
    !heatmap_percentChange28DaysAgo[date] ||
    !heatmap_percentChange28DaysAgo[previousDate]
  ) {
    return false;
  }
  switch (criteria) {
    case heatmap200WeekCriteria.enteringOverbought:
      const eo_crossedAbove =
        heatmap_percentChange28DaysAgo[previousDate] < 14 &&
        heatmap_percentChange28DaysAgo[date] >= 14;
      return eo_crossedAbove;
    case heatmap200WeekCriteria.exitingOverbought:
      const xo_crossedBelow =
        heatmap_percentChange28DaysAgo[previousDate] > 14 &&
        heatmap_percentChange28DaysAgo[date] <= 14;
      return xo_crossedBelow;
    case heatmap200WeekCriteria.enteringOversold:
      const heatmap200Data = chartData[categories.heatmap200WeekMovingAverage];
      const previousPrice =
        heatmap200Data[datasetNames.heatmap200WeekMovingAverage.btcPrice][
          previousDate
        ];
      const currentPrice =
        heatmap200Data[datasetNames.heatmap200WeekMovingAverage.btcPrice][date];
      if (!previousPrice || !currentPrice) {
        return false;
      }
      const current200WMA =
        heatmap200Data[
          datasetNames.heatmap200WeekMovingAverage.twoHundredWeekMA
        ][date];
      const crossedBelow =
        previousPrice > current200WMA && currentPrice <= current200WMA;
      return crossedBelow;
  }
};

const mvrvScoreCriteria = {
  enteringOverbought: "enteringOverbought",
  exitingOverbought: "exitingOverbought",
  enteringExtremeOverbought: "enteringExtremeOverbought",
  exitingExtremeOverbought: "exitingExtremeOverbought",
  enteringOversold: "enteringOversold",
  exitingOversold: "exitingOversold",
  enteringExtremeOversold: "enteringExtremeOversold",
  exitingExtremeOversold: "exitingExtremeOversold",
};
exports.mvrvScoreCriteria = mvrvScoreCriteria;
const mvrvZScore = (date, criteria) => {
  const previousDate = getPreviousDate(date);
  if (!previousDate) {
    return false;
  }
  const mvrvData = chartData[categories.mvrvZScore];
  const previousZScore = mvrvData[datasetNames.mvrvZscore.zScore][previousDate];
  const currentZScore = mvrvData[datasetNames.mvrvZscore.zScore][date];
  if (!previousZScore || !currentZScore) {
    return false;
  }
  switch (criteria) {
    case mvrvScoreCriteria.enteringOverbought:
      return previousZScore < 7.5 && currentZScore >= 7.5;
    case mvrvScoreCriteria.exitingOverbought:
      return previousZScore > 7.5 && currentZScore <= 7.5;
    case mvrvScoreCriteria.enteringExtremeOverbought:
      return previousZScore < 9 && currentZScore >= 9;
    case mvrvScoreCriteria.exitingExtremeOverbought:
      return previousZScore > 9 && currentZScore <= 9;
    case mvrvScoreCriteria.enteringOversold:
      return previousZScore > 0.1 && currentZScore <= 0.1;
    case mvrvScoreCriteria.exitingOversold:
      return previousZScore < 0.1 && currentZScore >= 0.1;
    case mvrvScoreCriteria.enteringExtremeOversold:
      return previousZScore > -0.4 && currentZScore <= -0.4;
    case mvrvScoreCriteria.exitingExtremeOversold:
      return previousZScore < -0.4 && currentZScore >= -0.4;
  }
};

const goldenRatioCriteria = {
  enteringOverbought: "enteringOverbought",
  reachingPotentialCycleHighZone: "reachingPotentialCycleHighZone",
};
exports.goldenRatioCriteria = goldenRatioCriteria;
const goldenRatio = (date, criteria) => {
  const previousDate = getPreviousDate(date);
  if (!previousDate) {
    return false;
  }
  const goldenRatioData = chartData[categories.goldenRatioMultiplier];
  const previousPrice =
    goldenRatioData[datasetNames.goldenRatioMultiplier.btcPrice][previousDate];
  const currentPrice =
    goldenRatioData[datasetNames.goldenRatioMultiplier.btcPrice][date];
  const current350DMA =
    goldenRatioData[datasetNames.goldenRatioMultiplier.price350DMA][date];
  if (!previousPrice || !currentPrice || !current350DMA) {
    return false;
  }
  if (criteria === goldenRatioCriteria.enteringOverbought) {
    const crossed =
      previousPrice < current350DMA * 2 && currentPrice >= current350DMA * 2;
    return crossed;
  } else {
    //reachingPotentialCycleHighZone
    const crossed =
      previousPrice < current350DMA * 3 && currentPrice >= current350DMA * 3;
    return crossed;
  }
};

const piCycleTop = (date) => {
  const previousDate = getPreviousDate(date);
  if (!previousDate) {
    return false;
  }
  const piCycleData = chartData[categories.piCycleTop];
  const previous111DMA =
    piCycleData[datasetNames.piCycleTop.price111DMA][previousDate];
  const current111DMA = piCycleData[datasetNames.piCycleTop.price111DMA][date];
  const current350DMA_x2 =
    piCycleData[datasetNames.piCycleTop.price350DMA_x2][date];
  if (!previous111DMA || !current111DMA || !current350DMA_x2) {
    return false;
  }
  const crossed =
    previous111DMA < current350DMA_x2 && current111DMA >= current350DMA_x2;
  return crossed;
};

const puellMultipleCriteria = {
  enteringOverbought: "enteringOverbought",
  exitingOverbought: "exitingOverbought",
  enteringOversold: "enteringOversold",
  exitingOversold: "exitingOversold",
};
exports.puellMultipleCriteria = puellMultipleCriteria;
const puellMultiple = (date, criteria) => {
  const previousDate = getPreviousDate(date);
  if (!previousDate) {
    return false;
  }
  const puellData = chartData[categories.puellMultiple];
  const previousPuell =
    puellData[datasetNames.puellMultiple.puellMultiple][previousDate];
  const currentPuell =
    puellData[datasetNames.puellMultiple.puellMultiple][date];
  if (!previousPuell || !currentPuell) {
    return false;
  }
  switch (criteria) {
    case mvrvScoreCriteria.enteringOverbought:
      const enteringOverbought = previousPuell < 4 && currentPuell >= 4;
      return enteringOverbought;
    case mvrvScoreCriteria.exitingOverbought:
      const exitingOverbought = previousPuell > 4 && currentPuell <= 4;
      return exitingOverbought;
    case mvrvScoreCriteria.enteringOversold:
      const enteringOversold = previousPuell > 0.5 && currentPuell <= 0.5;
      return enteringOversold;
    case mvrvScoreCriteria.exitingOversold:
      const exitingOversold = previousPuell < 0.5 && currentPuell >= 0.5;
      return exitingOversold;
  }
};

const logarithmicCriteria = {
  enteringOverbought: "enteringOverbought",
  exitingOverbought: "exitingOverbought",
  approachingResistance: "approachingResistance",
  retracingResistance: "retracingResistance",
  enteringOversold: "enteringOversold",
  exitingOversold: "exitingOversold",
};
exports.logarithmicCriteria = logarithmicCriteria;
const logarithmic = (date, criteria) => {
  const previousDate = getPreviousDate(date);
  if (!previousDate) {
    return false;
  }
  const logarithmicData = chartData[categories.logarithmicGrowthCurve];
  const previousOscillator =
    logarithmicData[datasetNames.logarithmicGrowthCurve.oscillator][
      previousDate
    ];
  const currentOscillator =
    logarithmicData[datasetNames.logarithmicGrowthCurve.oscillator][date];
  if (!previousOscillator || !currentOscillator) {
    return false;
  }
  switch (criteria) {
    case logarithmicCriteria.enteringOverbought:
      const enteringOverbought =
        previousOscillator < 0.9 && currentOscillator >= 0.9;
      return enteringOverbought;
    case logarithmicCriteria.exitingOverbought:
      const exitingOverbought =
        previousOscillator > 0.9 && currentOscillator <= 0.9;
      return exitingOverbought;

    case logarithmicCriteria.approachingResistance:
      const approachingResistance =
        previousOscillator < 0.5 && currentOscillator >= 0.5;
      return approachingResistance;
    case logarithmicCriteria.retracingResistance:
      const retracingResistance =
        previousOscillator > 0.5 && currentOscillator <= 0.5;
      return retracingResistance;

    case logarithmicCriteria.enteringOversold:
      const enteringOversold =
        previousOscillator > 0.02 && currentOscillator <= 0.02;
      return enteringOversold;
    case logarithmicCriteria.exitingOversold:
      const exitingOversold =
        previousOscillator < 0.02 && currentOscillator >= 0.02;
      return exitingOversold;
  }
};

const relativeUnrealizedCriteria = {
  enteringCapitulation: "enteringCapitulation",
  enteringHopeFearFromBelow: "enteringHopeFearFromBelow",
  enteringHopeFearFromAbove: "enteringHopeFearFromAbove",
  enteringOptimismDenialFromBelow: "enteringOptimismDenialFromBelow",
  enteringOptimismDenialFromAbove: "enteringOptimismDenialFromAbove",
  enteringGreed: "enteringGreed",
};
exports.relativeUnrealizedCriteria = relativeUnrealizedCriteria;
const relativeUnrealized = (date, criteria) => {
  const previousDate = getPreviousDate(date);
  if (!previousDate) {
    return false;
  }
  const relativeUnrealizedData =
    chartData[categories.relativeUnrealisedProfitLoss];
  const previousUPL =
    relativeUnrealizedData[
      datasetNames.relativeUnrealisedProfitLoss.relativeUnrealizedProfitLoss
    ][previousDate];
  const currentUPL =
    relativeUnrealizedData[
      datasetNames.relativeUnrealisedProfitLoss.relativeUnrealizedProfitLoss
    ][date];
  if (!previousUPL || !currentUPL) {
    return false;
  }
  switch (criteria) {
    case relativeUnrealizedCriteria.enteringCapitulation:
      const enteringCapitulation = previousUPL > 0 && currentUPL <= 0;
      return enteringCapitulation;
    case relativeUnrealizedCriteria.enteringHopeFearFromBelow:
      const enteringHopeFearFromBelow = previousUPL < 0 && currentUPL >= 0;
      return enteringHopeFearFromBelow;
    case relativeUnrealizedCriteria.enteringHopeFearFromAbove:
      const enteringHopeFearFromAbove = previousUPL > 0.3 && currentUPL <= 0.3;
      return enteringHopeFearFromAbove;
    case relativeUnrealizedCriteria.enteringOptimismDenialFromBelow:
      const enteringOptimismDenialFromBelow =
        previousUPL < 0.3 && currentUPL >= 0.3;
      return enteringOptimismDenialFromBelow;
    case relativeUnrealizedCriteria.enteringOptimismDenialFromAbove:
      const enteringOptimismDenialFromAbove =
        previousUPL > 0.55 && currentUPL <= 0.55;
      return enteringOptimismDenialFromAbove;
    case relativeUnrealizedCriteria.enteringGreed:
      const enteringGreed = previousUPL < 0.55 && currentUPL >= 0.55;
      return enteringGreed;
  }
};

exports.bullishTestCriteriaCombinations = {
  bitcoinInvestor_enteringOversold: [
    {
      testType: testTypes.bitcoinInvestor,
      criteria: bitcoinInvestorCriteria.enteringOversold,
      daysSince: 0,
    },
    null,
  ],
  heatmap200WeekMovingAverage_enteringOversold: [
    {
      testType: testTypes.heatmap200WeekMovingAverage,
      criteria: heatmap200WeekCriteria.enteringOversold,
      daysSince: 0,
    },
    null,
  ],
  mvrvZScore_enteringOversold: [
    {
      testType: testTypes.mvrvZScore,
      criteria: mvrvScoreCriteria.enteringOversold,
      daysSince: 0,
    },
    null,
  ],
  mvrvZScore_enteringExtremeOversold: [
    {
      testType: testTypes.mvrvZScore,
      criteria: mvrvScoreCriteria.enteringExtremeOversold,
      daysSince: 0,
    },
    null,
  ],
  puellMultiple_enteringOversold: [
    {
      testType: testTypes.puellMultiple,
      criteria: puellMultipleCriteria.enteringOversold,
      daysSince: 0,
    },
    null,
  ],
  logarithmic_enteringOversold: [
    {
      testType: testTypes.logarithmic,
      criteria: logarithmicCriteria.enteringOversold,
      daysSince: 0,
    },
    null,
  ],
  relativeUnrealized_enteringCapitulation: [
    {
      testType: testTypes.relativeUnrealized,
      criteria: relativeUnrealizedCriteria.enteringCapitulation,
      daysSince: 0,
    },
    null,
  ],
};

exports.bearishTestCriteriaCombinations = {
  bitcoinInvestor_enteringOverbought: [
    {
      testType: testTypes.bitcoinInvestor,
      criteria: bitcoinInvestorCriteria.enteringOverbought,
      daysSince: 0,
    },
    null,
  ],
  heatmap200WeekMovingAverage_enteringOverbought: [
    {
      testType: testTypes.heatmap200WeekMovingAverage,
      criteria: heatmap200WeekCriteria.enteringOverbought,
      daysSince: 0,
    },
    null,
  ],

  mvrvZScore_enteringOverbought: [
    {
      testType: testTypes.mvrvZScore,
      criteria: mvrvScoreCriteria.enteringOverbought,
      daysSince: 0,
    },
    null,
  ],
  mvrvZScore_enteringExtremeOverbought: [
    {
      testType: testTypes.mvrvZScore,
      criteria: mvrvScoreCriteria.enteringExtremeOverbought,
      daysSince: 0,
    },
    null,
  ],
  goldenRatio_enteringOverbought: [
    {
      testType: testTypes.goldenRatio,
      criteria: goldenRatioCriteria.enteringExtremeOversold,
      daysSince: 0,
    },
    null,
  ],
  goldenRatio_reachingPotentialCycleHighZone: [
    {
      testType: testTypes.goldenRatio,
      criteria: goldenRatioCriteria.reachingPotentialCycleHighZone,
      daysSince: 0,
    },
    null,
  ],
  piCycleTop: [
    {
      testType: testTypes.piCycleTop,
      criteria: null,
      daysSince: 0,
    },
    null,
  ],
  puellMultiple_enteringOverbought: [
    {
      testType: testTypes.puellMultiple,
      criteria: puellMultipleCriteria.enteringOverbought,
      daysSince: 0,
    },
    null,
  ],
  logarithmic_enteringOverbought: [
    {
      testType: testTypes.logarithmic,
      criteria: logarithmicCriteria.enteringOverbought,
      daysSince: 0,
    },
    null,
  ],
  relativeUnrealized_enteringGreed: [
    {
      testType: testTypes.relativeUnrealized,
      criteria: relativeUnrealizedCriteria.enteringGreed,
      daysSince: 0,
    },
    null,
  ],
};

// {
//   testType: testTypes.bitcoinInvestor,
//   criteria: bitcoinInvestorCriteria.exitingOverbought,
// },
// {
//   testType: testTypes.bitcoinInvestor,
//   criteria: bitcoinInvestorCriteria.exitingOversold,
// },
// {
//   testType: testTypes.heatmap200WeekMovingAverage,
//   criteria: heatmap200WeekCriteria.exitingOverbought,
// },
// {
//   testType: testTypes.mvrvZScore,
//   criteria: mvrvScoreCriteria.exitingOverbought,
// },
// {
//   testType: testTypes.mvrvZScore,
//   criteria: mvrvScoreCriteria.exitingExtremeOverbought,
// },
// {
//   testType: testTypes.mvrvZScore,
//   criteria: mvrvScoreCriteria.exitingOversold,
// },
// {
//   testType: testTypes.mvrvZScore,
//   criteria: mvrvScoreCriteria.exitingExtremeOversold,
// },
// {
//   testType: testTypes.puellMultiple,
//   criteria: puellMultipleCriteria.exitingOverbought,
// },
// {
//   testType: testTypes.puellMultiple,
//   criteria: puellMultipleCriteria.exitingOversold,
// },
// {
//   testType: testTypes.logarithmic,
//   criteria: logarithmicCriteria.exitingOverbought,
// },
// {
//   testType: testTypes.logarithmic,
//   criteria: logarithmicCriteria.approachingResistance,
// },
// {
//   testType: testTypes.logarithmic,
//   criteria: logarithmicCriteria.retracingResistance,
// },
// {
//   testType: testTypes.logarithmic,
//   criteria: logarithmicCriteria.exitingOversold,
// },
// {
//   testType: testTypes.relativeUnrealized,
//   criteria:
//     relativeUnrealizedCriteria.enteringHopeFearFromBelow,
// },
// {
//   testType: testTypes.relativeUnrealized,
//   criteria:
//     relativeUnrealizedCriteria.enteringHopeFearFromAbove,
// },
// {
//   testType: testTypes.relativeUnrealized,
//   criteria:
//     relativeUnrealizedCriteria.enteringOptimismDenialFromBelow,
// },
// {
//   testType: testTypes.relativeUnrealized,
//   criteria:
//     relativeUnrealizedCriteria.enteringOptimismDenialFromAbove,
// },
