
/*
Preprocess .solp files into ordinal solidity source under simple #if and #define directives like C or C#.

In principle, you should use a complete compiler generator, but for this purpose it is enough based on regular expressions.

In comparison to C#, logical orerators in #if ( ex. #if DEBUG && WINDOWS), are not supported.

Restrection in macro with arguments:
 * only quote, number, and identifiers can be macro arguments.
 * macro parameter should be $0, $1, ...
 * you can define macro only in your JS, not preprocessor source.
 * for example, if you declare macro as  defines["XXX"] = ["(", "$0", "+", "$1", ")"], and preprocessor calls XXX(A, 5), the result is (A + 5).

*/
'use strict';
function is_space(v) {
    for (var i = 0; i < v.length; i++)
        if (v[i] != " ") return false;
    return true;
}
function is_newline(s) {
    return s.indexOf("\n") != -1;
}


function init_token_defs(source, token_defs) {
    for (var i in token_defs) {
        var t = token_defs[i];
        t.regex.lastIndex = 0;
        t.result = t.regex.exec(source);
    }
}
function select_token_at(token_defs, cursor) {
    for (var i in token_defs) {
        var t = token_defs[i];
        if (t.result != null && t.result.index == cursor) return t;
    }
    return null;
}
function refresh_token_defs(source, token_defs, cursor) {
    for (var i in token_defs) {
        var t = token_defs[i];
        if (t.result != null && t.result.index < cursor) {
            t.regex.lastIndex = cursor;
            t.result = t.regex.exec(source);
        }
    }

}

function c_style_token_defs() {
    return [
        // following regular expressions originate from https://github.com/substack/c-tokenizer/blob/master/rules.js
        { regex: /(\s+)/g, name: 'whitespace' },
        { regex: /([_A-Za-z]\w*)/g, name: 'identifier' },
        { regex: /[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/g, name: 'number' },
        { regex: /\/\*([^*]|\*(?!\/))*\*\//g, name: 'area comment' },
        { regex: /\/\*([^*]|\*(?!\/))*\*?/g, name: 'area comment continue' },
        { regex: /\/\/[^\n]*/g, name: 'line comment' },
        { regex: /"([^"\n]|\\")*"/g, name: 'quote' },
        { regex: /'([^'\n]|\\')*'/g, name: 'quote' },
        { regex: /'(\\?[^'\n]|\\')'?/g, name: 'char' },
        { regex: /'[^']*/g, name: 'char continue' },
        { regex: /#([a-zA-Z]+)/g, name: 'directive' },
        { regex: /\(/g, name: 'open paren' },
        { regex: /\)/g, name: 'close paren' },
        { regex: /\[/g, name: 'open square' },
        { regex: /\]/g, name: 'close square' },
        { regex: /{/g, name: 'open curly' },
        { regex: /}/g, name: 'close curly' },
        { regex: /([~!%^&*\/\=|.,:;\?]|->|<{1,2}|>{1,2}|\*{1,2}|\|{1,2}|&{1,2}|-{1,2}|\+{1,2}|[-+*|&%\/=]=)/g, name: 'operator' },
        { regex: /\\\n?/g, name: 'line continue' },
        { regex: /##([_A-Za-z]\w*)/g, name: 'token concat' }
    ];
}

exports.tokenize = function tokenize(source) {
    var result = [];
    var token_defs = c_style_token_defs();
    init_token_defs(source, token_defs);
    var cursor = 0;
    while (cursor < source.length) {
        var tok = select_token_at(token_defs, cursor);
        if (tok == null) { throw "token not found / maybe it is syntax error in the source file"; }

        result.push({ "type": tok.name, "begin": tok.result.index, "end": tok.regex.lastIndex });
        cursor = tok.regex.lastIndex;
        refresh_token_defs(source, token_defs, cursor);
    }
    return result;
}

// tokens such as '$0', '$1' are converted into macro parameter
function apply_macro(m, args) {
    var result = [];
    for (var i in m) {
        var v = m[i];
        if (v[0] == "$") result.push(args[parseInt(v[1])]);
        else result.push(v);
    }
    return result;
}

