
pragma solidity ^0.4.0;
import "./FixedOddsRegulation.sol";
import "./IGame.sol";
import "./VoteContractPool.sol";
import "./MajorityVote_R4.sol";
import "./ExAnteGame_V4_R4.sol";

contract ExAnteRegulation is FixedOddsRegulation {

	constructor(FeeType cashier_ft, uint cashier_fv) public FixedOddsRegulation(cashier_ft, cashier_fv) {
		_version = "ExAnteRegulation.1";
	}

	// returns refunding odds list
	function getOdds(bytes8 truth, bytes8[] bettings) public view returns(int[] odds_) ;

	function calcRefundOdds(IGame game, bytes8 truth) public view returns(int[] permil_odds, int total_refund_, int cashier_fee_, int owner_fee_) {
		bytes8[] memory contents;
		uint[] memory volumes;
		uint[] memory count_unused;
		(contents, count_unused, volumes) = game.currentBettingList_Wide();
		int[] memory odds = getOdds(truth, contents);
		uint total_bet = 0;
		uint total_refund = 0;
		uint i;
		for(i = 0; i<contents.length; i++) {
			total_bet += volumes[i];
			total_refund += permilMul(volumes[i], uint(odds[i]));
		}
		uint cashier_fee = calcCashierFee(total_bet);
		//if total bettings are too low, fees are reset to 0
		if(cashier_fee > total_bet) {
			cashier_fee = 0;
		}
		

		return (odds, int(total_refund), int(cashier_fee), int(total_bet) - int(total_refund) - int(cashier_fee));
	}


}
