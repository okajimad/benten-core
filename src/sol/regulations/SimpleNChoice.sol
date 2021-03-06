pragma solidity ^0.4.19;
import "../games/ExPostGame_V4_R4.sol";
import "../MajorityVote_R4.sol";
import "../ETHCashier.sol";
import "./ExPostRegulation.sol";

contract SimpleNChoice is ExPostRegulation {

	constructor(FeeType owner_ft, uint owner_fv, FeeType cashier_ft, uint cashier_fv) public
	  ExPostRegulation(owner_ft, owner_fv, cashier_ft, cashier_fv) {
	}

  function description() public pure returns(string) {
    return "Benten betting regulation for Soccer";
  }
	function gameClass() public pure returns(string) {
		return "ExPostGame_V4_R4";
	}
	function isValidBet(IGame, bytes8) public view returns(bool) {
		return true;
	}

	function correctAnswerList_Wide(bytes8 truth, bytes8[] votes) public view returns(int[] answers) {
		answers = new int[](votes.length);

		for(uint i = 0; i < votes.length; i++) {
			bytes8 vote = votes[i];
			if(vote==truth)  //win
				answers[i] = 1;
			else //lose
				answers[i] = 0;
		}
		return answers;
	}

}