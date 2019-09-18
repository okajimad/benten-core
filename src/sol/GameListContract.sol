// collecting Game contracts without RDB

pragma solidity ^0.4.0;

contract GameListContract {
    address internal _owner;
    address[] internal _games;

    constructor() public {
        _owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "only owner can call this method");
        _;
    }

    function getOwner() public view returns (address) {
        return _owner;
    }

    function getGames() public view returns (address[]) {
        return _games;
    }

    function getIndex(address a) public view returns (int) {
        for(uint i=0; i<_games.length; i++)
            if(_games[i] == a) return int(i);
        return -1;
    }

    function addGame(address a) public onlyOwner {
        _games.push(a);
    }

    function getGameList() public view returns(address[]) {
        return _games;
    }

    function removeGame(address a) public onlyOwner {
        int index = getIndex(a);
        if(index==-1) revert();

        for (uint i = uint(index); i<_games.length-1; i++){
            _games[i] = _games[i+1];
        }
        delete _games[_games.length-1];
        _games.length--;
    }

}
