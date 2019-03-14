
var truffle_event = require("../src/tools/truffle_event");
var CoinCashier = artifacts.require("CoinCashier");

contract('CoinCashier', function (accounts) {
	var a0 = accounts[0];
	var a1 = accounts[1];
	var a2 = accounts[2];

	it("cashier_basic", async function () {
		var cashier = await CoinCashier.new("test1", 10000, false, { from: a0 });
		var deposit_handler = truffle_event.extractor(CoinCashier.abi, "Deposit");
		var withdraw_handler = truffle_event.extractor(CoinCashier.abi, "Withdraw");
		var event_count = 0;
		assert.equal(web3.eth.getBalance(cashier.address), 0);

		var s1 = await cashier.deposit({ from: a0, value: 300 });
		deposit_handler(s1, function (address, amount) {
			assert.equal(address, a0);
			assert.equal(amount, 300);
			event_count++;
		});
		assert.equal(await cashier.getName(), "test1");
		assert.equal(await cashier.balanceOf(a0), 300);
		assert.equal(await cashier.balanceOf(a1), 0);
		assert.equal(event_count, 1);
		assert.equal(web3.eth.getBalance(cashier.address), 300);

		deposit_handler(await cashier.deposit({ from: a1, value: 500 }), function (address, amount) {
			assert.equal(address, a1);
			assert.equal(amount, 500);
			event_count++;
		});
		assert.equal(await cashier.balanceOf(a0), 300);
		assert.equal(await cashier.balanceOf(a1), 500);
		assert.equal(event_count, 2);
		assert.equal(await cashier.poolVolume(), 9200);
		assert.equal(web3.eth.getBalance(cashier.address), 800);

		withdraw_handler(await cashier.withdraw(300, { from: a0 }), function (address, amount) {
			assert.equal(address, a0);
			assert.equal(amount, 300);
			event_count++;
		});
		assert.equal(event_count, 3);
		assert.equal(await cashier.poolVolume(), 9500);
		assert.equal(web3.eth.getBalance(cashier.address), 500);
		withdraw_handler(await cashier.withdraw(500, { from: a1 }), function (address, amount) {
			assert.equal(address, a1);
			assert.equal(amount, 500);
			event_count++;
		});
		assert.equal(event_count, 4);
		assert.equal(await cashier.poolVolume(), 10000);
		assert.equal(web3.eth.getBalance(cashier.address), 0);
	});
	it("transfers", async function () {
		var cashier = await CoinCashier.new("test1", 10000, false, { from: a0 });
		await cashier.deposit({ from: a0, value: 1000 });
		await cashier.deposit({ from: a1, value: 500 });
		assert.equal(web3.eth.getBalance(cashier.address), 1500);

		await cashier.transferCoin(a1, 100, { from: a0 });
		assert.equal(await cashier.balanceOf(a0), 900);
		assert.equal(await cashier.balanceOf(a1), 600);
		assert.equal(web3.eth.getBalance(cashier.address), 1500);

		await cashier.multiTransferCoin([a1, a2], [100, 200], { from: a0 });
		assert.equal(await cashier.balanceOf(a0), 600);
		assert.equal(await cashier.balanceOf(a1), 700);
		assert.equal(await cashier.balanceOf(a2), 200);
		assert.equal(web3.eth.getBalance(cashier.address), 1500);

		var bl = await cashier.balanceList({ from: a0 }); // even if 'view' function, onlyOwner modifier is effective.
		assert.equal(bl.length, 2);
		assert.equal(bl[0].length, 3);
		assert.equal(bl[1].length, 3);

	});
	it("error_cases", async function () {
		var cashier = await CoinCashier.new("test1", 10000, false, { from: a0 });
		await cashier.setOpen(false, { from: a0 });
		assert.equal(await cashier.isOpen(), false);
		await cashier.deposit({ from: a1, value: 500 });
		assert.equal(await cashier.getLastError(), "cashier is not open");

		await cashier.setOpen(true, { from: a0 });
		assert.equal(await cashier.isOpen(), true);
		await cashier.deposit({ from: a1, value: 15000 });
		assert.equal(await cashier.getLastError(), "pool is insufficient");

		await cashier.deposit({ from: a0, value: 100 });
		await cashier.transferCoin(a1, 200, { from: a0 });
		assert.equal(await cashier.getLastError(), "coin is insufficient");

		//overflow check
		var v0 = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0"; //max value of uint256 - 0xF
		await cashier.multiTransferCoin([a1, a2], [v0, 0x20], { from: a0 });
		assert.equal(await cashier.getLastError(), "overflow on multipleTransfer!");

	});

});
