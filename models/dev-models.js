var model = require('./index.js');
var ModelPerformer = model.ModelPerformer;
exports.CODES = model.CODES;

exports.recreateTables = function(){
	var client = model.getClient();
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

exports.cleanTables = function() {
	var client = model.getClient();
	client.query('delete from acct');
	client.query('delete from emailHandshake');
	client.query('delete from site');
	client.query('delete from resets');
    client.query('delete from audit');
    client.query("insert into acct (acctid,email,password) values (1,'victor.stone@gmail.com','qqqq')")    
    client.query("insert into site (ownerid,sitename,domain,agentaddress,agentemail) values (1,'Ass Over Tea Kettle','assoverteakettle.org','7 foo Ln., Bar Park, IL','assoverteakettle.org@gmail.com')");
}

exports.dumpAll = function(cb)
{
   // function cb( c, rows ) { if( c == models.CODES.OK)  data[this.name] = rows; }

    var dbNames = [ 'acct', 'emailHandshake', 'site', 'resets', 'audit' ];
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