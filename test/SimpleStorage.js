const { ethers } = require("hardhat");
const { assert, expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("SimpleStorage", function () {
  async function deploySimpleStorage() {
    const SimpleStorageFactory = await ethers.getContractFactory(
      "SimpleStorage"
    );
    const SimpleStorage = await SimpleStorageFactory.deploy();
    return { SimpleStorage };
  }
  it("Stores a favorite number", async function () {
    const { SimpleStorage } = await loadFixture(deploySimpleStorage);
    let favnum = 10;
    await SimpleStorage.store(favnum);
    expect(favnum).to.equal(await SimpleStorage.retrieve());
  });
  it("Stores the Person details in array", async function () {
    const { SimpleStorage } = await loadFixture(deploySimpleStorage);
    const person_name = "jeevan";
    const person_favnum = 14;
    await SimpleStorage.addPerson(person_name, person_favnum);
    const retrievedPerson = await SimpleStorage.people(0);
    const retrievedPersonfromFunc = await SimpleStorage.retrieveperson(0);
    expect(person_name).to.equal(retrievedPerson.name);
    expect(person_name).to.equal(retrievedPersonfromFunc);
  });
  it("updates the mapping of name to favorite number", async function () {
    const { SimpleStorage } = await loadFixture(deploySimpleStorage);
    const person_name = "jeevan";
    const person_favnum = 14;
    await SimpleStorage.addPerson(person_name, person_favnum);
    const retrievedNumber = await SimpleStorage.nameToFavoriteNumber(
      person_name
    );
    expect(retrievedNumber).to.equal(person_favnum);
    const retrievedNumberFromFunc = await SimpleStorage.retrievenumber(0);
    expect(retrievedNumberFromFunc).to.equal(person_favnum);
  });
  it("Adding person increases the length of people array", async function () {
    const { SimpleStorage } = await loadFixture(deploySimpleStorage);
    const person_name = "jeevan";
    const person_favnum = 14;
    await SimpleStorage.addPerson(person_name, person_favnum);
    await SimpleStorage.addPerson(person_name, person_favnum);
    const exp_length = 2;
    const length = await SimpleStorage.getLength();
    assert.equal(exp_length, length);
  });
});
