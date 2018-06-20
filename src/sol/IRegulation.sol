pragma solidity ^0.4.0;

interface IRegulation {
    function description() external view returns(string);
    function url() external view returns(string);
    function documentHash() external view returns (bytes32);

}