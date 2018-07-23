
pragma solidity ^0.4.0;
import "./BentenContractBase.sol";
import "./IRegulation.sol";

contract FixedOddsRegulation is BentenContractBase, IRegulation {

	FeeType internal _cashierFeeType;
	uint internal _cashierFee;

	constructor(FeeType ft, uint fee) public {
		_cashierFeeType = ft;
		_cashierFee = fee;
	}

	//derived class implement one of these function
	// (calcFixedOddsRefund(content, truth) family
	function calcFixedOddsRefund_V8_R8(bytes8 , bytes8 ) public pure returns(int) {
		return 0;
	}
	function calcFixedOddsRefund_V4_R4(bytes4 , bytes4 ) public pure returns(int) {
		return 0;
	}
	function calcFixedOddsRefund_V8_R4(bytes8 , bytes4 ) public pure returns(int) {
		return 0;
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

}
