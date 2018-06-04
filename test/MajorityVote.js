
var truffle_event = require("../src/tools/truffle_event");

var Cashier = artifacts.require("CoinCashier");
var MajorityVote = artifacts.require("MajorityVote");
var SimpleLottery = artifacts.require("SimpleLottery");

contract('MajorityVote', function(accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
  var c0 = "a1111";
  var c1 = "a2222";
  it("vote1", async function() {
    var cashier = await Cashier.new("test", 10000, false, {from:a0});
	var reg = await SimpleLottery.new({from:a0});
	var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.address, now, 10, {from:a0});
    var vote_handler = truffle_event.extractor(MajorityVote.abi, "Voted");
    var closed_handler = truffle_event.extractor(MajorityVote.abi, "Closed");

    assert.equal((await voting.openTime()).toNumber(), now);
    assert.equal(await voting.closeTime(), now + 10*60); //10 minutes = 600 seconds
    await cashier.deposit({from:a0, value:1000});
    await cashier.deposit({from:a1, value:1500});
    await cashier.ownerSupply(voting.address, 100, {from:a0});
    assert.equal(await voting.votingFee(), 100);
    assert.equal(await cashier.balanceOf(a0), 900);
    assert.equal(await cashier.balanceOf(a1), 1500);
    assert.equal(await cashier.balanceOf(voting.address), 100);
    assert.equal(web3.eth.getBalance(cashier.address), 2500);
    console.log("Step1 "+(await voting.candidateList()));
    
    vote_handler.(await cashier.bet8(voting.address, c0, 100, { from: a0 }), function (from, content, volume) {
        assert.equal(a0, from);
        assert.equal(content, c0);
        assert.equal(volume, 100);
    });
    var v1 = await cashier.bet8(voting.address, c0, 100, { from: a1 });
    
    //2nd vote from a1
    v1 = await cashier.bet8(voting.address, c1, 100, {from:a1});
    
    assert.equal(await cashier.balanceOf(a0), 800);
    assert.equal(await cashier.balanceOf(a1), 1300);
    assert.equal(await cashier.balanceOf(voting.address), 400);
    console.log("Step2 "+(await voting.candidateList()));
    console.log("      "+(await voting.currentVotingList()));

    await voting.setNow(now + 800);
    closed_handler(await voting.close({ from: a0 }), function (truth) {
        assert.equal(truth, "c1");
    });
    console.log("Step3 truth="+(await voting.truth()));
    
    var refunds = await voting.refundTuple();
    assert.equal(2, await voting.voterCount());
    assert.equal(refunds[0][0], a0);
    assert.equal(refunds[0][1], a1);
    assert.equal(refunds[1][0], 0);
    assert.equal(refunds[1][1], 400);
    assert.equal(refunds[2], 0);
    assert.equal(await cashier.balanceOf(a0), 800);
    assert.equal(await cashier.balanceOf(a1), 1700);
    assert.equal(await cashier.balanceOf(voting.address), 0);
    assert.equal(web3.eth.getBalance(cashier.address), 2500);

  });
  it("error_check", async function() {
    var cashier = await Cashier.new("test", 10000, false, {from:a0});
	var reg = await SimpleLottery.new({from:a0});
	var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.address, now, 10, {from:a0}); //cashier address is not ICoinCashier
    voting.setNow(now-100);
    await cashier.bet8(voting.address, c0, 100, {from:a1});
    assert.equal(await voting.getLastError(), "voting is not acceptable");
    voting.setLastError("");
    await cashier.bet8(voting.address, c0, 100, {from:a0});
    assert.equal(await voting.getLastError(), ""); //voting owner can vote anytime
    
  });
});
	