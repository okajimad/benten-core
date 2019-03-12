pragma solidity ^0.4.0;
/*
  Base class for Benten contract family

  Warning: This .solp file is converted solidity source code by the benten preprocessor
  You should 'npm run preprocess' to get solidity file
*/
contract BentenContractBase  {
    string private OutputFile = "BentenContractBase.sol";

    enum FeeType {
  	  Value, // fixed value
  	  Ratio // fixed ratio (permil)
    }
    address internal _owner;
    string internal _version;

    constructor() public {
        _owner = msg.sender;

        _now = now;

    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "only owner can call this method");
        _;
    }

    function getOwner() public view returns (address) {
        return _owner;
    }
    function getVersion() public view returns(string) {
        return _version;
    }

    //BUILD_TIME is defined in preprocessor
    function buildTime() public pure returns(string) {
        return "Tue Mar 12 2019 17:03:48 GMT+0900 (東京 (標準時))";
    }

    /* in contract development, if transaction is reverted by bug of our solidity source, 
       it is hard to retrieve the reason.
       now we introduce ERROR_CASE() macro. in debug build, write set a message to _lastError and just return transaction function.

       [normal solidity style]
       require(X);

       [benten style]
       if(!X) ERROR_CASE("error message")

       NOTE:
         You MUST NOT put ';' at the end of ERROR_CASE macro because solidity can not accept empty statement

    */


    string internal _lastError;

    function getLastError() public view returns(string) {
        return _lastError;
    }
    function setLastError(string e) public {
        _lastError = e;
    }

    
        
    


// current time is configurable in DEBUG build

    uint internal _now;
    function setNow(uint t) public {
        if(_now < t) // avoid returning to old days
            _now = t;
    }
    function getNow() public view returns(uint) {
        return _now;
    }

    
        
    


    function permilMul(uint a, uint b) public pure returns(uint) {
        if(a==0 || b==0) return 0;
        uint c = a * b;
        assert(c / b == a);
        return c/1000;
    }

}
