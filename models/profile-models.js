
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
	
	query.on('row', function(row) {	
		callback(false,row);
	});

	query.on('end', function(result) {
		if( result.rowCount < 1)
			callback(true);
	});
}

exports.initPasswordReset = function(email,callback){

	var query = models.getClient().query({
		text: "update acct set resetSecret = substring(md5(random()::text) from 2 for 10), resetDate = now() where email = $1 returning resetSecret",
		values: [email]
		});

	query.on('error', function(error) {
		console.log(error);
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

/* For a user who hasn't lost their password. */
exports.resetPasswordForLoggedInUser = function(userID,currentPassword,newPassword,callback){

	var query = models.getClient().query({
		text: "update acct set password = $1 where id = $2 and password = $3 returning id",
		values: [newPassword,userID,currentPassword]
		});

	query.on('error', function(error) {
		console.log(error);
		throw("Cat on a hot tin roof");
	});

	query.on('row', function(row) {	
		callback(false); // false means an error did not occur
	});

	query.on('end',function(result){
		console.log('got end in resetPasswordForLoggedInUser');
		console.log(result);
		if( typeof result !== "object" ||
			typeof result.rowCount !== "number" || 
			result.rowCount < 1 )
			callback(true);
	});		
}

exports.deleteAccount = function(userid,callback){
	
	// PT 1: delete any sites owned by this user
	// (in the future when there are multiple accounts per site this will become more complex)
	var siteQuery = models.getClient().query({
		text: "delete from site where ownerid = $1",
		values: [userid]
		});
	siteQuery.on('error', function(error) {
		console.log("Error [back four]");
		console.log(error);
		// note: we don't stop just because there was an error. this is arguably foolish 
		// because it means that something is borked in internal state.
	});	
	
	// PT 2: delete the user
	var acctQuery = models.getClient().query({
		text: "delete from acct where id = $1 returning id",
		values: [userid]
		});

	acctQuery.on('error', function(error) { throw("Error [back nine]"); });

	acctQuery.on('end',function(result){
		if( typeof result !== "object" ||
			typeof result.rowCount !== "number" || 
			result.rowCount < 1 )
			callback(true); // an error did occur
		else
			callback(false); // an error did not occur
	});		
}

exports.getSiteForUser = function(ownerid,callback){
	var query = models.getClient().query({
		text: "select *, oid from site where ownerid = $1",
		values: [ownerid]
		});

	query.on('error', function(error) { throw("Eat a peach"); });

	query.on('row', function(row) {	
		callback(false,row); // false means an error did not occur
	});

	query.on('end',function(result){
		if( typeof result !== "object" ||
			typeof result.rowCount !== "number" || 
			result.rowCount < 1 )
			callback(true); // an error did occur
	});		
	
}

exports.setSiteForUser = function(ownerid,sitename,domain,agentaddress,agentemail,callback){
	var query = models.getClient().query({
		text: "update site set sitename = $2, domain = $3, agentaddress = $4, agentemail = $5 where ownerid = $1",
		values: [ownerid,sitename,domain,agentaddress,agentemail]
	});
	// we now have either an insert id or an error to return to our caller
	query.on('error', function(error) {
		console.log('got error in setSiteForUser');
		console.log(error);
		callback(error);
    });
	query.on('end',function(result){
		console.log('got end in setSiteForUser');
		callback( typeof result !== "object" ||
			typeof result.rowCount !== "number" || 
			result.rowCount < 1);
	});		

}



