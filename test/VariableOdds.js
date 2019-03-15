
var truffle_event = require("../src/tools/truffle_event");
var ut = require("../src/tools/benten_util");

var Cashier = artifacts.require("CoinCashier");
var MajorityVote = artifacts.require("MajorityVote_R4");
var Regulation = artifacts.require("VariableOddsRegulation");
var VariableOdds = artifacts.require("VariableOddsGame_V4_R4");

contract('Variable Odds', function (accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
  it("basic", async function () {
    var cashier = await Cashier.new("test", 10000, false, { from: a0 });
    var reg = await Regulation.new(0, 0, { from: a0 });
    var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.address, a0, now + 120, now + 180, 0, 0, { from: a0 });
    var game = await VariableOdds.new("test", cashier.address, voting.address, reg.address, a0, now, now + 60, 0, 0, true, { from: a0 });

    var c0 = "0x01000000";
    var c1 = "0x00010000";

    await cashier.deposit({ from: a0, value: 1000 });
    await cashier.deposit({ from: a1, value: 1000 });
    await cashier.ownerSupply(voting.address, 100, { from: a0 });

    await game.updateOdds_Multi([c0, c1], [1500, 3000], { from: a0 }); //c0なら1.5倍、c1なら3倍の払い戻し
    var odds_list = await game.oddsList();
    assert.equal(odds_list[0].length, 2);
    assert.equal(odds_list[1].length, 2);
    //console.log(odds_list[0]); //これ確認する方法ほしい
    assert.equal(odds_list[1][0], 1500);
    assert.equal(odds_list[1][1], 3000);
    await cashier.bet4(game.address, c0, 400, { from: a0 });
    await cashier.bet4(game.address, c1, 300, { from: a1 });

    assert.equal(await cashier.balanceOf(a0), 500);
    assert.equal(await cashier.balanceOf(a1), 700);
    assert.equal(await cashier.balanceOf(voting.address), 100);
    assert.equal(await cashier.balanceOf(game.address), 700);
    var a0_bettings = await game.bettingOf({ from: a0 });
    assert.equal(a0_bettings[1][0], 400);
    var a1_bettings = await game.bettingOf({ from: a1 });
    assert.equal(a1_bettings[1][0], 300);
    var bettings = ut.formatBetting(await game.currentBettingList_Wide());
    console.log(bettings);
    /*
    var all_bettings = await game.currentBettingList();
    //all_bettings[0]にcontentあり
    assert.equal(all_bettings[1][0].toNumber(), 1);
    assert.equal(all_bettings[1][1].toNumber(), 1);
    assert.equal(all_bettings[2][0], 400);
    assert.equal(all_bettings[2][1], 300);
    */

    var c0_refund = await reg.calcRefundOdds(game.address, c0);
    ut.equalRoughly(c0_refund[0][0], 1500, 1); //1.5 odds
    ut.equalRoughly(c0_refund[0][1], 0, 1);
    ut.equalRoughly(c0_refund[1], 600, 1); //total_refund
    ut.equalRoughly(c0_refund[3], 100, 1); //owner fee
    var c1_refund = await reg.calcRefundOdds(game.address, c1);
    ut.equalRoughly(c1_refund[0][0], 0, 1); //3.0 odds
    ut.equalRoughly(c1_refund[0][1], 3000, 1);
    ut.equalRoughly(c1_refund[1], 900, 1); //total_refund
    ut.equalRoughly(c1_refund[3], -200, 1); //owner fee

    await voting.setNow(now + 150);
    assert.equal(await voting.voteAcceptable(), true);
    //this test gamble returns all bets to winner. if a1 wins, a1 receives 700
    await cashier.bet4(voting.address, c0, 200, { from: a0 });
    assert.equal(await cashier.balanceOf(voting.address), 300);

    await voting.setNow(now + 240);
    await game.setNow(now + 240);

    assert.equal(await game.betAcceptable(), false);
    assert.equal(await game.isClosed(), false);
    assert.equal(await voting.voteAcceptable(), false);
    await voting.close({ from: a0 });
    await voting.refundPartial(0, 1);
    //assert.equal(c1, await voting.truth()); //voting.truth() is converted to a string '0x61323232320000'!!
    assert.equal(await cashier.balanceOf(a0), 600);
    assert.equal(await cashier.balanceOf(a1), 700);
    assert.equal(await cashier.balanceOf(voting.address), 0);
    assert.equal(await cashier.balanceOf(game.address), 700);

    await game.close({ from: a0 });
    await game.refundPartial(0, 2);
    assert.equal(await game.betAcceptable(), false);
    assert.equal(await game.isClosed(), true);
    assert.equal(await game.totalBettings(), 700);
    assert.equal(await game.totalRefunds(), 600);
    assert.equal(await cashier.balanceOf(a0), 1300); //owner gets 100 as game owner profit, and a0 get refund 600
    assert.equal(await cashier.balanceOf(a1), 700); //a1 loses
    assert.equal(await cashier.balanceOf(voting.address), 0);
    assert.equal(await cashier.balanceOf(game.address), 0);

    console.log("FINISH");
  });
});
