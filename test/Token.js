const { ethers } = require("hardhat");
// const { expect } = require("chai");

// describe("Token contract", function () {
//   it("Deployment should assign the total supply of tokens to the owner", async function () {
//     const [owner] = await ethers.getSigners();

//     const hardhatToken = await ethers.deployContract("Token");
//     console.log(await hardhatToken.symbol())
//     const ownerBalance = await hardhatToken.balanceOf(owner.address);
//     expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
//   });
//   it("Should transfer tokens between accounts", async function() {
//     const [owner, addr1, addr2] = await ethers.getSigners();

//     const hardhatToken = await ethers.deployContract("Token");

//     // Transfer 50 tokens from owner to addr1
//     await hardhatToken.transfer(addr1.address, 50);
//     expect(await hardhatToken.balanceOf(addr1.address)).to.equal(50);

//     // Transfer 50 tokens from addr1 to addr2
//     await hardhatToken.connect(addr1).transfer(addr2.address, 50);
//     expect(await hardhatToken.balanceOf(addr2.address)).to.equal(50);

//     expect(await hardhatToken.balanceOf(addr1.address)).to.equal(0);
//   });
// });

const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Token contract", function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hardhatToken = await ethers.deployContract("Token");

    // Fixtures can return anything you consider useful for your tests
    return { hardhatToken, owner, addr1, addr2 };
  }

  it("Should assign the total supply of tokens to the owner", async function () {
    const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });

  it("Should transfer tokens between accounts", async function () {
    const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
      deployTokenFixture
    );

    // Transfer 50 tokens from owner to addr1
    await expect(
      hardhatToken.transfer(addr1.address, 50)
    ).to.changeTokenBalances(hardhatToken, [owner, addr1], [-50, 50]);

    // Transfer 50 tokens from addr1 to addr2
    // We use .connect(signer) to send a transaction from another account
    await expect(
      hardhatToken.connect(addr1).transfer(addr2.address, 50)
    ).to.changeTokenBalances(hardhatToken, [addr1, addr2], [-50, 50]);
  });
});
