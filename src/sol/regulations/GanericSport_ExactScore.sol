pragma solidity ^0.4.0;
import "../IRegulation.sol";
import "../games/DivideEqually_V8_R8.sol";
import "../MajorityVote_R8.sol";
import "../ETHCashier.sol";

contract GenericSport_ExactScore is FixedOddsRegulation {

    //description of voting content:
    //byte [0]  confiscated game(1), valid game(0)
    //byte [1]  home team/person score
    //byte [2]  away team/person score

    function description() public pure returns(string) {
      return "Benten betting regulation for Soccer";
    }
    function url() public pure returns (string) {
      return "https://.....";
    }
    function documentHash() public pure returns (bytes32) {
      return 0x01234567890123456789012345678901;
    }

    function calcFixedOddsRefund_V8_R8(bytes8 content, bytes8 truth) public pure returns(int) {
        if(truth[0]==1) return -1; // confiscated game
	
	return content==truth? 1 : 0;
    }

    mapping (address => address) internal _gameMemo;

    function deployDivideEquallyGame(string title, address cashier, uint bet_open_time, uint bet_dead_time, uint vote_open_time, uint vote_dead_time, 
      DivideEqually_V8_R8.CashierFeeType feetype, uint cashierfee) public payable {

      MajorityVote_R8 vote = new MajorityVote_R8(cashier, this, msg.sender, vote_open_time, vote_dead_time);
      ETHCashier ec = ETHCashier(cashier);
      // ec.ownerSupply(vote, owner_supply_coin); //CoinCashier style
      ec.ownerSupply(vote); //pay owner supply

      DivideEqually_V8_R8 game = new DivideEqually_V8_R8(title, cashier, vote, this, bet_open_time, bet_dead_time, false); //cancel not allowed
      game.setCashierFee(feetype, cashierfee);
      _gameMemo[msg.sender] = game;
    }
    function getLastDeployedGame() public view returns(address) {
      return _gameMemo[msg.sender];
    }

}