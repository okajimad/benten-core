

exports.formatBetting = function(bl) {
	return [ bl[0], bl[1].map(
function(e) { return (e.toNumber)? e.toNumber() : e.toString(); }
)];
}

exports.equalRoughly = function(a, b, e) {
	var fmt = function(v) { return v.toNumber? v.toNumber() : v.toString() };
	assert.ok(Math.abs(a - b) <= e, "not equal / expected=" + fmt(a) + ", actual=" + fmt(b));
}
