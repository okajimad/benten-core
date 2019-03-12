pragma solidity ^0.4.0;
import "../CoinCashier.sol";
import "../IRegulation.sol";
import "../regulations/FixedOddsRegulation.sol";
import "./GameBase_V4_R4.sol";
/*
  Warning: This .solp file is converted solidity source code by the benten preprocessor
  You should 'npm run preprocess' to get solidity file
*/
contract FixedOddsGame_V4_R4    	is GameBase_V4_R4{
    string private OutputFile = "games\FixedOddsGame_V4_R4.sol";
    struct Entry {
        bytes4 content;
        uint volume;
        uint count; // for Entry[] of _bettings -> betting count
    }
    mapping (address => Entry[]) internal _entries;
    uint private _betCount;
    Entry[] internal _bettings; // array for each content


    constructor(string title, address cashier, address voting, address regulation, address owner, uint open_time, uint close_time, uint bet_total_limit, uint bet_one_time_limit, bool allow_cancel) public GameBase_V4_R4(title, cashier, voting, regulation, owner, open_time, close_time, bet_total_limit, bet_one_time_limit, allow_cancel) {
    }

    function betBody(address from, bytes4 content, uint coin) internal {
        if(!betAcceptable()) 
            {setLastError("betting not acceptable"); return;}
        if(_closed)
            {setLastError("betting is already closed"); return;}

        entry(from, content, coin);
    }

    function entry(address from, bytes4 content, uint volume) private {
        Entry[] storage e = _entries[from];
        bool new_entry = e.length==0;
        if(new_entry) _addresses.push(from);
        e.push(Entry(content, volume, 1));

        uint32 index = findOrCreate(content);
        Entry storage t = _bettings[index];
        t.volume += volume;
        t.count++;
        _betCount++;
        _totalBettings += volume;

        emit Entried(msg.sender, content, volume);
    }

    function bettingOf() public view returns(bytes4[], uint[]) {
        Entry[] storage e = _entries[msg.sender];
        bytes4[] memory b = new bytes4[](e.length);
        uint[] memory v = new uint[](e.length);
        for(uint i = 0; i<e.length; i++) {
            b[i] = e[i].content;
            v[i] = e[i].volume;
        }
        return (b, v);
    }

    function currentBettingList() public view returns(bytes4[], uint[], uint[] ) {
        bytes4[] memory candidates = new bytes4[](_bettings.length);
        uint[] memory counts = new uint[](_bettings.length);
        uint[] memory volumes = new uint[](_bettings.length);
        for(uint i = 0; i<_bettings.length; i++) {
            Entry storage e = _bettings[i];
            candidates[i] = e.content;
            volumes[i] = e.volume;
            counts[i] = e.count;
        }
        return (candidates, counts, volumes);
    }
    // using most wide bytesN 
    function currentBettingList_Wide() public view returns(bytes8[], uint[], uint[]) {
        bytes8[] memory candidates = new bytes8[](_bettings.length);
        uint[] memory counts = new uint[](_bettings.length);
        uint[] memory volumes = new uint[](_bettings.length);
        for(uint i = 0; i<_bettings.length; i++) {
            Entry storage e = _bettings[i];
            candidates[i] = bytes8(e.content);
            volumes[i] = e.volume;
            counts[i] = e.count;
        }
        return (candidates, counts, volumes);
    }

    function findOrCreate(bytes4 content) internal returns(uint32) {
        for(uint i = 0; i<_bettings.length; i++) {
            if(content == _bettings[i].content)
                return uint32(i);
        }
        _bettings.push(Entry(content, 0, 0));
        return uint32(_bettings.length-1);
    }
    function findEntryIndex(bytes4 content) internal view returns(uint32) {
        for(uint i = 0; i<_bettings.length; i++) {
            if(content == _bettings[i].content)
                return uint32(i);
        }
        return 0xFFFFFFFF;
    }


    //Close Voting
    function close() public onlyOwnerOrCashier {
        if(!_resultSource.isClosed())
            {setLastError("voting address is not closed"); return;}
        if(_cancelled)
            {setLastError("game is already cancelled"); return;}
        if(_closed)
            {setLastError("game is already closed"); return;}

        uint i;
        bytes4 truth = _resultSource.truth(); //get correct answer

        bytes4[] memory content_list;
        uint[] memory bettings;
        uint[] memory counts;
        (content_list, bettings, counts) = currentBettingList();
        int[] memory refund_odds;
        int totalRefunds_;
        int cashierFee_;
        int ownerRefund_;
        (refund_odds, totalRefunds_, cashierFee_, ownerRefund_) = FixedOddsRegulation(_regulation).calcRefundOdds(this, truth);
        _cashierFee = uint(cashierFee_);

        CashierBase cashier = CashierBase(_cashier);

        _totalRefunds = 0;
        for(i = 0; i<_addresses.length; i++) {
            closePerUser(_addresses[i], refund_odds);
        }
        if(_totalRefunds > _totalBettings + _ownerSupply) 
            {setLastError("owner supply is insufficient"); return;}

        
        //remaining coin go to the owner of this game
        uint base_profit = _totalBettings + _ownerSupply - _totalRefunds;
        _ownerRefund = base_profit - _cashierFee;

        if(_ownerRefund > 0)
            _cashier.transferCoin(getOwner(), _ownerRefund);
        if(_cashierFee > 0)
            _cashier.transferCoin(cashier.getOwner(), _cashierFee);
        _closed = true;

        emit Closed(truth, _refundAddresses.length, _totalBettings, _totalRefunds);
    }
    
    function closePerUser(address a, int[] refund_odds) private {
        Entry[] storage e = _entries[a];
        for(uint j=0; j<e.length; j++) {
            Entry storage ee = e[j];
            uint32 index = findOrCreate(ee.content);
            int odds = refund_odds[index];
            uint refund_per_bet = 0;

            if(odds == -1)
                refund_per_bet += ee.volume; // confiscated game
            else
                refund_per_bet += permilMul(ee.volume, uint(odds));

            _totalRefunds += refund_per_bet;
            _refundAddresses.push(a); // _refundAddresses may contain same address if the address bets multiple times
            _refunds.push(refund_per_bet);
            _refundRemains.push(refund_per_bet);
        }
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
            _refunds.push(refund);
            _refundAddresses.push(a);
            _totalRefunds += refund;
        }
        
        if(_ownerSupply>0)
            _cashier.transferCoin(this.getOwner(), _ownerSupply);
        _cancelled = true;
        _closed = true;

        emit Cancelled(_refundAddresses.length, _totalBettings, _totalRefunds);
    }



}
