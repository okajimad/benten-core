var truffle_event = require("../src/tools/truffle_event");

var Cashier = artifacts.require("ETHCashier");
var Regulation = artifacts.require("GenericSport_WinLose");
var VotePool = artifacts.require("VoteContractPool");
var DivideEqually_V4_R4 = artifacts.require("DivideEqually_V4_R4");

contract('Basic', function(accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
  it("1", async function() {
    var cashier = await Cashier.new("test", 10000, false, {from:a0});
    await cashier.deposit({from:a0, value:2000});
	var reg = await Regulation.new({from:a0});
	var now = await cashier.getNow();
	var pool = await VotePool.new({from:a0});
	await pool.reserve4(2, {from:a0});
	
	var pr1 = await DivideEqually_V4_R4.new("mmmmmm", cashier.address, await pool.peek4(), reg.address, now+100, now+200, false, {from:a0}); //cancel not allowed
	console.log("pr1=%s", pr1.address);
	var vote = await pool.peek4();
	await reg.deployDivideEquallyGame("X", pool.address, cashier.address, now+100, now+200, now+300, now+400 , 0, 100, 0, 100, {from:a0, value:1000});
    
    var game_addr = await reg.getLastDeployedGame({from:a0});
    console.log("A" + game_addr);
    var game = await DivideEqually_V4_R4.at(game_addr);
    assert.equal(await game.resultSource(), vote);
    //assert.equal(await (await game.resultSource()).getOwner(), a0);
    assert.equal(await game.getOwner(), a0);
  });
});

