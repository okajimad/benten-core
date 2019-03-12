pragma solidity ^0.4.0;

import "./ICoinCashier.sol";
import "./BettingTarget_V4.sol";
/*
  Warning: This .solp file is converted solidity source code by the benten preprocessor
  You should 'npm run preprocess' to get solidity file
*/
contract ResultAnnouncement_R4   	is BettingTarget_V4{
    string private OutputFile = "ResultAnnouncement_R4.sol";
    uint internal _openTime;
    uint internal _lockTime;
    bool internal _closed;

    event Closed(bytes4 truth);

    constructor(address cashier, address regulation, address owner, uint open_time, uint lock_time) public {
        _cashier = ICoinCashier(cashier);
        _regulation = IRegulation(regulation);
        _openTime = open_time;
        _lockTime = lock_time;
        _closed = false;
        _owner = owner; // if a Game deploys new Announcement, msg.sender is Game contract. the owner should be the onwer of Game. 
    }
    function cashier() public view returns(address) {
        return _cashier;
    }
    function regulation() public view returns(address) {
        return _regulation;
    }
    function votingFee() public view returns(uint) {
        return 0;
    }

    function voteAcceptable() public view returns(bool) {
        return _openTime <= getNow() && getNow() < _lockTime && !_closed;
    }
    function openTime() public view returns(uint) {
        return _openTime;
    }
    function lockTime() public view returns(uint) {
        return _lockTime;
    }
    function isClosed() public view returns(bool) {
        return _closed;
    }
    function isBeforeOpen() public view returns(bool) {
        return _openTime > getNow();
    }
    function isAfterLock() public view returns(bool) {
        return _lockTime < getNow();
    }
    function truth() public view returns(bytes4);

}
