
var GenericSport_VariableOdds = artifacts.require("GenericSport_VariableOdds");
 
function makeRottelyNum(a, b) {
  //solidity type bytesN is represented as Javascript string '0xXXXX....'
  var t = (a * 100000 + b).toString(16);
  while(t.length<6) t = "0"+t;
  return "0x"+t;
}

contract('GenericSport_VariableOdds', function(accounts) {
  it("f", async function() {
    var a0 = accounts[0];
    var r = await GenericSport_VariableOdds.new(0, 0, {from:a0});

    assert.equal(await r.convertVoteResultToBet("0x0003000000000000"), "0x0001000000000000");
    assert.equal(await r.convertVoteResultToBet("0x0000030000000000"), "0x0000010000000000");
    assert.equal(await r.convertVoteResultToBet("0x0003030000000000"), "0x0001010000000000");
    assert.equal(await r.convertVoteResultToBet("0x0100000000000000"), "0x0101010000000000");
  });
});
	