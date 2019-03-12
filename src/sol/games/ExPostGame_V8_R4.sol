pragma solidity ^0.4.0;
import "./FixedOddsGame_V8_R4.sol";
/*
  Warning: This .solp file is converted solidity source code by the benten preprocessor
  You should 'npm run preprocess' to get solidity file
*/
// A lottery that the winners take all bettings in proportion to their bettings
contract ExPostGame_V8_R4    	is FixedOddsGame_V8_R4{
    string private OutputFile = "games\ExPostGame_V8_R4.sol";

    constructor(string title, address cashier, address voting, address regulation, address owner, uint open_time, uint close_time, uint bet_total_limit, uint bet_one_time_limit, bool allow_cancel) public FixedOddsGame_V8_R4(title, cashier, voting, regulation, owner, open_time, close_time, bet_total_limit, bet_one_time_limit, allow_cancel) {
        _className = "ExPostGame_V8_R4";
    }

}
