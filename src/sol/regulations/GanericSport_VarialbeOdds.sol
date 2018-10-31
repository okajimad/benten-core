pragma solidity ^0.4.19;
import "../VariableOddsRegulation.sol";

contract GenericSport_VariableOdds is VariableOddsRegulation {

	constructor(FeeType cashier_ft, uint cashier_fv) public VariableOddsRegulation(cashier_ft, cashier_fv) {
	}

	function convertVoteResultToBet(bytes8 truth) public pure returns(bytes8) {
		bytes8 v = truth[0]; // validation flag
		bytes8 h = byte((truth[1] >= truth[2])? 1 : 0); //home team wins or draw
		bytes8 a = byte((truth[1] <= truth[2])? 1 : 0); //away team wins or draw
		return v | (h >> 8) | (a >> 16);
	}

}