
//make event extract function from abi.
//the function receives truffle transaction result JSON and calls back to user event handler

exports.extractor = function(abi, eventName) {
  function findEventTypeInfo() {
    for(var i in abi) {
    	var e = abi[i];
    	if(e.name==eventName && e.type=="event") return e;
    }
    return null;
  }
  
  var et = findEventTypeInfo();
  if(et==null) throw "eventType not found / " + eventName;
  
  return function(truffle_result, callback) {
  	  var logs = truffle_result.logs;
  	  for(var i in logs) {
  	  	  if(logs[i].event==eventName) {
  	  	  	  var s = logs[i].args;
  	  	  	  //format args to abi order
	  	  	  var a = et.inputs.map(function(x) { return s[x.name]; });
	  	  	  callback.apply(this, a);
  	  	  }
  	  }
  }
}
