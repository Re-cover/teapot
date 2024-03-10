const { randomUUID } = require("crypto");
const ethers = require("ethers");
require("dotenv").config();

const GAS_PRICE = 1050000000;
const LOW_GAS_PRICE = 50000000;

function createText() {
  const id = randomUUID();
  const text = `data:application/json,{"p":"bm-20","op":"mint","tick":"BMW","id":"${id}","amt":"10"}`;
  return text;
}

function stringToHex(string) {
  return "0x" + Buffer.from(string, "utf8").toString("hex");
}

async function batchMint(wallet, mintCount) {
  let nonce = await wallet.getTransactionCount();
  console.log(`nonce: ${nonce}`);

  let successCount = 0;
  while (successCount < mintCount) {
    try {
      const hexDataURI = stringToHex(createText());
      const tx = {
        to: wallet.address,
        value: ethers.utils.parseEther("0"),
        data: hexDataURI,
        nonce: nonce++,
        gasPrice: LOW_GAS_PRICE,
      };

      // 使用你的钱包发送交易
      const txResponse = await wallet.sendTransaction(tx);
      console.log(`nonce: ${nonce}, txn hash: ${txResponse.hash}`);
      successCount++;
    } catch (error) {
      console.error(`nonce: ${nonce}, error: ${error}`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 失败后等待2秒
      try {
        // 错误根源可能为rpc接点区块同步不及时，重新获取nonce防止nonce占用错误
        nonce = await wallet.getTransactionCount();
      } catch (error) {
        console.error(`retry fetch nonce error: ${error}`);
      }
    }
  }
}

async function doOneMint(wallet) {
  let nonce = await wallet.getTransactionCount();
  console.log(`nonce: ${nonce}`);

  const text = createText();
  const hexDataURI = stringToHex(text);

  console.log(`text: ${text}`);
  console.log(`hexDataURI: ${hexDataURI}`);

  const gasPrice = await wallet.getGasPrice();
  console.log(`est gas price: ${gasPrice.toString()}`);

  const tx = {
    to: wallet.address,
    value: ethers.utils.parseEther("0"),
    data: hexDataURI,
    nonce: nonce++,
    gasPrice: LOW_GAS_PRICE,
  };

  // 使用你的钱包发送交易
  const txResponse = await wallet.sendTransaction(tx);
  console.log(`txn response: ${JSON.stringify(txResponse)}`);

  // 等待交易被矿工确认
  const receipt = await txResponse.wait();
  console.log(`transaction receipt: ${JSON.stringify(receipt)}`);
  console.log(`transaction was confirmed in block ${receipt.blockNumber}`);
}

async function getBalance(provider, address) {
  console.log(`address: ${address}`);
  const balance = await provider.getBalance(address);
  const balanceFormatted = ethers.utils.formatEther(balance);
  console.log(`balance: ${balanceFormatted}`);
}

async function main() {
  const pk = process.env.PRIVATE_KEY; // 私钥

  // rpc节点
  // const providerUrl = "https://rpc-1.bevm.io";
  const providerUrl = "https://rpc-2.bevm.io";
  // const providerUrl = "https://rpc-3.bevm.io";
  // const providerUrl = "https://bevm.rpc.thirdweb.com";

  console.log(`rpc url: ${providerUrl}`);

  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const wallet = new ethers.Wallet(pk, provider);

  // 获取钱包余额
  await getBalance(provider, wallet.address);

  // 测试一次mint
  // await doOneMint(wallet);

  // 批量mint，次数200自行修改
  await batchMint(wallet, 200);

  process.exit();
}

main();
