const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
var axios = require('axios')

const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
 
const adapter = new FileSync('db.json')
const db = low(adapter)

let bodyParser = require('body-parser');

app.use(bodyParser.json({
    limit: '50mb'
}));

app.use(bodyParser.urlencoded({

    extended: true

}));

const exchanges = require('./lib/exchanges.js')
const binance = require('./lib/binance.js')

app.get('/oracle', (req,res) => {
	
	const main = async () => {

		let data = await exchanges.lib(req.query.coin, req.query.amount)
		res.send(data)
	}

	main()

});

app.get('/binanceMarkets', (req,res) => {
	
	const bin = async () => {

		let availableMarkets = await binance.finder(req.query.coin, req.query.amount)
		res.send(availableMarkets)
	}

	bin()

});

process.on('uncaughtException', function(err) {

	console.log(err)

});

server.listen(port, () => {

	console.log('Server is up on port ' + port);

}) 