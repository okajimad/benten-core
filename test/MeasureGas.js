
var MeasureGas = artifacts.require("MeasureGas");

contract('MeasureGas', function(accounts) {
  var a0 = accounts[0];
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

});
