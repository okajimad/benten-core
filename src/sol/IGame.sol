pragma solidity ^0.4.0;

interface IGame  {

	function totalBettings() external view returns(uint);

	function currentBettingList_Wide() public view returns(bytes8[], uint[], uint[]);
}

interface IVariableOddsGame { //interfaces canot inherit!
	function estimateTotalRefund_Wide(bytes8 result) public view returns(uint);
}