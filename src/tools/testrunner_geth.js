/*
	gethの中に入って動く、Solidityの動作試験用環境
*/
(function(){

//ABIからイベント定義を見つける
function findEventDef(abi, name) {
	for(var i=0; i<abi.length; i++) {
		var o = abi[i];
		if(o.type=="event" && o.name==name) return o;
	}
	return null;
}

//配列でないときは長さ１の配列にする
function createEventNames(v) {
	if(!Array.isArray(v)) throw "Event Definition is not array";
	
	var r = [];
	for(var i=0; i<v.length; i+=2) {
		var n = v[i].address;
		var alias = benten.addressMap[n].alias;
		if(!alias) throw "Alias is not found for index " + i;
		r[i/2] = alias + "." + v[i+1];
	}
	return r;
}
//createEventNamesはできたという前提で、argのObjectをABIの引数順で配列にする
function createEventArgConverters(v) {
	var r = [];
	for(var i=0; i<v.length; i+=2) {
		var n = v[i].address;
		var abi = benten.addressMap[n].abi;
		var ed = findEventDef(abi, v[i+1]);
		if(!ed) throw "Event Definition for " + v[i+1] + " not found";
		var inputs = ed.inputs;
		// (a,b,c)という引数のイベントがあれば、[arg[a],arg[b],arg[c]]という配列を作って返す関数になる。
		r[i/2] = function(earg) {
			var a = [];
			for(var j=0; j<inputs.length; j++)
				a[j] = earg[inputs[j].name];
			return a;
	    }
	}
	return r;
}

//配列の各要素をキーとし、その値にnullがマップされたオブジェクト
function makeEmptyVars(names) {
	var o = {};
	for(var i in names)
		o[ names[i] ] = null;
	return o;
}
//nullでないもので埋まったらOK
function satisfiedEventResults(step) {
	for(var i in step.eventNames)
		if(step.eventVars[ step.eventNames[i] ] == null) return false;
	return true;
}
//ウォッチしたいイベント名に合わせて
function formatEventResults(step) {
  var r = [];
  if(step.eventNames) {
    for(var i = 0; i<step.eventNames.length; i++) {
        var ev = step.eventVars[step.eventNames[i]];
        r = r.concat(step.eventArgConverters[i](ev));
    }
  }
  return r
}
function formatEventName(earg) {
  return earg.alias + "." + earg.event;
}
exports.testCase = function() {
  return {
    step: function(triggerf, eventDefs, assertf) {
    	eventNames = createEventNames(eventDefs);
    	//ステップのオブジェクト作成
var n = { triggerf:triggerf, eventNames:eventNames, eventArgConverters:createEventArgConverters(eventDefs), eventVars:makeEmptyVars(eventNames), assertf:assertf };
		//各ステップからなるLinkedListの保持
        if(this.firstStep) {
        	this.lastStep.next = n;
        	this.lastStep = n;
        }
        else {
        	this.firstStep = this.lastStep = n;
        }
    	return this;
    },
    //ハンドラを得る。doneは全部が完了して初めて呼ぶやつ
    confirm: function(done) {
    	
    	var s = this.firstStep;
    	var ignore_events = false;
    	
    	//ここで返す関数が、gethのイベントリスナーになる。
    	//現在のステップが興味のあるイベントを受信し続け、揃ったらassert用関数を呼ぶ
    	return function(earg) {
    		if(ignore_events) return;
    		
    		s.eventVars[formatEventName(earg)] = earg.args;
    		if(!satisfiedEventResults(s)) return;
    		
    		try {
    		  s.assertf.apply(null, formatEventResults(s));
    	    }
    	    catch(e) {
   	        console.log(e);
   	        console.log(e.stack);
    	      ignore_event = true;
   	          done(false); //Assert失敗時は全部を強制終了し以降のイベントを無視
   	          return;
    	    }
    	    
    	    //次のステップへ
    		if(s.next) {
    		  s = s.next;
    		  try {
				s.triggerf();
      	      }
    	      catch(e) {
    	        console.log(e); //Triggerの実行でランタイムエラーになることもある。それを報告
    	        console.log(e.stack);
   	            done(false); 
   	            return;
   	          }
    	    }
    		else //完全終了
    		  done(true);
        };
    }
  };
};

exports.assertEq = function(expected, actual, tag) {
  if(actual!=expected) {
  	  var msg = "Error!! GethTestRunner Assertion Failed\n";
  	  msg += "[Expected] " + expected.toString();
  	  msg += " [Actual] " + actual.toString();
  	  if(tag) msg += " [Tag] " + tag;
  	  console.log(msg);
  	  throw msg;
  }
};

})();
