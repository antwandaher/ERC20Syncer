var express = require('express');
var router = express.Router();
var Web3 = require('web3');
var BlockController = require('../models/controller');

const httpURL = "https://mainnet.infura.io/v3/7b51708246e6410799eaebf0e19b49c2"
const wsURL = "wss://mainnet.infura.io/ws/v3/7b51708246e6410799eaebf0e19b49c2"

const htWeb3 = new Web3(new Web3.providers.HttpProvider(httpURL));
const wsWeb3 = new Web3(new Web3.providers.WebsocketProvider(wsURL));

var subscription = {};

router.get('/transactions/:assetAddress', function(req, res, next) {
  const assetAdress = req.params.assetAddress ? req.params.assetAddress : '';
  const ownerAdress = req.query.owner ? req.query.owner : '';
  const limit = req.query.limit ? parseInt(req.query.limit) : 50 ;
  const skip = req.query.skip ? parseInt(req.query.skip) : 0;
  BlockController.getUserTransactions(assetAdress, ownerAdress, limit, skip).then((resp) => {
    res.send(resp);
  });
});

/*  Open a socket with infura for asset chain, given owners address
 *  Get transaction receipts and push to DB if contractAddress matches criteria.
*/
router.post('/transactions/:assetAddress', function(req, res, next) {
  const assetAdress = req.params.assetAddress;
  const ownerAdress = req.query.owner;
  const subID = ownerAdress + ':' + assetAdress;
  let active = false;
  if (typeof(assetAdress) === 'undefined') {
    res.send('ERR: Missing asset address.')
  } else if (typeof(ownerAdress) === 'undefined') {
    res.send('ERR: Missing owner address.');
  } else {

    if (subID in subscription) {
      if (!subscription[subID].active) {
        subscription[subID].sub = initiateSub(assetAdress, ownerAdress);
        active = true;
        subscription[subID].active = active;
      }
      else removeSub(subID);  
    } else {
      active = true;
      subscription[subID] = {'active': active, 'sub': initiateSub(assetAdress, ownerAdress)};
    }
    res.send(`Sync ${active ? "started" : "stopped"} for address ${ownerAdress}, on asset ${assetAdress}`);
  }
  
});


async function getERCTransferFromOwner (blockHash, contractAddress, ownerAdress) {
  let blockToSave = {};
	wsWeb3.eth.getBlock(blockHash).then((block) => {
    if (block) {
      console.log('Block data fetched.');
      blockToSave = {...block};
      blockToSave.transactions = [];
      for (var transactionIndex in block.transactions) {
        let transactionHash = block.transactions[transactionIndex]
        wsWeb3.eth.getTransactionReceipt(transactionHash).then((receipt) => {
          if (receipt && receipt.contractAddress && receipt.contractAddress === contractAddress
            && (receipt.from = ownerAdress || receipt.to === ownerAdress)) {
            receipt.address = ownerAdress;
            BlockController.addToBlock(blockToSave, receipt);
          }
        });
      };
    } else {
      console.log('Null block returned.')
    }
  });
};

function initiateSub (asset, owner) {
  const wsWeb3 = new Web3(new Web3.providers.WebsocketProvider(wsURL));

  return wsWeb3.eth.subscribe('newBlockHeaders', 
    (error, blockHeader) => {
      if (error) console.log(error);
      console.log('Successfully subscribed!');
    }).on('data', (block) => {
      console.log('New Ethereum-Block header data received.');
      getERCTransferFromOwner(block.hash, asset, owner);
  });
};

function removeSub (subID) {
  subscription[subID].sub.unsubscribe(function(error, success){
    if(success) {
      console.log('Successfully unsubscribed!');
      subscription[subID].active = false;
    }
  });
};

module.exports = router;
