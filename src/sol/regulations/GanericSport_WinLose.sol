pragma solidity ^0.4.19;
import "../ExPostGame_V4_R4.sol";
import "../MajorityVote_R4.sol";
import "../ETHCashier.sol";
import "../ExPostRegulation.sol";
import "../VoteContractPool.sol";

contract GenericSport_WinLose is ExPostRegulation {

	constructor(FeeType owner_ft, uint owner_fv, FeeType cashier_ft, uint cashier_fv) public ExPostRegulation(owner_ft, owner_fv, cashier_ft, cashier_fv) {
	}

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

    function calcOddsList_V4_R4(bytes4 truth, bytes4[] votes, uint[] volumes) public view returns(uint[] odds, uint owner_fee) {
        uint total_vol = 0;
	uint i = 0;
	for(i=0; i<volumes.length; i++) total_vol += volumes[i];

	byte home_byte = truth[1]>=truth[2]? byte(1) : byte(0);
        byte away_byte = truth[1]<=truth[2]? byte(1) : byte(0);
	
	odds = new uint[](votes.length);
	owner_fee = calcOwnerFee(total_vol);
	uint refund = total_vol - owner_fee;
	for(i=0; i<votes.length; i++) {
		bytes4 vote = votes[i];
		if(volumes[i]!=0 && vote[1]==home_byte && vote[2]==away_byte)  //win
			odds[i] = refund * 1000 / volumes[i]; //permil
		else //lose
			odds[i] = 0;
	}
	return (odds, owner_fee);
    }

    mapping (address => address) internal _gameMemo;

    function deployExPostGame_V4_R4(string title, address mv_pool, address cashier, uint bet_open_time, uint bet_lock_time, uint vote_open_time, uint vote_lock_time) public {

      VoteContractPool pool = VoteContractPool(mv_pool);

      MajorityVote_R4 vote = MajorityVote_R4(pool.peek4()); //new MajorityVote_R4(cashier, address(this), msg.sender, vote_open_time, vote_lock_time);
      if(vote==address(0)) revert();
      pool.pop4();

      vote.activate(cashier, address(this), msg.sender, vote_open_time, vote_lock_time);
      ExPostGame_V4_R4 game = new ExPostGame_V4_R4(title, cashier, vote, address(this), msg.sender, bet_open_time, bet_lock_time, false); //cancel not allowed
      _gameMemo[msg.sender] = game;
    }

    function getLastDeployedGameOf(address from) public view returns(address) {
      return _gameMemo[from];
    }

}