

exports.formatBetting = function(bl) {
	return [ bl[0], bl[1].map(
function(e) { return (e.toNumber)? e.toNumber() : e.toString(); }
)];
}
