
const prep = require('../src/tools/preprocessor');

var assert = require('assert');

describe('prep', function() {
  describe('1', function() {
    it('simple macro', function() {
      var defs = {"A":10};
      var r = prep.preprocess("A B C", defs);
      assert.equal(r.join(""), "10 B C");
    });
  });
  describe('2', function() {
    it('macro with args', function() {
      var defs = {"B": ["$0", "+", "$1"]};
      var r = prep.preprocess("A B(2,3) C", defs);
      assert.equal(r.join(""), "A 2+3 C");
    });
  });
  describe('3', function() {
    it('token concat', function() {
      var defs = {"T": 8, "S":16};
      var r = prep.preprocess("x = X ##T _ ##S ;", defs);
      assert.equal(r.join(""), "x = X8_16;");
    });
  });
  describe('4', function() {
    it('stringizing', function() {
      var defs = {"T": 8, "S":16};
      var r = prep.preprocess("x = #T; y = 'A_#S_#T';", defs);
      assert.equal(r.join(""), "x = \"8\"; y = 'A_16_8';");
    });
  });
  describe('5', function() {
    it('ternary', function() {
      var r = prep.preprocess("x = (y>5)? 0 : 1", null);
      assert.equal(16, r.length);
      assert.equal(r.join(""), "x = (y>5)? 0 : 1");
    });
  });
});
