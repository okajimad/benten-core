
pragma solidity ^0.4.0;
import "./IRegulation.sol";

contract FixedOddsRegulation is IRegulation {

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
}
