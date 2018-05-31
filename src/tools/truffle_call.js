
var options = {
"contracts_directory":"contracts/debug",
"contracts_build_directory":"build/debug"
};

var done = function(err, result) {
	if(err) {
		console.log(err.message);
	}
	else {
		console.log("Compile Succeeded");
	}
}

var Config = require("truffle-config");
var Contracts = require("truffle-workflow-compile");

var config = Config.detect(options);
Contracts.compile(config, done);
