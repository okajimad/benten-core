pragma solidity ^0.4.19;

import "./VariableOddsGame_V4_R4.sol";

contract GenericSport_VariableOddsGame is VariableOddsGame_V4_R4 {
  constructor(string title, address cashier, address voting, address regulation, address owner, uint open_time, uint close_time, uint bet_total_limit, uint bet_one_time_limit, bool allow_cancel) public VariableOddsGame_V4_R4(title, cashier, voting, regulation, owner, open_time, close_time, bet_total_limit, bet_one_time_limit, allow_cancel) {
    _version = "GenericSport_VariableOddsGame.1";

    findOrCreateOdds(0x00010000); //home wins
    findOrCreateOdds(0x00000100); //away wins
    findOrCreateOdds(0x00010100); //draw
  }
}