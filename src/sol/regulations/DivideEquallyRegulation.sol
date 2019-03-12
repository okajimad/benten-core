pragma solidity ^0.4.0;
import "../IRegulation.sol";

contract DivideEquallyRegulation is IRegulation {
    function description() public view returns(string) {
        return "Benten betting sample";
    }
    function url() public view returns (string) {
        return "https://.....";
    }
    function documentHash() public view returns (bytes32) {
        return 0x01234567890123456789012345678901;
    }

}