const _ = require("lodash"),
  axios = require("axios"),
  moment = require("moment"),
  JSZip = require("jszip"),
  fs = require("fs"),
  { chartDataFetchInfo } = require("./constants");

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
  //await downloadChartData();
  const chartData = await extractChartDataFromZip();
  debugger;
})();
