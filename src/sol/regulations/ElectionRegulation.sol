pragma solidity ^0.4.19;
import "../games/ExPostGame_V4_R4.sol";
import "../MajorityVote_R4.sol";
import "./FixedOwnerFeeRegulation.sol";

/*
  Generic Regulation for Election 

  * each candidate either wins or loses
	* participants bet one candidate either win or lose any times
	* voters specify the group of winners

	VOTE_TYPE examples:
	          0x00000001: candidate #1 loses
	          0x80000001: candidate #1 wins
	          0x00000002: candidate #2 loses
	          0x80000002: candidate #2 wins
	          0x00000004: candidate #3 loses
	          0x80000004: candidate #3 wins

  then up to 31 candidates are supported.

	RESULT_TYPE examples:
	          0x00000035: candidate #1, #3, #5, and #6 win
	          0x00000070: candidate #5, #6, and #7 win

	Refunding:
    for each candidate #n, 
		  * refund amount is ([betting for #n win] + [betting for #n lose]) * (1 - [fee ratio])
			* winner takes the refund in proportion to the betting amount
*/

contract ElectionRegulation is FixedOwnerFeeRegulation {

	constructor(FeeType owner_ft, uint owner_fv, FeeType cashier_ft, uint cashier_fv) public FixedOwnerFeeRegulation(owner_ft, owner_fv, cashier_ft, cashier_fv) {
	}

    function description() public pure returns(string) {
      return "";
    }
    function url() public pure returns (string) {
      return "https://.....";
    }
    function documentHash() public pure returns (bytes32) {
      return 0x01234567890123456789012345678901;
    }
	function gameClass() public pure returns(string) {
		return "ExPostGame_V4_R4";
	}

	function calcRefundOdds(IGame game, bytes8 truth) public view returns(int[] permil_odds_, int total_refund, int cashier_fee, int owner_fee) {
		bytes8[] memory contents;
		uint[] memory volumes;
		uint[] memory count_unused;
		(contents, count_unused, volumes) = game.currentBettingList_Wide();

		bytes8 candidate_mask = 0x0000000000000001;
		int[] memory odds = new int[](contents.length);
  	int c;
		int o;
		int r;
		for(uint i = 0; i < 31; i++) {
			(c,o,r) = oneCandidate(candidate_mask, truth, odds, contents, volumes);
			cashier_fee += c;
			owner_fee += o;
			total_refund += r;
			candidate_mask = candidate_mask << 1; // next candidate
		}

		return (odds, total_refund, cashier_fee, owner_fee);

	}

	function oneCandidate(bytes8 candidate_mask, bytes8 truth, int[] memory odds, bytes8[] memory contents, uint[] memory volumes) private view returns(int cashier_fee, int owner_fee, int refund) {
			bytes8 vote_win = candidate_mask | 0x80000000;
			bytes8 vote_lose = candidate_mask;
			int32 index_win = findIndex(contents, vote_win);
			int32 index_lose = findIndex(contents, vote_lose);
			uint volume_win = index_win==-1? 0 : volumes[uint(index_win)];
			uint volume_lose = index_lose==-1? 0 : volumes[uint(index_lose)];
			uint candidate_volume = volume_win + volume_lose; // total betting amount for the candidate

			if(candidate_volume > 0) {
				cashier_fee = int(calcCashierFee(candidate_volume));
				owner_fee = int(calcOwnerFee(candidate_volume));
				refund = int(candidate_volume) - cashier_fee - owner_fee;
				//bool win = (truth & candidate_mask) != 0; // number of local variables get limit!!!!

				if((truth & candidate_mask) != 0) {
					if(index_win != -1)
  					odds[uint(index_win)] = int(uint(refund) * 1000 / volume_win);
				}
				else {
					if(index_lose != -1)
  					odds[uint(index_lose)] = int(uint(refund) * 1000 / volume_lose);
				}
			}

			return (cashier_fee, owner_fee, refund);
	}

    function findIndex(bytes8[] memory bettings, bytes8 content) internal view returns(int32) {
        for(uint i = 0; i<bettings.length; i++) {
            if(content == bettings[i])
                return int32(i);
        }
        return -1;
    }


}