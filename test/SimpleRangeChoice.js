
var truffle_event = require("../src/tools/truffle_event");
var ut = require("../src/tools/benten_util");

var Cashier = artifacts.require("CoinCashier");
var MajorityVote = artifacts.require("MajorityVote_R4");
var Regulation = artifacts.require("SimpleRangeChoice");
var ExPostGame = artifacts.require("ExPostGame_V4_R4");

contract('Basic games', function (accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
  var a2 = accounts[2];
  var c0 = "0x00010005";
  var c1 = "0x0006000a";
  it("SimpleRangeChoice", async function () {
    var cashier = await Cashier.new("test", "TST", 1000, 1000, 10000, false, { from: a0 });
    var reg = await Regulation.new(1, 100, 1, 50, { from: a0 }); //owner fee: 10%, cashier fee: 5%
    var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.addres, a0, now + 120, now + 180, 0, 0, { from: a0 });
    var game = await ExPostGame.new("SAYU", cashier.address, voting.address, reg.address, a0, now + 10, now + 60, 0, 0, false, { from: a0 });

    var example_truth = "0x00000009";

    await game.setDescription(c0, "SAYU1");
    await game.setDescription(c1, "SAYU2");
    assert.equal(await game.getDescription(c0), "SAYU1");
    assert.equal(await game.getDescription(c1), "SAYU2");

    var a0_initial_coin = 0;
    var a1_initial_coin = 0;
    var a2_initial_coin = 0;
    await cashier.deposit({ from: a0, value: 1000 });
    await cashier.deposit({ from: a1, value: 1000 });
    await cashier.deposit({ from: a2, value: 1000 });
    await cashier.ownerSupply(voting.address, 100, { from: a0 });
    await game.setNow(now + 30);
    await cashier.bet4(game.address, c0, 400, { from: a1 });
    await cashier.bet4(game.address, c1, 300, { from: a2 })
    assert.equal(await game.title(), "SAYU");
    await cashier.bet4(voting.address, example_truth, 200, { from: a0 });

    assert.equal(await cashier.balanceOf(a0), 700);
    assert.equal(await cashier.balanceOf(a1), 600);
    assert.equal(await cashier.balanceOf(a2), 700);
    assert.equal(await cashier.balanceOf(voting.address), 300);
    assert.equal(await cashier.balanceOf(game.address), 700);
    var bettings = ut.formatBetting(await game.currentBettingList());

    assert.equal(bettings[0][0], c0); //TODO conversion utility required
    assert.equal(bettings[0][1], c1);
    assert.equal(bettings[1][0], 1);
    assert.equal(bettings[1][1], 1);
    assert.equal(bettings[2][0], 400);
    assert.equal(bettings[2][1], 300);

    var b0 = await game.bettingOf({ from: a1 });
    var b1 = await game.bettingOf({ from: a2 });
    assert.equal(b0[0][0], c0);
    assert.equal(b1[0][0], c1);
    assert.equal(b0[1][0], 400);
    assert.equal(b1[1][0], 300);
    assert.equal(500, await reg.calcCashierFee(10000));

    //calcRefundOdds returns(int[] permil_odds, int total_refund_, int cashier_fee_, int owner_fee_)
    var refund_c0 = ut.formatRefundOdds(await reg.calcRefundOdds(game.address, "0x00000003")); // for example result '3' means c0 wins
    assert.equal(refund_c0[2], 35); //cashier_fee: 35
    assert.equal(refund_c0[3], 70); //owner_fee: 70
    ut.equalRoughly(refund_c0[0][0], 1000 * (700 * 0.85 / 400), 1);
    assert.equal(refund_c0[0][1], 0);
    var refund_c1 = ut.formatRefundOdds(await reg.calcRefundOdds(game.address, "0x00000009")); //c1 wins
    assert.equal(refund_c1[2], 35); //cashier_fee: 35
    assert.equal(refund_c1[3], 70); //owner_fee: 70
    assert.equal(refund_c1[0][0], 0);
    ut.equalRoughly(refund_c1[0][1], 1000 * (700 * 0.85 / 300), 1);

    await voting.setNow(now + 300);
    await game.setNow(now + 300);
    assert.equal(await game.betAcceptable(), false);
    assert.equal(await game.isClosed(), false);
    assert.equal(await voting.voteAcceptable(), false);
    await voting.close({ from: a0 });
    await voting.refundPartial(0, 1);
    assert.equal(example_truth, await voting.truth());
    assert.equal(await cashier.balanceOf(a0), 1000); //received voting result
    assert.equal(await cashier.balanceOf(a1), 600);
    assert.equal(await cashier.balanceOf(a2), 700);
    assert.equal(await cashier.balanceOf(voting.address), 0);
    assert.equal(await cashier.balanceOf(game.address), 700);


    await game.close({ from: a0 });
    await game.refundPartial(0, 2);
    assert.equal(await game.betAcceptable(), false);
    assert.equal(await game.isClosed(), true);
    ut.equalRoughly(await game.totalBettings(), 700, 1);
    ut.equalRoughly(await game.totalRefunds(), 595, 1);
    var refund_tuple = ut.formatRefundTuple(await game.refundTuple());
    ut.equalRoughly(refund_tuple[2], 35, 1); //cashier fee
    ut.equalRoughly(refund_tuple[3], 70, 1); //owner fee
    ut.equalRoughly(await cashier.balanceOf(a0), 1105, 1); //owner gets 100 as game owner profit
    ut.equalRoughly(await cashier.balanceOf(a1), 600, 1); //a1 loses
    ut.equalRoughly(await cashier.balanceOf(a2), 1295, 1); //a2 wins
    assert.equal(await cashier.balanceOf(voting.address), 0);
    assert.equal(await cashier.balanceOf(game.address), 0);

    console.log("FINISH");
  });
});
