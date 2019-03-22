
var truffle_event = require("../src/tools/truffle_event");
var ut = require("../src/tools/benten_util");

var Cashier = artifacts.require("CoinCashier");
var MajorityVote = artifacts.require("MajorityVote_R4");
var Regulation = artifacts.require("ElectionRegulation");
var ExPostGame = artifacts.require("ExPostGame_V4_R4");

contract('Basic games', function (accounts) {
  const a0 = accounts[0];
  const a1 = accounts[1];
  const a2 = accounts[2];
  const c0 = "0x00000001";
  const c1 = "0x00000010";
  const c0_win = "0x80000001";
  const c1_win = "0x80000010";
  it("Election", async function () {
    var cashier = await Cashier.new("test", 1000000, false, { from: a0 });
    var reg = await Regulation.new(1, 100, 1, 50, { from: a0 }); //owner fee: 10%, cashier fee: 5%
    var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.addres, a0, now + 120, now + 180, 0, 0, { from: a0 });
    var game = await ExPostGame.new("SAYU", cashier.address, voting.address, reg.address, a0, now + 10, now + 60, 0, 0, false, { from: a0 });

    await game.setDescription(c0, "SAYU1");
    const desc = await game.getDescPairAt(0);
    await game.setDescription(c1, "SAYU2");
    assert.equal(await game.getDescription(c0), "SAYU1");
    assert.equal(await game.getDescription(c1), "SAYU2");

    var a0_initial_coin = 0;
    var a1_initial_coin = 0;
    var a2_initial_coin = 0;
    await cashier.deposit({ from: a0, value: 10000 });
    await cashier.deposit({ from: a1, value: 100000 });
    await cashier.deposit({ from: a2, value: 100000 });
    await cashier.ownerSupply(voting.address, 2000, { from: a0 });
    await game.setNow(now + 30);
    await cashier.bet4(game.address, c0, 40000, { from: a1 });
    await cashier.bet4(game.address, c0_win, 40000, { from: a2 }); //a1: bets [c0 lose], a2: bets[c0 win]
    await cashier.bet4(game.address, c1_win, 4000, { from: a1 });
    await cashier.bet4(game.address, c1, 2000, { from: a2 }); //a1: bets [c1 win], a2: bets[c0 lose]
    assert.equal(await game.title(), "SAYU");


    assert.equal(await cashier.balanceOf(a0), 8000);
    assert.equal(await cashier.balanceOf(a1), 56000);
    assert.equal(await cashier.balanceOf(a2), 58000);
    assert.equal(await cashier.balanceOf(voting.address), 2000);
    assert.equal(await cashier.balanceOf(game.address), 86000);
    var bettings = ut.formatBetting(await game.currentBettingList());

    assert.equal(bettings[0].length, 4);
    assert.equal(bettings[1].length, 4);
    assert.equal(bettings[2].length, 4);

    var b1 = await game.bettingOf({ from: a1 });
    var b2 = await game.bettingOf({ from: a2 });
    assert.equal(b1[0].length, 2);
    assert.equal(b1[0][0], c0);
    assert.equal(b1[0][1], c1_win);
    assert.equal(b1[1][0], 40000);
    assert.equal(b1[1][1], 4000);
    assert.equal(b2[0].length, 2);
    assert.equal(b2[0][0], c0_win);
    assert.equal(b2[0][1], c1);
    assert.equal(b2[1][0], 40000);
    assert.equal(b2[1][1], 2000);
    assert.equal(500, await reg.calcCashierFee(10000));

    //calcRefundOdds returns(int[] permil_odds, int total_refund_, int cashier_fee_, int owner_fee_)
    const refund_c0 = ut.formatRefundOdds(await reg.calcRefundOdds(game.address, c0));
    const contents_list = (await game.currentBettingList_Wide())[0];
    const tv1 = await reg.candidateTest(game.address, "0x0000000100000000", "0x0000000100000000");
    console.log("tv %d %d %d", tv1[0], tv1[1], tv1[2]);

    assert.equal(refund_c0[2], 86000 * 0.05); //cashier_fee
    assert.equal(refund_c0[3], 86000 * 0.1); //owner_fee
    let refund = refund_c0[1];
    let rl = refund_c0[0]; //refund ratio list
    assert.equal(refund, 86000 * 0.85);

    ut.equalRoughly(rl[0], 0, 1);                             //bet for c0 lose
    ut.equalRoughly(rl[1], 1000 * (80000 * 0.85 / 40000), 1); //bet for c0 win
    ut.equalRoughly(rl[2], 0, 1);                           //bet for c1 win
    ut.equalRoughly(rl[3], 1000 * (6000 * 0.85 / 2000), 1); //bet for c1 lose

    const both_win = "0x00000011";
    const refund_both = ut.formatRefundOdds(await reg.calcRefundOdds(game.address, both_win));
    assert.equal(refund_both[2], 86000 * 0.05); //cashier_fee
    assert.equal(refund_both[3], 86000 * 0.1); //owner_fee
    refund = refund_both[1];
    rl = refund_both[0]; //refund ratio list
    assert.equal(refund, 86000 * 0.85);

    ut.equalRoughly(rl[0], 0, 1);                             //bet for c0 lose
    ut.equalRoughly(rl[1], 1000 * (80000 * 0.85 / 40000), 1); //bet for c0 win
    ut.equalRoughly(rl[2], 1000 * (6000 * 0.85 / 4000), 1);   //bet for c1 win
    ut.equalRoughly(rl[3], 0, 1);                             //bet for c1 lose

    console.log("FINISH");
  });
});
