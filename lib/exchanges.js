/**
EXCHANGES LIBRARY
*/

/**
GET REQUIRED LIBRARIES
*/
const cloneDeep = require('clone-deep');
const ccxt = require ('ccxt');
const axios = require ('axios')

/**
INIT ALL EXCHANGES
*/
let binance = new ccxt.binance ()
let bittrex = new ccxt.bittrex()
let hitbtc = new ccxt.hitbtc()
//let lbank = new ccxt.lbank()
let bitz = new ccxt.bitz()
let okex = new ccxt.okex()
let cobinhood = new ccxt.cobinhood()
let bigone = new ccxt.bigone()
let poloniex = new ccxt.poloniex()
let gateio = new ccxt.gateio()
let coinex	= new ccxt.coinex()
let cryptopia = new ccxt.cryptopia()

/**
GetDataFromLibrary: This function accept a pair of coins and the amount the user is willing to invest and it returns the best strategy among all the exchanges
@param coin: pairs of coin, example: ETH/USDT
@param amount: User investment
*/

let getDataFromLibrary = async function (coin, amount) {


   var exIds = ['bittrex', 'binance','hitbtc','lbank','bitz','okex','cobinhood','bigone','poloniex','gateio','coinex','cryptopia']
 
   var ex = await Promise.all(
   							  [bittrex.fetchOrderBook(coin),
   							  binance.fetchOrderBook(coin), 
   							  hitbtc.fetchOrderBook(coin),
   							//  lbank.fetchOrderBook(coin),
   							  bitz.fetchOrderBook(coin),
   							  okex.fetchOrderBook(coin),
   							  cobinhood.fetchOrderBook(coin),
   							  bigone.fetchOrderBook(coin),
   							  poloniex.fetchOrderBook(coin),
   							  gateio.fetchOrderBook(coin),
   							  coinex.fetchOrderBook(coin),
   							  cryptopia.fetchOrderBook(coin)]
   							 )

  	var obj = {}
	var exchanges = []

	for (var i=0; i<ex.length; i++){

		for (var j=0; j<exIds.length; j++) {

			if (i===j){

				obj.id = exIds[j];
				obj.orderBook = ex[i]
				var objClone = cloneDeep(obj) 
				exchanges.push(objClone)

			}

		}

	}


	let exchangesWithFees = await addFees(exchanges) 
	let strategies = await getWinners(exchangesWithFees, amount);

	return strategies


}

/**
getWinners: This function spilts the good combinations from the bad combinations of exchanges
@param exchangesWithFees: Array of objects containing all the info for all the available exchanges
@param amount: User investment
*/

let getWinners = async function(exchangesWithFees, amount) {

	let winners = [];
	let profit = false

	for (var i=0; i<exchangesWithFees.length; i++){

		for (var j=0; j<exchangesWithFees.length; j++){

			if (i!=j){

				let fees = {

					buy: exchangesWithFees[i].buyFee,
					sell: exchangesWithFees[j].sellFee,
					ethWithdrawalFee: exchangesWithFees[i].ethWithdrawalFee,
					usdtWithdrawalFee: exchangesWithFees[j].usdtWithdrawalFee
				}

				let buyStrategy = await getBuyStrategy (amount, exchangesWithFees[i].orderBook.asks, fees)
				let sellStrategy = await getSellStrategy(buyStrategy, exchangesWithFees[j].orderBook.bids, fees)
				
				if (sellStrategy.totalQuantity >= buyStrategy.initialInvestment) {

					profit = true
					let margin = parseFloat(((sellStrategy.totalQuantity - buyStrategy.initialInvestment)/buyStrategy.initialInvestment)*100).toFixed(4)

					let cycle = {

						buyExchange: exchangesWithFees[i].id,
						sellExchange: exchangesWithFees[j].id,
						profit: profit,
						margin:parseFloat(margin),
						marginUnit: '%',
						strategy: {
							buyStrategy:buyStrategy,
							sellStrategy:sellStrategy
						}
					}

				winners.push(cycle)

				}

			}

		}

	}	

	return winners

}

/**
addFees: This function accepts the exchanges from the ccxt library and returns the same data but with all the related fees attached to it
@param exchanges: Array of objects containing all the info for all the available exchanges
*/


