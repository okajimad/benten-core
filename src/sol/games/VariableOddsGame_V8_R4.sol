pragma solidity ^0.4.0;
import "../CoinCashier.sol";
import "../IRegulation.sol";
import "./GameBase_V8_R4.sol";

contract VariableOddsGame_V8_R4    	is GameBase_V8_R4, IVariableOddsGame {
    string private OutputFile = "games\VariableOddsGame_V8_R4.sol";
    struct Entry {
        uint32 odds;
        bytes8 content;
        uint volume; 
    }
    struct CurrentOdds {
        uint32 odds;
        bytes8 content;
    }
    mapping (address => Entry[]) private _entries;
    uint private _betCount;
    CurrentOdds[] private _currentOdds;

    constructor(string title, address cashier, address voting, address regulation, address owner, uint open_time, uint close_time, uint bet_total_limit, uint bet_one_time_limit, bool allow_cancel) public GameBase_V8_R4(title, cashier, voting, regulation, owner, open_time, close_time, bet_total_limit, bet_one_time_limit, allow_cancel) {
        _version = "VariableOddsGame.1";
    }

    function oddsList() public view returns(bytes8[], uint[]) {
        bytes8[] memory candidates = new bytes8[](_currentOdds.length);
        uint[] memory odds = new uint[](_currentOdds.length);
        uint i;
        for(i = 0; i<_currentOdds.length; i++) {
            candidates[i] = _currentOdds[i].content;
            odds[i] = _currentOdds[i].odds;
        }
        return (candidates, odds);

    }

    function updateOdds(bytes8 content, uint32 value) public onlyOwner {
        if(getNow() >= _lockTime) 
            {setLastError("betting not acceptable"); return;}
        uint32 index = findOrCreateOdds(content);
        _currentOdds[index].odds = value;
    }
    function updateOdds_Multi(bytes8[] contents, uint32[] values) public onlyOwner {
        if(getNow() >= _lockTime) 
            {setLastError("betting not acceptable"); return;}
        for(uint i = 0; i<contents.length; i++) {
            if(values[i] > 0) {
                uint32 index = findOrCreateOdds(contents[i]);
                _currentOdds[index].odds = values[i];
            }
        }
    }

    function betBody(address from, bytes8 content, uint coin) internal {
        if(!betAcceptable()) 
            {setLastError("betting not acceptable"); return;}
        if(_closed)
            {setLastError("betting is already closed"); return;}
        entry(from, content, coin);
    }

    function entry(address from, bytes8 content, uint volume) private {

        Entry[] storage e = _entries[from];
        bool new_entry = e.length==0;
        int index = findOddsIndex(content);
        if(index==-1) {setLastError("odds not found"); return;}

        uint32 odds = _currentOdds[uint(index)].odds;
        e.push(Entry(odds, content, volume));
        if(new_entry) _addresses.push(from);

        _betCount++;
        _totalBettings += volume;

        emit Entried(msg.sender, content, volume);
    }

    //get bettings content of msg.sender
    function bettingOf() public view returns(bytes8[], uint[]) {
        Entry[] storage e = _entries[msg.sender];
        bytes8[] memory b = new bytes8[](e.length);
        uint[] memory v = new uint[](e.length);
        for(uint i = 0; i<e.length; i++) {
            b[i] = e[i].content;
            v[i] = e[i].volume;
        }
        return (b, v);
    }

    // returns (contents, counts, volumes) tuple
    function currentBettingList_Wide() public view returns(bytes8[], uint[], uint[] ) {
        bytes8[] memory candidates = new bytes8[](_currentOdds.length);
        uint i;
        for(i = 0; i<_currentOdds.length; i++)
            candidates[i] = bytes8(_currentOdds[i].content);

        uint[] memory counts = new uint[](_currentOdds.length);
        uint[] memory volumes = new uint[](_currentOdds.length);
        for(i = 0; i<_addresses.length; i++) {
            address a= _addresses[i];
            Entry[] storage e = _entries[a];
            for(uint j=0; j<e.length; j++) {
                Entry storage m = e[j];
                int index = findOddsIndex(m.content);
                if(index!=-1) {
                    uint ui = uint(index);
                    volumes[ui] += m.volume;
                    counts[ui] += 1;
                }
            }
        }
        return (candidates, counts, volumes);
    }
    function findOrCreateOdds(bytes8 content) internal returns(uint32) {
        for(uint i = 0; i<_currentOdds.length; i++) {
            if(content == _currentOdds[i].content)
                return uint32(i);
        }
        _currentOdds.push(CurrentOdds(0, content));
        return uint32(_currentOdds.length-1);
    }
    function findOddsIndex(bytes8 content) internal view returns(int32) {
        for(uint i = 0; i<_currentOdds.length; i++) {
            if(content == _currentOdds[i].content)
                return int32(i);
        }
        return -1;
    }

    function estimateTotalRefund(bytes8 truth) public view returns(uint) {
        uint total_refund = 0;
        for(uint i = 0; i<_addresses.length; i++) {
            address a= _addresses[i];
            Entry[] storage e = _entries[a];
            for(uint j=0; j<e.length; j++) {
                Entry storage m = e[j];
                if(m.volume!=0)
                    total_refund += calculateRefundWithOdds(m.content, truth, m.odds, m.volume);
            }
        }
        return total_refund;
    }
    function estimateTotalRefund_Wide(bytes8 truth) public view returns(uint) {
        uint total_refund = 0;
        for(uint i = 0; i<_addresses.length; i++) {
            address a= _addresses[i];
            Entry[] storage e = _entries[a];
            for(uint j=0; j<e.length; j++) {
                Entry storage m = e[j];
                if(m.volume!=0)
                    total_refund += calculateRefundWithOdds_Wide(m.content, truth, m.odds, m.volume);
            }
        }
        return total_refund;
    }
    function estimateTotalRefund_Multi(bytes4[] truth_list) public view onlyOwner returns(uint[]) {
        uint[] memory result = new uint[](truth_list.length);
        for(uint i = 0; i<truth_list.length; i++)
            result[i] = estimateTotalRefund(truth_list[i]);
        return result;
    }
    

    //Close Voting
    function close() public onlyOwnerOrCashier  {
        if(!_resultSource.isClosed())
            {setLastError("voting address is not closed"); return;}
        if(_cancelled)
            {setLastError("game is already cancelled"); return;}
        if(_closed)
            {setLastError("game is already closed"); return;}
        uint i;
        address a;
        bytes4 truth = _resultSource.truth(); //get correct answer
        _totalBettings = CoinCashier(_cashier).balanceOf(this);
        _totalRefunds = estimateTotalRefund(truth);

        if(_totalRefunds > _totalBettings + _ownerSupply) 
            {setLastError("supply is insufficient"); return;}

        CashierBase cashier = CashierBase(_cashier);

        for(i = 0; i<_addresses.length; i++) {
            a = _addresses[i];
            Entry[] storage e = _entries[a];
            uint refund = 0;
            for(uint j = 0; j<e.length; j++) {
                Entry storage m = e[j];
                if(m.volume!=0) 
                    refund += calculateRefundWithOdds(m.content, truth, m.odds, m.volume);
                _refundAddresses.push(a);
                _refunds.push(refund);
                _refundRemains.push(refund);
            }
        }

        //remaining coin go to the owner of this game
        uint base_profit = _totalBettings + _ownerSupply - _totalRefunds;
        _cashierFee = IRegulation(_regulation).calcCashierFee(_totalBettings);
        if(_cashierFee > base_profit) {
            _cashierFee = base_profit;
            _ownerRefund = 0;
        }
        else
            _ownerRefund = base_profit - _cashierFee;

        //remaining coin go to the owner of this game
        _cashier.transferCoin(getOwner(), _ownerRefund);
        _cashier.transferCoin(cashier.getOwner(), _cashierFee);
        _closed = true;
        
        emit Closed(truth, _refundAddresses.length, _totalBettings, _totalRefunds);
    }


    function cancelGame() public onlyOwner {
        if(_closed)
            {setLastError("game is already closed"); return;}
        if(_cancelled)
            {setLastError("game is already cancelled"); return;}
        if(!_allowCancel)
            {setLastError("cancel is not allowed"); return;}

        _totalRefunds = 0;
        for(uint i = 0; i<_addresses.length; i++) {
            address a = _addresses[i];
            Entry[] storage e = _entries[a];
            uint refund = 0;
            for(uint j=0; j<e.length; j++) {
                refund += e[j].volume;
            }
            if(refund>0)
                _cashier.transferCoin(a, refund);
            _refundAddresses.push(a);
            _refunds.push(refund);
            _totalRefunds += refund;
        }
        
        if(_ownerSupply>0)
            _cashier.transferCoin(this.getOwner(), _ownerSupply);
        _cancelled = true;
        _closed = true;

        emit Cancelled(_refundAddresses.length, _totalBettings, _totalRefunds);
    }

    function calculateRefundWithOdds(bytes8 content, bytes8 truth, uint odds, uint volume) public pure returns(uint) {
        if(content==truth)
            return permilMul(volume, odds); //odds is permil, TODO overflow check
        else
            return 0;
    }
    function calculateRefundWithOdds_Wide(bytes8 content, bytes8 truth, uint odds, uint volume) public pure returns(uint) {
        if(bytes8(content)==truth)
            return permilMul(volume, odds); //odds is permil, TODO overflow check
        else
            return 0;
    }

}
