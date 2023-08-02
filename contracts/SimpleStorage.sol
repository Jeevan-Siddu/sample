// / I'm a comment!
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;
// pragma solidity ^0.8.0;
// pragma solidity >=0.8.0 <0.9.0;

contract SimpleStorage {
    uint256 favoriteNumber;

    struct People {
        uint256 favoriteNumber;
        string name;
    }

    // uint256[] public anArray;
    People[] public people;

    mapping(string => uint256) public nameToFavoriteNumber;

    function store(uint256 _favoriteNumber) public {
        favoriteNumber = _favoriteNumber;
    }
   
    function retrieveperson(
        uint256 _index
    ) public view returns (string memory) {
        string memory name = people[_index].name;
        return name;
    }

    function retrievenumber(uint256 _index) public view returns (uint256 ) {
        uint256 num = people[_index].favoriteNumber;
        return num;
    }

    function retrieve() public view returns (uint256) {
        return favoriteNumber;
    }

    function addPerson(string memory _name, uint256 _favoriteNumber) public {
        people.push(People(_favoriteNumber, _name));
        nameToFavoriteNumber[_name] = _favoriteNumber;
    }

    function getLength() public view returns(uint256){
        return people.length;
    }
}