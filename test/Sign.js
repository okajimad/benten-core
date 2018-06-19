
var Validator = artifacts.require("ValidateSignature");

contract('SignaturePractice', function(accounts) {
  it("", async function() {
    var a0 = accounts[0];
    var content = "01234567890123456789012345678901234567890123456789";
    var hash = web3.sha3(content);
    //sign is hex string as 520-bit(65 bytes) value. the length of string is 132 ("0x" + (520/4) )
    //validation feature is not supported by web3, ethereumjs-util may support it.
    
    var validator = await Validator.new({from:a0});
    //hash = await validator.toEthSignedMessageHash(hash);
    
    var sign = await web3.eth.sign(a0, hash);
    var r = "0x" + sign.substring(2, 2+64);
    var s = "0x" + sign.substring(2+64, 2+64+64);
    var v = parseInt(sign.substring(2+64+64, 2+64+64+2), 16);
    v += 27; //version must be 27 or higher! see https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ECRecovery.sol
    var ret_addr = await validator.verify(r, s, v, hash);
    assert.equal(a0, ret_addr);

  });
});
	