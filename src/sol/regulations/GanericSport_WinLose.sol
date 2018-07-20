pragma solidity ^0.4.19;
import "../games/DivideEqually_V4_R4.sol";
import "../MajorityVote_R4.sol";
import "../ETHCashier.sol";
import "../FixedOddsRegulation.sol";
import "../VoteContractPool.sol";

contract GenericSport_WinLose is FixedOddsRegulation {

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

        byte home_byte = truth[1]>=truth[2]? byte(1) : byte(0);
        byte away_byte = truth[1]<=truth[2]? byte(1) : byte(0);

	return (content[1]==home_byte && content[2]==away_byte)? 1 : 0;
    }

    mapping (address => address) internal _gameMemo;
    address internal _lastGame;

    function deployDivideEquallyGame(string title, address mv_pool, address cashier, uint bet_open_time, uint bet_lock_time, uint vote_open_time, uint vote_lock_time, DivideEqually_V4_R4.FeeType cashierfeetype, uint cashierfee, DivideEqually_V4_R4.FeeType ownerfeetype, uint ownerfee) public payable {

      VoteContractPool pool = VoteContractPool(mv_pool);

      MajorityVote_R4 vote = MajorityVote_R4(pool.peek4()); //new MajorityVote_R4(cashier, address(this), msg.sender, vote_open_time, vote_lock_time);
      if(vote==address(0)) revert();
      pool.pop4();

      vote.activate(cashier, address(this), msg.sender, vote_open_time, vote_lock_time);
      ETHCashier ec = ETHCashier(cashier);
      // ec.ownerSupply(vote, owner_supply_coin); //CoinCashier style
      //ec.ownerSupply(vote); //pay owner supply
      DivideEqually_V4_R4 game = new DivideEqually_V4_R4(title, cashier, vote, address(this), bet_open_time, bet_lock_time, false); //cancel not allowed
      game.setCashierFee(cashierfeetype, cashierfee);
      game.setGameOwnerFee(ownerfeetype, ownerfee);
      _gameMemo[msg.sender] = game;
      _lastGame = game;
    }

    function getLastDeployedGame() public view returns(address) {
      return _gameMemo[msg.sender];
    }
    function lastGame() public view returns(address) { return _lastGame; }

}