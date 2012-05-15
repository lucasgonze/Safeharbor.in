
console.log("bp 1");

// documentation:
// https://devcenter.heroku.com/articles/database
// https://github.com/brianc/node-postgres/wiki
// https://github.com/brianc/node-postgres
var pg = require('pg');

function showUserTable(){
	
}

function createUserTable() {

	console.log("bp 2.-a");
	
    // this config var is a Heroku thing
    var client = new pg.Client(process.env.DATABASE_URL);
    client.connect();
    client.query("drop table if exists user");

	client.query("create table user (id serial,emailConfirmed bool default false,email text not null,password text not null)");

	client.query({
	  name: 'insert user',
	  text: "INSERT INTO user(email,password) values($1, $2)",
	  values: ["email 1","1234"]
	});
	client.query({
	  name: 'insert user',
	  text: "INSERT INTO user(email,password) values($1, $2)",
	  values: ["email 1","1234"]
	});
	client.query({
	  name: 'insert user',
	  text: "INSERT INTO user(email,password) values($1, $2)",
	  values: ["email 2","abcd"]
	});

	var selectQuery = client.query("SELECT * FROM user");

    console.log("2.a");

	//can stream row results back 1 at a time
	selectQuery.on('row', function(row) {
      console.log("2.b");
	  console.log(row);
	});
	
    console.log("2.c");

	//fired after last row is emitted
	selectQuery.on('end', function() { 
	  client.end();
	});
	
    client.end();
	console.log("bp 3");

}

createUserTable();
