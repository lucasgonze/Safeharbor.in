
//var D = new Date(); console.log("Debug logging at (hours:minutes) "); console.log(D.getHours()); console.log(D.getMinutes());


function getClient(){
	var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
	var conString = process.env.DATABASE_URL || "tcp://postgres:EMbr4EDS@localhost/safeharborin"; // on heroku and on my local dev box
	var client = new pg.Client(conString);
	client.connect();
	return(client);
}

exports.createAcct = function(email,password,callback){
	
	getClient().query({
	  name: 'insert acct',
	  text: "INSERT INTO acct(email,password,opaque_id) values($1, $2, $3)",
	  values: [email,password,opacified]
	}, function(err,insertCallback){
		callback(err,opacified);
	});
}

exports.initEmailConfirmation = function(email,password,callback){
	getClient().query({
	  name: 'insert confirmation',
	  text: "INSERT INTO emailHandshake(email,password) values($1,$2)",
	  values: [email,password]
	}, callback);
}

exports.handshakeEmailConfirmation = function(oid,callback){
	var client = getClient();
	client.query(
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

exports.recreateTables = function(){
	client = getClient();
	client.query("drop table if exists acct");
	client.query("create table acct (id serial,email text not null unique,password text not null,opaque_id varchar(32) not null unique)");
	client.query("drop table if exists emailHandshake");
	client.query("create table emailHandshake (creation timestamp DEFAULT current_timestamp,id serial, email text not null unique,password text not null) with oids;");
}


