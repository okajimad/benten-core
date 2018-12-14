var truffle_event = require("../src/tools/truffle_event");

var Cashier = artifacts.require("ETHCashier");
var Regulation = artifacts.require("GenericSport_WinLose");
var ExPostGame_V4_R4 = artifacts.require("ExPostGame_V4_R4");
var MajorityVote_R4 = artifacts.require("MajorityVote_R4");

contract('Basic', function(accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
  it("1", async function() {
    var cashier = await Cashier.new("test", 10000, false, {from:a0});
    await cashier.deposit({from:a0, value:2000});
	var reg = await Regulation.new(0,0,0,0,{from:a0});
	var now = await cashier.getNow();
	
	var game = await ExPostGame_V4_R4.new("X", cashier.address, null, reg.address, a0, now+100, now+200, false, {from:a0});
    assert.equal(await game.getOwner(), a0);
    
    await cashier.deployAndSetVoting_R4(game.address, now+300, now+400, 30, {from:a0, value:1000});
    var voting = MajorityVote_R4.at(await game.resultSource());
    assert.equal(voting.address, await game.resultSource());
    assert.equal(await voting.getOwner(), a0);

    assert.equal(await voting.voteUpperLimit(), 30);
    assert.equal(await voting.votingFee(), 1000);
    assert.equal(await cashier.balanceOf(voting.address), 1000);
    
  });
});

