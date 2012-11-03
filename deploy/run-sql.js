
/*
 Set up the sandbox accounts for testing/hacking.
*/

var debug = console.log;
var fs = require('fs');
var getClient = require('../models/index.js').getClient;
var async = require('async');

var runSQLFile = function(filename,callback){
	
	if( typeof filename == "undefined"){
		debug("DONE");
		process.exit(code=0);				
	}
	
	debug("Reading SQL file: ",filename);
	var sql = fs.readFileSync(filename,"utf8");

	debug("SQL: ==>",sql.trim(),"<==");
	if( sql.trim() === ""){
		debug("Skipping empty file");
		callback(false);
	}

	var query = getClient().query(sql);
	if( !query ){
		debug("(Null query error for sql: ",sql);
		process.exit(code=1);
	}

	query.on('error',function(err){
		debug('ERROR',err);
		callback(true);
	})
	query.on('row',function(data){
		debug('ROW',data);
	})
	query.on('end',function(data){
		debug('END',data);
		callback(false);
	})	
}


var files = ['deploy/sandbox.sql'];
if( process.argv.length > 2 && process.argv[2] === "--clear")
	files.push('deploy/reset-all.sql');

async.forEachSeries(files, runSQLFile, function(err){
    // if any of the files produced an error, err would equal that error
	if(err){
		debug('forEach ERROR',err);		
		process.exit(code=3);
	} else {
		debug('A-OK, no errors');
	}
});




