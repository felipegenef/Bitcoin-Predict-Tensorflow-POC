import Mayer from "./metricas.js";

import fearGreed from "./fearAndGreedDataset.js";
import price from "./priceDataset.js";

async function main() {
  const mayerIndex = price.map((item, index, prices) => {
    if (index < 200) return 1;
    const pricesUntilDate = prices.slice(0, index);
    const mayermultiple = new Mayer({
      prices: pricesUntilDate.map((item) => item.priceUSD),
    }).calculateMayerMultiple({ currentPrice: item.priceUSD });
    return mayermultiple.value;
  });
  const trainingData = [];
  // from mayer start
  for (let index = 201; index < mayerIndex.length; index++) {
    const ma = mayerIndex[index];
    const fg = fearGreed[index];
    const priceValue = price[index];

    trainingData.push({
      ma: ma,
      fg: parseInt(fg.value),
      price: priceValue.priceUSD,
    });
  }
  const TfDataset = tf.data.array(trainingData);

  const points = await TfDataset.map((item) => ({
    x: item.fg,
    y: item.price,
  })).toArray();

  tfvis.render.scatterplot(
    { name: "Teste" },
    { values: [points], series: ["original"] },
    { xLabel: "Medo e Ganancia", yLabel: "Preço" }
  );
}
main();
