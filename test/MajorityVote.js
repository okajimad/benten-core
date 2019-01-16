
var truffle_event = require("../src/tools/truffle_event");
var benten_util = require("../src/tools/benten_util");

var Cashier = artifacts.require("CoinCashier");
var MajorityVote = artifacts.require("MajorityVote_R4");
var Regulation = artifacts.require("ChohanRegulation");

contract('MajorityVote', function(accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
  var a2 = accounts[2];
  var c0 = "a111";
  var c1 = "a222";
  it("vote1", async function() {
    var cashier = await Cashier.new("test", 10000, false, {from:a0});
	var reg = await Regulation.new(1900,0,0, {from:a0});
	var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.address, a0, now, now + 600, 0, {from:a0});
    await voting.setCheckMajorityOnClose(false, {from:a0} );
    var vote_handler = truffle_event.extractor(MajorityVote.abi, "Voted");
    var closed_handler = truffle_event.extractor(MajorityVote.abi, "Closed");

    assert.equal((await voting.openTime()).toNumber(), now);
    assert.equal(await voting.lockTime(), now + 10*60); //10 minutes = 600 seconds
    await cashier.deposit({from:a0, value:1000});
    await cashier.deposit({from:a1, value:1500});
    await cashier.ownerSupply(voting.address, 200, {from:a0});
    assert.equal(await voting.votingFee(), 200);
    await voting.setFreeVotings(100, 2); //100unit * 2
    assert.equal(await voting.votingFee(), 0);
    assert.equal((await voting.getFreeVotings())[1], 2);
    assert.equal(await cashier.balanceOf(a0), 800);
    assert.equal(await cashier.balanceOf(a1), 1500);
    assert.equal(await cashier.balanceOf(voting.address), 200);
    assert.equal(web3.eth.getBalance(cashier.address), 2500);
    console.log("Step1 "+(await voting.candidateList()));
    
    vote_handler(await cashier.bet4(voting.address, c0, 100, { from: a0 }), function (from, content, volume) {
        assert.equal(a0, from);
        assert.equal(content, c0);
        assert.equal(volume, 100);
    });
    var v1 = await cashier.bet4(voting.address, c0, 100, { from: a1 });
    
    //2nd vote from a1
    v1 = await cashier.bet4(voting.address, c1, 100, {from:a1});
    
    assert.equal(await cashier.balanceOf(a0), 700);
    assert.equal(await cashier.balanceOf(a1), 1300);
    assert.equal(await cashier.balanceOf(voting.address), 500);
    console.log("Step2 "+(await voting.candidateList()));
    console.log("      "+(await voting.currentVotingList()));
    
    //free vote
    await voting.freeVote(c1, {from:a2});
    assert.equal((await voting.getFreeVotings())[1], 1);
    // totalsupply:500( supply:0, freeVoteRemain:100, a0:100, a1:200, a2:100),  winner:a1 and a2
    assert.equal(3, (await voting.voterCount()));

    await voting.setNow(now + 6000); //locktime is extended
    console.log("D1");
    await voting.close({ from: a0 });
    //closed_handler(await voting.close({ from: a0 }), function (truth) {
    //    assert.equal(truth, c1);
    //});
    console.log("Step3 truth="+(await voting.truth()));
    console.log("      err="+(await voting.getLastError()));
    
    console.log("D2");
    assert.ok(await voting.isClosed());
    var refunds = await voting.refundTuple();
    console.log("D3");
    assert.equal(3, await voting.voterCount());
    assert.equal(refunds[0][0], a0);
    assert.equal(refunds[0][1], a1);
    assert.equal(refunds[0][2], a2);
    assert.equal(refunds[1][0], 0);
    assert.equal(refunds[1][1], 333); //(500 * 200 / 300)  , 100
    assert.equal(refunds[1][2], 166); //(500 * 100 / 300)  , 200
    assert.equal(refunds[2], 1); 
    assert.equal(await cashier.balanceOf(a0), 701);
    assert.equal(await cashier.balanceOf(a1), 1633);
    assert.equal(await cashier.balanceOf(a2), 166);
    assert.equal(await cashier.balanceOf(voting.address), 0);
    assert.equal(web3.eth.getBalance(cashier.address), 2500);

  });
  it("error_check", async function() {
    var cashier = await Cashier.new("test", 10000, false, {from:a0});
	var reg = await Regulation.new(1900,0,0, {from:a0});
	var now = (await cashier.getNow()).toNumber();
    var voting = await MajorityVote.new(cashier.address, reg.address, a0, now, now+600, 0, {from:a0}); //cashier address is not ICoinCashier
    await cashier.ownerSupply(voting.address, 100, {from:a0});
    await cashier.bet4(voting.address, c0, 9800, {from:a0});
    assert.equal(await voting.getLastError(), ""); //less than 99%
    assert.equal(await voting.majorityRatioPermil(), Math.floor( 9800*1000/9900 ));
    await cashier.bet4(voting.address, c0, 100, {from:a0}); //the just 99%
    assert.equal(await voting.majorityRatioPermil(), Math.floor( 9900*1000/10000 ) );
    await cashier.bet4(voting.address, c0, 100, {from:a0}); //more votes are rejected
    assert.equal(await voting.getLastError(), "Existing Voter Profit Protect"); //99% rule
    
    await voting.setLastError("");
    var close_time = await voting.lockTime();
    await cashier.bet4(voting.address, c1, 12000, {from:a1});
    assert.equal((await voting.lockTime()).toNumber() - close_time,  60 * 60); //deadline time extended 60 minutes
    assert.equal(await voting.getLastError(), ""); 
    console.log(benten_util.formatVoting(await voting.currentVotingList()));
    assert.equal((await voting.majorityRatioPermil()).toNumber(), Math.floor( 12000*1000/22000 ) );
    
    await voting.setNow(now-100);
    await cashier.bet4(voting.address, c1, 100, {from:a1});
    assert.equal(await voting.getLastError(), "voting is not acceptable");
    await voting.setLastError("");
    await cashier.bet4(voting.address, c1, 100, {from:a0}); //changed vote content c0 -> c1
    assert.equal(await voting.getLastError(), ""); //voting owner can vote anytime
    console.log(benten_util.formatVoting(await voting.currentVotingList()));

  });
});
	