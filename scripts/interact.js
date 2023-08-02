/***************************-------------Not working dont know why**************************** */

require("dotenv").config();
const API_KEY = process.env.API_KEY;
const SEPOLIA_PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const { ethers } = require("hardhat");
const contract = require("../artifacts/contracts/Token.sol/Token.json");

// provider;
const netObj = {
  name: "Sepolia",
  chainId: 11155111, // hardwired bullshit
};
const provider = new ethers.providers.AlchemyProvider(
  netObj,
  "ffFqT4mKQcl77VX-Peh-y6QE4wcYJFmHA"
);

//signer
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

//contract Instance
const Token_Contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  Token_Contract.abi,
  signer
);

// // Provider
// const alchemyProvider = new ethers.providers.AlchemyProvider(
//   (network = "sepolia"),
//   API_KEY
// );

// // Signer
// const signer = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);

// Contract
// const helloWorldContract = new ethers.Contract(
//   CONTRACT_ADDRESS,
//   contract.abi,
//   signer
// );

async function main() {
  //   const owner = await Token_Contract.owner();
  //   console.log(owner);
  console.log(JSON.stringify(contract.abi));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(0);
  });
