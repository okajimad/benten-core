pragma solidity ^0.4.19;
import "../games/ExAnteGame_V4_R4.sol";
import "../MajorityVote_R4.sol";
import "../ETHCashier.sol";
import "./ExAnteRegulation.sol";

contract ChohanRegulation is ExAnteRegulation {

    function description() public pure returns(string) {
      return "Benten betting regulation for Cho-han";
    }
    function url() public pure returns (string) {
      return "https://.....";
    }
    function documentHash() public pure returns (bytes32) {
      return 0x01234567890123456789012345678901;
    }

	int private _winner_refund_ratio;

	constructor(int winner_refund_ratio, FeeType cashier_ft, uint cashier_fv) public ExAnteRegulation(cashier_ft, cashier_fv) {
		_winner_refund_ratio = winner_refund_ratio; //if 5% fee, winner_refund_ratio must be 1950
	}
	
	// truth: 3,4バイト目がサイコロの目
	// betting: ０が丁、１が半

	function getOdds(bytes8 truth, bytes8[] bettings) public view returns(int[] odds_) {
		int[] memory odds = new int[](bettings.length);
		bool even = (( uint(truth[2]) + uint(truth[3])) & 1) == 0;
		for(uint i=0; i<bettings.length; i++) {
			int b = int(bettings[i][3]);
			if(b == 0)
				odds[i] = even? _winner_refund_ratio : 0;
			else if(b == 1)
				odds[i] = even? 0 : _winner_refund_ratio;
			else
				odds[i] = 0;
		}
		return odds;
	}

	function bytesTest(bytes8 val, uint index) public pure returns(int) {
		return int( val[index] );
	}


}