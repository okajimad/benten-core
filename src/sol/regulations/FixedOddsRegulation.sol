
pragma solidity ^0.4.0;
import "../BentenContractBase.sol";
import "../IRegulation.sol";
import "../IGame.sol";

contract FixedOddsRegulation is BentenContractBase, IRegulation {

	FeeType internal _cashierFeeType;
	uint internal _cashierFee;

	constructor(FeeType ft, uint fee) public {
		_cashierFeeType = ft;
		_cashierFee = fee;
		_version = "FixedOddsRegulation(abstract)";
	}


	function cashierFee() external view returns(FeeType, uint) {
		return (_cashierFeeType, _cashierFee);
	}


	function calcCashierFee(uint total_bettings) public view returns(uint) {
		if(_cashierFeeType==FeeType.Value)
			return total_bettings < _cashierFee? total_bettings : _cashierFee;
		else
			return permilMul(total_bettings, _cashierFee);
	}

	function gameClass() public pure returns(string) {
		return "undefined game";
	}


	/*
	watch betting status of 'game' and returns refunds odds for given 'truth'. fees are considered.
	if odds is -1, it means the game result is confiscated.
	*/
	function calcRefundOdds(IGame game, bytes8 truth) public view returns(int[] permil_odds, int total_refund, int cashier_fee, int owner_fee);

}
