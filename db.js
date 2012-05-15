
console.log("bp 1");

// documentation:
// https://devcenter.heroku.com/articles/database
// https://github.com/brianc/node-postgres/wiki
// https://github.com/brianc/node-postgres
var pg = require('pg');

function showUserTable(){
	
}

function createUserTable() {

	console.log("bp 2");
    // this config var is a Heroku thing
    var client = new pg.Client(process.env.DATABASE_URL);
    client.connect();
    client.query("drop table if exists user");

	client.query("create table user (id serial,emailConfirmed bool default false,email text not null,password text not null)");

	client.query({
	  name: 'insert user',
	  text: "INSERT INTO user(email,password) values($1, $2, $3)",
	  values: ["test@example.com","1234"]
	});

	var selectQuery = client.query("SELECT * FROM user");

	//can stream row results back 1 at a time
	selectQuery.on('row', function(row) {
	  console.log(row);
	});

	//fired after last row is emitted
	query.on('end', function() { 
	  client.end();
	});
	
    client.end();
	console.log("bp 3");

}

createUserTable();
