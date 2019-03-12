pragma solidity ^0.4.0;
import "./CoinCashier.sol";
import "./IRegulation.sol";
import "./IGame.sol";
import "./ResultAnnouncement_R4.sol";
import "./MajorityVote_R4.sol";
/*
  Warning: This .solp file is converted solidity source code by the benten preprocessor
  You should 'npm run preprocess' to get solidity file
*/
contract GameBase_V4_R4    	is BettingTarget_V4, IGame {   
    string private OutputFile = "GameBase_V4_R4.sol";

    string internal _title;
    string internal _className;
    address[] internal _addresses; //better list
    uint internal _ownerSupply;

    ResultAnnouncement_R4   	internal _resultSource;
    IRegulation internal _regulation;
    uint internal _openTime;
    uint internal _lockTime;
    bool internal _closed;
    // cancel option
    bool internal _allowCancel;
    bool internal _cancelled;     //flag of cancelling game by owner

    //results: these are set in close() function
    uint internal _totalRefunds;
    uint internal _cashierFee;
    uint internal _ownerRefund;
    address[] internal _refundAddresses;
    uint[] internal _refunds; //corresponding to _refundAddresses
    uint[] internal _refundRemains;

    event Entried(address indexed user, bytes4 content, uint volume);
    event Closed(bytes4 truth, uint userCount, uint totalBetting, uint totalRefund);
    event Cancelled(uint userCount, uint totalBetting, uint totalRefund);

    constructor(string title, address cashier, address result_src, address regulation, address owner, uint open_time, uint lock_time, uint bet_total_limit, uint bet_one_time_limit, bool allow_cancel) public {
        _title = title;
        _owner = owner;
        _cashier = CoinCashier(cashier);
        _resultSource = ResultAnnouncement_R4(result_src);
        _regulation = IRegulation(regulation);
        _openTime = open_time;
        _lockTime = lock_time;
        _totalBettingsLimit = bet_total_limit;
        _oneTimeBettingsLimit = bet_one_time_limit;
        _allowCancel = allow_cancel;
    }

    function title() public view returns(string) {
        return _title;
    }
    function className() public view returns(string) {
        return _className;
    }
    function openTime() public view returns(uint) {
        return _openTime;
    }
    function lockTime() public view returns(uint) {
        return  _lockTime;
    }
    function isClosed() public view returns(bool) {
        return _closed;
    }
    function cancelAllowed() public view returns(bool) {
        return _allowCancel;
    }
    function cancelled() public view returns(bool) {
        return _cancelled;
    }
    function betAcceptable() public view returns(bool) {
        return _openTime <= getNow() && getNow() <= _lockTime && !_cancelled && !_closed;
    }
    function isBeforeOpen() public view returns(bool) {
        return _openTime > getNow();
    }
    function isAfterLock() public view returns(bool) {
        return _lockTime < getNow();
    }


    function ownerSupplyBody(uint coin) internal {
        _ownerSupply += coin;
    }
    function regulation() public view returns(address) {
        return _regulation;
    }
    function resultSource() public view returns(address) {
        return _resultSource;
    }
    function setResultSource(address source) public onlyOwnerOrCashier {
        if(_resultSource != address(0)) revert(); //one time registration is allowed
        _resultSource = ResultAnnouncement_R4(source);
    }
    function getOwnerSupply() public view returns(uint) {
        return _ownerSupply;
    }

    function totalBettings() public view returns(uint) {
        return _totalBettings;
    }
    function totalRefunds() public view returns(uint) {
        require(_closed);
        return _totalRefunds;
    }
    function refundTuple() public view returns(address[] a, uint[] v, uint cf, uint ow) {
        require(_closed);
        return (_refundAddresses, _refunds, _cashierFee, _ownerRefund);
    }

    //Description of each candidate can be embedded in contract storage
    struct CandidateDescription {
        bytes4 content;
        string description;
    }
    CandidateDescription[] internal _descriptions;
    function setDescription(bytes4 content, string new_description) public  {
        require(_openTime > getNow());
        
        for(uint i=0; i<_descriptions.length; i++) {
            CandidateDescription storage e = _descriptions[i];
            if(e.content == content) {
                revert(); //overwriting is not permitted
            }
        }
        CandidateDescription memory ne = CandidateDescription(content, new_description);
        _descriptions.push(ne);
    }
    function setDescription_Multiple(bytes4 content1, string new_description1, bytes4 content2, string new_description2, bytes4 content3, string new_description3, bytes4 content4, string new_description4, bytes4 content5, string new_description5) public  {
        if(bytes(new_description1).length > 0) setDescription(content1, new_description1);
        if(bytes(new_description2).length > 0) setDescription(content2, new_description2);
        if(bytes(new_description3).length > 0) setDescription(content3, new_description3);
        if(bytes(new_description4).length > 0) setDescription(content4, new_description4);
        if(bytes(new_description5).length > 0) setDescription(content5, new_description5);
    }
    
    function getDescription(bytes4 content) public view returns(string) {
        for(uint i=0; i<_descriptions.length; i++) {
            CandidateDescription storage e = _descriptions[i];
            if(e.content == content) {
                return e.description;
            }
        }
        return "";
    }
    function getDescriptionCount() public view returns(uint) {
        return _descriptions.length;
    }

    //partial refunding operation
    function refundPartial(uint start, uint end) public {
        for(uint i = start; i < end; i++) {
            uint v = _refundRemains[i];
            if(v > 0) {
                _cashier.transferCoin(_refundAddresses[i], v);
                _refundRemains[i] = 0;
            }
        }
    }
    function refundRemains() public view returns(address[], uint[]) {
        return (_refundAddresses, _refundRemains);
    }

    // getDescriptionList() style function is not allowed since 'string[]' cannot be used as return type of function!

}
