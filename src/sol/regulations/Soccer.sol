pragma solidity ^0.4.0;
import "../IRegulation.sol";
import "../games/DivideEqually_V8_R8.sol";
import "../MajorityVote_R8.sol";
import "../ETHCashier.sol";

contract Soccer is IRegulation {
    function description() public pure returns(string) {
      return "Benten betting regulation for Soccer";
    }
    function url() public pure returns (string) {
      return "https://.....";
    }
    function documentHash() public pure returns (bytes32) {
      return 0x01234567890123456789012345678901;
    }
    function resultList() public pure returns(bytes8[], bytes16[]) {
      bytes8[] memory r = new bytes8[](3);
      bytes16[] memory s = new bytes16[](3);
      //string[] cannot be return type
      r[0] = 0x000001; s[0] = "away team wins";
      r[1] = 0x000100; s[1] = "draw";
      r[2] = 0x010000; s[2] = "home team wins";
      return (r, s);
    }

    mapping (address => address) internal _gameMemo;

    function deployGame(address cashier, uint bet_open_time, uint bet_dead_time, uint vote_open_time, uint vote_dead_time, 
      DivideEqually_V8_R8.CashierFeeType feetype, uint cashierfee) public payable {

      MajorityVote_R8 vote = new MajorityVote_R8(cashier, this, msg.sender, vote_open_time, vote_dead_time);
      ETHCashier ec = ETHCashier(cashier);
      ec.ownerSupply(vote); //pay owner supply

      DivideEqually_V8_R8 game = new DivideEqually_V8_R8(cashier, vote, this, bet_open_time, bet_dead_time, false); //cancel not allowed
      game.setCashierFee(feetype, cashierfee);
      _gameMemo[msg.sender] = game;
    }
    function getLastDeployedGame() public view returns(address) {
      return _gameMemo[msg.sender];
    }

}