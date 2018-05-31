
var Random = artifacts.require("Random");

contract('Random', function(accounts) {
  it("t1", async function() {
    var a0 = accounts[0];
    var rnd = await Random.new(new Date().getTime(), {from:a0});
    var odd_count = 0;
    var mlb_count = 0; // most left bit
    
    var total_count = 1000;
    for(var i=0; i<total_count; i++) {
      await rnd.nextUint32();
      var v = await rnd.get();
      if(v & 1) odd_count++;
      if(v & 0x80000000) mlb_count++;
    }
    console.log("count= %f %f", odd_count, mlb_count);
    
    //r1, r2 must be around 0.5 because Random provides correct random values
    var r1 = odd_count / total_count;
    var r2 = mlb_count / total_count;
    assert.ok(r1 > 0.45);
    assert.ok(r1 < 0.55);
    assert.ok(r2 > 0.45);
    assert.ok(r2 < 0.55);
  });
});
	