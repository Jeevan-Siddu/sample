// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Auction {
    address public auctioneer;
    uint256 public endTime;
    uint256 public highestBid;
    address public highestBidder;
    mapping(address => uint256) public bids;

    event BidPlaced(address indexed bidder, uint256 amount);
    event AuctionEnded(address winner, uint256 amount);

    modifier onlyAuctioneer() {
        require(
            msg.sender == auctioneer,
            "Only auctioneer can call this function"
        );
        _;
    }

    modifier onlyBeforeEnd() {
        require(block.timestamp < endTime, "Auction has ended");
        _;
    }

    modifier onlyAfterEnd() {
        require(block.timestamp >= endTime, "Auction has not ended");
        _;
    }

    constructor(uint256 durationInSeconds) {
        auctioneer = msg.sender;
        endTime = block.timestamp + durationInSeconds;
    }

    function placeBid() external payable onlyBeforeEnd {
        require(
            msg.value > highestBid,
            "Bid amount must be higher than current highest bid"
        );
        require(
            msg.sender != highestBidder,
            "You are already the highest bidder"
        );

        if (highestBidder != address(0)) {
            //address(0) means it is an invalid or uninitialised address
            // Refund the previous highest bidder
            payable(highestBidder).transfer(highestBid);
        }

        highestBid = msg.value;
        highestBidder = msg.sender;
        bids[msg.sender] = msg.value;

        emit BidPlaced(msg.sender, msg.value);
    }

    function endAuction() external onlyAuctioneer onlyAfterEnd {
        payable(auctioneer).transfer(address(this).balance);
        emit AuctionEnded(highestBidder, highestBid);
    }
}
