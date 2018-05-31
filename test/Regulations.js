
var DreamJumbo = artifacts.require("DreamJumboLottery_JPN");

function makeRottelyNum(a, b) {
  //solidity type bytesN is represented as Javascript string '0xXXXX....'
  var t = (a * 100000 + b).toString(16);
  while(t.length<6) t = "0"+t;
  return "0x"+t;
}

contract('DreamJumbo', function(accounts) {
  it("dj1", async function() {
    var a0 = accounts[0];
    try {
    console.log(makeRottelyNum(1, 0));
    var dj = await DreamJumbo.new({from:a0});
    var x = await dj.check(makeRottelyNum(1, 101),makeRottelyNum(1, 100));
    console.log(x.toNumber());
    //assert.equal(1, await cashier.getAccountCount());
    //assert.equal(await cashier.getPoolVolume(), 9500);
    console.log("FINISH!");
    }
    catch(e) {
    	console.log("Error / " + e.toString());
    }
  });
});
	