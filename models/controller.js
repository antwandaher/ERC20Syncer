const BlockModel = require('../models/schema')

const addBlock = (block) => {
    const query = new BlockModel({
        'hash': block.hash,
        'parentHash': block.parentHash,
        'transactions': block.transactions,
        'timestamp': block.timestamp
    });
    query.save(function (err, block) {
        if (err) {
            console.log(err);
            return 'error';
        } else {
            console.log('Save success');
        }
    })
};

const addToBlock = async (block, receipt) => {
    findBlock(block).then(async (resp) => {
        if (resp) {
            const res = await BlockModel.updateOne({'hash': block.hash}, {$push: {transactions: receipt}});
            if (!res.ok) {
                console.log(`Error Saving ${block.hash}`)
            }
        } else {
            const blockToAdd = {...block};
            blockToAdd.transactions = [receipt];
            addBlock(blockToAdd);
        }
    })
};

const findBlock = async (block) => {
    const query = await BlockModel.exists({"hash": block.hash});
    return query;
}

const getAll = async () => {
    const query = await BlockModel.find({});
    return query;
}

const getUserTransactions = async (assetAddress, ownerAddress, limit, skip) => {
    const queryResp = await BlockModel.find({"transactions.address": ownerAddress, "transaction.contractAddress": assetAddress}, null, {'sort': {'timestamp': '-1'}, 'skip': skip, 'limit': limit});
    return queryResp;
}

exports.addBlock = addBlock; 
exports.findBlock = findBlock;
exports.getUserTransactions = getUserTransactions;
exports.getAll = getAll;
exports.addToBlock = addToBlock;