const ethers = require("ethers");
require("dotenv").config();

const hexDataURI =
  "0x646174613a2c7b2270223a226d616e2d3230222c226f70223a226d696e74222c227469636b223a226d616e74222c22616d74223a223130227d";

async function batchMint(wallet, mintCount) {
  let nonce = await wallet.getTransactionCount();
  console.log(`nonce: ${nonce}`);

  let successCount = 0;
  while (successCount < mintCount) {
    try {
      const tx = {
        to: wallet.address,
        value: ethers.utils.parseEther("0"),
        data: hexDataURI,
        nonce: nonce++,
      };

      // 使用你的钱包发送交易
      const txResponse = await wallet.sendTransaction(tx);
      console.log(`nonce: ${tx.nonce}, txn hash: ${txResponse.hash}`);
      successCount++;
    } catch (error) {
      console.error(`nonce: ${nonce}, error: ${error}`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 失败后等待2秒
      try {
        //错误根源可能为rpc接点区块同步不及时，重新获取nonce防止nonce占用错误
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
  console.log(`hexDataURI: ${hexDataURI}`);

  const tx = {
    to: wallet.address,
    value: ethers.utils.parseEther("0"),
    data: hexDataURI,
    nonce: nonce++,
  };

  // 使用你的钱包发送交易
  const txResponse = await wallet.sendTransaction(tx);
  console.log(`txn hash: ${txResponse.hash}`);

  // 等待交易被矿工确认
  const receipt = await txResponse.wait();
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

  const providerUrl = "https://rpc.mantle.xyz";
  // const providerUrl = "https://1rpc.io/mantle";
  // const providerUrl = "https://mantle.publicnode.com";

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
