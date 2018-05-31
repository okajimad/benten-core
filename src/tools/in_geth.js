
/*
	gethの中で動くやつのセットアップ
*/

var benten = { addressMap:{} }; //弁天用ルートオブジェクト
var exports = {};

//よく使うアカウント
var a0 = eth.accounts[0];
var a1 = eth.accounts[1];

//モジュールのロード
//ここにトリックがあり、ロード先はES5のJavaScriptモジュールを想定している。
//gethはこれを直接サポートしないが、グローバル変数 exports の存在のもとで実行すれば必要なものが exports に入るので、それをbenten[key]にコピーすれば必要なものがセットアップできる
function loadModule(key, filename) {
  if(!loadScript(filename)) throw "load error for " + filename;
  benten[key] = exports;
  exports = {};
}


//abiはある前提で、まだロードされてないならbytecodeをロードし、contractへもってくる
function loadContract(name) {
  var c = benten_contracts[name];
  if(!c) console.log("contract " + name + " not found");
  if(!c.contract) {
    loadScript("output/"+name+"_code.js");
    c.bytecode = eval(name + "_bytecode");
    c.contract = web3.eth.contract(c.abi);
  }
  return c;
}

//aliasが登録されていればそれを使い、いなければアドレス自身の先頭を返す　読みやすいように
function findAlias(address) {
  var p = benten.addressMap[address];
  if(p)
    return p;
  else
    return {alias:address.substring(0, 6)+"..."};
}

//既知のコントラクトがあるならそれを登録
function registerAlias(address, typeName, alias) {
  var c = loadContract(typeName);
  benten.addressMap[address] = {alias:alias};
  return c.contract.at(address);
}

function errorWrap(f, this_, args) {
 try {
   f.apply(this_, args);
 }
 catch(e) {
   console.log(e);
   console.log(e.stack);
 }
}

function deployContract(name, alias, owner, constructor_arg, deploy_callback) {
  var c = loadContract(name);
  
  
  var on_deploy = function (e, contract) {
    if(e)
      console.log('Deploy Error ' + e.toString());
    if(typeof contract.address !== 'undefined') {
         console.log('Contract mined: ' + alias + ', address: ' + contract.address);
         benten.addressMap[contract.address] = {alias:alias, abi:c.abi }; //逆に引けるようにする
         //allEvents.watchを重ねて呼ぶと前のやつも有効で混乱のもとだし、であるからcontractにルートのフックをつける形で
         contract.allEvents().watch( function(e, val) {
           if(e) console.log("event error / " + e);
           var p = findAlias(val.address);
           var a = {alias:p.alias, event:val.event, args:val.args, address:val.address};
           console.log("Watch / " + JSON.stringify(a));
           if(contract.bentenEventHook) contract.bentenEventHook(a);
         });
         if(deploy_callback) errorWrap(deploy_callback, null, [contract]);
      }
  };
  
  constructor_arg.push( { from: owner, data: c.bytecode, gasPrice:10000000000000, gas:3500000/* gas:'4700000'*/ }); //このgasを変にいじるとおかしな点がいろいろ。後で調べる
  constructor_arg.push( on_deploy);
  return c.contract.new.apply(c.contract, constructor_arg); //カスタムコンストラクタ引数に対して追加
}

//このin_geth.jsからの相対パスではないことに注意
loadModule("unittest", "src/testrunner_geth.js");

//これはグローバル変数とする
loadScript("output/benten_abi.js");

//Cashierはもはや安定していてあまりいじらないと思うので、基本既存のブロックチェーンに入れてしまう。
//最初に作るときだけこれを呼び、そのアドレスをtodaywork.jsに入れる
function deployCashier(alias, owner) {
  return deployContract("CoinCashier", alias, owner, [100000], function(c) {
    eth.sendTransaction({from:a0, to:c.address, value:30000});
    eth.sendTransaction({from:a1, to:c.address, value:30000});
  });
}
