pragma solidity ^0.4.0;

contract MeasureGas {
  bytes8 private _data8;
  bytes32 private _data32;
  bytes private _dataLong;

  enum Direction { North, South }
  Direction private _direction;
  function getDirection() public view returns(Direction) {
    return _direction;
  }
  function setDirection(Direction v) public {
    _direction = v;
  }

  function set8(bytes8 d) public {
    _data8 = d;
  }
  function set32(bytes32 d) public {
    _data32 = d;
  }
  function setLong(bytes d) public {
    bytes[] memory x = new bytes[](d.length);
    x[0] = d;
    _dataLong = d;
  }
  function get8() public view returns(bytes8) {
    return _data8;
  }
  function get32() public view returns(bytes32) {
    return _data32;
  }
/*
  function getLong() public view returns(bytes) {
    return _dataLong;
  }
*/
  function () payable public {
  }

}
