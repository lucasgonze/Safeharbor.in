var safeharbor = require('../lib/safeharbor.js');

var model = safeharbor.models;

var debug = require('../lib/debug.js');
var ModelPerformer = model.ModelPerformer;
exports.CODES = model.CODES;

process.on( safeharbor.UPDATE_EVENT_NAME, function(major,minor,revision) {
    console.log( major, minor, revision );
});

exports.recreateTables = function(callback){
	var client = model.getClient();
	debug.save();
	debug.setVolume(1);
    debug.out('RECREATE TABLES---------------');
    

	function q( sql )
	{
	    debug.out( 'SQL ', sql );
	    client.query( sql, callback );
	}
	
	q('drop table if exists acct');
	q('create table acct (  acctid serial unique, ' +
	                      ' email text not null unique, ' +
	                      ' password text not null, ' +
	                      ' resetSecret text, ' +
	                      ' role text not null, ' +
	                      ' autologin integer not null default 0, ' +
	                      ' resetDate timestamp ' + 
	                      ') with oids');

	q('drop table if exists site');
	q('create table site (  acct integer not null, ' +
	                      ' siteid serial unique, ' +
	                      ' sitename text not null, ' +
	                      ' domain text not null unique, ' +
	                      ' agentaddress text not null, ' +
	                      ' agentemail text not null,' +
						  ' agentname text not null,' +
						  ' agentphone text not null' +
	                      ') with oids');

    q('drop table if exists contact');
    q("create table contact ( contactid serial unique, " +
                            " owners_full_name text not null, " +
                            " full_name text not null, " +
                            " job_title text not null, " +
                            " email text not null, " +
                            " phone text not null, " +
                            " fax text not null, " +
                            " postal text not null " +                            
                            ")");

    q('drop table if exists audit');
    q("create table audit (  auditid serial unique, " +
                           " site integer not null, " +
                           " contact integer not null default 0, " + 
                           " opname text not null, " +
                           " attachment text not null default '', " +
                           " creation timestamp DEFAULT current_timestamp" +
                           ")");

    q('drop table if exists media');
    q("create table media (  mediaid serial unique, " +
                           " audit integer not null, " +
                           " page text not null, " +
                           " media_url text not null, " +
                           " anchor text not null, " +
                           " description text not null " +
                           ")");


	q('drop table if exists emailHandshake');
	q('create table emailHandshake (creation timestamp DEFAULT current_timestamp,regid serial, email text not null,password text not null) with oids');

	q('drop table if exists resets');
	q('create table resets (ts timestamp,userid integer not null,secret text not null)');	
	
    q('drop table if exists requests');
    
    debug.restore();
}

exports.cleanTables = function(callback) {
    console.log('CLEAN TABLES---------------');
	var client = model.getClient();

	function q( sql )
	{
	    client.query( sql, [], function(a,b,c) { callback(sql, a, b, c ); } );
	}
	
	q('delete from acct');
	q('delete from emailHandshake');
	q('delete from site');
	q('delete from resets');
    q('delete from audit');
    q('delete from contact');
    q('delete from media');

    q("insert into acct (role,email,password) values ('1','victor@safeharbor.in',  'qqqq')");
    q("insert into acct (role,email,password) values ('1','lucasgonze@safeharbor.in', 'qqqq')");
    q("insert into acct (role,email,password) values ('1','jim@safeharbor.in',     'qqqq')");
    q("insert into acct (role,email,password) values ('3','nicole@safeharbor.in',  'qqqq')");


    q("insert into site (siteid,acct,sitename,domain,agentaddress,agentemail,agentname,agentphone) values " +
           "(40,1,'Safe Harbor.in','1.safeharbor.in','7 foo Ln., Bar Park, IL'," +
             "'victor@safeharbor.in','Jane Doe Esquire','(800) 555-1212')");
    q("insert into site (siteid,acct,sitename,domain,agentaddress,agentemail,agentname,agentphone) values " +
           "(41,2,'Safe Harbor.in','2.safeharbor.in','7 foo Ln., Bar Park, IL'," +
             "'lucas.gonze@gmail.com','Jane Doe Esquire','(800) 555-1212')");
    q("insert into site (siteid,acct,sitename,domain,agentaddress,agentemail,agentname,agentphone) values " +
           "(42,3,'Safe Harbor.in','3.safeharbor.in','7 foo Ln., Bar Park, IL'," +
             "'jim@safeharbor.in','Jane Doe Esquire','(800) 555-1212')");
    q("insert into site (siteid,acct,sitename,domain,agentaddress,agentemail,agentname,agentphone) values " +
           "(43,4,'Safe Harbor.in','4.safeharbor.in','7 foo Ln., Bar Park, IL'," +
             "'nicole@safeharbor.in','Jane Doe Esquire','(800) 555-1212')");

}

exports.dumpAll = function(cb)
{
   // function cb( c, rows ) { if( c == models.CODES.OK)  data[this.name] = rows; }

    var dbNames = [ 'acct', 'emailHandshake', 'site', 'resets', 'audit', 'contact', 'media' ];
    var prev = null, first = null;

    function perf() {
            var sql = 'SELECT * FROM ' + this.name;
            this.table.findAllRows(sql);
        }
            
    for( var i = 0; i < dbNames.length; i++ )
    {
        var model = new ModelPerformer( { callback: cb, performer: perf } );
        model.name = dbNames[i];
        if( prev )
            prev.chain( model );
        else
            first = model;
        prev = model;
    }
    
    return first;

}