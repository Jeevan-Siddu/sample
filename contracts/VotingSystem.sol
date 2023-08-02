// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

error Voting_alreadyVoted();
error Voting_votingclosed();
error Voting_stillopen();

import "hardhat/console.sol";

contract Voting {
    struct vote {
        string[] options;
        uint256 votingtime;
        uint256 createdtime;
    }
    mapping(uint256 => address[]) voterslist;
    mapping(uint256 => mapping(string => uint256)) public votecount;
    mapping(uint256 => vote) public pollidtovote;
    mapping(uint256 => string) public pollidtowinner;
    address public immutable i_owner;

    constructor() {
        i_owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == i_owner);
        _;
    }
    event pollCreated(uint256 indexed id);
    event winnerAttained(uint256 indexed id, string indexed name);
    event voteadded(uint256 indexed id, address name);

    function createPoll(
        uint256 id,
        string[] memory _options,
        uint256 interval
    ) public onlyOwner {
        vote memory newvote = vote({
            options: _options,
            votingtime: interval,
            createdtime: block.timestamp
        });
        pollidtovote[id] = newvote;
        emit pollCreated(id);
    }

    function addVote(uint256 id, string calldata tovote) public {
        bool isvoted = isVoted(msg.sender, id);
        if (isvoted) {
            revert Voting_alreadyVoted();
        }
        bool istimepassed = isTimePassed(id);
        if (istimepassed) {
            revert Voting_votingclosed();
        }
        votecount[id][tovote]++;
        voterslist[id].push(msg.sender);
        emit voteadded(id, msg.sender);
    }

    function isVoted(address voter, uint256 id) public view returns (bool) {
        uint256 len = voterslist[id].length;
        for (uint256 i = 0; i < len; i++) {
            if (voterslist[id][i] == voter) {
                return true;
            }
        }
        return false;
    }

    function isTimePassed(uint256 id) public view returns (bool) {
        if (
            block.timestamp - pollidtovote[id].createdtime >
            pollidtovote[id].votingtime
        ) {
            return true;
        }
        return false;
    }

    function getWinner(uint256 id) public returns (string[] memory) {
        string[] memory result = new string[](2);
        result[0] = "DMK";
        result[1] = "ADMK";
        string memory winner;
        bool istimepassed = isTimePassed(id);
        if (!istimepassed) {
            revert Voting_stillopen();
        }

        uint256 max = 0;
        uint256 len = pollidtovote[id].options.length;
        for (uint256 i = 0; i < len; i++) {
            string memory name = pollidtovote[id].options[i];
            uint256 count = votecount[id][name];
            if (count > max) {
                max = count;
                winner = name;
            }
        }
        console.log("Hello");
        // console.log(winner);
        emit winnerAttained(id, winner);
        pollidtowinner[id] = winner;
        return result;
        // uint256 len=voterslist[id].length;
        // for(int i=0;i<len;i++){

        // }
    }

    function getWinnerWithoutStateChange(
        uint256 id
    ) public view returns (string memory winner) {
        bool istimepassed = isTimePassed(id);
        if (!istimepassed) {
            // revert Voting_stillopen();
        }
        uint256 max = 0;
        uint256 len = pollidtovote[id].options.length;
        for (uint256 i = 0; i < len; i++) {
            string memory name = pollidtovote[id].options[i];
            uint256 count = votecount[id][name];
            if (count > max) {
                max = count;
                winner = name;
            }
        }
        console.log(winner, " hdbjdkjk");
    }

    function getNumberOfVoters(uint256 id) public view returns (uint256) {
        return voterslist[id].length;
    }

    function getNumberOfVotes(
        uint256 id,
        string memory name
    ) public view returns (uint256) {
        return votecount[id][name];
    }
    // receive() external payable{}
    // callback() external payable{}
}
