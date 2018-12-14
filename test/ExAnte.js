
var truffle_event = require("../src/tools/truffle_event");
var ut = require("../src/tools/benten_util");

var Cashier = artifacts.require("CoinCashier");
var MajorityVote = artifacts.require("MajorityVote_R4");
var Regulation = artifacts.require("ChohanRegulation");
var ExAnteGame = artifacts.require("ExAnteGame_V4_R4");

contract('Basic games', function(accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
  var c0 = "0x00000000";
  var c1 = "0x00000001";
  it("Chohan", async function() {
    var cashier = await Cashier.new("test", 10000, false, {from:a0});
	var reg = await Regulation.new(1900, 0, 0, {from:a0});
	var now = (await cashier.getNow()).toNumber();
	var game = await ExAnteGame.new("chohan_01", cashier.address,  null, reg.address, a0, now, now+60, true, {from:a0});
    var voting = await MajorityVote.new(cashier.address, reg.addres, a0, now+120, now+180);

    var a0_initial_coin = 0;
    var a1_initial_coin = 0;
    await cashier.deposit({from:a0, value:1000});
    await cashier.deposit({from:a1, value:1000});
    await cashier.ownerSupply(voting.address, 100, {from:a0});
    await game.setNow(now+30);
    await cashier.bet4(game.address, c0, 400, {from:a0});
    await cashier.bet4(game.address, c1, 300, {from:a1})
    assert.equal(await game.title(), "chohan_01");
    
    assert.equal(await cashier.balanceOf(a0), 500);
    assert.equal(await cashier.balanceOf(a1), 700);
    assert.equal(await cashier.balanceOf(voting.address), 100);
    assert.equal(await cashier.balanceOf(game.address), 700);
    var bettings = ut.formatBetting(await game.currentBettingList());
    console.log(bettings);

    //assert.equal(bettings[0][0], c0); //TODO conversion utility required
    //assert.equal(bettings[0][1], c1);
    assert.equal(bettings[2][0], 400);
    assert.equal(bettings[2][1], 300);
    
    var b0 = await game.bettingOf({from:a0});
    var b1 = await game.bettingOf({from:a1});
    //assert.equal(b0[0], c0);
    //assert.equal(b1[0], c1);
    assert.equal(b0[1], 400);
    assert.equal(b1[1], 300);
    
    const refund_cho = ut.formatRefundOdds(await reg.calcRefundOdds(game.address, "0x00000101"))[0];
    assert.equal(refund_cho[0], 1900);
    assert.equal(refund_cho[1], 0);
    const refund_han = ut.formatRefundOdds(await reg.calcRefundOdds(game.address, "0x00000102"))[0];
    assert.equal(refund_han[0], 0);
    assert.equal(refund_han[1], 1900);

    //this test gamble returns 1.9 times refund for winner
    await voting.setNow(now+150, {from:a0});
    assert.ok(await voting.voteAcceptable());
    await cashier.bet4(voting.address, "0x00000504", 200, {from:a0});

    await voting.setNow(now+300);
    await game.setNow(now+300);
    assert.equal(await game.betAcceptable(), false);
    assert.equal(await game.isClosed(), false);
    assert.equal(await voting.voteAcceptable(), false);
	voting.close({from:a0});
	console.log(await voting.getLastError());
    assert.equal(ut.equalRoughly(await cashier.balanceOf(a0), 600, 1));
    assert.equal(ut.equalRoughly(await cashier.balanceOf(a1), 700, 1));
    assert.equal(ut.equalRoughly(await cashier.balanceOf(voting.address), 0, 1));
    assert.equal(ut.equalRoughly(await cashier.balanceOf(game.address), 700, 1));
    
    
	await game.close({from:a0});
    assert.equal(await game.betAcceptable(), false);
    assert.equal(await game.isClosed(), true);
    //in this case, 'owner supply' is not necessary
	ut.equalRoughly(await game.totalBettings(), 700, 1);
	ut.equalRoughly(await game.totalRefunds(), 300*1.9, 1);
    ut.equalRoughly(await cashier.balanceOf(a0), 600 + 700 - 300*1.9, 1); //owner gets 100 as game owner profit
    ut.equalRoughly(await cashier.balanceOf(a1), 700 + 300*1.9, 1); //a1 wins 700
    assert.equal(await cashier.balanceOf(voting.address), 0);
    assert.equal(await cashier.balanceOf(game.address), 0);
    
    console.log("FINISH");
  });
});
	