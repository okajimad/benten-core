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
	
	//transaction cannot return values...

	function peek4() public view returns(address) {
		return _MajorityVote4[_MajorityVote4.length-1];
	}
	function pop4() public {
		delete _MajorityVote4[_MajorityVote4.length-1];
		_MajorityVote4.length--;
	}

}
