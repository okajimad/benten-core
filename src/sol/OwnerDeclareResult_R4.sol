pragma solidity ^0.4.0;

import "./ICoinCashier.sol";
import "./ResultAnnouncement_R4.sol";
/*
  Warning: This .solp file is converted solidity source code by the benten preprocessor
  You should 'npm run preprocess' to get solidity file
*/
contract OwnerDeclareResult_R4   	is ResultAnnouncement_R4{
    string private OutputFile = "OwnerDeclareResult_R4.sol";

    event Closed(bytes4 truth);

    bytes4 private _result;

    constructor(address cashier, address regulation, address owner, uint open_time, uint lock_time) public ResultAnnouncement_R4(cashier, regulation, owner, open_time, lock_time) {
    }
    function truth() public view returns(bytes4) {
        return _result;
    }
    function close() public onlyOwnerOrCashier {
        revert();
        //call setTruth() instead of close()
    }
    function setTruth(bytes4 v) public onlyOwner {
        if(getNow() < _lockTime)
            {setLastError("current time is before voting close time"); return;}
        if(_closed)
            {setLastError("voting is already closed"); return;}
        _result = v;
        _closed = true;
        emit Closed(v);
    }

}
