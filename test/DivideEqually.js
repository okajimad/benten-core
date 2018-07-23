
var truffle_event = require("../src/tools/truffle_event");
var ut = require("../src/tools/benten_util");

var Cashier = artifacts.require("CoinCashier");
var MajorityVote = artifacts.require("MajorityVote_R4");
var Regulation = artifacts.require("GenericSport_WinLose");
var ExPostGame = artifacts.require("ExPostGame_V4_R4");

contract('Basic games', function(accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
  var c0 = "0x000100";
  var c1 = "0x000001";
  it("DivideEqually", async function() {
    var cashier = await Cashier.new("test", 10000, false, {from:a0});
	var reg = await Regulation.new(0, 0, 0, 0, {from:a0});
	var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.addres, a0, now+120, now+180);
	var game = await ExPostGame.new("さゆ", cashier.address, voting.address, reg.address, now, now+60, true, {from:a0});

  var a0_initial_coin = 0;
  var a1_initial_coin = 0;
    await cashier.deposit({from:a0, value:1000});
    await cashier.deposit({from:a1, value:1500});
    await cashier.ownerSupply(voting.address, 100, {from:a0});
    await cashier.bet4(game.address, c0, 400, {from:a0});
    await cashier.bet4(game.address, c1, 300, {from:a1})
    assert.equal(await game.title(), "さゆ");
    //this test gamble returns all bets to winner. if a1 wins, a1 receives 700
    await cashier.bet4(voting.address, c1, 200, {from:a0});
    
    assert.equal(await cashier.balanceOf(a0), 300);
    assert.equal(await cashier.balanceOf(a1), 1200);
    assert.equal(await cashier.balanceOf(voting.address), 300);
    assert.equal(await cashier.balanceOf(game.address), 700);
    var bettings = await game.currentBettingList();

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
    
    ut.equalRoughly(await game.estimateTotalRefund(c0, {from:a0}), 700, 1);
    ut.equalRoughly(await game.estimateTotalRefund(c1, {from:a0}), 700, 1);

    await voting.setNow(now+300);
    await game.setNow(now+300);
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
	ut.equalRoughly(await game.totalBettings(), 700, 1);
	ut.equalRoughly(await game.totalRefunds(), 700, 1);
    ut.equalRoughly(await cashier.balanceOf(a0), 600, 1); //owner gets 100 as game owner profit
    ut.equalRoughly(await cashier.balanceOf(a1), 1900, 1); //a1 wins 700
    assert.equal(await cashier.balanceOf(voting.address), 0);
    assert.equal(await cashier.balanceOf(game.address), 0);
    
    console.log("FINISH");
  });
  it("ownerSupply", async function () {
      var cashier = await Cashier.new("test", 10000, false, { from: a0 });
      var reg = await Regulation.new({ from: a0 });
      var now = (await cashier.getNow()).toNumber();
      var voting = await MajorityVote.new(cashier.address, reg.address, a0, now + 120, now+180, { from: a0 });
      var game = await SimpleLottery.new(cashier.address, voting.address, reg.address, now, now+60, true, { from: a0 });
      game.setPayoutPermil(3000); //winner 3 takes 3 timers of their bets

      var a0_initial_coin = 0;
      var a1_initial_coin = 0;
      await cashier.deposit({ from: a0, value: 1000 });
      await cashier.deposit({ from: a1, value: 1500 });
      await cashier.ownerSupply(voting.address, 100, { from: a0 });
      await cashier.bet8(game.address, c0, 400, { from: a0 });
      await cashier.bet8(game.address, c1, 300, { from: a1 })

      await cashier.bet8(voting.address, c1, 200, { from: a0 });

      assert.equal(await cashier.balanceOf(a0), 300);
      assert.equal(await cashier.balanceOf(a1), 1200);
      assert.equal(await cashier.balanceOf(voting.address), 300);
      assert.equal(await cashier.balanceOf(game.address), 700);
      var bettings = await game.currentBettingList();
      //assert.equal(bettings[0][0], c0); //TODO conversion utility required
      //assert.equal(bettings[0][1], c1);
      assert.equal(bettings[1][0], 400);
      assert.equal(bettings[1][1], 300);

      var b0 = await game.bettingOf({ from: a0 });
      var b1 = await game.bettingOf({ from: a1 });
      //assert.equal(b0[0], c0);
      //assert.equal(b1[0], c1);
      assert.equal(b0[1], 400);
      assert.equal(b1[1], 300);

      //At this point:
      // initial asset: a0:1000, a1:1500
      // voting: ownerSupply 100(a0), vote 200(a0) for 'c1'
      // game: c0,400(a0) c1,300(a1)

      assert.equal(await game.estimateTotalRefund(c0, { from: a0 }), 1200);
      assert.equal(await game.estimateTotalRefund(c1, { from: a0 }), 900);

      await voting.setNow(now + 1000);
      await game.setNow(now + 1000);
      assert.equal(await game.betAcceptable(), false);
      assert.equal(await game.isClosed(), false);
      assert.equal(await voting.voteAcceptable(), false);
      await voting.close({ from: a0 });
      
      //assert.equal(c1, await voting.truth()); //voting.truth() is converted to a string '0x61323232320000'!!
      assert.equal(await cashier.balanceOf(a0), 600);
      assert.equal(await cashier.balanceOf(a1), 1200);
      assert.equal(await cashier.balanceOf(voting.address), 0);
      assert.equal(await cashier.balanceOf(game.address), 700);

      assert.equal(await game.estimateTotalRefund(c0), 1200);
      assert.equal(await game.estimateTotalRefund(c1), 900);
      //owner supply is short!
      await game.close({ from: a0 });
      assert.equal(await game.getLastError(), "owner supply is insufficient");
      await cashier.ownerSupply(game.address, 200, { from: a0 });
      assert.equal(await cashier.balanceOf(a0), 400);
      await game.close({ from: a0 });

      assert.equal(await game.betAcceptable(), false);
      assert.equal(await game.isClosed(), true);
      assert.equal(await game.totalBettings(), 700);
      assert.equal(await game.totalRefunds(), 900);
      assert.equal(await cashier.balanceOf(a0), 400); //owner gets 100 as game owner profit
      assert.equal(await cashier.balanceOf(a1), 2100); //a1 wins 700
      assert.equal(await cashier.balanceOf(voting.address), 0);
      assert.equal(await cashier.balanceOf(game.address), 0);

      console.log("FINISH");
  });
  it("cancelGame", async function () {
      var cashier = await Cashier.new("test", 10000, false, { from: a0 });
      var reg = await Regulation.new({ from: a0 });
      var now = (await cashier.getNow()).toNumber();
      var voting = await MajorityVote.new(cashier.address, reg.address, now + 60, 10, { from: a0 });
      var game = await SimpleLottery.new(cashier.address, voting.address, reg.address, now, true, { from: a0 });
      game.setPayoutPermil(3000); //winner 3 takes 3 timers of their bets

      var a0_initial_coin = 0;
      var a1_initial_coin = 0;
      await cashier.deposit({ from: a0, value: 1000 });
      await cashier.deposit({ from: a1, value: 1500 });
      await cashier.bet8(game.address, c0, 400, { from: a0 });
      await cashier.bet8(game.address, c1, 300, { from: a1 })

      assert.equal(await cashier.balanceOf(a0), 600);
      assert.equal(await cashier.balanceOf(a1), 1200);
      assert.equal(await cashier.balanceOf(voting.address), 0);
      assert.equal(await cashier.balanceOf(game.address), 700);
      var bettings = await game.currentBettingList();
      //assert.equal(bettings[0][0], c0); //TODO conversion utility required
      //assert.equal(bettings[0][1], c1);
      assert.equal(bettings[1][0], 400);
      assert.equal(bettings[1][1], 300);

      //At this point:
      // initial asset: a0:1000, a1:1500
      // voting: 0
      // game: c0,400(a0) c1,300(a1)

      assert.equal(await game.estimateTotalRefund(c0, { from: a0 }), 1200);
      assert.equal(await game.estimateTotalRefund(c1, { from: a0 }), 900);

      await voting.setNow(now + 1000);
      await game.setNow(now + 1000);
      assert.equal(await game.betAcceptable(), false);
      assert.equal(await game.isClosed(), false);
      assert.equal(await voting.voteAcceptable(), false);
      //cancel game
      await game.cancelGame({from: a0});
      assert.ok(await game.cancelled());
      
      //assert.equal(c1, await voting.truth()); //voting.truth() is converted to a string '0x61323232320000'!!
      assert.equal(await cashier.balanceOf(a0), 1000);
      assert.equal(await cashier.balanceOf(a1), 1500);
      assert.equal(await cashier.balanceOf(voting.address), 0);
      assert.equal(await cashier.balanceOf(game.address), 0);
      assert.equal(await game.isClosed(), true);
      assert.equal(await game.totalBettings(), 700);
      assert.equal(await game.totalRefunds(), 700);

      console.log("FINISH");
  });
});
	