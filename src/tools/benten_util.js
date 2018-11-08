
const conv = function(e) { return (e.toNumber)? e.toNumber() : e; };

exports.formatBetting = function(bl) {
	return [ bl[0], bl[1].map(conv), bl[2].map(conv) ];
}
exports.formatVoting = function(bl) {
	return [ bl[0], bl[1].map(conv) ];
}

//ro: [ [odds0, odds1, ... ], cashier_fee ]
exports.formatRefundOdds = function(ro) {
	return [ ro[0].map(conv), conv(ro[1]) ];
}

//tt: [ addresses, refund_volumes, cashier_fee, owner_fee]
exports.formatRefundTuple = function(rt) {
	return [ rt[0], rt[1].map(conv), conv(rt[2]), conv(rt[3]) ];
};

exports.equalRoughly = function(a, b, e) {
	var fmt = function(v) { return v.toNumber? v.toNumber() : v.toString() };
	assert.ok(Math.abs(a - b) <= e, "not equal / expected=" + fmt(a) + ", actual=" + fmt(b));
}
