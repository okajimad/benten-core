
var truffle_event = require("../src/tools/truffle_event");

var Cashier = artifacts.require("CoinCashier");
var MajorityVote = artifacts.require("MajorityVote_R8");
var Regulation = artifacts.require("DivideEquallyRegulation");
var ShuffleLottery = artifacts.require("ShuffleLottery_V8_R8");

contract('Shuffle Lottery', function(accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
  var c0 = "a1111";
  var c1 = "a2222";
  it("Shuffle Lottery", async function() {
    var cashier = await Cashier.new("test", 10000, false, {from:a0});
	var reg = await Regulation.new({from:a0});
	var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.address, now+60, 10, {from:a0});
	var game = await ShuffleLottery.new(cashier.address, voting.address, reg.address, now, true, 1000, {from:a0, gas:100000000 });

    await cashier.deposit({from:a0, value:1000});
    await cashier.deposit({from:a1, value:1500});
    await cashier.ownerSupply(voting.address, 100, {from:a0});
    await game.shuffle({from:a0, gas:100000000 });
    
    //await cashier.bet8(game.address, c0, 400, {from:a0});
    //await cashier.bet8(game.address, c1, 300, {from:a1})
    
    console.log("FINISH");
  });
});
	