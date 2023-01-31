import tf from "@tensorflow/tfjs";
import fs from "fs/promises";
import Mayer from "./metricas.js";
// Dados fictícios para treinamento
// ma= multiplo mayer
// fg = fear and greed index
// price = preço do bitcoin

// Prepara os dados para treinamento
async function main() {
  const fearGreed = JSON.parse(await fs.readFile("FearAndGreedDataset.json"));
  const price = JSON.parse(await fs.readFile("PriceDataset.json"));
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

  const inputTensor = tf.tensor2d(
    trainingData.map((data) => [data.ma, data.fg])
  );
  const outputTensor = tf.tensor2d(trainingData.map((data) => [data.price]));

  // Define o modelo
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [2] }));
  model.compile({
    optimizer: tf.train.adam(1),
    loss: tf.losses.meanSquaredError,
  });

  // Treina o modelo
  console.time("Treinando");
  console.timeLog("Treinando");
  await model.fit(inputTensor, outputTensor, { epochs: 1000 });
  console.log("Treinamento finalizado!");
  console.timeEnd("Treinando");
  // Testa o modelo
  const testData = [{ ma: 1.16, fg: 51 }];
  const testTensor = tf.tensor2d(testData.map((data) => [data.ma, data.fg]));
  const result = await model.predict(testTensor).array();
  console.log(
    `Preço previsto do Bitcoin: ${parseFloat(result[0][0].toFixed(2))}`
  );
}
main();
