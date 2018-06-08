/*
  CoinCashier interface
*/

pragma solidity ^0.4.0;

interface ICoinCashier {

	function balanceOf(address a) external view returns(uint);

	function deposit() payable external;
	function withdraw(uint coin) external;

	//single transfer
	function transferCoin(address to, uint coin) external;
	//bulk transfer
	// if we modify multiTransferCoin to 'eternal' method, solidity compiler generates error.
	// variable-length array seems to be prohibited in external methods.
	function multiTransferCoin(address[] to, uint[] coin) public;
}
