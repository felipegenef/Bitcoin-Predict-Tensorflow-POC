import axios from "axios";
import fs from "fs/promises";

import moment from "moment";
import Mayer from "./metricas.js";
// async function GrabData() {
//   const fearData = await axios.get("https://api.alternative.me/fng/?limit=0");
//   const priceData = await axios.get(
//     "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=8000"
//   );

//   await fs.writeFile(
//     "./fearAndGreed.json",
//     JSON.stringify(
//       fearData.data.data.map((item) => {
//         return {
//           ...item,
//           date: moment(new Date(parseInt(item.timestamp) * 1000)).format(
//             "YYYY-MM-DD"
//           ),
//         };
//       })
//     )
//   );
//   await fs.writeFile(
//     "./price.json",
//     JSON.stringify(
//       priceData.data.prices.map((item) => {
//         const timestamp = item[0];
//         const priceUSD = item[1];
//         return {
//           timestamp,
//           priceUSD,
//           date: moment(new Date(timestamp)).format("YYYY-MM-DD"),
//         };
//       })
//     )
//   );
// }
async function main() {
  //   await GrabData();
  //   Get the limiting array (the one with less days of data)
  const FG = JSON.parse(await fs.readFile("./fearAndGreed.json"));
  const PRICES = JSON.parse(await fs.readFile("./price.json"));

  const daysWithData = new Set();
  for (const { date } of FG) {
    daysWithData.add(date);
  }
  const fgFiltredData = FG.filter((item) => daysWithData.has(item.date));
  const pricesFiltredData = PRICES.filter((item) =>
    daysWithData.has(item.date)
  );
  await fs.writeFile(
    "FearAndGreedDataset.json",
    JSON.stringify(sortByDate(fgFiltredData))
  );
  await fs.writeFile(
    "PriceDataset.json",
    JSON.stringify(sortByDate(pricesFiltredData))
  );
}
main();
function sortByDate(array) {
  return array.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
}
