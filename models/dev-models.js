var model = require('./index.js');
var ModelPerformer = model.ModelPerformer;
exports.CODES = model.CODES;

exports.recreateTables = function(callback){
    console.log('RECREATE TABLES---------------');
	var client = model.getClient();

	function q( sql )
	{
	    client.query( sql, callback );
	}
	
	q('drop table if exists acct');
	q('create table acct (acctid serial,email text not null unique,password text not null,resetSecret text,resetDate timestamp) with oids');
	q('drop table if exists emailHandshake');
	q('create table emailHandshake (creation timestamp DEFAULT current_timestamp,regid serial, email text not null,password text not null) with oids');
	q('drop table if exists site');
	q('create table site (ownerid integer not null, siteid serial, sitename text not null, domain text not null unique, agentaddress text not null, agentemail text not null) with oids; ');
	q('drop table if exists resets');
	q('create table resets (ts timestamp,userid integer not null,secret text not null)');	
    q('drop table if exists audit');
    q("create table audit (auditid serial, siteid integer not null, opname text not null, attachment text not null default '',creation timestamp DEFAULT current_timestamp)");
    q('drop table if exists requests');
    q("create table requests ( trackingid integer not null, page text not null, anchor text not null, description text not null, email text not null, phone text not null, postal text not null)");
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
    q('delete from requests');

    q("insert into acct (acctid,email,password) values (1,'victor.stone@gmail.com','qqqq')");

    q("insert into site (siteid,ownerid,sitename,domain,agentaddress,agentemail) values (40,1,'Ass Over Tea Kettle','assoverteakettle.org','7 foo Ln., Bar Park, IL','assoverteakettle.org@gmail.com')");

    q("insert into audit (auditid, siteid,opname) values (1, 40, 'takedownRequest')"); 
    q("insert into audit (auditid, siteid,opname) values (2, 40, 'takedownRequest')"); 
    q("insert into audit (auditid, siteid,opname) values (3, 40, 'takedownRequest')"); 

    q("insert into requests (trackingid, page, anchor, description, email, phone, postal) values " + 
                                    "(1, 'http://some.page.com', 'http://some.page.com/foo.mp3', 'stairway to heaven', 'foo@bar.com','555-099-9888', '39 PO BOX, Kentucky, WA, 90087')" ); 
    q("insert into requests (trackingid, page, anchor, description, email, phone, postal) values " + 
                                    "(1, 'http://some.page.com', 'http://some.page.com/bar.mp3', 'all girls go to heaven', 'foo@bar.com','555-099-9888', '39 PO BOX, Kentucky, WA, 90087')" ); 
    q("insert into requests (trackingid, page, anchor, description, email, phone, postal) values " + 
                                    "(2, 'http://someother.page.com', 'http://some.page.com/barbff.jpg', 'album cover', 'foo@bar.com','555-099-9888', '39 PO BOX, Kentucky, WA, 90087')" ); 
    q("insert into requests (trackingid, page, anchor, description, email, phone, postal) values " + 
                                    "(3, 'http://some.page.com', 'http://some.page.com/mediagalore', 'Good Itentions (The Movie)', 'foo@bar.com','555-099-9888', '39 PO BOX, Kentucky, WA, 90087')" ); 
    
}

exports.dumpAll = function(cb)
{
   // function cb( c, rows ) { if( c == models.CODES.OK)  data[this.name] = rows; }

    var dbNames = [ 'acct', 'emailHandshake', 'site', 'resets', 'audit', 'requests' ];
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