
function getClient()
{
    var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
	var conString = process.env.DATABASE_URL || "tcp://postgres:EMbr4EDS@localhost/safeharborin"; // on heroku and on my local dev box
	var client = new pg.Client(conString);
	client.connect();
	return(client);
}

var c = getClient();

function d( n, a )
{
    console.log( [ n, a ] );
}


function dTable(table)
{
    var q = c.query( 'select * from ' + table );
    
    q.on( 'error', function( err ) { d(table + ': err',err); } );
    q.on( 'row',   function( row ) { d(table + ': row',row); } );
    q.on( 'end',   function( res ) { d(table + ': end',res); } );
}

dTable('acct');
dTable('site');
dTable('emailHandshake');
dTable('audit');

function wait()
{
    setTimeout( wait, 500 );
}