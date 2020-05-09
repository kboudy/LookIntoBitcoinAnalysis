const _ = require("lodash"),
  { getChartData } = require("./dataUtils"),
  { categories, datasetNames } = require("./constants");

let chartData = null;
let dates = null;
let heatmap_percentChange28DaysAgo = {};

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

const mvrvCriteria = {
  enteringOverbought: "enteringOverbought",
  exitingOverbought: "exitingOverbought",
  enteringExtremeOverbought: "enteringExtremeOverbought",
  exitingExtremeOverbought: "exitingExtremeOverbought",
  enteringOversold: "enteringOversold",
  exitingOversold: "exitingOversold",
  enteringExtremeOversold: "enteringExtremeOversold",
  exitingExtremeOversold: "exitingExtremeOversold",
};
exports.mvrvCriteria = mvrvCriteria;
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
    case mvrvCriteria.enteringOverbought:
      return previousZScore < 7.5 && currentZScore >= 7.5;
    case mvrvCriteria.exitingOverbought:
      return previousZScore > 7.5 && currentZScore <= 7.5;
    case mvrvCriteria.enteringExtremeOverbought:
      return previousZScore < 9 && currentZScore >= 9;
    case mvrvCriteria.exitingExtremeOverbought:
      return previousZScore > 9 && currentZScore <= 9;
    case mvrvCriteria.enteringOversold:
      return previousZScore > 0.1 && currentZScore <= 0.1;
    case mvrvCriteria.exitingOversold:
      return previousZScore < 0.1 && currentZScore >= 0.1;
    case mvrvCriteria.enteringExtremeOversold:
      return previousZScore > -0.4 && currentZScore <= -0.4;
    case mvrvCriteria.exitingExtremeOversold:
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

const puellCriteria = {
  enteringOverbought: "enteringOverbought",
  exitingOverbought: "exitingOverbought",
  enteringOversold: "enteringOversold",
  exitingOversold: "exitingOversold",
};
exports.puellCriteria = puellCriteria;
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
    case mvrvCriteria.enteringOverbought:
      const enteringOverbought = previousPuell < 4 && currentPuell >= 4;
      return enteringOverbought;
    case mvrvCriteria.exitingOverbought:
      const exitingOverbought = previousPuell > 4 && currentPuell <= 4;
      return exitingOverbought;
    case mvrvCriteria.enteringOversold:
      const enteringOversold = previousPuell > 0.5 && currentPuell <= 0.5;
      return enteringOversold;
    case mvrvCriteria.exitingOversold:
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