function remove_last_whitespaces(arr) {
    //removed prev whitespaces
    var last = arr[arr.length - 1];
    while (is_space(last)) {
        arr.pop();
        last = arr[arr.length - 1];
    }
}

exports.preprocess = function (source, defines) {
    if (!defines) defines = {};

    var if_stack = [];
    function if_stack_enabled() {
        for (var i in if_stack)
            if (if_stack[i] == false) return false;
        return true;
    }

    var tokens = exports.tokenize(source, c_style_token_defs());

    function token_at(i) {
        var t = tokens[i];
        return source.substring(t.begin, t.end);
    }
    //search next 2 tokens without whitespace
    function next2tok(c, callback) {
        var first = null;
        while (true) {
            var t = tokens[c];
            if (t.type != "whitespace" && t.type != "area comment" && t.type != "line comment") {
                if (!first)
                    first = token_at(c);
                else {
                    callback(first, token_at(c), c);
                    return c + 1;
                }
            }
            c++;
        }
    }
    function next1tok(c, callback) {
        while (true) {
            var t = tokens[c];
            if (t.type != "whitespace" && t.type != "area comment" && t.type != "line comment") {
                callback(token_at(c), c);
                return c + 1;
            }
            c++;
        }
    }
    function next_bracket_close(c, callback) {
        var args = [];
        while (true) {
            var t = tokens[c];
            // Ommission Work!  We should use aythentic token analizer...
            if (t.type == "quote" || t.type == "number" || t.type == "identifier") {
                args.push(token_at(c));
            }
            if (t.type == "close paren") {
                callback(args);
                return c;
            }
            c++;
        }
    }
    function check_quote(v) {
        //apply #XXX style macro
        if (v.indexOf('#') == -1) return v; //easy case

        for (var k in defines) {
            var e = defines[k];
            v = v.replace("#" + k, e);
        }
        return v;
    }
    var c = 0;
    var result = [];

    while (c < tokens.length) {
        var t = tokens[c];
        var ty = t.type;
        var tv = source.substring(t.begin, t.end);
        if (ty == "directive") {
            tv = tv.substring(1); //remove '#'
            if (tv == "define")
                c = next2tok(c + 1, function (k, v) { defines[k] = v });
            else if (tv == "undef")
                c = next1tok(c + 1, function (k) { defines[k] = null });
            else if (tv == "if") {
                var neg = false;
                function if_branch(v) {
                    var val = defines[v] ? true : false;
                    if (neg) val = !val;
                    if_stack.push(val);
                };
                c = next1tok(c + 1, function (v, c) {
                    if (v == "!") {
                        neg = true;
                        next1tok(c + 1, if_branch);
                    }
                    else
                        if_branch(v);
                });
            }
            else if (tv == "else") {
                if_stack[if_stack.length - 1] = !if_stack[if_stack.length - 1]
                c++;
            }
            else if (tv == "endif") {
                if_stack.pop();
                c++;
            }
            else if (defines[tv]) {
                if (if_stack_enabled()) {
                    result.push('"' + defines[tv] + '"'); //stringizing
                    c++;
                }
            }
            else
                throw "unknown directive " + tv;
        }
        else if (ty == "identifier") {
            if (if_stack_enabled()) {
                var a = defines[tv];
                if (tv != "constructor" && a) { //Every JS object has 'contructor' property though solidity uses constructor keyword!
                    if (Array.isArray(a)) {
                        c = next_bracket_close(c + 1, function (args) {
                            var x = apply_macro(a, args);
                            result = result.concat(apply_macro(a, args));
                        });
                    }
                    else
                        result.push(a);
                }
                else
                    result.push(tv);
            }
            c++;
        }
        else if (ty == "token concat") {
            if (if_stack_enabled()) {
                remove_last_whitespaces(result);
                var n = tv.substring(2);
                result.push(defines[n]); // get after "##"
                c++;
                //skip whitespace
                while (is_space(token_at(c))) {
                    c++;
                }
            }
        }
        else if (ty == "quote") {
            if (if_stack_enabled()) result.push(check_quote(tv));
            c++;
        }
        else {
            if (if_stack_enabled() || is_newline(tv)) //preserve newline to hold line number. solc may output compile error
                result.push(tv);
            c++;
        }
    }

    return result;

}

