const _ = require("lodash"),
  axios = require("axios"),
  moment = require("moment"),
  JSZip = require("jszip"),
  fs = require("fs");

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

const downloadChartData = async () => {
  const chartData = {};
  for (const ctName of Object.keys(chartDataFetchInfo)) {
    const ctObj = chartDataFetchInfo[ctName];
    const rawResponseData = (
      await axios.get(
        `https://www.lookintobitcoin.com/django_plotly_dash/app/${ctObj.urlKey}/_dash-layout`
      )
    ).data.props.children[0].props.figure.data;
    chartData[ctName] = {};
    for (const rrd of rawResponseData) {
      if (ctObj.dataToKeep.includes(rrd.name)) {
        const dataCollection = {};
        chartData[ctName][rrd.name] = dataCollection;
        let dateStrings = rrd.x;
        let yValues = rrd.y;
        if (dateStrings.length > yValues.length) {
          dateStrings = dateStrings.slice(0, yValues.length);
        }
        for (let i = 0; i < dateStrings.length; i++) {
          const mDate = moment(dateStrings[i].slice(0, 10), "YYYY-MM-DD");
          dataCollection[mDate.format("YYYY-MM-DD")] = yValues[i];
        }
      }
    }
  }
  const zip = new JSZip();
  zip.file("chartData.json", JSON.stringify(chartData));
  zip
    .generateNodeStream({
      type: "nodebuffer",
      streamFiles: true,
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    })
    .pipe(fs.createWriteStream("chartData.zip"))
    .on("finish", function () {
      //console.log("chartData.zip written.");
    });
};

const extractChartDataFromZip = async () => {
  return new Promise((resolve, reject) => {
    fs.readFile("chartData.zip", async (err, data) => {
      if (err) reject(err);
      const zipData = await JSZip.loadAsync(data);
      const chartData = JSON.parse(
        await zipData.file("chartData.json").async("string")
      );
      resolve(chartData);
    });
  });
};

(async () => {
  await downloadChartData();
  //const chartData = await extractChartDataFromZip();
  debugger;
})();
