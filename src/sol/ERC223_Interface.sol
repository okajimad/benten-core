pragma solidity ^0.4.9;

 /* New ERC223 contract interface */

interface ERC223 {
    function balanceOf(address who) external view returns (uint);

    function name() external view returns (string _name);
    function symbol() external view returns (string _symbol);
    function decimals() external view returns (uint8 _decimals);
    function totalSupply() external view returns (uint256 _supply);

    //solidity compiler claims that function overloading in interface is an error. So we change the modifier to public
    function transfer(address to, uint value) public returns (bool ok);
    function transfer(address to, uint value, bytes data) public returns (bool ok);
    function transfer(address to, uint value, bytes data, string custom_fallback) public returns (bool ok);

    event Transfer(address indexed from, address indexed to, uint value, bytes indexed data);
}

interface ERC223_ContractReceiver {
    function tokenFallback(address _from, uint _value, bytes _data) external;
}