
// documentation:
// https://devcenter.heroku.com/articles/database
// https://github.com/brianc/node-postgres/wiki

/*
User table: 

drop table users;
create table users (
id serial,
emailConfirmed bool default false,
email text not null,
password text not null
)
*/

