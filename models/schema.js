var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var blockSchema = new Schema({
    number: Number,
    hash: String,
    parentHash: String,
    transactions: Object,
    uncleHash: String,
    transactionsRoot: String,
    stateRoot: String,
    receiptsRoot: String,
    timestamp: Number
});

module.exports = mongoose.model('Block', blockSchema );