pragma solidity ^0.4.0;
import "../IRegulation.sol";

contract Soccer is IRegulation {
    function description() public pure returns(string) {
      return "Benten betting regulation for Soccer";
    }
    function url() public pure returns (string) {
      return "https://.....";
    }
    function documentHash() public pure returns (bytes32) {
      return 0x01234567890123456789012345678901;
    }
    function resultList() public pure returns(bytes8[], bytes16[]) {
      bytes8[] memory r = new bytes8[](3);
      bytes16[] memory s = new bytes16[](3);
      //string[] cannot be return type
      r[0] = 0x000001; s[0] = "away team wins";
      r[1] = 0x000100; s[1] = "draw";
      r[2] = 0x010000; s[2] = "home team wins";
      return (r, s);
    }
}