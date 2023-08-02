const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FundMe", function () {
  async function deployFundMe() {
    const mockFactory = await ethers.getContractFactory("MockV3Aggregator");
    const mock = await mockFactory.deploy(8, 20000000);
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    const fundMe = await fundMeFactory.deploy(mock.target);
    const [owner, acc1, acc2] = await ethers.getSigners();
    return { mock, fundMe, owner, acc1, acc2 };
  }
  describe("Constructor", function () {
    it("should set the right pricefeed address", async function () {
      const { mock, fundMe } = await loadFixture(deployFundMe);
      const priceFeed = await fundMe.s_priceFeed();
      expect(priceFeed).to.equal(mock.target);
    });
    it("Should set the right owner", async function () {
      const { owner, fundMe } = await loadFixture(deployFundMe);
      const contractOwner = await fundMe.i_owner();
      console.log(owner);
      expect(contractOwner).to.equal(owner.address);
    });
  });
  describe("Fund", function () {
    it("Should revert if money is passed LESS THAN THRESHOLD", async function () {
      const { owner, fundMe } = await loadFixture(deployFundMe);
      await expect(fundMe.fund()).to.be.rejectedWith(
        "You need to spend more ETH!"
      );
    });
    it("Should work if money is passed", async function () {
      const { owner, fundMe } = await loadFixture(deployFundMe);
      await expect(fundMe.fund({ value: 10000000000 })).not.to.be.reverted;
    });
    it("Increases the length of funders array", async function () {
      const { owner, fundMe } = await loadFixture(deployFundMe);
      await expect(fundMe.fund({ value: 10000000000 })).not.to.be.reverted;
      const length = 1;
      expect(await fundMe.getLength()).to.equal(1);
    });
    it("updates the address to amount funded mapping", async function () {
      const { owner, fundMe, acc1 } = await loadFixture(deployFundMe);
      const fundowner = 10000000000;
      await expect(fundMe.fund({ value: fundowner })).not.to.be.reverted;
      const acc1funded = 100000000000;
      fundMe.connect(acc1).fund({ value: acc1funded });
      const ownerFunded = await fundMe.getFundAmount(owner.address);
      expect(ownerFunded).to.equal(fundowner);
      expect(await fundMe.s_addressToAmountFunded(acc1.address)).to.equal(
        acc1funded
      );
    });
    describe("Withdraw", function () {
      async function fundAmount() {
        // const {fundMe} = await loadFixture(deployFundMe);
        const { fundMe } = await loadFixture(deployFundMe);

        const fundowner = 10000000000;
        await fundMe.fund({ value: fundowner });
        return { fundMe };
      }
      it("can be called by only owner", async function () {
        const { acc1 } = await loadFixture(deployFundMe);
        const { fundMe } = await loadFixture(fundAmount);
        await expect(
          fundMe.connect(acc1).withdraw()
        ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
      });
      it("Increases the length of funders array", async function () {
        const { fundMe } = await loadFixture(fundAmount);
        expect(await fundMe.getLength()).to.equal(1);
      });
      it("Resets the funders array", async function () {
        const { fundMe } = await loadFixture(fundAmount);
        await fundMe.withdraw();
        expect(await fundMe.getLength()).to.equal(0);
      });
    });
  });
});
