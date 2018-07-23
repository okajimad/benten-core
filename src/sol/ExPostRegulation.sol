
pragma solidity ^0.4.0;
import "./FixedOddsRegulation.sol";

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

	function calcOddsList_V4_R4(bytes4 , bytes4[] votes, uint[] ) public view returns(uint[] odds, uint owner_fee) {
		uint[] memory r = new uint[](votes.length);
		return (r, 0);
	}
	function calcOddsList_V8_R4(bytes4, bytes8[] votes, uint[] ) public view returns(uint[] odds, uint owner_fee) {
		uint[] memory r = new uint[](votes.length);
		return (r, 0);
	}

}
