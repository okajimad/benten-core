
pragma solidity ^0.4.0;
import "./FixedOwnerFeeRegulation.sol";
import "../IGame.sol";
import "../MajorityVote_R4.sol";
import "../games/ExPostGame_V4_R4.sol";

contract ExPostRegulation is FixedOwnerFeeRegulation {


	constructor(FeeType owner_ft, uint owner_fv, FeeType cashier_ft, uint cashier_fv) public FixedOwnerFeeRegulation(owner_ft, owner_fv, cashier_ft, cashier_fv) {
		_ownerFeeType = owner_ft;
		_ownerFee = owner_fv;
		_version = "ExPostRegulation.1";
	}

	// returns refunding odds list
	function correctAnswerList_Wide(bytes8 truth, bytes8[] votes) public view returns(int[] answers);

	function calcRefundOdds(IGame game, bytes8 truth) public view returns(int[] permil_odds, int total_refund_, int cashier_fee_, int owner_fee_) {
		bytes8[] memory contents;
		uint[] memory volumes;
		uint[] memory count_unused;
		(contents, count_unused, volumes) = game.currentBettingList_Wide();
		uint total = game.totalBettings();
		uint cashier_fee = calcCashierFee(total);
		uint owner_fee = calcOwnerFee(total);
		//if total bettings are too low, fees are reset to 0
		if(cashier_fee + owner_fee > total) {
			owner_fee = 0;
			cashier_fee = 0;
		}
		uint total_refund = total - cashier_fee - owner_fee;

		return (makeOddsList(contents, truth, total_refund, volumes), int(total_refund), int(cashier_fee), int(owner_fee));
	}
	function makeOddsList(bytes8[] contents, bytes8 truth, uint total_refund, uint[] volumes) private view returns(int[]) {
		int[] memory answer_list =  correctAnswerList_Wide(truth, contents);
		int[] memory odds = new int[](contents.length);
		for(uint i = 0; i<contents.length; i++) {
			int o = answer_list[i];
			if(o > 0)
				odds[i] = int(total_refund * 1000 / volumes[i] );
			else if(o == 0)
				odds[i] = 0;
			else
				odds[i] = -1;
		}
		return odds;
	}


}
