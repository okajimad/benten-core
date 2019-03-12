pragma solidity ^0.4.0;
import "./BettingTarget_V8.sol";
import "./BettingTarget_V4.sol";
import "./CashierBase.sol";
import "./MajorityVote_R4.sol";
import "./IGame.sol";
/*
  Warning: This .solp file is converted solidity source code by the benten preprocessor
  You should 'npm run preprocess' to get solidity file
*/
contract CoinCashier is CashierBase  {
    string private OutputFile = "CoinCashier.sol";


    constructor(string name, uint initialIssue, bool allowAdditionalIssue) public {
        _version = "CoinCashier.0";
        _name = name;
        _issuedVolume = initialIssue;
        _poolVolume = initialIssue;
        _allowAdditionalIssue = allowAdditionalIssue;
        _open = true;
    }
    //single transfer
    function transferCoin(address to, uint coin) public {
        if(coin==0)
            return;
        transferCoin(msg.sender, to, coin);
    }
    
    //bulk transfer
    function multiTransferCoin(address[] to, uint[] coin) public {
        checkMultiTransferCoin(to, coin);

        for(uint i = 0; i<coin.length; i++)
            transferCoin(msg.sender, to[i], coin[i]);

    }

    //Betting or Voting Root Function

    //  only coin owner can call BettingTarget through this CoinCashier
    function bet8(address target, bytes8 content, uint coin) public {
        BettingTarget_V8 b = BettingTarget_V8(target);
        transferCoin(msg.sender, target, coin); //private method: modify internal storage, only msg.sender pay coin to other
        // BettingTarget.bet() accepts only if the caller is CoinCashier
        b.bet(msg.sender, content, coin);
    }

    //bytes4 version
    function bet4(address target, bytes4 content, uint coin) public {
        BettingTarget_V4 b = BettingTarget_V4(target);
        transferCoin(msg.sender, target, coin);
        // BettingTarget.bet() accepts only if the caller is CoinCashier
        b.bet(msg.sender, content, coin);
    }

    //Game Owner Supply
    function ownerSupply(address target, uint coin) public {
        BettingTarget_V8 b = BettingTarget_V8(target);
        if(b.getOwner() != msg.sender) 
            {setLastError("Only game/voting owner can call ownerSupply"); return;}
        transferCoin(msg.sender, target, coin);
        // BettingTarget.ownerSupply() accepts only if the caller is CoinCashier
        b.ownerSupply(coin);
    }

    /*
    function deployAndSetVoting_R4(address game_, uint vote_open_time, uint vote_lock_time, uint owner_supply, uint vote_volume_upper_limit) public {
        IGame game = IGame(game_);
        MajorityVote_R4 vote = new MajorityVote_R4(address(this), game.regulation(), msg.sender, vote_open_time, vote_lock_time, vote_volume_upper_limit);
        game.setResultSource(vote);
        ownerSupply(vote, owner_supply);
    }
    */
}
