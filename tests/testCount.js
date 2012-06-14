
function getClient()
{
    var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
	var conString = process.env.DATABASE_URL || "tcp://postgres:EMbr4EDS@localhost/safeharborin"; // on heroku and on my local dev box
	var client = new pg.Client(conString);
	client.connect();
	return(client);
}

var q = getClient().query( 'select count(*) as cnt from acct' );

function d( n, a )
{
    console.log( [ n, a ] );
}

q.on( 'error', function( err ) { d('err',err); } );
q.on( 'row',   function( row ) { d('row',row); } );
q.on( 'end',   function( res ) { d('end',res); } );

function wait()
{
    setTimeout( wait, 500 );
}