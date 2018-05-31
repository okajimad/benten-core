pragma solidity ^0.4.0;

//XORSHIFT algorithm
contract Random {
  uint32 private _x;
  uint32 private _y;
  uint32 private _z;
  uint32 private _w;

  constructor(uint128 seed) {
    _x = uint32((seed & 0xFFFFFFFF000000000000000000000000) >> 96);
    _y = uint32((seed & 0x00000000FFFFFFFF0000000000000000) >> 64);
    _z = uint32((seed & 0x0000000000000000FFFFFFFF00000000) >> 32);
    _w = uint32(seed & 0x000000000000000000000000FFFFFFFF);
  }

  function nextUint32() public {
    uint32 t;
 
    t = _x ^ (_x << 11);
    _x = _y; _y = _z; _z = _w;
    _w = (_w ^ (_w >> 19)) ^ (t ^ (t >> 8)); 
  }

  function get() public view returns(uint32) {
    return _w;
  }

  //random generator cannot accept ETH
  function () public payable {
    revert();
  }
}
