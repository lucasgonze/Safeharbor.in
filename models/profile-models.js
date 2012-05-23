
var models = require('./index.js');

/*****************************
 * Account management
 *****************************/

// fixme: rename to something without "acct"
exports.checkAcct = function(email,password,callback){
	var query = models.getClient().query({
		text: "select id from acct where email = $1 and password = $2",
		values: [email,password]
		});	

	query.on('error', function(error) {
		console.log("Account query returning error");
		console.log(error);
		// this is an application error, not a bad username or password
		throw(error);
	});

	query.on('end', function(result) {
		if( typeof result === "object" &&
			typeof result.rowCount === "number" && 
			result.rowCount > 0 )
			callback(false,result);
		else
			callback(true);
	});
}

exports.initPasswordReset = function(email,callback){

	var query = models.getClient().query({
		text: "update acct set resetSecret = substring(md5(random()::text) from 2 for 10), resetDate = now() where email = $1 returning resetSecret",
		values: [email]
		});

	query.on('error', function(error) {
		throw("Error 447");
	});

	query.on('row', function(row) {	
		callback(false,row.resetsecret); // all lowercase is deliberate, not a bug
	});

	query.on('end',function(result){
		if( typeof result !== "object" ||
			typeof result.rowCount !== "number" || 
			result.rowCount < 1 )
			callback(true);
	});	
	
}

exports.saveNewPassword = function(resetSecret,newPassword,callback){
	// fixme: check the date on the resetSecret and don't do the update if older than an hour
	var query = models.getClient().query({
		text: "update acct set password = $1 where resetSecret = $2 returning email",
		values: [newPassword,resetSecret]
		});

	query.on('error', function(error) {
		throw("Error [super sandstone]");
	});

	query.on('row', function(row) {	
		callback(false); // false means an error did not occur
	});

	query.on('end',function(result){
		if( typeof result !== "object" ||
			typeof result.rowCount !== "number" || 
			result.rowCount < 1 )
			callback(true);
	});	
	
	
}
