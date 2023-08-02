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

describe("VotingSystem", function () {
  async function deployVotingSystem() {
    const votingSystemFactory = await ethers.getContractFactory("Voting");
    const VotingSystem = await votingSystemFactory.deploy();
    const [owner, acc1, acc2] = await ethers.getSigners();
    return { VotingSystem, owner, acc1, acc2, votingSystemFactory };
  }

  describe("constructor", function () {
    it("Sets the owner correctly", async function () {
      const { owner, VotingSystem } = await loadFixture(deployVotingSystem);
      expect(await VotingSystem.i_owner()).to.eq(owner.address);
    });
  });
  describe("CreatePoll", function () {
    it("Can be called by only owner", async function () {
      const { VotingSystem, owner, acc1 } = await loadFixture(
        deployVotingSystem
      );
      const options = ["DMK", "ADMK"];
      const interval = 24 * 60 * 60; // one day;
      const id = 1;
      await expect(VotingSystem.createPoll(id, options, interval)).not.to.be
        .reverted;
      await expect(VotingSystem.connect(acc1).createPoll(id, options, interval))
        .to.be.revertedWithoutReason;
    });
    it("emit an event upon successfull poll creation", async function () {
      const { VotingSystem, owner } = await loadFixture(deployVotingSystem);
      const options = ["DMK", "ADMK"];
      const interval = 24 * 60 * 60; // one day;
      const id = 1;
      await expect(VotingSystem.createPoll(id, options, interval))
        .to.emit(VotingSystem, "pollCreated")
        .withArgs(id);
    });
    it("updates the poll id to vote mapping", async function () {
      const { VotingSystem, owner } = await loadFixture(deployVotingSystem);
      const options = ["DMK", "ADMK"];
      const interval = 24 * 60 * 60; // one day;
      const id = 1;
      // const Time = await time.latest();
      await VotingSystem.createPoll(id, options, interval);
      const vote = await VotingSystem.pollidtovote(id);
      const Time = await helpers.time.latest();
      console.log(vote);
      // assert.equal(vote.options, options);
      //in vote string is not returned
      assert.equal(vote.votingtime, interval);
      expect(vote.createdtime).to.equal(Time);
    });
  });
  describe("addVote", async function () {
    async function createVote() {
      const { VotingSystem, owner } = await loadFixture(deployVotingSystem);
      const options = ["DMK", "ADMK"];
      const interval = 24 * 60 * 60; // one day;
      const id = 1;
      // const Time = await time.latest();
      await VotingSystem.createPoll(id, options, interval);
      return { VotingSystem, options, id, interval };
    }
    it("adds a vote", async function () {
      const { owner, acc1 } = await loadFixture(deployVotingSystem);
      const { VotingSystem, id, options } = await loadFixture(createVote);
      await expect(VotingSystem.connect(acc1).addVote(id, options[0]))
        .to.emit(VotingSystem, "voteadded")
        .withArgs(id, acc1.address);
    });
    it("If time passed cannot add vote", async function () {
      const { owner, acc1 } = await loadFixture(deployVotingSystem);
      const { VotingSystem, id, options, interval } = await loadFixture(
        createVote
      );
      await helpers.time.increase(interval);
      await expect(
        VotingSystem.addVote(id, options[0])
      ).to.be.revertedWithCustomError(VotingSystem, "Voting_votingclosed");
    });
    it("Same person cannot register two votes", async function () {
      const { VotingSystem, id, options, interval } = await loadFixture(
        createVote
      );
      await VotingSystem.addVote(id, options[0]);
      await expect(
        VotingSystem.addVote(id, options[1])
      ).to.be.revertedWithCustomError(VotingSystem, "Voting_alreadyVoted");
    });
    it("If vote added it increases the number of voters", async function () {
      const { VotingSystem, id, options, interval } = await loadFixture(
        createVote
      );
      await VotingSystem.addVote(id, options[0]);
      const votersLength = await VotingSystem.getNumberOfVoters(id);
      assert.equal(votersLength, 1);
    });
    it("IF voted it increases the votes count of voted candidate by one", async function () {
      const { VotingSystem, id, options, interval } = await loadFixture(
        createVote
      );
      await VotingSystem.addVote(id, options[0]);
      const votecount = await VotingSystem.votecount(id, options[0]);
      assert.equal(votecount.toString(), "1");
    });
  });
  describe("GetWinner", function () {
    async function createVote() {
      const { VotingSystem, owner } = await loadFixture(deployVotingSystem);
      const options = ["DMK", "ADMK"];
      const interval = 24 * 60 * 60; // one day;
      const id = 1;
      // const Time = await time.latest();
      await VotingSystem.createPoll(id, options, interval);
      return { VotingSystem, options, id, interval };
    }
    it("Cant call getWinner if voting still open", async function () {
      const { VotingSystem, id, options, interval } = await loadFixture(
        createVote
      );
      await expect(VotingSystem.getWinner(id)).to.be.revertedWithCustomError(
        VotingSystem,
        "Voting_stillopen"
      );
    });
    async function EnterVote() {
      const { VotingSystem, id, options, interval } = await loadFixture(
        createVote
      );
      // await VotingSystem.addVote(id, options[0]);
      const accounts = await ethers.getSigners();
      for (let i = 0; i < 15; i++) {
        await VotingSystem.connect(accounts[i]).addVote(id, options[0]);
      }
      for (let i = 16; i < 19; i++) {
        await VotingSystem.connect(accounts[i]).addVote(id, options[1]);
      }

      await helpers.time.increase(interval);
      return { VotingSystem, id, options, interval };
    }
    it("calculates the winner correctly", async function () {
      const { VotingSystem, id, options } = await loadFixture(EnterVote);
      const txnresponse = await VotingSystem.getWinner(id);
      const txnreceipt = await txnresponse.wait(1);
      const winner = await VotingSystem.pollidtowinner(id);
      const expectedWinner = options[0];
      expect(winner).to.equal(expectedWinner);
    });
    it("expects to emit a event upon choosing winner", async function () {
      const { VotingSystem, id, options } = await loadFixture(EnterVote);
      await expect(VotingSystem.getWinner(id))
        .to.emit(VotingSystem, "winnerAttained")
        .withArgs(id, options[0]);
    });
    it("Calculates the winner from an emitted event", async function () {
      const { VotingSystem, id, options } = await loadFixture(EnterVote);
      await new Promise(async (resolve, reject) => {
        VotingSystem.once("winnerAttained", async () => {
          try {
            // assert(endingtimestamp > startingtimestamp);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
        const txnresponse = await VotingSystem.getWinner(id);
        const txnreceipt = await txnresponse.wait(1);
        expect(txnresponse).to.equal(options[0]);
        // console.log(txnreceipt.logs[0].args.target);
      });
    });
    it("Getting the winner", async function () {
      const { VotingSystem, id, options } = await loadFixture(EnterVote);
      const result = await VotingSystem.getWinnerWithoutStateChange(id);
      // await helpers.time.increase(interval);
      // console.log(result);
      console.log(await VotingSystem.getNumberOfVotes(id, options[0]));

      const expectedWinner = options[0];
      expect(result).to.equal(expectedWinner);
    });
  });
});

//ethers v6 <<<<<<<< ethers v5
//ethers v6 updates doubt:
// staticCall not working
// events unable to log
