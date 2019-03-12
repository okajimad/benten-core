pragma solidity ^0.4.0;
/*
  Warning: This .solp file is converted solidity source code by the benten preprocessor
  You should 'npm run preprocess' to get solidity file
*/
import "./BentenContractBase.sol";
import "./ICoinCashier.sol";
import "./IRegulation.sol";

contract BettingTarget_V8   	is BentenContractBase {
    string private OutputFile = "BettingTarget_V8.sol";
    ICoinCashier internal _cashier;
    IRegulation internal _regulation;
    
    function betBody(address sender, bytes8 content, uint coin) internal;
    function ownerSupplyBody(uint coin) internal;

    modifier onlyOwnerOrCashier() {
        //require(msg.sender == _owner || msg.sender == address(_cashier));
        _;
    }

    uint internal _totalBettings; //current total betting volume
    uint internal _totalBettingsLimit; // total and per action limit of betting.  0 means no limit
    uint internal _oneTimeBettingsLimit;

    function getBettingsLimit() public view returns(uint, uint, uint) {
        return (_oneTimeBettingsLimit, _totalBettingsLimit, _totalBettingsLimit==0? 0 : _totalBettingsLimit - _totalBettings);
    }
    function setBettingsLimit(uint total_limit, uint one_time_limit) public onlyOwner {
        if(_totalBettings!=0) 
            {setLastError("settings cannot be changed after first bet"); return;}
        _totalBettings = total_limit;
        _oneTimeBettingsLimit = one_time_limit;
    }

    function bet(address sender, bytes8 content, uint coin) public {
        //this restriction is important
        if(msg.sender != address(_cashier)) 
            {setLastError("betting source is not ICoinCashier"); return;}
        if(_totalBettingsLimit!=0 && _totalBettings + coin > _totalBettingsLimit)
            {setLastError("exceeding total betting limit"); return;}
        if(_oneTimeBettingsLimit!=0 && coin > _oneTimeBettingsLimit)
            {setLastError("exceeding one time betting limit"); return;}

        betBody(sender, content, coin);
    }

    function ownerSupply(uint coin) public {
        //this restriction is important
        if(msg.sender != address(_cashier)) 
            {setLastError("ownerSupply source is not ICoinCashier"); return;}

        ownerSupplyBody(coin);
    }

    //close voting or betting ( abstract function )
    function close() public;

    //refund to betters by index
    function refundPartial(uint start, uint end) public;
}