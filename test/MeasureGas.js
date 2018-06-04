
var MeasureGas = artifacts.require("MeasureGas");
var Cashier = artifacts.require("CoinCashier");
var MajorityVote = artifacts.require("MajorityVote_R8");
var Regulation = artifacts.require("DivideEquallyRegulation");
var DivideEqually = artifacts.require("DivideEqually_V8_R8");

contract('MeasureGas', function(accounts) {
    var a0 = accounts[0];
    /*
  it("gas1", async function() {
      var mg = await MeasureGas.new({from:a0});
      await mg.set8("00000001");
      await mg.get8();
      await mg.sendTransaction({from:a0, value:1});
      await mg.set32("00000001000000010000000100000001");
      await mg.get32();
      await mg.sendTransaction({from:a0, value:2});
      await mg.setLong("0000000100000001000000010000000100000001000000010000000100000001");
      await mg.getLong();
      await mg.sendTransaction({from:a0, value:3});

  });
    */
    it("betting count and gas", async function () {
        if(accounts.length<100)
            assert.ok(false, "this test requires at least 100 accounts");
      var cashier = await Cashier.new("test", 1000000, false, { from: a0 });
      var reg = await Regulation.new({ from: a0 });
      var now = (await cashier.getNow()).toNumber();
      var voting = await MajorityVote.new(cashier.address, reg.address, now + 60, 10, { from: a0 });
      var game = await DivideEqually.new(cashier.address, voting.address, reg.address, now, true, { from: a0 });
      for (var i = 0; i < 100; i++) {
          await cashier.deposit({ from: accounts[i], value: 1000 });
          await cashier.bet8(game.address, (i*100).toString(), 1000, { from: accounts[i] });
          //place delimiter to ganache log
          if ((i % 10) == 0) 
              await web3.eth.sendTransaction({ from: accounts[99], to: accounts[0], value: i * 10 });
          console.log("progress %d / 100", i);
      }
      console.log(await game.currentBettingList());
  });
});
