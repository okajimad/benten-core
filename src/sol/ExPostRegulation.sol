
pragma solidity ^0.4.0;
import "./FixedOddsRegulation.sol";
import "./IGame.sol";

contract ExPostRegulation is FixedOddsRegulation {

	FeeType internal _ownerFeeType;
	uint internal _ownerFee;

	constructor(FeeType owner_ft, uint owner_fv, FeeType cashier_ft, uint cashier_fv) public FixedOddsRegulation(cashier_ft, cashier_fv) {
		_ownerFeeType = owner_ft;
		_ownerFee = owner_fv;
	}

	function ownerFee() external view returns(FeeType, uint) {
		return (_ownerFeeType, _ownerFee);
	}

	function calcOwnerFee(uint total_bettings) public view returns(uint) {
		if(_ownerFeeType==FeeType.Value)
			return total_bettings < _ownerFee? total_bettings : _ownerFee;
		else
			return permilMul(total_bettings, _ownerFee);
	}

	// returns refunding odds list
	function correctAnswerList_Wide(bytes8 truth, bytes8[] votes) public view returns(int[] answers);

	function calcRefundOdds(IGame game, bytes8 truth) public view returns(int[] permil_odds, uint cashier_fee) {
		bytes8[] memory contents;
		uint[] memory volumes;
		uint[] memory count_unused;
		(contents, count_unused, volumes) = game.currentBettingList_Wide();
		uint total = 0;
		uint i;
		for(i = 0; i<contents.length; i++) {
			total += volumes[i];
		}
		cashier_fee = calcCashierFee(total);
		uint owner_fee = calcOwnerFee(total);
		//if total bettings are too low, fees are reset to 0
		if(cashier_fee + owner_fee > total) {
			owner_fee = 0;
			cashier_fee = 0;
		}
		uint total_refund = total - cashier_fee - owner_fee;
		int[] memory answer_list =  correctAnswerList_Wide(truth, contents);

		int[] memory odds = new int[](contents.length);
		for(i = 0; i<contents.length; i++) {
			int o = answer_list[i];
			if(o > 0)
				odds[i] = int(total_refund * 1000 / volumes[i] );
			else if(o == 0)
				odds[i] = 0;
			else
				odds[i] = -1;
		}
		return (odds, cashier_fee);
	}

}
