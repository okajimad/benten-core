
var truffle_event = require("../src/tools/truffle_event");
var ETHCashier = artifacts.require("ETHCashier");
var MajorityVote = artifacts.require("MajorityVote_R8"); //sample bet target
var Random = artifacts.require("Random");

contract('ETHCashier', function(accounts) {
  var a0 = accounts[0];
  var a1 = accounts[1];
    
  it("ethcashier_basic", async function() {
    var cashier = await ETHCashier.new("test1", 1000000000, false, {from:a0});
	var now = (await cashier.getNow()).toNumber();
    var vote = await MajorityVote.new(cashier.address, null, a0, now-1, 10, {from:a0});
    assert.equal(web3.eth.getBalance(cashier.address), 0);
    
    var s1 = await cashier.bet8(vote.address, "A", {from:a0, value:30000000});
	assert.equal(await cashier.name(), "test1");
	assert.equal(await cashier.balanceOf(a0), 0);
	assert.equal(await cashier.balanceOf(vote.address), 30000000);
	assert.equal(await cashier.balanceOf(a1), 0);
    assert.equal(web3.eth.getBalance(cashier.address), 30000000);
	console.log("AAA " + (await cashier.balanceList({from:a0})));
	console.log("AAA " + (await cashier.balanceListPrac2({from:a0})));
    
    await cashier.bet8(vote.address, "B", {from:a1, value:50000000});
	assert.equal(await cashier.balanceOf(a0), 0);
	assert.equal(await cashier.balanceOf(a1), 0);
	assert.equal(await cashier.balanceOf(vote.address), 80000000);
    assert.equal(await cashier.poolVolume(), 920000000);
    assert.equal(web3.eth.getBalance(cashier.address), 80000000);
    
    var a1_eth_1 = web3.eth.getBalance(a1);
    //a1 wins voting
    await vote.setNow(now+600);
    await vote.close({from:a0});
   	var a1_eth_2 = web3.eth.getBalance(a1);
    assert.equal(await cashier.balanceOf(a0), 0);
	assert.equal(await cashier.balanceOf(a1), 0);
	assert.equal(await cashier.balanceOf(vote.address), 0);
    assert.equal(await cashier.poolVolume(), 1000000000);
    console.log(await cashier.getLastError());
    //gasïâíSÇÃñ‚ëËÇ…Ç‹Ç¬ÇÌÇÈñ‚ëËÇ∆évÇÌÇÍÇÈÅBé·ä±êîéöÇ™çáÇÌÇ»Ç¢
    assert.ok(80000000 - a1_eth_2.minus(a1_eth_1.toNumber()).toNumber() < 3000 );
    assert.equal(web3.eth.getBalance(cashier.address), 0);
    
  });
  
});
