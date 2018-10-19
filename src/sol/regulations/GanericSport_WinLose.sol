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

    function correctAnswerList_Wide(bytes8 truth, bytes8[] votes) public view returns(int[] answers) {
    
	bool aborted = truth[0]!=0; // if the game is aborted in real world
	byte home_byte = truth[1]>=truth[2]? byte(1) : byte(0);
        byte away_byte = truth[1]<=truth[2]? byte(1) : byte(0);
	
	answers = new int[](votes.length);
	for(uint i=0; i<votes.length; i++) {
		bytes8 vote = votes[i];
		if(aborted)
			answers[i] = -1;
		else if(vote[1]==home_byte && vote[2]==away_byte)  //win
			answers[i] = 1;
		else //lose
			answers[i] = 0;
	}
	return answers;
    }


}