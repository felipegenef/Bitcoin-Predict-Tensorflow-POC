export default class Mayer {
  #prices = [];
  /**
   *
   * @param {{prices:number}} Prices - Prices to be added to the Mayer Algorithm
   */
  constructor({ prices }) {
    this.#prices = prices;
  }
  /**
   *
   * @param {{currentPrice}} currentPrice - Current Bitcoin Price
   * @returns {{ value: number, analysis: "expensive" | "normal" | "cheap",legend: { expensive: 3, normal: 2, cheap: 1 }}}
   */
  calculateMayerMultiple({ currentPrice }) {
    const TwoHundredDaysMovingAverage =
      Mayer.calculateTwoHundredDaysMovingAverage(this.#prices);
    return Mayer.mayerMultiple(currentPrice, TwoHundredDaysMovingAverage);
  }
  /**
   *
   * @param {number } Prices - Prices to be added to the Moving Average Algorithm
   * @param {number} WindowSize - Window size of items that will be used in the Moving Average Algorithm
   * @returns {Array<number>}
   */
  static movingAverage(prices, windowSize) {
    const movingAverages = [];
    for (let i = 0; i < prices.length - windowSize + 1; i++) {
      let sum = 0;
      for (let j = i; j < i + windowSize; j++) {
        sum += prices[j];
      }
      movingAverages.push(sum / windowSize);
    }
    return movingAverages;
  }
  /**
   *
   * @param {number} Price - Prices to be added to the Mayer Algorithm
   * @param {number} twoHundredDaysMovingAverage - Moving average of the last 200 days
   * @returns {{ value: number, analysis: "expensive" | "normal" | "cheap",legend: { expensive: 3, normal: 2, cheap: 1 }}}
   */
  static mayerMultiple(price, twoHundredDaysMovingAverage) {
    let analysis = "expensive";
    let analysisNumber = 3;
    const mayerMultiple = price / twoHundredDaysMovingAverage;
    if (mayerMultiple < 2 && mayerMultiple > 1) {
      analysis = "normal";
      analysisNumber = 2;
    }
    if (mayerMultiple <= 1) {
      analysis = "cheap";
      analysisNumber = 1;
    }
    return {
      value: mayerMultiple,
      analysis,
      analysisNumber,
      legend: { expensive: 3, normal: 2, cheap: 1 },
    };
  }
  /**
   *
   * @param {number} prices - Prices used to calculate the moving average of the last 200 days
   * @returns {number}
   */
  static calculateTwoHundredDaysMovingAverage(prices) {
    return Mayer.movingAverage(prices, 200).pop();
  }
}

// /**
//  * @type {Mayer}
//  */
// module.exports = Mayer;
