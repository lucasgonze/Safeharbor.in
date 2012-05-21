
var models = require('./index.js');

//var D = new Date(); console.log("Debug logging at (hours:minutes) "); console.log(D.getHours()); console.log(D.getMinutes());

function getSecureUniquePublicID(){
	var id = Math.floor((Math.random()*10000000)+1);
	return(""+id);
}

exports.createAcct = function(email,password,callback){
	
	models.getClient().query({
	  name: 'insert acct',
	  text: "INSERT INTO acct(email,password,opaque_id) values($1, $2, $3)",
	  values: [email,password,opacified]
	}, function(err,insertCallback){
		callback(err,opacified);
	});
}

exports.checkForAccount = function(email,callback){
	models.getClient().query({
		text: "select count(*) from acct where email = $1", 
		values: [email]
	}, callback);
}

exports.initEmailConfirmation = function(email,password,callback){
	models.getClient().query({
	  name: 'insert confirmation',
	  text: "INSERT INTO emailHandshake(email,password) values($1,$2)",
	  values: [email,password]
	}, callback);
}

exports.handshakeEmailConfirmation = function(oid,callback){
	models.getClient().query(
		{text: "select email,password from emailHandshake where oid = $1",values: [oid]},
		function (err,selectResult){
			if( undefined !== err && null !== err )
				callback(err);
		 	else {
				client.query({text: "delete from emailHandshake where oid = $1",values: [oid]});
				callback(err,selectResult);
			}
		}
	);
}

exports.createAcct = function(oid,callback){
	var result = null;
	var client = models.getClient();

	client.query('begin');

	var query = client.query({
		text: "insert into acct (email,password) select email, password from emailHandshake where oid = $1 returning id",
		values: [oid]
	});
	// we now have either an insert id or an error to return to our caller
	query.on('error', function(error) {
		console.log(error);
		client.query('rollback');
		client.query('end');
		callback(error);
    });
 	query.on('row', function(row) {	
		console.log(row)
		result = row;
    });

	query = client.query({
		text: "delete from emailHandshake where oid = $1",
		values: [oid]
	});
	query.on('error', function(error) {
		client.query('rollback');
		client.query('end');
		callback(error);
    });

	client.query('end',function(){
		callback(null,result);		
	});
}

exports.createSite = function(ownerid,sitename,domain,agentaddress,agentemail,callback){
	var query = models.getClient().query({
		text: "insert into site (ownerid,sitename,domain,agentaddress,agentemail) values($1,$2,$3,$4,$5) returning id,oid",
		values: [ownerid,sitename,domain,agentaddress,agentemail]
	});
	// we now have either an insert id or an error to return to our caller
	query.on('error', function(error) {
		callback(error);
    });
 	query.on('row', function(row) {	
		callback(null,row);
    });	
}

