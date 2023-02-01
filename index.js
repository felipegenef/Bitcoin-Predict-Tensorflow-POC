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
  tfvis.show.modelSummary({ name: "Model Summary" }, model);
  // pega layer por nome ou index.
  const layer = model.getLayer(undefined, 0);
  tfvis.show.layer({ name: "Layer" }, layer);
  // Compila
  model.compile({
    optimizer: tf.train.adam(0.1),
    loss: tf.losses.meanSquaredError,
    metrics: ["accuracy"],
  });
  // Treina o modelo
  console.time("Treinando");
  console.timeLog("Treinando");

  const { onBatchEnd, onEpochEnd } = tfvis.show.fitCallbacks(
    { name: "Training Performance" },
    ["loss"]
  );

  const result = await model.fit(trainingInputData, trainingOutputData, {
    epochs: 1000,
    validationSplit: 0.2, //20% para validação
    callbacks: {
      // batchSize: 5,
      onBatchEnd,
      onEpochEnd,
    },
  });
  const lastTrainingLoss = result.history.loss.pop();
  const lastTrainingValLoss = result.history.val_loss.pop();
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
