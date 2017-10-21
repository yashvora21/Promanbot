var nock = require('nock');
var data = require('./mocks/mock.json');

module.exports.startMock = function(){

	// Mock for story board
	var pathRegex = /\/1\/members\/me\/boards.*/;
	nock("https://api.trello.com")
	.persist()
	.get(pathRegex)
	.reply(200, JSON.stringify(data.MeBoards) );

	// Mock for all the lists in a board
	pathRegex = /\/1\/boards\/.*\/lists/;
	nock("https://api.trello.com")
	.persist()
	.get(pathRegex)
	.reply(200, JSON.stringify(data.boardLists) );
	
	// Mock for getting all the cards in a List
	pathRegex = /\/1\/batch/;
	nock("https://api.trello.com")
	.persist()
	.get(pathRegex)
	.reply(200, JSON.stringify(data.cardList) );

};
