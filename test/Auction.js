const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { assert } = require("chai");
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { EventFragment } = require("ethers");
const { deployAuction, enterBid } = require("../scripts/deployAuction");

describe(" Auction", function () {
  describe("Constructor", function () {
    it("Set the duration correctly", async function () {
      const { Auction, Duration, Time } = await loadFixture(deployAuction);
      const endTime = Duration + Time;
      //   console.log(await Auction.endTime());
      //   console.log(endTime);
      expect(await Auction.endTime()).to.equal(endTime);
    });
  });
  describe("PlaceBId", async function () {
    it("Can be called only before election time ends", async function () {
      const { Auction, Duration, Time } = await loadFixture(deployAuction);
      await helpers.time.increase(Duration + Time);
      await expect(Auction.placeBid()).to.be.revertedWith("Auction has ended");
    });
    it("Accepts value only greater than highest bid", async function () {
      const { Auction, owner, acc1 } = await loadFixture(deployAuction);
      const firstBidAmount = 1000;
      const secondBidAmount = 100;
      await Auction.placeBid({ value: firstBidAmount });
      await expect(
        Auction.placeBid({ value: secondBidAmount })
      ).to.be.revertedWith(
        "Bid amount must be higher than current highest bid"
      );
    });
    it("Same person continuously cant be two times highest bidder", async function () {
      const { Auction, owner, acc1 } = await loadFixture(deployAuction);
      const firstBidAmount = 1000;
      const secondBidAmount = 10000;
      await Auction.placeBid({ value: firstBidAmount });
      console.log(await Auction.highestBid());
      await expect(
        Auction.placeBid({ value: secondBidAmount })
      ).to.be.revertedWith("You are already the highest bidder");
    });
    it("If highest bid , it will store its highest bid amount", async function () {
      const { Auction, owner, acc1 } = await loadFixture(deployAuction);
      const BidAmount = 1000000;
      console.log(owner);
      await Auction.placeBid({ value: BidAmount });
      console.log(await Auction.highestBid());
      expect(await Auction.highestBid()).to.equal(BidAmount);
    });
    it("If highest bid , it will store its highest bidder", async function () {
      const { Auction, owner, acc1 } = await loadFixture(deployAuction);
      const BidAmount = 1000000;
      console.log(owner);
      await Auction.placeBid({ value: BidAmount });
      console.log(await Auction.highestBid());
      expect(await Auction.highestBidder()).to.equal(owner.address);
    });
    it("Will emit an event upon successful bid", async function () {
      const { Auction, owner, acc1 } = await loadFixture(deployAuction);
      const BidAmount = 1000000;
      await expect(Auction.placeBid({ value: BidAmount }))
        .to.emit(Auction, "BidPlaced")
        .withArgs(owner.address, BidAmount);
      // .withArgs(owner, BidAmount);
    });
    it("Modifies the bids MApping", async function () {
      const { Auction, owner, acc1 } = await loadFixture(deployAuction);
      const BidAmount = 1000000;
      await Auction.connect(acc1).placeBid({ value: BidAmount });
      assert.equal(await Auction.bids(acc1), BidAmount);
    });
    it("On second bidding money get went back to the first bidder", async function () {
      const { Auction, owner, acc1 } = await loadFixture(deployAuction);
      const BidAmount = 1000000;
      const balanceBefore = await ethers.provider.getBalance(Auction.target);
      await expect(
        Auction.placeBid({ value: BidAmount })
      ).to.changeEtherBalances([Auction, owner], [BidAmount, -BidAmount]);
      const newBidAmount = BidAmount + BidAmount;
      await expect(
        Auction.connect(acc1).placeBid({ value: newBidAmount })
      ).to.changeEtherBalances(
        [Auction, owner, acc1],
        [newBidAmount - BidAmount, BidAmount, -newBidAmount]
      );
    });
  });
  describe("End Auction", function () {
    it("can be called by only auctioneer", async function () {
      const { Auction } = await loadFixture(enterBid);
      const { acc1 } = await loadFixture(deployAuction);
      await expect(Auction.connect(acc1).endAuction()).to.be.revertedWith(
        "Only auctioneer can call this function"
      );
    });
    it("Can be called only after election ended", async function () {
      const { Auction } = await loadFixture(enterBid);
      const { acc1, owner } = await loadFixture(deployAuction);
      await expect(Auction.endAuction()).to.be.revertedWith(
        "Auction has not ended"
      );
    });
    it("Should transfer all the money to auctioneer", async function () {
      //   const { Auction, total, Duration } = await loadFixture(enterBid);
      //   const { acc1, owner } = await loadFixture(deployAuction);
      const { Auction, Duration, owner } = await loadFixture(deployAuction);
      let accounts = await ethers.getSigners();
      //   let total = 0;
      let BidAmount = 10000;
      for (let i = 1; i < 5; i++) {
        await Auction.connect(accounts[i]).placeBid({ value: BidAmount });
        // total += BidAmount;
        BidAmount = BidAmount * 2;
      }
      let total = await ethers.provider.getBalance(Auction.target);
      total = Number(total);
      await helpers.time.increase(Duration);
      await expect(Auction.endAuction()).to.changeEtherBalances(
        [Auction, owner],
        [-total, +total]
      );
    });
    it("Should emit an event on auction ended", async function () {
      const { Auction, Duration, owner } = await loadFixture(deployAuction);
      let accounts = await ethers.getSigners();
      //   let total = 0;
      let BidAmount = 10000;
      for (let i = 1; i < 5; i++) {
        await Auction.connect(accounts[i]).placeBid({ value: BidAmount });
        // total += BidAmount;
        BidAmount = BidAmount * 2;
      }
      let total = await ethers.provider.getBalance(Auction.target);
      total = Number(total);
      await helpers.time.increase(Duration);
      await expect(Auction.endAuction())
        .to.emit(Auction, "AuctionEnded")
        .withArgs(accounts[4].address, BidAmount / 2);
    });
  });
});
