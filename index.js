const _ = require("lodash"),
  axios = require("axios"),
  JSZip = require("jszip"),
  fs = require("fs");

const chartDataFetchInfo = {
  relativeUnrealisedProfitLoss: {
    urlKey: "unrealised_profit_loss",
    dataToKeep: ["BTC Price", "Relative Unrealised Profit/Loss"],
  },

  bitcoinInvestorTool: {
    urlKey: "market_cycle_ma",
    dataToKeep: [
      "BTC Price",
      "2 Year Moving Average x 5",
      "2 Year Moving Average",
    ],
  },
  heatmap200WeekMovingAverage: {
    urlKey: "200wma_heatmap",
    dataToKeep: [
      "BTC Price",
      "% Monthly Increase Of 200 Week Moving Average",
      "200 Week Moving Average",
    ],
  },
  mvrvZscore: { urlKey: "mvrv_zscore", dataToKeep: ["Z-Score"] },
  goldenRatioMultiplier: {
    urlKey: "golden_ratio",
    dataToKeep: ["BTC Price", "Price 350DMA"],
  },
  piCycleTop: {
    urlKey: "pi_cycle_top_indicator",
    dataToKeep: ["BTC Price", "Price 111DMA", "Price 350DMA x 2"],
  },
  puellMultiple: {
    urlKey: "puell_multiple",
    dataToKeep: ["BTC Price", "Puell Multiple"],
  },
  logarithmicGrowthCurve: {
    urlKey: "log_log_regression",
    dataToKeep: [
      "BTC Price",
      "HighDev",
      "Fib9098Dev",
      "Fib8541Dev",
      "Fib7639Dev",
      "Fib618Dev",
      "MidDev",
      "Fib382Dev",
      "Fib2361Dev",
      "Fib1459Dev",
      "Fib0902Dev",
      "LowDev",
      "Oscillator",
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
        chartData[ctName][rrd.name] = {};
        chartData[ctName][rrd.name].x = rrd.x;
        chartData[ctName][rrd.name].y = rrd.y;
        if (
          chartData[ctName][rrd.name].x.length >
          chartData[ctName][rrd.name].y.length
        ) {
          chartData[ctName][rrd.name].x = chartData[ctName][rrd.name].x.slice(
            0,
            chartData[ctName][rrd.name].y.length
          );
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
  //await downloadChartData();
  const chartData = await extractChartDataFromZip();
  debugger;
})();
