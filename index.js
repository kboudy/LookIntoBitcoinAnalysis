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

const MAX_SIMULTANEOUS_TRADES = 2000;

//returns the test results, per day, for every test/criteria combo
// in the format of the "days since test passed", for flexibility
const getDaysSinceTestResults = async () => {
  //  all indicator tests run on each day, and a "# of days since test passed" tally is kept
  const daysSince_testResults = {};

  const dates = getDates().btcPrice;
  let previousDate = null;
  for (const d of dates) {
    daysSince_testResults[d] = {};
    for (const tccKey in {
      ...bullishTestCriteriaCombinations,
      ...bearishTestCriteriaCombinations,
    }) {
      const thisTCC = bullishTestCriteriaCombinations[tccKey]
        ? bullishTestCriteriaCombinations[tccKey][0] // [0] element has the criteria, [1] is null
        : bearishTestCriteriaCombinations[tccKey][0];
      const positiveResult = await runIndicatorTest(
        d,
        thisTCC.testType,
        thisTCC.criteria
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

const getLegendCode = (indicatorLegend, indicatorKey, isBuy) => {
  if (indicatorLegend[indicatorKey]) {
    return indicatorLegend[indicatorKey];
  }
  let legendPrefix = isBuy ? "B" : "S";
  let maxLegend = null;
  for (const v of Object.values(indicatorLegend)) {
    if (!v.startsWith(legendPrefix)) {
      continue;
    }
    if (!maxLegend || v > maxLegend) {
      maxLegend = v;
    }
  }
  let nextIdx = 0;
  if (maxLegend) {
    nextIdx = parseInt(maxLegend.slice(1)) + 1;
  }
  const result = `${legendPrefix}${nextIdx}`;
  indicatorLegend[indicatorKey] = result;
  return result;
};

(async () => {
  //await downloadChartData();
  await initialize();
  const daysSince_testResults = await getDaysSinceTestResults();
  const bullishCombinations = cartesian.getAllPossibleCombinations(
    bullishTestCriteriaCombinations,
    100
  );
  const bearishCombinations = cartesian.getAllPossibleCombinations(
    bearishTestCriteriaCombinations,
    100
  );
  // we now have:
  //  - all indicator test results, in the "days since test passed" format
  //  - every bullish test combo (for buy triggers)
  //  - every bearish test combo (for sell triggers)
  // so we'll run every bullish+bearish combo possibility and store the results
  const chartData = await getChartData();
  const btcPriceData =
    chartData[categories.bitcoinInvestorTool][
      datasetNames.bitcoinInvestorTool.btcPrice
    ];
  const dates = Object.keys(btcPriceData)
    .filter((d) => d > "2010-01-01")
    .sort();

  const results = [];

  const indicatorLegend = {};

  for (const bullishCombination of bullishCombinations) {
    if (Object.keys(bullishCombination).length < 7) {
      // note - the "7" above - currently only running the set with max indicators
      continue;
    }
    for (const bearishCombination of bearishCombinations) {
      if (Object.keys(bearishCombination).length < 10) {
        // note - the "10" above - currently only running the set with max indicators
        continue;
      }
      let activeTrades = [];
      const completedTrades = [];

      for (const dt of dates) {
        const todayResults = daysSince_testResults[dt];
        if (activeTrades.length <= MAX_SIMULTANEOUS_TRADES) {
          for (const k of Object.keys(bullishCombination)) {
            const { daysSince } = bullishCombination[k];
            if (todayResults[k] <= daysSince) {
              activeTrades.push({
                buyDate: dt,
                buyPrice: btcPriceData[dt],
                buyReason: k,
              });
              break;
            }
          }
        }

        for (const trade of [...activeTrades]) {
          if (trade.date === dt) {
            // never sell on same day
            continue;
          }
          for (const k of Object.keys(bearishCombination)) {
            const { daysSince } = bearishCombination[k];
            if (todayResults[k] <= daysSince) {
              trade.sellDate = dt;
              trade.sellPrice = btcPriceData[dt];
              trade.dayCount = moment(trade.sellDate, "YYYY-MM-DD").diff(
                moment(trade.buyDate, "YYYY-MM-DD"),
                "days"
              );
              trade.sellReason = k;
              trade.profitLossPercent = parseFloat(
                (
                  ((trade.sellPrice - trade.buyPrice) / trade.buyPrice) *
                  100
                ).toFixed(1)
              );
              completedTrades.push(trade);
              activeTrades = activeTrades.filter((t) => t !== trade);
              break;
            }
          }
        }
      }
      // we're done with this bullish/bearish buy/sell combo.  aggregate the trade result stats
      if (completedTrades.length === 0) {
        continue;
      }
      let completedTradeCSVOutput =
        "buy date,sell date,day count,buy price,sell price,profit/loss %,buy indicator,buy criteria,sell indicator,sell criteria\n";
      for (const ct of completedTrades) {
        completedTradeCSVOutput += `${ct.buyDate},${ct.sellDate},${
          ct.dayCount
        },${ct.buyPrice.toFixed(2)},${ct.sellPrice.toFixed(2)},${
          ct.profitLossPercent
        },${ct.buyReason.split("_")[0]},${ct.buyReason.split("_")[1]},${
          ct.sellReason.split("_")[0]
        },${ct.sellReason.split("_")[1]}\n`;
      }
      fs.writeFileSync("completedTrades.csv", completedTradeCSVOutput, "utf8");

      let activeTradeCSVOutput =
        "buy date,buy price,buy indicator,buy criteria\n";
      for (const aTrade of activeTrades) {
        activeTradeCSVOutput += `${aTrade.buyDate},${aTrade.buyPrice.toFixed(
          2
        )},${aTrade.buyReason.split("_")[0]},${
          aTrade.buyReason.split("_")[1]
        }\n`;
      }
      fs.writeFileSync("activeTrades.csv", activeTradeCSVOutput, "utf8");

      const result = {};
      for (const k of Object.keys(bullishCombination)) {
        result[getLegendCode(indicatorLegend, k, true)] = true;
      }
      for (const k of Object.keys(bearishCombination)) {
        result[getLegendCode(indicatorLegend, k, false)] = true;
      }
      result.tradeCount = completedTrades.length;
      result.avgProfit =
        Math.round(_.meanBy(completedTrades, (t) => t.profitLossPercent) * 10) /
        10;
      result.maxProfit = _.maxBy(
        completedTrades,
        (t) => t.profitLossPercent
      ).profitLossPercent;
      result.minProfit = _.minBy(
        completedTrades,
        (t) => t.profitLossPercent
      ).profitLossPercent;
      result.avgDaysHeld = Math.round(
        _.meanBy(completedTrades, (t) => t.dayCount)
      );
      result.minTradeDate = _.minBy(completedTrades, (t) => t.buyDate).buyDate;
      result.maxTradeDate = _.maxBy(completedTrades, (t) => t.buyDate).buyDate;
      result.maxDaysHeld = _.maxBy(completedTrades, (t) => t.dayCount).dayCount;
      result.minDaysHeld = _.minBy(completedTrades, (t) => t.dayCount).dayCount;
      result.percentProfitable =
        Math.round(
          (completedTrades.filter((t) => t.profitLossPercent > 0).length *
            1000) /
            completedTrades.length
        ) / 10;
      results.push(result);
    }
  }

  fs.writeFileSync(
    "tradeResults.json",
    JSON.stringify({ results, indicatorLegend }),
    "utf8"
  );
})();
