pragma solidity ^0.4.0;
import "./MajorityVote_R4.sol";
//import "./MajorityVote_R8.sol";

//Vote Contract Pool:
//  To deploy games in 1 transaction, Vote contract must be prepared before the deployment of Game.
contract VoteContractPool {
	address[] internal _MajorityVote8;
	address[] internal _MajorityVote4;

	function reserve4(uint count) public {
		address a0 = address(0);
		for(uint i=0; i<count; i++) {
			MajorityVote_R4 v = new MajorityVote_R4(a0, a0, a0, 0, 0);
			_MajorityVote4.push(v);
		}
	}
	function reserve4_F5() public {
		address a0 = address(0);
		for(uint i=0; i<5; i++) {
			MajorityVote_R4 v = new MajorityVote_R4(a0, a0, a0, 0, 0);
			_MajorityVote4.push(v);
		}
	}

	function remaining4() public view returns(uint) {
		return _MajorityVote4.length;
	}

	uint private _uint_v;
	function prac_set_uint(uint v) public {
		_uint_v = v*2;
	}
	function prac_get_uint() public view returns(uint) {
		return _uint_v;
	}
	int private _int_v;
	function prac_set_int(int v) public {
		_int_v = v*2;
	}
	function prac_get_int() public view returns(int) {
		return _int_v;
	}
	uint32 private _uint32_v;
	function prac_set_uint32(uint32 v) public {
		_uint32_v = v*2;
	}
	function prac_get_uint32() public view returns(uint32) {
		return _uint32_v;
	}
	string private _string_v;
	function prac_set_string(string v) public {
		_string_v = v;
	}
	function prac_get_string() public view returns(string) {
		return _string_v;
	}

	
	//transaction cannot return values...

	function peek4() public view returns(address) {
		return _MajorityVote4[_MajorityVote4.length-1];
	}
	function pop4() public {
		delete _MajorityVote4[_MajorityVote4.length-1];
		_MajorityVote4.length--;
	}

}
