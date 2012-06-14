
/*
drop table if exists acct;
create table acct (id serial,email text not null unique,password text not null not null unique) with oids;
drop table if exists emailHandshake;
create table emailHandshake (creation timestamp DEFAULT current_timestamp,id serial, email text not null unique,password text not null) with oids;
drop table if exists site;
create table site (ownerid integer not null, id serial, sitename text not null, domain text not null unique, agentaddress text not null, agentemail text not null) with oids; 
drop table if exists resets;
create table resets (ts timestamp,userid integer not null,secret text not null);
*/
exports.recreateTables = function(){
	var client = require('./index.js').getClient();
	client.query('drop table if exists acct');
	client.query('create table acct (acctid serial,email text not null unique,password text not null,resetSecret text,resetDate timestamp) with oids');
	client.query('drop table if exists emailHandshake');
	client.query('create table emailHandshake (creation timestamp DEFAULT current_timestamp,regid serial, email text not null,password text not null) with oids');
	client.query('drop table if exists site');
	client.query('create table site (ownerid integer not null, siteid serial, sitename text not null, domain text not null unique, agentaddress text not null, agentemail text not null) with oids; ');
	client.query('drop table if exists resets');
	client.query('create table resets (ts timestamp,userid integer not null,secret text not null)');	
    client.query('drop table if exists audit');
    client.query('create table audit (auditid serial, siteid integer not null, opname text not null, attachment text not null,creation timestamp DEFAULT current_timestamp)');
}

