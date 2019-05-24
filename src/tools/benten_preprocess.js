
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

//const output_dir = filepath.create("./contracts", build_env.defines.DEBUG? "debug" : "release");
const output_dir = filepath.create("contracts", "");
const vscode_src_dir = filepath.create("src/generated", "");
const encoding = "utf8";

function merge(o1, o2) {
  var r = {};
  var k;
  for (k in o1) r[k] = o1[k];
  for (k in o2) r[k] = o2[k];
  return r;
}

function get_datasize_iteration(filename) {
  function vote_def(len) {
    return { "VOTE_SIZE": len.toString(), "VOTE_TYPE": "bytes" + len };
  }
  function result_def(len) {
    return { "RESULT_SIZE": len.toString(), "RESULT_TYPE": "bytes" + len };
  }

  if (filename.endsWith("_V.solp"))
    return [4, 8].map(vote_def);
  else if (filename.endsWith("_V_R.solp")) {
    var rd = result_def(4);
    return [4, 8].map(vote_def).map(function (e) { return merge(e, rd) });
  }
  else if (filename.endsWith("_R.solp"))
    return [4].map(result_def);
  else //not applied
    return [{}];
}

function canSkip(dest, src) {
  if (dest.exists()) {
    var stat_src = fs.statSync(src.toString());
    var stat_out = fs.statSync(dest.toString());
    if (stat_out.mtime >= stat_src.mtime) return true; //タイムスタンプ判定でコンパイル不要
  }
  return false;
}

//run preprocess and write result
function preprocess_solp(build_env, input_dir) {
  var target_list = [];
  input_dir = filepath.create(input_dir);
  input_dir.recurse(file => {
    if (file.extname() != ".solp") return;

    var input_rel_path = input_dir.relative(file.toString());
    //preprocess and copy
    var datasize_iteration = get_datasize_iteration(input_rel_path);
    for (var i in datasize_iteration) {
      var sz_def = datasize_iteration[i];
      var output_rel_path = input_rel_path.replace(".solp", ".sol").replace("_V", "_V" + sz_def.VOTE_SIZE).replace("_R", "_R" + sz_def.RESULT_SIZE); //replace file name
      var solfile = output_dir.resolve(output_rel_path);
      if (canSkip(solfile, file)) return;
      solfile.dir().mkdir();
      var solp_source = fs.readFileSync(file.toString(), encoding);
      //run preprocessor
      build_env.defines["FILE"] = output_rel_path.replace("\\", "\\\\");
      var preprocessor_result = prep.preprocess(solp_source, merge(build_env.defines, sz_def)).join("")
      fs.writeFileSync(solfile.toString(), preprocessor_result);

      //to linting sol files using VSCode, result file also placed at src/generated
      solfile = vscode_src_dir.resolve(output_rel_path);
      solfile.dir().mkdir();
      fs.writeFileSync(solfile.toString(), preprocessor_result);

      target_list.push({ input: solfile, rel_path: output_rel_path });
    }
  });

}

//copy if file is newer
function preprocess_sol(build_env, input_dir) {
  input_dir = filepath.create(input_dir);
  input_dir.recurse(file => {
    if (file.extname() != ".sol") return;
    //copy if source is newer
    var input_rel_path = input_dir.relative(file.toString());
    var solfile = output_dir.resolve(input_rel_path);
    if (canSkip(solfile, file)) return;
    solfile.dir().mkdir();
    fs.copyFileSync(file.toString(), solfile.toString());
  });
}

function preprocess(build_env) {
  preprocess_sol(build_env, "src/sol");
  preprocess_solp(build_env, "src/solp");

}

const now = '"' + new Date().toString() + '"';
const debug_env = {
  "name":"debug",
  "defines":
  {
    "DEBUG": 1,
    "BUILD_TIME": now,
    "ERROR_CASE": ["{", "setLastError(", "$0", "); return;}"]
  }
};
const release_env = {
  "name":"release",
  "defines":
  {
    "DEBUG": 0,
    "BUILD_TIME": now,
    "ERROR_CASE": ["revert();"]
  }
};

const env_name = process.argv[2]; // node benten_preprocess.js [debug/release]
const env = env_name=="release"? release_env : debug_env;
console.log("benten preprocess env_name=%s", env.name);
preprocess(env); //run
