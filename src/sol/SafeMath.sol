pragma solidity ^0.4.0;

library SafeMath {
	// returns a * b / 1000 with overflow check
	function mulPermil(uint a, uint b) public pure returns(uint) {
		if(a==0 || b==0) return 0;
		uint c = a * b;
		assert(c / b == a);
		return c/1000;
	}
}