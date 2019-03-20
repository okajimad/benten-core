
pragma solidity ^0.4.0;
import "./FixedOddsRegulation.sol";
import "../IGame.sol";
import "../MajorityVote_R4.sol";
import "../games/ExPostGame_V4_R4.sol";

contract FixedOwnerFeeRegulation is FixedOddsRegulation {

	FeeType internal _ownerFeeType;
	uint internal _ownerFee;

	constructor(FeeType owner_ft, uint owner_fv, FeeType cashier_ft, uint cashier_fv) public FixedOddsRegulation(cashier_ft, cashier_fv) {
		_ownerFeeType = owner_ft;
		_ownerFee = owner_fv;
		_version = "FixedOwnerFee.1";
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

}
