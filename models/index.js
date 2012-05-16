
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
	  text: "INSERT INTO acct(email,password) values($1, $2)",
	  values: [email,password]
	}, callback);
}

exports.createAcctTable = function(){
	client.query("drop table if exists acct");
	client.query("create table acct (id serial,emailConfirmed bool default false,email text not null unique,password text not null)",dbErr);
}

