
var truffle_event = require("../src/tools/truffle_event");
var ETHCashier = artifacts.require("ETHCashier");
var MajorityVote = artifacts.require("MajorityVote_R4"); //sample bet target

contract('ETHCashier', function (accounts) {
    var a0 = accounts[0];
    var a1 = accounts[1];

    it("ethcashier_basic", async function () {
        var a0_eth_1 = web3.eth.getBalance(a0);
        var cashier = await ETHCashier.new("test1", 1000000000, false, { from: a0 });
        var now = (await cashier.getNow()).toNumber();
        var vote = await MajorityVote.new(cashier.address, null, a0, now - 1, now + 300, 0, 0, { from: a0 });
        assert.equal(web3.eth.getBalance(cashier.address), 0);

        var s1 = await cashier.bet4(vote.address, "A", { from: a0, value: 30000000 });
        assert.equal(await cashier.getName(), "test1");
        assert.equal(await cashier.balanceOf(a0), 0);
        assert.equal(await cashier.balanceOf(vote.address), 30000000);
        assert.equal(await cashier.balanceOf(a1), 0);
        assert.equal(web3.eth.getBalance(cashier.address), 30000000);
        console.log("BalanceList " + (await cashier.balanceList({ from: a0 })));

        await cashier.bet4(vote.address, "B", { from: a1, value: 50000000 });
        assert.equal(await cashier.balanceOf(a0), 0);
        assert.equal(await cashier.balanceOf(a1), 0);
        assert.equal(await cashier.balanceOf(vote.address), 80000000);
        assert.equal(await cashier.poolVolume(), 920000000);
        assert.equal(web3.eth.getBalance(cashier.address), 80000000);

        var a1_eth_1 = web3.eth.getBalance(a1);
        //a1 wins voting
        await vote.setNow(now + 4000); //vote time is extended
        await vote.close({ from: a0 });
        console.log("vote error: %s", await vote.getLastError());
        console.log("cashier error: %s", await cashier.getLastError());
        await vote.refundPartial(0, 2); // refund main
        var a0_eth_2 = web3.eth.getBalance(a0);
        var a1_eth_2 = web3.eth.getBalance(a1);
        assert.ok(await vote.isClosed());
        assert.equal(await cashier.balanceOf(a0), 0);
        assert.equal(await cashier.balanceOf(a1), 0);
        assert.equal(await cashier.balanceOf(vote.address), 0);
        assert.equal((await cashier.poolVolume()).toNumber(), 1000000000);
        //diff_0 is not 0 for gas consumption
        var diff_0 = (-30000000) - a0_eth_2.minus(a0_eth_1);
        var diff_1 = 80000000 - a1_eth_2.minus(a1_eth_1.toNumber()).toNumber();
        assert.ok(diff_1 == 0);
        console.log(diff_0);
        assert.equal(web3.eth.getBalance(cashier.address), 0);

    });

});
