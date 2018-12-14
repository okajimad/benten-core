pragma solidity ^0.4.19;

// testing transactions accessing multiple contracts. PoA network
contract InterContract {
	//inter contracts transaction inspection
	int private _a;
	InterContract_Inner private _b;
	function testA(int a, int b) public {
		_a = a * 2;
		if(b == 1) _a += _b.getV();
		else if(b == 2) _b.setV(_a);
	}
	function createInner() public {
		_b = new InterContract_Inner();
	}
	function getA() public view returns(int) { return _a; }

}

contract InterContract_Inner {
	int private _v;
	function setV(int v) public { _v = v * 3; }
	function getV() public view returns(int) { return _v; }
}