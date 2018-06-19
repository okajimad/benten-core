pragma solidity ^0.4.0;

contract ValidateSignature {
	//web3.eth.sign returns 65 bytes value.
	//r: first 32 bytes
	//s: next 32 bytes
	//v: last 1 byte
	function verify(bytes32 r, bytes32 s, uint8 v, bytes32 hash) public pure returns(address) {
		//we found this prefix trick info at https://ethereum.stackexchange.com/questions/15364/ecrecover-from-geth-and-web3-eth-sign
		bytes memory prefix = "\x19Ethereum Signed Message:\n32";
		bytes32 prefixedHash = keccak256(prefix, hash);
		return ecrecover(prefixedHash, v, r, s);
	}

}
