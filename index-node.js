import tf, { Tensor } from "@tensorflow/tfjs";
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
  tf.util.shuffle(trainingData);

  const inputTensor = tf.tensor2d(
    trainingData.map((data) => [data.ma, data.fg]),
    [trainingData.length, 2] // Numero de itens , numero de variaveis (2 x)
  );
  const outputTensor = tf.tensor2d(
    trainingData.map((data) => [data.price]),
    [trainingData.length, 1] // Numero de itens , numero de variaveis (1 y)
  );
  // Normalise with min max normaliser
  const normalizedInput = await normalise(inputTensor);
  const normalizedOutput = await normalise(outputTensor);
  // 70 / 30 separation
  const separation_70_30 = [
    Math.round(normalizedOutput.normalizedTensor.shape[0] * 0.7),
    trainingData.length -
      Math.round(normalizedOutput.normalizedTensor.shape[0] * 0.7),
  ];

  const [trainingInputData, testingInputData] = tf.split(
    normalizedInput.normalizedTensor,
    separation_70_30
  );
  const [trainingOutputData, testingOutputData] = tf.split(
    normalizedOutput.normalizedTensor,
    separation_70_30
  );
  // Define o modelo
  const model = tf.sequential();
  // units = quantidade de neuronios
  model.add(tf.layers.dense({ units: 1, inputShape: [2] }));
  model.summary();

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: tf.losses.meanSquaredError,
    metrics: ["accuracy"],
  });

  // Treina o modelo
  console.time("Treinando");
  console.timeLog("Treinando");
  const training = await model.fit(trainingInputData, trainingOutputData, {
    epochs: 1000,
    validationSplit: 0.2, //20% para validação
    callbacks: {
      // Opcional
      onEpochEnd: (epoch, { loss, acc }) =>
        console.log(`Epoch: ${epoch}, Loss: ${loss}, ACC: ${acc}`),
    },
  });
  const lastTrainingLoss = training.history.loss.pop();
  const lastTrainingValLoss = training.history.val_loss.pop();
  const [lossTensor] = await model.evaluate(
    testingInputData,
    testingOutputData
  );
  const loss = await lossTensor.dataSync();
  console.log("Treinamento finalizado!");
  console.timeEnd("Treinando");

  console.log(
    `Training Loss: ${lastTrainingLoss}, ValLoss: ${lastTrainingValLoss} Testing Loss: ${loss}\nModelo ${
      lastTrainingLoss > loss ? "Bom" : "Ruim"
    }`
  );

  // const testTensor = tf.tensor2d(testData.map((data) => [data.ma, data.fg]));
  // const result = await model.predict(testTensor).array();
  // console.log(
  //   `Preço previsto do Bitcoin: ${parseFloat(result[0][0].toFixed(2))}`
  // );
}
/**
 *
 * @param {Tensor} tensor
 */
async function normalise(tensor) {
  const min = tensor.min();
  const max = tensor.max();
  const normalizedTensor = tensor.sub(min).div(max.sub(min));
  return { normalizedTensor, min, max };
}
/**
 *
 * @param {Tensor} tensor
 * @param {Tensor} min
 * @param {Tensor} max
 */
async function denormalize(tensor, min, max) {
  const denormalizedTensor = tensor.mul(max.sub(min)).add(min);
  return denormalizedTensor;
}
main();
