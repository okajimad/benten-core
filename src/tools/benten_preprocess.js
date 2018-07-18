
/*
	solidity で書かれた弁天用スマートコントラクトをコンパイルする
	solディレクトリにある全solファイルをコンパイルするが、コンパイル結果のファイルのほうがタイムスタンプが新しければスキップする
	
	fsは、読み込み時のみエンコーディング指定が必須
*/

const fs = require('fs');
const fsex = require('fs-extra');
const solc = require('solc');
const filepath = require('filepath');
const child_process = require('child_process');

const prep = require('./preprocessor');

const input_dir = filepath.create("src/sol");
const encoding = "utf8";

function merge(o1, o2) {
  var r = {};
  var k;
  for(k in o1) r[k] = o1[k];
  for(k in o2) r[k] = o2[k];
  return r;
}

function get_datasize_iteration(filename) {
  function vote_def(len) {
    return {"VOTE_SIZE":len.toString(), "VOTE_TYPE":"bytes"+len};
  }
  function result_def(len) {
    return {"RESULT_SIZE":len.toString(), "RESULT_TYPE":"bytes"+len};
  }
	
  if(filename.endsWith("_V.solp"))
    return [4,8].map(vote_def);
  else if(filename.endsWith("_V_R.solp")) {
    var rd = result_def(4);
    return [4,8].map(vote_def).map(function(e){return merge(e, rd)});
  }
  else if(filename.endsWith("_R.solp"))
    return [4].map(result_def);
  else //not applied
    return [{}];
}

function build(build_env) {
    //const output_dir = filepath.create("./contracts", build_env.defines.DEBUG? "debug" : "release");
    const output_dir = filepath.create("contracts", "");
    //const abi_list_path = output_dir.append("benten_abi.json");

    function toByteCodeFileName(name) {
        if(name.indexOf(".solp!")!=-1)
            return name.replace(".solp", "_code.js");
        else
            return name.replace(".sol", "_code.js");
    }
/*
    var resolveImport_Cache = {};
    function resolveImport(path) {
        console.log("resolve " + path);
        var c = resolveImport_Cache[path];
        if (c) return c;

        var file = output_dir.resolve(path);
        if (file.exists()) {
            c = { contents: fs.readFileSync(file.toString(), encoding) };
            resolveImport_Cache[path] = c;
            return c;
        }
        else
            return { error: 'File not found' };
    }
*/

    //ABIは全コントラクトをまとめて１ファイルにする
    //コンパイル時に更新しないものは現状維持なので一旦ファイルを全部読む
//const abi_list = fs.existsSync(abi_list_path.toString()) ? JSON.parse(fs.readFileSync(abi_list_path.toString(), encoding)) : {};

    //コンパイルすべきファイルにリスティング, およびプリプロセッサにかける
    var target_list = [];
    input_dir.recurse(file => {
        if (file.extname() != ".sol" && file.extname() != ".solp") return;

        var input_rel_path = input_dir.relative(file.toString());
        var stat = fs.statSync(file.toString());

        function canSkipCompile(sf) {
          if (sf.exists()) {
              var stat_out = fs.statSync(sf.toString());
              if (stat_out.mtime >= stat.mtime) return true; //タイムスタンプ判定でコンパイル不要
          }
          return false;
        }

        if (file.extname() == ".sol") {
            //simply copy file
            var output_rel_path = input_rel_path;
            var solfile = output_dir.resolve(output_rel_path);
            solfile.dir().mkdir();
            if(canSkipCompile(solfile)) return;
            fsex.copySync(file.toString(), solfile.toString());
            target_list.push({ input: solfile, rel_path:output_rel_path });
        }
        else {
            //preprocess and copy
            var datasize_iteration = get_datasize_iteration(input_rel_path);
            for(var i in datasize_iteration) {
              var sz_def = datasize_iteration[i];
              var output_rel_path = input_rel_path.replace(".solp", ".sol").replace("_V", "_V"+sz_def.VOTE_SIZE).replace("_R", "_R"+sz_def.RESULT_SIZE); //replace file name
              var solfile = output_dir.resolve(output_rel_path);
              solfile.dir().mkdir();
              if(canSkipCompile(solfile)) return;
              var sol_source = fs.readFileSync(file.toString(), encoding);
              //run preprocessor
              var prep_result = prep.preprocess(sol_source, merge(build_env.defines, sz_def)).join("")
              fs.writeFileSync(solfile.toString(), prep_result);
              target_list.push({ input: solfile, rel_path: output_rel_path });
            }
        }
    });

/*
    var compile_error = false;
    //read .sol files and compile
    var solc_input = {};
    var solc_output = {};
    target_list.forEach(e => {
        console.log("compile " + e.input);
        var sol_source = fs.readFileSync(e.input.toString(), encoding);
        var contractname = e.rel_path.replace(".sol", "").replace("/", "_").replace("\\", "_");
        console.log("  find contract " + contractname);
        solc_input[contractname] = sol_source;
        solc_output[contractname] = e.output;
    });
    var output = solc.compile({ sources: solc_input }, 1, resolveImport); // 1 はコンパイルオプション。他にもいろいろあると思う

    if (output.errors) {
        //コンパイルエラーを出力して処理中止 (including warnings)
        for (var p in output.errors) console.error(output.errors[p]);
        compile_error = true;
        return;
    }

    var outputfile_content = "";
    for (var name in output.contracts) { //複数contractが1つのファイルにあるとまずい
        var colon = name.indexOf(":");
        var contractname = name.substring(0, colon);
        if (solc_output[contractname]) {
            // for example, imported contracts are included 'output'. We extract only 'contractname' at initialization of 'solc_output'
            /*
            console.log("output contract name " + name);
            console.log("  output file" + solc_output[contractname].toString());
            console.log("  output name" + contractname);
            
            var bytecode_file_content = toByteCodeFileContent(contractname, output.contracts[name].bytecode);  //name は [filename]:[contractname] 
            fs.writeFileSync(solc_output[contractname].toString(), bytecode_file_content);

            //update abi_list that contains all contracts
            abi_list[contractname] = JSON.parse(output.contracts[name].interface);
        }
    }
    

    //ABIの書き込み
    //compileが書き込むときはjsonが望ましいが、gethの中で動くときはloadScriptでしか読めないのでbenten_contractsというグローバル変数に入れられるようにする
    //またgeth内で適宜ロードができるよう, bytecodeやcontractを入れられるプレースを作っておく
    fs.writeFileSync(abi_list_path.toString(), JSON.stringify(abi_list));

    var t = {};
    for (var name in abi_list)
        t[name] = { abi: abi_list[name] };
    fs.writeFileSync(abi_list_path.toString().replace("json", "js"), "var benten_contracts= " + JSON.stringify(t));
    */
}

//for (var i = 0; i < process.argv.length; i++) {

var now = '"'+new Date().toString()+'"';
var debug_env = { "defines":
  { "DEBUG": 1,
    "BUILD_TIME":now,
    "ERROR_CASE":["{", "setLastError(", "$0", "); return; }"]
  }
};
var release_env = { "defines":
  { "DEBUG": 0,
    "BUILD_TIME":now,
    "ERROR_CASE":["revert;"]
  }
};

build(debug_env);

