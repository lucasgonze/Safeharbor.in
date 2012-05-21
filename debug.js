
// Posgres reference: https://github.com/brianc/node-postgres/wiki/Query

//var D = new Date(); console.log("Debug logging at (hours:minutes) "); console.log(D.getHours()); console.log(D.getMinutes());

function getClient(){
	var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
	var conString = process.env.DATABASE_URL || "tcp://postgres:EMbr4EDS@localhost/safeharborin"; // on heroku and on my local dev box
	var client = new pg.Client(conString);
	client.connect();
	return(client);
}

oid = 17196;
callback = function(err,result){
	console.log("BP 2");
	console.log(err);
	console.log(result);
}

	var result = null;
	var client = getClient();

	var query = client.query({
		text: "insert into acct (email,password,opaque_id) select email, password, oid from emailHandshake where oid = $1 returning id",
		values: [oid]
	});
	console.log(query);
	// we now have either an insert id or an error to return to our caller
	query.on('error', function(error) {
		console.log("L 6");
		client.query('rollback');
		client.query('end');
		callback(error);
    });
console.log("L 1");
 	query.on('row', function(row) {	
console.log("L 2");
console.log(row);
    	console.log('got row back after insert');
		result = row;
    });
console.log("L 3");
