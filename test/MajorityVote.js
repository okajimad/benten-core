
var truffle_event = require("../src/tools/truffle_event");
var benten_util = require("../src/tools/benten_util");

var Cashier = artifacts.require("CoinCashier");
var MajorityVote = artifacts.require("MajorityVote_R8");
var Regulation = artifacts.require("DivideEquallyRegulation");

contract('MajorityVote', function(accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
  var c0 = "a1111";
  var c1 = "a2222";
  it("vote1", async function() {
    var cashier = await Cashier.new("test", 10000, false, {from:a0});
	var reg = await Regulation.new({from:a0});
	var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.address, null, now, now + 600, {from:a0});
    var vote_handler = truffle_event.extractor(MajorityVote.abi, "Voted");
    var closed_handler = truffle_event.extractor(MajorityVote.abi, "Closed");

    assert.equal((await voting.openTime()).toNumber(), now);
    assert.equal(await voting.deadlineTime(), now + 10*60); //10 minutes = 600 seconds
    await cashier.deposit({from:a0, value:1000});
    await cashier.deposit({from:a1, value:1500});
    await cashier.ownerSupply(voting.address, 100, {from:a0});
    assert.equal(await voting.votingFee(), 100);
    assert.equal(await cashier.balanceOf(a0), 900);
    assert.equal(await cashier.balanceOf(a1), 1500);
    assert.equal(await cashier.balanceOf(voting.address), 100);
    assert.equal(web3.eth.getBalance(cashier.address), 2500);
    console.log("Step1 "+(await voting.candidateList()));
    
    vote_handler(await cashier.bet8(voting.address, c0, 100, { from: a0 }), function (from, content, volume) {
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

    await voting.setNow(now + 3000);
    closed_handler(await voting.close({ from: a0 }), function (truth) {
        assert.equal(truth, c1);
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
	var reg = await Regulation.new({from:a0});
	var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.address, null, now, now+600, {from:a0}); //cashier address is not ICoinCashier
    await cashier.ownerSupply(voting.address, 100, {from:a0});
    await cashier.bet8(voting.address, c0, 9800, {from:a0});
    assert.equal(await voting.getLastError(), ""); //less than 99%
    assert.equal(await voting.isOccupiedByMajority(), false);
    await cashier.bet8(voting.address, c0, 100, {from:a0}); //the just 99%
    assert.equal(await voting.isOccupiedByMajority(), true);
    await cashier.bet8(voting.address, c0, 100, {from:a0}); //more votes are rejected
    assert.equal(await voting.getLastError(), "Existing Voter Profit Protect"); //99% rule
    assert.equal(await voting.isOccupiedByMajority(), true);
    await voting.setLastError("");
    var close_time = await voting.deadlineTime();
    await cashier.bet8(voting.address, c1, 12000, {from:a1});
    assert.equal((await voting.deadlineTime()).toNumber() - close_time,  30 * 60); //deadline time extended 30 minutes
    assert.equal(await voting.getLastError(), ""); 
    console.log(benten_util.formatBetting(await voting.currentVotingList()));
    assert.equal(await voting.isOccupiedByMajority(), false);
    
    voting.setNow(now-100);
    await cashier.bet8(voting.address, c1, 100, {from:a1});
    assert.equal(await voting.getLastError(), "voting is not acceptable");
    await voting.setLastError("");
    await cashier.bet8(voting.address, c1, 100, {from:a0}); //changed vote content c0 -> c1
    assert.equal(await voting.getLastError(), ""); //voting owner can vote anytime
    console.log(benten_util.formatBetting(await voting.currentVotingList()));

  });
});
	