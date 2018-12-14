
var InterContract = artifacts.require("InterContract");

contract('InterContract', function(accounts) {
  it("t1", async function() {
    var a0 = "0xb011FE1C6a03f7ed487A6DD1200f5f086277A0b9";
    console.log("start");
    console.log(accounts);
    web3.personal.unlockAccount(a0, "sana", 0);
    var ic = await InterContract.new({from:a0 });
    await ic.testA(123, 0);
    console.log(await ic.getA());
  });
});
	