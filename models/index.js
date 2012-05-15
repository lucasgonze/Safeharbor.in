
//var D = new Date(); console.log("Debug logging at (hours:minutes) "); console.log(D.getHours()); console.log(D.getMinutes());

var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
var conString = process.env.DATABASE_URL || "tcp://postgres:EMbr4EDS@localhost/safeharborin";
var client = new pg.Client(conString);
client.connect();

function dbErr(err,result)
	if( err !== null ) {
		console.log("got error on create table");
		console.log(err);
	} else 
		console.log("Create table ok")
}		

function logAcct(){
	var query = client.query("SELECT * FROM acct");
	query.on('row', function(row) {
		console.log("got row");
	  	console.log(row.email);
	  	console.log(row.password);
	});

	query.on('end', function() { 
	  client.end();
	});	
}

function createAcctTable(){
	client.query("drop table if exists acct");
	client.query("create table acct (id serial,emailConfirmed bool default false,email text not null,password text not null)",dbErr);
}

createAcctTable();
