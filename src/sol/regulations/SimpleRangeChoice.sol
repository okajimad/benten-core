pragma solidity ^0.4.19;
import "../games/ExPostGame_V4_R4.sol";
import "../MajorityVote_R4.sol";
import "../ETHCashier.sol";
import "./ExPostRegulation.sol";

/* 8 byte bet content means: [min_value(4byte)] [max_value(4byte)]
   if the truth value is within the range, the better wins. otherwise loses.
 */

contract SimpleRangeChoice is ExPostRegulation {

	constructor(FeeType owner_ft, uint owner_fv, FeeType cashier_ft, uint cashier_fv) public
	ExPostRegulation(owner_ft, owner_fv, cashier_ft, cashier_fv) {
	}

	function description() public pure returns(string) {
		return "Benten betting regulation for Soccer";
	}
	function gameClass() public pure returns(string) {
		return "ExPostGame_V4_R4";
	}
	function isValidBet(IGame game, bytes8 bet) public view returns(bool) {

		return game.hasDescription_Wide(bet);
	}
  function correctAnswerList_Wide(bytes8 truth, bytes8[] votes) public view returns(int[] answers) {

		answers = new int[](votes.length);
		uint itruth = (uint)((truth & 0xFFFFFFFF00000000)) >> 32;
		for(uint i = 0; i < votes.length; i++) {
			bytes8 vote = votes[i];
			uint range_min = (uint)((vote & 0xFFFF000000000000) >> 48);
			uint range_max = (uint)((vote & 0x0000FFFF00000000) >> 32);

			if(range_min <= itruth && itruth <= range_max)  //win
				answers[i] = 1;
			else //lose
				answers[i] = 0;
		}
		return answers;
  }

}