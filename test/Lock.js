const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { lock, unlockTime, lockedAmount, owner, otherAccount } =
        await loadFixture(deployOneYearLockFixture);
      const ownerFromContract = await lock.owner();
      expect(ownerFromContract).to.equal(owner.address);
      //   console.log(owner, owner.address);
    });
    it("Should set the correct unlock time", async function () {
      const { unlockTime, lock } = await loadFixture(deployOneYearLockFixture);
      const timeFromContract = await lock.unlockTime();
      expect(timeFromContract).to.equal(unlockTime);
    });
    it("Shoud fail if unlock time is less than current time", async function () {
      const Lock = await ethers.getContractFactory("Lock");
      const unlockTime = (await time.latest()) - 10000;
      await expect(
        Lock.deploy(unlockTime, { value: 10000 })
      ).to.be.revertedWith("Unlock time should be in the future");
    });
    it("Correct amount depsited to contract", async function () {
      const { lock, lockedAmount } = await loadFixture(
        deployOneYearLockFixture
      );
      //   const provider = ethers.getDefaultProvider();
      const balanceFromContract = await ethers.provider.getBalance(lock.target);
      expect(balanceFromContract).to.equal(lockedAmount);
    });
  });
  describe("Withdraw", function () {
    it("Should revert if time has not passed", async function () {
      const { lock } = await loadFixture(deployOneYearLockFixture);
      //   console.log(lock.runner.address);
      await expect(lock.withdraw()).to.be.revertedWith(
        "You can't withdraw yet"
      );
      //   const tx = await lock.withdraw();
      //   //   tx.wait();
      //   const balance = lock.getBalance();
      //   expect(balance).to.equal(0);
    });
    it("Should withdraw if time has passed", async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);
      await time.increaseTo(unlockTime);
      await expect(lock.withdraw()).not.to.be.reverted;
    });
    it("should be reverted if other person is calling withdraw", async function () {
      const { lock, otherAccount, unlockTime } = await loadFixture(
        deployOneYearLockFixture
      );
      await time.increaseTo(unlockTime);
      await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
        "You aren't the owner"
      );
    });
    it("Contract Balance should be 0 after withdrawal", async function () {
      const { lock, otherAccount, unlockTime } = await loadFixture(
        deployOneYearLockFixture
      );
      await time.increaseTo(unlockTime);
      const contractBalanceBefore = await ethers.provider.getBalance(
        lock.target
      );
      await expect(lock.withdraw())
        .to.emit(lock, "Withdrawal")
        .withArgs(contractBalanceBefore, anyValue);
    });
    it("should change balances after the withdraw function", async function () {
      const { lock, otherAccount, unlockTime, owner, lockedAmount } =
        await loadFixture(deployOneYearLockFixture);
      await time.increaseTo(unlockTime);
      await expect(lock.withdraw()).changeEtherBalances(
        [lock.target, owner],
        [-lockedAmount, +lockedAmount]
      );
    });
  });
});
