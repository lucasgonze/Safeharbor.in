
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
		callback(error);
	});
	
	query.on('row', function(row) {	
		callback(null,row);
	});

	query.on('end', function(result) {
		if( typeof result !== 'undefined') // DB error
			if( result.rowCount < 1) 
				callback(null,null); // not found
	});
}

exports.initPasswordReset = function(email,callback){

	var query = models.getClient().query({
		text: "update acct set resetSecret = substring(md5(random()::text) from 2 for 10), resetDate = now() where email = $1 returning resetSecret",
		values: [email]
		});

	query.on('error', function(error) {callback(error)});

	query.on('row', function(row) {	
		callback(null,row.resetsecret); // all lowercase is deliberate, not a bug
	});

	query.on('end',function(result){
		if( typeof result !== 'undefined') // DB error
			if( result.rowCount < 1) 
				callback(null,null); // not found
	});		
}

exports.saveNewPassword = function(resetSecret,newPassword,callback){
	
	// fixme: check the date on the resetSecret and don't do the update if older than an hour
	var query = models.getClient().query({
		text: "update acct set password = $1 where resetSecret = $2 and returning email",
		values: [newPassword,resetSecret]
		});

	query.on('error', function(error) {callback(error)});

	query.on('row', function(row) { callback(null,row); });

	query.on('end',function(result){
		if( typeof result !== 'undefined') // DB error
			if( result.rowCount < 1) 
				callback(null,null); // not found
	});		
}

/* For a user who hasn't lost their password. */
exports.resetPasswordForLoggedInUser = function(userID,currentPassword,newPassword,callback){

	var query = models.getClient().query({
		text: "update acct set password = $1 where id = $2 and password = $3 returning id",
		values: [newPassword,userID,currentPassword]
		});

	query.on('error', function(error) { callback(error); });
	query.on('row', function(row) {	callback(null,row); });

	query.on('end',function(result){
		if( typeof result !== 'undefined') // DB error
			if( result.rowCount < 1) 
				callback(null,null); // not found
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

	acctQuery.on('error', function(error) { callback(error); });
	acctQuery.on('row', function(row) {	callback(null,row); });

	// note: no handler for the 'end' event makes sense in this case.
}

exports.getSiteForUser = function(ownerid,callback){
	var query = models.getClient().query({
		text: "select *, oid from site where ownerid = $1",
		values: [ownerid]
		});

	query.on('error', function(error) { callback(error); });
	query.on('row', function(row) {	callback(null,row); });

	query.on('end',function(result){
		if( typeof result !== 'undefined') // DB error
			if( result.rowCount < 1) 
				callback(null,null); // not found
	});	
}

exports.updateSiteForUser = function(ownerid,sitename,domain,agentaddress,agentemail,callback){
	var query = models.getClient().query({
		text: "update site set sitename = $2, domain = $3, agentaddress = $4, agentemail = $5 where ownerid = $1",
		values: [ownerid,sitename,domain,agentaddress,agentemail]
	});

	query.on('error', function(error) { callback(error); });
	query.on('row', function(row) {	callback(null,row); });

	query.on('end',function(result){
		if( typeof result !== 'undefined') // DB error
			if( result.rowCount < 1) 
				callback(null,null); // not found
	});	
}



