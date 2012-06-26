/*
   OUTPUT FROM THE SCRIPT BELOW ON HEROKU SERVER:
   
create: end { rows: [], command: 'CREATE', rowCount: NaN }
insert1: row { id: 1 }
insert1: end { rows: [], command: 'INSERT', rowCount: 1, oid: 0 }
insert2: row { id: 2 }
insert2: end { rows: [], command: 'INSERT', rowCount: 1, oid: 0 }
insert3: row { id: 3 }
insert3: end { rows: [], command: 'INSERT', rowCount: 1, oid: 0 }
insert4: row { id: 4 }
insert4: end { rows: [], command: 'INSERT', rowCount: 1, oid: 0 }
insert5 (fail): err { stack: [Getter/Setter],
  arguments: undefined,
  type: undefined,
  message: 'duplicate key value violates unique constraint "shtest_email_key"',
  length: 122,
  name: 'error',
  severity: 'ERROR',
  code: '23505',
  detail: undefined,
  hint: undefined,
  position: undefined,
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  file: 'nbtinsert.c',
  line: '298',
  routine: '_bt_check_unique' }
insert5 (fail): end 
select1: row { id: 1,
  email: 'foo1@bar',
  resetdate: Sun, 01 Jan 2012 00:00:00 GMT }
select1: row { id: 2,
  email: 'oo2@bar',
  resetdate: Mon, 02 Jan 2012 00:00:00 GMT }
select1: row { id: 3,
  email: 'foo3@bar',
  resetdate: Tue, 03 Jan 2012 00:00:00 GMT }
select1: row { id: 4,
  email: 'foo4@bar',
  resetdate: Wed, 04 Jan 2012 00:00:00 GMT }
select1: end { rows: [] }
select2 (fail): end { rows: [] }
select3: row { id: 1,
  email: 'foo1@bar',
  resetdate: Sun, 01 Jan 2012 00:00:00 GMT }
select3: end { rows: [] }
delete: end { rows: [], command: 'DELETE', rowCount: 1, oid: NaN }

***************************************************************/

function getClient()
{
    var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
	var conString = process.env.DATABASE_URL || "tcp://postgres:EMbr4EDS@localhost/safeharborin"; // on heroku and on my local dev box
	var client = new pg.Client(conString);
	client.connect();
	return(client);
}

var c = getClient();


function t( name, sql )
{
    function d( n, a, b )
    {
        console.log( n, a ? a : "(null)", b ? b : "(null)" );
    }
    
    var q = c.query( sql );
    
    q.on( 'error', function( err, x ) { d(name + ': err',err,x); } );
    q.on( 'row',   function( row, x ) { d(name + ': row',row,x); } );
    q.on( 'end',   function( res, x ) { d(name + ': end',res,x); } );
}

c.query('drop table if exists shtest');
t('create', 'create table shtest (id serial,email text not null unique,resetDate timestamp)');
t('insert1', 'insert into shtest (email,resetDate) VALUES (\'foo1@bar\', \'2012-01-01\') returning id');
t('insert2', 'insert into shtest (email,resetDate) VALUES (\'oo2@bar\', \'2012-01-02\') returning id');
t('insert3', 'insert into shtest (email,resetDate) VALUES (\'foo3@bar\', \'2012-01-03\') returning id');
t('insert4', 'insert into shtest (email,resetDate) VALUES (\'foo4@bar\', \'2012-01-04\') returning id');
t('insert5 (fail)', 'insert into shtest (email,resetDate) VALUES (\'foo4@bar\', \'2012-01-04\') returning id');
t('insert6', 'insert into shtest (id,email,resetDate) VALUES (1000,\'foo4@bar\', \'2012-01-04\') returning id');
t('update1', 'update shtest set email=\'updated@bar.com\' where id = 1000');
t('update2 (fail)', 'update shtest set email=\'updated@bar.com\' where id = 4000');
t('update3 (SQLERR)', 'update shtest xemail=\'updated@bar.com\' where id = 4000');
t('select1', 'select * from shtest');
t('select2 (fail)', 'select * from shtest where email = \'nomatch\' ');
t('select3', 'select * from shtest where email = \'foo1@bar\' ');
t('delete', 'delete from shtest where email = \'foo1@bar\' ');


function wait()
{
    setTimeout( wait, 500 );
}