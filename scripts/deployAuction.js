const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const { ethers } = require("hardhat");
async function deployAuction() {
  const Duration = 60 * 60;
  const AuctionFactory = await ethers.getContractFactory("Auction");
  const Auction = await AuctionFactory.deploy(Duration);
  const [owner, acc1, acc2] = await ethers.getSigners();
  const Time = await time.latest();
  return { Auction, owner, acc1, acc2, AuctionFactory, Time, Duration };
}

async function enterBid() {
  const { Auction, Duration } = await loadFixture(deployAuction);
  let accounts = await ethers.getSigners();
  let total = 0;
  let BidAmount = 10000;
  for (let i = 1; i < 5; i++) {
    await Auction.connect(accounts[i]).placeBid({ value: BidAmount });
    total += BidAmount;
    BidAmount = BidAmount * 2;
  }
  console.log(await ethers.provider.getBalance(Auction.target));
  return { Duration, Auction, total };
}

module.exports = { deployAuction, enterBid };