let addFees = async function(exchanges) {

	var url = 'https://cryptomatic.bubbleapps.io/api/1.1/obj/exchange'

	let data = await axios.get(url)
	  .then(function (fessData) {
	    var data = fessData.data.response.results;
	   
	    for (var i=0; i<exchanges.length; i++){

	    	for (var j=0; j<data.length; j++){

	    		if (exchanges[i].id === data[j].name){

	    			exchanges[i].buyFee = data[j].fee_buy_percentage;
	    			exchanges[i].sellFee = data[j].fee_sell_percentage;
	    			exchanges[i].ethWithdrawalFee = data[j].fee_transfer_withdrawal_eth;
	    			exchanges[i].usdtWithdrawalFee = data[j].fee_transfer_withdrawal_usdt;

	    		}
	    	}

	    	if (i === exchanges.length -1){

	    		return exchanges

	    	}

	    }

	    
	  })
	  .catch(function (error) {
	    return error;
	  });
 
	  return data

}


/**
getBuyStrategy: This function simulate the placement of a certain amount of money to buy crypto on a specific exchange
@param investment: Amount of money the user is willing to invest
@param asks: orderbook's ask side for a specific exchange
*/

async function getBuyStrategy (investment, asks, fees) {

	var remainingInvestment = investment;
	var orderBookDepth = []
	var suggestedPrice = 0
	var buyPotential = 0
	var totalQuantityTobuy = 0

	for (var i=0; i<asks.length; i++){

		var price = parseFloat(asks[i][0])
		var volume = parseFloat(asks[i][1]) 

		buyPotential = (price*volume)*(1-fees.buy/100)

		if ( remainingInvestment >= buyPotential ) {

			remainingInvestment = remainingInvestment - buyPotential

			orderBookDepth.push(asks[i])
			totalQuantityTobuy = totalQuantityTobuy + volume*(1-fees.buy/100)

		} else {

			//ADD how much of the volume I can buy with the remaining investment
			var residualAmountToBuy = (remainingInvestment/price)*(1-fees.buy/100)
			remainingInvestment = remainingInvestment - (residualAmountToBuy*price)
			var lastOrder = [price, residualAmountToBuy]

			orderBookDepth.push(lastOrder)
			
			totalQuantityTobuy = totalQuantityTobuy + residualAmountToBuy 

			suggestedPrice = price

			break

		}

	}

	var buyStrategy = {

		buyPrice: suggestedPrice,
		quantity: orderBookDepth,
		initialInvestment: investment,
		feesPaidInStableCoin: remainingInvestment,
		ethWithdrawalFee: fees.ethWithdrawalFee,
		totalQuantity: totalQuantityTobuy

	}

	return buyStrategy

}

/**
getSellStrategy: This function simulate the placement of a certain amount of money to sell crypto on a specific exchange
@param buyStrategy: Simulation of buying crypto in the buy exchange
@param bids: orderbook's bid side for a specific exchange
*/


async function getSellStrategy(buyStrategy, bids, fees){

	var remainingInvestment = buyStrategy.totalQuantity - fees.ethWithdrawalFee
	var orderBookDepth = []
	var suggestedPrice = 0
	var sellPotential = 0
	var totalQuantityToSell = 0


	for (var i=0; i<bids.length; i++){

		var price = parseFloat(bids[i][0])
		var volume = parseFloat(bids[i][1]) 

		sellPotential = sellPotential + volume*(1-fees.sell/100)

		if ( remainingInvestment >= sellPotential ) {

			remainingInvestment = remainingInvestment - sellPotential

			orderBookDepth.push(bids[i])
			totalQuantityToSell = totalQuantityToSell + volume*price*(1-fees.sell/100)


		} else {

			//ADD how much of the volume I can buy with the remaining investment
			var residualAmountToSell = remainingInvestment*(1-fees.sell/100)
			remainingInvestment = remainingInvestment - residualAmountToSell
			var lastOrder = [price, residualAmountToSell]

			orderBookDepth.push(lastOrder)
			totalQuantityToSell = totalQuantityToSell + residualAmountToSell*price //- fees.usdtWithdrawalFee
			suggestedPrice = price

			break

		}

	}

	var sellStrategy = {

		sellPrice: suggestedPrice,
		quantity: orderBookDepth,
		initialInvestment: buyStrategy.totalQuantity - fees.ethWithdrawalFee,
		feesPaidInCryptoCoin: remainingInvestment,
		usdtWithdrawalFee: fees.usdtWithdrawalFee,
		totalQuantity: totalQuantityToSell

	}

	return sellStrategy

}



const lib = async (coin, amount) => {

	let data = await getDataFromLibrary(coin, amount)
	return data
}


/**
Exporting Module
*/

module.exports = {

    lib: lib

};
