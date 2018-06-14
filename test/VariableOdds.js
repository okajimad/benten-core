
var truffle_event = require("../src/tools/truffle_event");

var Cashier = artifacts.require("CoinCashier");
var MajorityVote = artifacts.require("MajorityVote_R8");
var Regulation = artifacts.require("DivideEquallyRegulation");
var VariableOdds = artifacts.require("VariableOddsGame_V8_R8");

contract('Variable Odds', function(accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
  var c0 = "a1111";
  var c1 = "a2222";
  it("basic", async function() {
    var cashier = await Cashier.new("test", 10000, false, {from:a0});
	var reg = await Regulation.new({from:a0});
	var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.address, now+60, 10, {from:a0});
	var game = await VariableOdds.new(cashier.address, voting.address, reg.address, now, true, {from:a0});

    await cashier.deposit({from:a0, value:1000});
    await cashier.deposit({from:a1, value:1500});
    await cashier.ownerSupply(voting.address, 100, {from:a0});
    await game.updateOdds(c0, 1500, {from:a0}); //c0なら1.5倍、c1なら3倍の払い戻し
    await game.updateOdds(c1, 3000, {from:a0});
    var odds_list = await game.oddsList();
    assert.equal(odds_list[0].length, 2);
    assert.equal(odds_list[1].length, 2);
    console.log(odds_list[0]); //これ確認する方法ほしい
    assert.equal(odds_list[1][0], 1500);
    assert.equal(odds_list[1][1], 3000);
    await cashier.bet8(game.address, c0, 400, {from:a0});
    await cashier.bet8(game.address, c1, 300, {from:a1});
    //this test gamble returns all bets to winner. if a1 wins, a1 receives 700
    await cashier.bet8(voting.address, c0, 200, {from:a0});
    
    assert.equal(await cashier.balanceOf(a0), 300);
    assert.equal(await cashier.balanceOf(a1), 1200);
    assert.equal(await cashier.balanceOf(voting.address), 300);
    assert.equal(await cashier.balanceOf(game.address), 700);
    var a0_bettings = await game.bettingOf({from:a0});
    assert.equal(a0_bettings[1][0], 400);
    var a1_bettings = await game.bettingOf({from:a1});
    assert.equal(a1_bettings[1][0], 300);
    var all_bettings = await game.allBettingList();
    //all_bettings[0]にcontentあり
    assert.equal(all_bettings[1][0], 1);
    assert.equal(all_bettings[1][1], 1);
    assert.equal(all_bettings[2][0], 400);
    assert.equal(all_bettings[2][1], 300);
    
    var c0_refund = await game.estimateTotalRefund(c0, {from:a0});
    assert.equal(c0_refund, 600); //400*1.5
    var c1_refund = await game.estimateTotalRefund(c1, {from:a0});
    assert.equal(c1_refund, 900); //300*3
    
    await voting.setNow(now+1000);
    await game.setNow(now+1000);
    assert.equal(await game.betAcceptable(), false);
    assert.equal(await game.isClosed(), false);
    assert.equal(await voting.voteAcceptable(), false);
	voting.close({from:a0});
    //assert.equal(c1, await voting.truth()); //voting.truth() is converted to a string '0x61323232320000'!!
    assert.equal((await cashier.balanceOf(a0)).toNumber(), 600);
    assert.equal(await cashier.balanceOf(a1), 1200);
    assert.equal(await cashier.balanceOf(voting.address), 0);
    assert.equal(await cashier.balanceOf(game.address), 700);
    
    await game.close({from:a0});
    assert.equal(await game.betAcceptable(), false);
    assert.equal(await game.isClosed(), true);
	assert.equal(await game.totalBettings(), 700);
	assert.equal(await game.totalRefunds(), 600);
    assert.equal(await cashier.balanceOf(a0), 1300); //owner gets 100 as game owner profit, and a0 get refund 600
    assert.equal(await cashier.balanceOf(a1), 1200); //a1 loses
    assert.equal(await cashier.balanceOf(voting.address), 0);
    assert.equal(await cashier.balanceOf(game.address), 0);
    
    console.log("FINISH");
  });
});
	