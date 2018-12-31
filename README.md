# Arbitrage

This API accepts a pair of coins and the amount the user is willing to invest and it returns the best arbitrage strategy among all the supported exchanges by simulating the order placement for buy and sell requests. 

# What is arbitrage? 

According to Investopedia.com this is the definition of Arbitrage: 
Arbitrage is the simultaneous purchase and sale of an asset to profit from an imbalance in the price. It is a trade that profits by exploiting the price differences of identical or similar financial instruments on different markets or in different forms. Arbitrage exists as a result of market inefficiencies and would therefore not exist if all markets were perfectly efficient.

# Triangular Arbitrage

According to Wikipedia: 
Triangular arbitrage (also referred to as cross currency arbitrage or three-point arbitrage) is the act of exploiting an arbitrage opportunity resulting from a pricing discrepancy among three different currencies. A triangular arbitrage strategy involves three trades, exchanging the initial currency for a second, the second currency for a third, and the third currency for the initial. During the second trade, the arbitrageur locks in a zero-risk profit from the discrepancy that exists when the market cross exchange rate is not aligned with the implicit cross exchange rate. A profitable trade is only possible if there exist market imperfections. Profitable triangular arbitrage is very rarely possible because when such opportunities arise, traders execute trades that take advantage of the imperfections and prices adjust up or down until the opportunity disappears.

# Crypto Arbitrage

At the moment we only support the following Cryptocurrency Exchanges

```
- bittrex
- binance
- hitbtc
- lbank
- bitz
- okex
- cobinhood
- bigone
- poloniex
- gateio
- coinex
- cryptopia 
```

# How can I use standard arbitrage?

Base Url

```
https://gentle-hamlet-49207.herokuapp.com/oracle
```

Required Params:

- ```coin```: (ex. ETH/USDT)
- ```amount```: (ex. 1000 USDT)

Final Url 

```
https://gentle-hamlet-49207.herokuapp.com/oracle?coin=ETH/USDT&amount=1000
```

# Output example

In this case if we would have invested 1000 USDT we would have made 1.49% net profit by following the buy and sell strategy between the 2 exchanges.

```
[
  {
    "buyExchange": "bittrex",
    "sellExchange": "hitbtc",
    "profit": true,
    "margin": 1.4934,
    "marginUnit": "%",
    "strategy": {
      "buyStrategy": {
        "buyPrice": 114.58999998,
        "quantity": Array[1][
          Array[2][
            114.58999998,
            8.704948077267641
          ]
        ],
        "initialInvestment": "1000",
        "feesPaidInStableCoin": 2.5,
        "ethWithdrawalFee": 0.006,
        "totalQuantity": 8.704948077267641
      },
      "sellStrategy": {
        "sellPrice": 116.79,
        "quantity": Array[1][
          Array[2][
            116.79,
            8.690249129190374
          ]
        ],
        "initialInvestment": 8.69894807726764,
        "feesPaidInCryptoCoin": 0.008698948077267232,
        "usdtWithdrawalFee": 45,
        "totalQuantity": 1014.9341957981438
      }
    }
  }
]
```

# How can I use triangular arbitrage? (Under Development)

We'll use Binance to find triangular arbitrage opportunities because we can use 429 different coins. 
We would benefit also of getting some BNB to pay for trading fees, like this we would basically pay half commissions all the time we need to trade.

To get all markets related to a specific coin (for now results are limited to max 10)

```
https://gentle-hamlet-49207.herokuapp.com/binanceMarkets?coin=USDT
```

The system will search for all the markets in which we can trade the ```coin```