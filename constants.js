const urlKeys = {
  relativeUnrealisedProfitLoss: "unrealised_profit_loss",
  marketCycleMA: "market_cycle_ma",
  twoHundredWeekMAHeatmap: "200wma_heatmap",
  mvrvZScore: "mvrv_zscore",
  goldenRatio: "golden_ratio",
  piCycleTopIndicator: "pi_cycle_top_indicator",
  puellMultiple: "puell_multiple",
  logLogRegression: "log_log_regression",
};
exports.urlKeys = urlKeys;

const datasetNames = {
  relativeUnrealisedProfitLoss: {
    btcPrice: "BTC Price",
    relativeUnrealizedProfitLoss: "Relative Unrealised Profit/Loss",
  },
  bitcoinInvestorTool: {
    btcPrice: "BTC Price",
    twoYearMovingAverage: "2 Year Moving Average",
    twoYearMovingAverage_x5: "2 Year Moving Average x 5",
  },
  heatmap200WeekMovingAverage: {
    btcPrice: "BTC Price",
    percentMonthlyIncreaseOf200WeekMA:
      "% Monthly Increase Of 200 Week Moving Average",
    twoHundredWeekMA: "200 Week Moving Average",
  },
  mvrvZscore: {
    zScore: "Z-Score",
  },
  goldenRatioMultiplier: {
    btcPrice: "BTC Price",
    price350DMA: "Price 350DMA",
  },
  piCycleTop: {
    btcPrice: "BTC Price",
    price111DMA: "Price 111DMA",
    price350DMA_x2: "Price 350DMA x 2",
  },
  puellMultiple: {
    btcPrice: "BTC Price",
    puellMultiple: "Puell Multiple",
  },
  logarithmicGrowthCurve: {
    btcPrice: "BTC Price",
    highDev: "HighDev",
    fib9098Dev: "Fib9098Dev",
    fib8541Dev: "Fib8541Dev",
    fib7639Dev: "Fib7639Dev",
    fib618Dev: "Fib618Dev",
    midDev: "MidDev",
    fib382Dev: "Fib382Dev",
    fib2361Dev: "Fib2361Dev",
    fib1459Dev: "Fib1459Dev",
    fib0902Dev: "Fib0902Dev",
    lowDev: "LowDev",
    oscillator: "Oscillator",
  },
};
exports.datasetNames = datasetNames;

const chartDataFetchInfo = {
  relativeUnrealisedProfitLoss: {
    urlKey: urlKeys.relativeUnrealisedProfitLoss,
    dataToKeep: [
      datasetNames.relativeUnrealisedProfitLoss.btcPrice,
      datasetNames.relativeUnrealisedProfitLoss.relativeUnrealizedProfitLoss,
    ],
  },

  bitcoinInvestorTool: {
    urlKey: urlKeys.marketCycleMA,
    dataToKeep: [
      datasetNames.bitcoinInvestorTool.btcPrice,
      datasetNames.bitcoinInvestorTool.twoYearMovingAverage_x5,
      datasetNames.bitcoinInvestorTool.twoYearMovingAverage,
    ],
  },
  heatmap200WeekMovingAverage: {
    urlKey: urlKeys.twoHundredWeekMAHeatmap,
    dataToKeep: [
      datasetNames.heatmap200WeekMovingAverage.btcPrice,
      datasetNames.heatmap200WeekMovingAverage
        .percentMonthlyIncreaseOf200WeekMA,
      datasetNames.heatmap200WeekMovingAverage.twoHundredWeekMA,
    ],
  },
  mvrvZscore: {
    urlKey: urlKeys.mvrvZScore,
    dataToKeep: [datasetNames.mvrvZscore.zScore],
  },
  goldenRatioMultiplier: {
    urlKey: urlKeys.goldenRatio,
    dataToKeep: [
      datasetNames.goldenRatioMultiplier.btcPrice,
      datasetNames.goldenRatioMultiplier.price350DMA,
    ],
  },
  piCycleTop: {
    urlKey: urlKeys.piCycleTopIndicator,
    dataToKeep: [
      datasetNames.piCycleTop.btcPrice,
      datasetNames.piCycleTop.price111DMA,
      datasetNames.piCycleTop.price350DMA_x2,
    ],
  },
  puellMultiple: {
    urlKey: urlKeys.puellMultiple,
    dataToKeep: [
      datasetNames.puellMultiple.btcPrice,
      datasetNames.puellMultiple.puellMultiple,
    ],
  },
  logarithmicGrowthCurve: {
    urlKey: urlKeys.logLogRegression,
    dataToKeep: [
      datasetNames.logarithmicGrowthCurve.btcPrice,
      datasetNames.logarithmicGrowthCurve.highDev,
      datasetNames.logarithmicGrowthCurve.fib9098Dev,
      datasetNames.logarithmicGrowthCurve.fib8541Dev,
      datasetNames.logarithmicGrowthCurve.fib7639Dev,
      datasetNames.logarithmicGrowthCurve.fib618Dev,
      datasetNames.logarithmicGrowthCurve.midDev,
      datasetNames.logarithmicGrowthCurve.fib382Dev,
      datasetNames.logarithmicGrowthCurve.fib2361Dev,
      datasetNames.logarithmicGrowthCurve.fib1459Dev,
      datasetNames.logarithmicGrowthCurve.fib0902Dev,
      datasetNames.logarithmicGrowthCurve.lowDev,
      datasetNames.logarithmicGrowthCurve.oscillator,
    ],
  },
};
exports.chartDataFetchInfo = chartDataFetchInfo;
