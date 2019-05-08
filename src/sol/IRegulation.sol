pragma solidity ^0.4.0;
import "./BentenContractBase.sol";
import "./IGame.sol";

interface IRegulation {

    function description() external view returns(string);

    function gameClass() external pure returns(string);

    function cashierFee() external view returns(BentenContractBase.FeeType, uint);

    function calcCashierFee(uint total_bettings) external view returns(uint);

    function isValidBet(IGame game, bytes8 bet) external view returns(bool);
}