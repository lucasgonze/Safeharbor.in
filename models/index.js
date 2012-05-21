

// Posgres reference: https://github.com/brianc/node-postgres/wiki/Query

exports.getClient = function() {
	var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
	var conString = process.env.DATABASE_URL || "tcp://postgres:EMbr4EDS@localhost/safeharborin"; // on heroku and on my local dev box
	var client = new pg.Client(conString);
	client.connect();
	return(client);
}

/*
drop table if exists acct;
create table acct (id serial,email text not null unique,password text not null not null unique) with oids;
drop table if exists emailHandshake;
create table emailHandshake (creation timestamp DEFAULT current_timestamp,id serial, email text not null unique,password text not null) with oids;
drop table if exists site;
create table site (ownerid integer not null, id serial, sitename text not null, domain text not null unique, agentaddress text not null, agentemail text not null) with oids; 
*/
exports.recreateTables = function(){
	client = exports.getClient();
	// see above for sql to execute here.
}

