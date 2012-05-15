
// documentation:
// https://devcenter.heroku.com/articles/database
// https://github.com/brianc/node-postgres/wiki
// https://github.com/brianc/node-postgres

/*
User table: 

drop table users;
create table users (id serial,emailConfirmed bool default false,email text not null,password text not null)
*/

var pg = require('pg');
var connectionString = process.env.DATABASE_URL; // this config var is a Heroku thing

var client = new pg.Client(connectionString);
client.connect();
client.query("drop table if exists user");
/*
client.query("create table user (id serial,emailConfirmed bool default false,email text not null,password text not null)");

client.query({
  name: 'insert user',
  text: "INSERT INTO user(email,password) values($1, $2, $3)",
  values: ["test@example.com","1234"]
});

var selectQuery = client.query("SELECT * FROM user");

//can stream row results back 1 at a time
query.on('row', function(row) {
  console.log(row);
});

//fired after last row is emitted
query.on('end', function() { 
  client.end();
});
*/
client.end();
