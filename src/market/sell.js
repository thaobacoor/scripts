require('dotenv').config();
const fs = require('fs');
const Web3 = require('web3');
const moment = require('moment');
const { sleep, generateCode, minutes } = require('../../utils');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC));
const accounts = require('../../accounts.json');
const ABI = require('../ABI/Market.json');

const contractAddress = process.env.MARKET_ADDRESS;
const gameAddress = process.env.GAME_ADDRESS;
const tokens = ['0xdCe0cF324155F6331bA1Bb1957b47d80d107Eb5D'];
const sellingPrice = web3.utils.toWei(process.env.PRICE, 'ether');

// const defaultWei = 5000000000; // default 5 GWei
const contract = new web3.eth.Contract(ABI, contractAddress);

const run = async (account, privateKey, orderId, game, tokenIds, price, fiat) => {
  try {
    const dataTx = contract.methods.setPriceFee(orderId, game, tokenIds, price, fiat).encodeABI();
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(account);

    const rawTransaction = {
      nonce: web3.utils.toHex(nonce),
      gasPrice: web3.utils.toHex(gasPrice * 1.1),
      from: account,
      to: contractAddress,
      data: dataTx,
    };
    const gasLimit = await web3.eth.estimateGas(rawTransaction);

    const gasLimitHex = web3.utils.toHex(gasLimit);
    rawTransaction.gasLimit = gasLimitHex;

    const signedTransaction = await web3.eth.accounts.signTransaction(rawTransaction, privateKey);

    return web3.eth
      .sendSignedTransaction(signedTransaction.rawTransaction)
      .on('receipt', ({ transactionHash }) => {
        console.log(orderId, `${process.env.EXPLORER}/tx/${transactionHash}`);
      })
      .catch((err) => {
        console.log('error1', err);
      });
  } catch (error) {
    console.log('error2', error);
  }
};

const sellNFTs = async ({ from, to, address, privateKey }) => {
  const stream = fs.createWriteStream('orders.txt', { flags:'a' });
  for (let i = from; i < to; i++) {
    const orderId = moment(new Date()).format('YYMMDD') + generateCode(8);
    stream.write(`${orderId}\n`);
    await run(address, privateKey, orderId, gameAddress, [i], sellingPrice, tokens);
  }
  stream.end();
  console.log(`${address} - completed!`)
};


const script = async () => {
  for (let i = 0; i < accounts.length; i++) {
    const { address, privateKey, from, to } = accounts[i];
    sellNFTs({ from, to, address, privateKey });
  }
  await sleep(minutes(60)); // 1 hours
};

script();
