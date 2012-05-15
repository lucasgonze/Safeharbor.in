var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
var conString = process.env.DATABASE_URL;

var client = new pg.Client(conString);
client.connect();

/*

//queries are queued and executed one after another once the connection becomes available
client.query("CREATE TEMP user (id serial,emailConfirmed bool default false,email text not null,password text not null)");
client.query("INSERT INTO user(email, password) values($1, $2)", ['test1@example.com', "password 1"]);
client.query("INSERT INTO user(email, password) values($1, $2)", ['test2@example.com', "password 2"]);

var query = client.query("SELECT * FROM user");

//can stream row results back 1 at a time
query.on('row', function(row) {
	console.log("got row");
  	console.log(row.email);
  	console.log(row.password);
});

//fired after last row is emitted
query.on('end', function() { 
  client.end();
});

*/