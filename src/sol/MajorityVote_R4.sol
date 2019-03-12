pragma solidity ^0.4.0;

import "./ICoinCashier.sol";
import "./ResultAnnouncement_R4.sol";
/*
  Warning: This .solp file is converted solidity source code by the benten preprocessor
  You should 'npm run preprocess' to get solidity file
*/
contract MajorityVote_R4   	is ResultAnnouncement_R4{
    string private OutputFile = "MajorityVote_R4.sol";
    struct Vote {
        uint32 index;
        uint volume;
    }
    mapping (address => Vote) private _voters;
    address[] private _addresses;

    uint private _votingFee;
    uint private _freeVoteUnit; // unit amount of coins for free votings
    uint private _freeVoteRemainCount; // remaining count of free votings
    address[] private _freeVoteAddresses;
    bytes4[] private _candidates;

    //filled at the time of voting lock
    uint32 private _truthIndex;
    uint32 constant UNDECIDED = 0xFFFFFFFF;
    uint[] private _refunds;
    uint[] private _refundRemains;
    uint private _finalVoteVolume;
    uint private _refundFraction;

    uint private _timeExtensionOnReversal;
    uint private _lockTimeExtensionCount;

    bool private _checkMajorityOnClose; // if this flag is true and 90% majority does not exist, lock time is extended

    event Voted(address indexed voter, bytes4 content, uint volume);
    event MajorityReversal(address indexed voter, bytes4 content, uint volume);
    event NoMajority();

    constructor(address cashier, address regulation, address owner, uint open_time, uint lock_time, uint vote_total_limit, uint vote_one_time_limit) public ResultAnnouncement_R4(cashier, regulation, owner, open_time, lock_time) {
        _truthIndex = UNDECIDED;
        _timeExtensionOnReversal = 60 minutes;
        _version = "MajorityVote.0";
        _totalBettingsLimit = vote_total_limit;
        _oneTimeBettingsLimit = vote_one_time_limit;
        _checkMajorityOnClose = true;
    }

    function setCheckMajorityOnClose(bool v) public {
        _checkMajorityOnClose = v;
    }


    //owner is changable if current owner is null.
    //this feature is used by contract deployment by regulation or web server
    function activate(address cashier, address regulation, address newOwner, uint open_time, uint lock_time) public {
        if(_owner!=address(0))
            {setLastError("current owner is not null"); return;}
        _cashier = ICoinCashier(cashier);
        _regulation = IRegulation(regulation);
        _openTime = open_time;
        _lockTime = lock_time;
        _closed = false;
        _truthIndex = UNDECIDED;
        _timeExtensionOnReversal = 30 minutes;

        _owner = newOwner; //set new owner
    }

    function ownerSupplyBody(uint coin) internal {
        _votingFee += coin;
    }
    function votingFee() public view returns(uint) {
        return _votingFee;
    }
    function lockTimeExtensionCount() public view returns(uint) {
        return _lockTimeExtensionCount;
    }
    function betBody(address from, bytes4 content, uint coin) internal {
        vote(from, content, coin);
    }

    function vote(address from, bytes4 content, uint volume) private {
        if(from!=getOwner() && !voteAcceptable()) //voting owner can vote any time to protect from malicious voting
            {setLastError("voting is not acceptable"); return;}
        if(_closed)
            {setLastError("voting is already closed"); return;}
        if(_totalBettings + volume < _totalBettings)
            {setLastError("overflow"); return;}

        uint32 index = findOrCreate(content);
        if(_totalBettings!=0) {
            uint32 major_index = currentMajorIndex();
            uint major_total = currentVotingByIndex(major_index);
            // if all votings are unlimited, voting fee cannot pay even gas of voting.
            // to reserve voters profit, additional votes for 90% majority is rejected.
            if(index==major_index && majorityRatioPermil() >= 900)
                {setLastError("Existing Voter Profit Protect"); return;}

            // in case of reversals ( it may be malicious! ), the lock time is extended automatically.
            // the other justice voters get a chance of steal the malicious votes.
            if(index!=major_index && currentVotingByIndex(index)+volume >= major_total) {
                emit MajorityReversal(from, content, volume);
                _lockTime += _timeExtensionOnReversal;
                _lockTimeExtensionCount++;
            }
        }

        _totalBettings += volume;
        Vote storage ch = _voters[from];
        bool new_voter = ch.volume==0;
        if(!new_voter)
            {setLastError("voting is allowed one time per address"); return;}
        // in case of multiple votes, the last vote content is valid. volume is total votes.
        ch.index = index;
        ch.volume = ch.volume + volume;

        if(new_voter)
            _addresses.push(from); 
        emit Voted(from, content, volume);
    }
    function currentVotingOf() public view returns(bytes4, uint) {
        Vote storage ch = _voters[msg.sender];
        if(ch.volume==0)
            return (0, ch.volume);
        else
            return (_candidates[ch.index], ch.volume);
    }

    function findOrCreate(bytes4 content) private returns(uint32) {
        for(uint i=0; i<_candidates.length; i++) {
            bytes4 ch = _candidates[i];
            if(content==ch)
                return uint32(i);
        }
        _candidates.push(content);
        return uint32(_candidates.length-1);
    }
    function currentVotingByIndex(uint32 index) private view returns(uint) {
        uint[] memory volumes;
        (, volumes, ) = currentVotingList();
        return volumes[index];
    }
    function currentMajorIndex() private view returns(uint32) {
        uint[] memory volumes;
        (, volumes, ) = currentVotingList();
        uint32 major_index = 0;
        uint major_volume = 0;
        for(uint i=0; i<volumes.length; i++) {
            uint v = volumes[i];
            if(v > major_volume) {
                major_volume = v;
                major_index = uint32(i);
            }
        }
        return major_index;
    }
    function majorityRatioPermil() public view returns(uint) {
        if(_totalBettings==0) return 0;

        uint32 major_index = currentMajorIndex();
        uint major_total = currentVotingByIndex(major_index);
        return major_total * 1000 / (_totalBettings + _votingFee + ( _freeVoteUnit * _freeVoteRemainCount ) );
    }

    function currentVotingList() public view returns(bytes4[], uint[], uint ) {
        uint[] memory volumes = new uint[](_candidates.length);
        for(uint i=0; i<_addresses.length; i++) {
            address a = _addresses[i];
            Vote storage v = _voters[a];
            volumes[v.index] += v.volume;
        }
        return (_candidates, volumes, _votingFee + ( _freeVoteUnit * _freeVoteRemainCount ));
    }
    // bytes[] is not allowed by solidity compiler. then use fixed size instead.
    function candidateList() public view returns(bytes4[] memory) {
        return _candidates;
    }

    // free voting feature
    function setFreeVotings(uint unit, uint count) public onlyOwner {
        if(_freeVoteUnit == 0) _freeVoteUnit = unit; // _freeVoteUnit is configurable only first time
        if(_freeVoteUnit * count > _votingFee) 
            {setLastError("insufficient voting fee reservation"); return;}

        _votingFee -= _freeVoteUnit * count;
        _freeVoteRemainCount += count;
    }
    function getFreeVotings() public view returns(uint, uint) {
        return (_freeVoteUnit, _freeVoteRemainCount);
    }
    function containsFreeVoteAddress(address a) public view returns(bool) {
        for(uint i=0; i<_freeVoteAddresses.length; i++)
            if(_freeVoteAddresses[i] == a) return true;
        return false;
    }
    function freeVote(bytes4 content) public {
        if(_freeVoteRemainCount==0 || _freeVoteUnit==0) revert();
        if(containsFreeVoteAddress(msg.sender)) 
            {setLastError("duplicated free voting"); return;}
        _freeVoteRemainCount--;
        if(!voteAcceptable()) //voting owner can vote any time to protect from malicious voting
            {setLastError("voting is not acceptable"); return;}
        
        vote(msg.sender, content, _freeVoteUnit);
        _freeVoteAddresses.push(msg.sender);
    }

    //Close Voting
    function close() public onlyOwnerOrCashier { 
        if(getNow() < _lockTime)
            {setLastError("current time is before voting close time"); return;}
        if(_closed)
            {setLastError("voting is already closed"); return;}
        /* this limitation is deprectated
        If actual results are subtle, you may not be able to get 90%

        if(_checkMajorityOnClose && majorityRatioPermil() < 900) {
            emit NoMajority();
            _lockTime += _timeExtensionOnReversal;
            _lockTimeExtensionCount++;
            return;
        }
        */
        uint32 max_index = 0;
        uint max = 0;
        uint total = 0;
        uint i;
        address a;

        uint[] memory volumes = new uint[](_candidates.length);
        for(i=0; i<_addresses.length; i++) {
            a = _addresses[i];
            Vote storage v = _voters[a];
            volumes[v.index] += v.volume;
        }

        for(i=0; i<volumes.length; i++) {
            if(max < volumes[i]) {
                max = volumes[i];
                max_index = uint32(i);
            }
            total += volumes[i];
        }
        _finalVoteVolume = total;
        _truthIndex = max_index;

        uint fv = _finalVoteVolume + _votingFee + (_freeVoteRemainCount * _freeVoteUnit); //remaining free vote
        uint cv = volumes[_truthIndex];
        uint reward_sum = 0;
        for(i=0; i<_addresses.length; i++) {
            a = _addresses[i];
            uint reward = 0;
            if(_voters[a].index == _truthIndex) {
                reward = fv * _voters[a].volume / cv;
                reward_sum += reward;
            }
            _refunds.push(reward);
            _refundRemains.push(reward);
        }

        _refundFraction = fv - reward_sum;
        _cashier.transferCoin(getOwner(), _refundFraction);

        _closed = true;

        emit Closed(this.truth());
    }

    //partial refunding operation
    function refundPartial(uint start, uint end) public {
        for(uint i = start; i < end; i++) {
            uint v = _refundRemains[i];
            if(v > 0) {
                _cashier.transferCoin(_addresses[i], v);
                _refundRemains[i] = 0;
            }
        }
    }
    function refundRemains() public view returns(address[], uint[]) {
        return (_addresses, _refundRemains);
    }

    function voterCount() public view returns(uint) {
        return _addresses.length;
    }
    function refundTuple() public view returns(address[] a, uint[] v, uint f) {
        if(_truthIndex==UNDECIDED) revert();
        return (_addresses, _refunds, _refundFraction);
    }
    function truth() public view returns(bytes4) {
        if(_truthIndex==UNDECIDED)
            return -1;
        else
            return _candidates[_truthIndex];
    }



}
