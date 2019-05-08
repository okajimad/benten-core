pragma solidity ^0.4.0;

interface IGame  {

	function totalBettings() external view returns(uint);

	function currentBettingList_Wide() external view returns(bytes8[], uint[], uint[]);

	function setResultSource(address source) external;

	function regulation() external view returns(address);

	function hasDescription_Wide(bytes8 v8) external view returns(bool);
}

interface IVariableOddsGame { //interfaces canot inherit!
	function estimateTotalRefund_Wide(bytes8 result) external view returns(uint);
}