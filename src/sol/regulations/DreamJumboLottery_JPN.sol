pragma solidity ^0.4.0;
import "../IRegulation.sol";

contract DreamJumboLottery_JPN is IRegulation {
    /*
       ドリームジャンボ宝くじの系列 X組-Y番 で、Xは1-100, Yは100000-199999
       この番号を(X-1)*100000 + (Y-100000) とすれば、0～9999999 の整数に割り振れる。
       これは３バイト必要なのでbytes3で表す
    */
    function description() public view returns(string) {
      return "";
    }
    function url() public view returns (string) {
      return "https://.....";
    }
    function documentHash() public view returns (bytes32) {
      return 0x01234567890123456789012345678901;
    }


    enum Result {
      None,
      Prize1,       //１等
      Prize1_Zengo, //前後賞
      Prize1_Kumi,  //組違い
      Prize2,       //２等
      Prize3        //３等
    }

    function check(bytes3 rottely, bytes3 winning_info) public pure returns(Result) {
      uint g = uint(rottely) / 100000;
      uint n = uint(rottely) % 100000;

      uint p1_g = uint(winning_info) / 100000;
      uint p1_n = uint(winning_info) % 100000;

      if(g==p1_g && n==p1_n) 
        return Result.Prize1;
      else if(n==p1_n)
        return Result.Prize1_Kumi;
      else {
        uint m = (n - p1_n) % 100000;
        if(m==1 || m==99999) return Result.Prize1_Zengo;
      }
      return Result.None;
    }

	function verifyVotingContent(bytes8 ) external view returns(bool) {
	  return true;
	}
	function verifyBetContent(bytes8 ) external view returns(bool) {
	return true;
	}


	/*function calculateRefund(bytes8 , bytes8, uint volume) external view returns(uint) {
	return 0;
	}*/

}