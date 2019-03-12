pragma solidity ^0.4.0;
import "./BentenContractBase.sol";
import "./ICoinCashier.sol";
import "./BettingTarget_V4.sol";
import "./BettingTarget_V8.sol";
import "./IGame.sol";
/*
  Warning: This .solp file is converted solidity source code by the benten preprocessor
  You should 'npm run preprocess' to get solidity file
*/

//ETHCashier omits deposit/withdraw feature.
//now bet() is payable and transferCoin() combines ETH transfer
contract CashierBase is BentenContractBase, ICoinCashier  {
    string private OutputFile = "CashierBase.sol";
    string internal _name;

    uint internal _issuedVolume;
    uint internal _poolVolume;
    address[] internal _addresses;

    mapping (address => uint) internal _balances;
    bool internal _open;
    bool internal _allowAdditionalIssue;

    //we assume delegatedAddress is managed by server, not human.
    //if the owner set delegatedAddress, some transactions (such as tasks executed at fixed time) from delegatedAddress are permitted
    address internal _delegatedAddress;

    event Deposit(address indexed account, uint amount);
    event Withdraw(address indexed account, uint amount);
    event TransferCoin(address indexed from, address indexed to, uint amount);

    function getName() public view returns(string) {
        return _name;
    }
    function setOpen(bool open) public onlyOwner {
        _open = open;
    }
    function isOpen() public view returns(bool) {
        return _open;
    }
    function getDelegatedAddress() public view returns(address) {
        return _delegatedAddress;
    }
    function setDelegatedOwner(address dg, address newOwner) public onlyOwner {
        if(dg!=address(0)) _delegatedAddress = dg;
        if(newOwner!=address(0)) _owner = newOwner;
    }
    function additionalIssueAllowed() public view returns(bool) {
        return _allowAdditionalIssue;
    }
    function poolVolume() public view returns(uint) {
        return _poolVolume;
    }
    function balanceOf(address a) public view returns(uint) {
        return _balances[a];
    }

    function addIssue(uint value) public onlyOwner {
        if(!_allowAdditionalIssue)
            {setLastError("!_allowAdditionalIssue"); return;}
        _issuedVolume += value;
        _poolVolume += value;
    }

    //list all balances
    function balanceList() public view onlyOwner returns(address[], uint[] )  {
        address[] memory ad = new address[](_addresses.length);
        uint[] memory vol = new uint[](_addresses.length);
        for(uint i=0; i<_addresses.length; i++) {
            ad[i] = _addresses[i];
            vol[i] = _balances[ad[i]];
        }
        return (ad, vol);
    }
    function deposit() public payable { //NOT external, since bet() calls deposit
        depositInternal(msg.sender, msg.value);
    }
    function depositInternal(address to, uint amount) internal {
        //if(isContract(to)) 
        //    ERROR_CASE("any contracts cannot deposit")

        // amount / coin rate may be change
        if(!_open)
            {setLastError("cashier is not open"); return;}
        if(_poolVolume < coin)
            {setLastError("pool is insufficient"); return;}

        uint coin = _balances[to];
        if(coin==0) _addresses.push(to);

        coin += amount;
        _poolVolume -= coin;
        _balances[to] = coin;
        emit Deposit(to, coin);
    }
    function withdraw(uint coin) public {
        withdraw(msg.sender, coin);
    }
    function withdraw(address to, uint coin) internal {
        if(!_open)
            {setLastError("cashier is not open"); return;}
        uint current = _balances[to];
        if(current < coin)
            {setLastError("coin is insufficient"); return;}

        uint amount = coin;
        current -= coin;
        _poolVolume += coin;
        if(current==0) {
            delete _balances[to];
        }
        else
            _balances[to] = current;

        // if this transfer fails, an exception is thrown.
        // you can see the difference of payment methods at https://medium.com/daox/three-methods-to-transfer-funds-in-ethereum-by-means-of-solidity-5719944ed6e9
        if(!to.call.value(amount)()) revert();

        emit Withdraw(to, coin);
    }
    
    function transferCoin(address from, address to, uint amount) internal {
        if(amount==0)
            return;
        if(!_open)
            {setLastError("cashier is not open"); return;}

        uint src = _balances[from];
        if(src < amount)
            {setLastError("coin is insufficient"); return;}
        uint dst = _balances[to];
        if(dst==0) _addresses.push(to);
        src -= amount;
        dst += amount;
        _balances[to] = dst;
        _balances[from] = src;
        emit TransferCoin(from, to, amount);
    }

    function checkMultiTransferCoin(address[] to, uint[] coin) internal {
        if(to.length!=coin.length)
            {setLastError("input data error"); return;}
        uint i;
        uint total = 0;
        for(i = 0; i<coin.length; i++) {
            uint m = total;
            total += coin[i];
            //uint overflow check
            if(m > total)
                {setLastError("overflow on multipleTransfer!"); return;}
        }
        if(total > balanceOf(msg.sender))
            {setLastError("total balance is insufficient"); return;}
    }

    //close target
    function delegatedClose4(address target) public {
        if(msg.sender!=getOwner() && msg.sender!=_delegatedAddress)
            {setLastError("sender does not allowed"); return;}
        BettingTarget_V4 t = BettingTarget_V4(target);
        t.close();
    }
    function delegatedClose8(address target) public {
        if(msg.sender!=getOwner() && msg.sender!=_delegatedAddress)
            {setLastError("sender does not allowed"); return;}
        BettingTarget_V8 t = BettingTarget_V8(target);
        t.close();
    }
    //set result source
    function delegatedSetResultSource(address target, address source) public {
        if(msg.sender!=getOwner() && msg.sender!=_delegatedAddress)
            {setLastError("sender does not allowed"); return;}
        IGame t = IGame(target);
        t.setResultSource(source);
    }
    //refunding partially
    function delegatedRefundPartial4(address target, uint start, uint end) public {
        if(msg.sender!=getOwner() && msg.sender!=_delegatedAddress)
            {setLastError("sender does not allowed"); return;}
        BettingTarget_V4 t = BettingTarget_V4(target);
        t.refundPartial(start, end);
    }
    function delegatedRefundPartial8(address target, uint start, uint end) public {
        if(msg.sender!=getOwner() && msg.sender!=_delegatedAddress)
            {setLastError("sender does not allowed"); return;}
        BettingTarget_V8 t = BettingTarget_V8(target);
        t.refundPartial(start, end);
    }
/*
    function isContract(address addr) private view returns (bool is_contract) {
        uint length;
        assembly {
            //retrieve the size of the code on target address, this needs assembly
            length := extcodesize(addr)
        }
        return (length>0);
    }
    function hashContract(address addr) public view returns(bytes32) {
        uint length;
        assembly {
            //retrieve the size of the code on target address, this needs assembly
            length := extcodesize(addr)
        }
        bytes memory buf = new bytes(length);
        assembly {
            extcodecopy(addr, add(buf, 0x20), 0, length)
        }
        return sha256(buf);
    }
*/
}
