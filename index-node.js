import tf from "@tensorflow/tfjs-node";
// import tf from "@tensorflow/tfjs";
// import tf from "@tensorflow/tfjs-node";
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
  const TfDataset = tf.data.array(trainingData);
  const points = TfDataset.map((item) => ({ x: item.fg, y: item.price }));

  const inputTensor = tf.tensor2d(
    trainingData.map((data) => [data.ma, data.fg]),
    [trainingData.length, 2] // Numero de itens , numero de variaveis (2 x)
  );
  const outputTensor = tf.tensor2d(
    trainingData.map((data) => [data.price]),
    [trainingData.length, 1] // Numero de itens , numero de variaveis (1 y)
  );

  // Define o modelo
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [2] }));
  model.compile({
    optimizer: tf.train.adam(20),
    loss: tf.losses.meanSquaredError,
    metrics: ["accuracy"],
  });

  // Treina o modelo
  console.time("Treinando");
  console.timeLog("Treinando");
  await model.fit(inputTensor, outputTensor, { epochs: 1000 });
  console.log("Treinamento finalizado!");
  console.timeEnd("Treinando");
  // Testa o modelo
  const testData = [{ ma: 1.18, fg: 51 }];
  const testTensor = tf.tensor2d(testData.map((data) => [data.ma, data.fg]));
  const result = await model.predict(testTensor).array();
  console.log(
    `Preço previsto do Bitcoin: ${parseFloat(result[0][0].toFixed(2))}`
  );
}
main();
