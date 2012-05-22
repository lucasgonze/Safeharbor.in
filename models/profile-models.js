
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
		// this is really an application error, not a bad username or password
		callback(true);
	});
	query.on('row', function(result) {
		callback(false,result);
	});
	query.on('end', function(result) {
		callback(true);
	});
}

