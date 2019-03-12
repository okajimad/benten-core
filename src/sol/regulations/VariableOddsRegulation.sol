
pragma solidity ^0.4.0;
import "../IGame.sol";
import "../games/VariableOddsGame_V4_R4.sol";
import "../MajorityVote_R4.sol";
import "../games/ExPostGame_V4_R4.sol";
import "../BentenContractBase.sol";
import "../IRegulation.sol";

contract VariableOddsRegulation is BentenContractBase, IRegulation {

	FeeType internal _cashierFeeType;
	uint internal _cashierFee;

	constructor(FeeType ft, uint fee) public {
		_cashierFeeType = ft;
		_cashierFee = fee;
		_version = "VariableOddsRegulation";
	}
    function description() public pure returns(string) {
      return "Benten betting regulation for Soccer";
    }
    function url() public pure returns (string) {
      return "https://.....";
    }
    function documentHash() public pure returns (bytes32) {
      return 0x01234567890123456789012345678901;
    }


	function cashierFee() external view returns(FeeType, uint) {
		return (_cashierFeeType, _cashierFee);
	}


	function calcCashierFee(uint total_bettings) public view returns(uint) {
		if(_cashierFeeType==FeeType.Value)
			return total_bettings < _cashierFee? total_bettings : _cashierFee;
		else
			return permilMul(total_bettings, _cashierFee);
	}

	// betting content may be simpler than voting result
	// for example, in sport games, following case is usual: [voting content:actual score] [betting content: select winner] 
	function convertVoteResultToBet(bytes8 truth) public pure returns(bytes8) {
		return truth;
	}

	/*
	watch betting status of 'game' and returns refunds odds for given 'truth'. fees are considered.
	if odds is -1, it means the game result is confiscated.
	*/
	function calcRefundOdds(IGame game_, bytes8 truth) public view returns(int[] permil_average_odds, int total_refund_, int cashier_fee_, int owner_fee) {
		
		truth = convertVoteResultToBet(truth);

		uint total_bet = game_.totalBettings();

		bytes8[] memory contents;
		uint[] memory volumes;
		uint[] memory count_unused;
		(contents, count_unused, volumes) = game_.currentBettingList_Wide();
		uint total_refund = (IVariableOddsGame(game_)).estimateTotalRefund_Wide(truth);
		uint cashier_fee = calcCashierFee(total_bet);
		//if total bettings are too low, fees are reset to 0
		if(cashier_fee > total_bet) {
			cashier_fee = 0;
		}
		
		int[] memory odds = new int[](contents.length);
		for(uint i=0; i<odds.length; i++) 
			if(contents[i] == truth) odds[i] = volumes[i]==0? 0 : int(total_refund * 1000 / volumes[i]);

		return (odds, int(total_refund), int(cashier_fee), int(total_bet) - int(total_refund) - int(cashier_fee));
	}


}
