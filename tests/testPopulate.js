
var data = { 
 acct:     
  [ { acctid: 1,
    email: 'victor.stone@gmail.com',
    password: '1111',
    resetsecret: 'f4e0d01077' } ],
site: 
  [ { ownerid: 1,
    siteid: 1,
    sitename: 'foohelo',
    domain: 'ssaotk.org',
    agentaddress: 'QQQQQ address of your designated agent to receive not',
    agentemail: 'wefwefef@fooe.com' } ],
emailHandshake: 
[
  { 
    regid: 1,
    email: 'victor.stone@gmail.com',
    password: 'foobar' },

  { 
    regid: 2,
    email: 'victor.stone@gmail.com',
    password: '5555' },

  { 
    regid: 3,
    email: 'victor.stone@gmail.com',
    password: '1111' },

  { 
    regid: 4,
    email: 'victor.stone@gmail.com',
    password: '1111' },

  { 
    regid: 5,
    email: 'pablo.ansonia@gmail.com',
    password: '2222' },

  { 
    regid: 6,
    email: 'assoverteakettle.org@gmail.com',
    password: '3333' },

  { 
    regid: 7,
    email: 'assoverteakettle.org@gmail.com',
    password: '3333' } ]
};

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
    var D = data[table];
    var first = D[0];
    var fields = [];
    var dollars = [];
    var i = 1;
    for( var k in first )
    {
        fields.push(k);
        dollars.push( '$' + i );
        ++i;
    }

    for( i = 0; i < D.length; i++ )
    {
        var sql = 'INSERT INTO ' + table + 
                   ' (' + fields.join(',') + ') VALUES (' + dollars.join(',') + ')' ;

        var r = D[i];
        var values = [];
        for( var n in r )
            values.push( r[n] );
            
        var q = c.query( sql, values, function( err, r ) { d( [table, err, r] ); } );        
    }
    
    return;
    
}

dTable('acct');
dTable('site');
dTable('emailHandshake');

function wait()
{
    setTimeout( wait, 500 );
}

