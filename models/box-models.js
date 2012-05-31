
var models = require('./index.js');
exports.get = function(siteid,callback){

	// fixme: use a truly opaque ID rather than showing the literal database serial number ID
	var query = models.getClient().query({
		text: "select *,oid from site where oid = $1",
		values: [siteid]
		});	

	query.on('error', function(error) {throw(error);}); // code problem
	
	query.on('row', function(row) {	
		callback(false,row);
	});

	query.on('end', function(result) {
		if( result.rowCount < 1)
			callback(true);
	});
}

