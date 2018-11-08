pragma solidity ^0.4.0;
import "./BentenContractBase.sol";

interface IRegulation {

    function description() external view returns(string);
    function url() external view returns(string);
    function documentHash() external view returns (bytes32);

    function gameClass() external pure returns(string);

    function cashierFee() external view returns(BentenContractBase.FeeType, uint);

    function calcCashierFee(uint total_bettings) external view returns(uint);


}