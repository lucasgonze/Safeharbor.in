
/*
*/
var Performer = require('../lib/performer.js').Performer;
var utils = require('../lib/utils.js');
var util = require('util');

var ModelPerformer = function ( params ) 
{
    Performer.call( this, params );
    
    this.parseObj   = params.parseObj || null;
    this.paramNames = params.names || null;
    this.values     = params.values || [ ];
        
    this.api       = table;   // prototype
    this.table     = null;    // instance
    
    if( this.parseObj )
    {
        this.parseValues();
    }
    else 
    {
        this.invalidargs = false;
    }

    this.validargs = !this.invalidargs;
        
}

//utils.extend( ModelPerformer, Performer );
util.inherits( ModelPerformer, Performer );
    
ModelPerformer.prototype.parseValues = function()
{
    var onThis    = this.parseObj;
    var numParams = this.paramNames.length;
    this.values = [];

    for( var n = 0; n < numParams; n++ )
    {
        var name = this.paramNames[n];
        if( typeof onThis[name] !== 'string' && 
            typeof onThis[name] !== 'number' )
        {
            this.invalidargs = name;
            return false;
        }
        else
        {
            this.values.push(onThis[name]);
        }
    }
    
    this.invalidargs = false;
    
}

ModelPerformer.prototype.prePerform = function()
{
    if( this.invalidargs )
    {
        var err = new InvalidSQLValues('Missing values or wrong type for ' + this.invalidargs);
        throw err;
    }
    this.table = this.getAPI();
    return true;
}

ModelPerformer.prototype.postPerform = function( err )
{
    if( err )
    {   
        // we have to catch and swallow a null 'query'
        // because that will mask the underlying SQL
        // exception that caused the problem in the 
        // first place.
        if( err instanceof NullQueryError )     
            console.log( ['null query: ', err ] );
        else
            Performer.prototype.postPerform.call( this, err );
    }
}

ModelPerformer.prototype.getAPI = function()
{
    return new this.api(getClient(),this,this.callback,this.values);
}


// Static function
var getClient = function() {
    var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
	var conString = process.env.DATABASE_URL || "tcp://postgres:EMbr4EDS@localhost/safeharborin"; // on heroku and on my local dev box
	var client = new pg.Client(conString);
	if( !client )
	    throw new InvalidConnect(conString);
	client.connect();
	return(client);
}

// Static global

var CODES  = {
    SUCCESS:   'ok',
    SQL_ERROR: 'sqlerr',
    INVALID_ARGS: 'bogusargs',
    APP_ERROR: 'apperr', // ?? 
    NO_RECORDS_DELETED: 'norecdel',
    NO_RECORDS_INSERTED: 'norecins',    
    NO_RECORDS_INSERTED: 'norecins',    
    NO_RECORDS_FOUND: 'norecsfound',
    MULTIPLE_RECORDS_FOUND: 'multirecsfound',
    QUERY_NO_MORE_ROWS: 'qdone',
    QUERY_ROW: 'qrow',
    QUERY_COUNT: 'qcount',
    INSERT_SINGLE: 'ins'
}

CODES.OK            = 
CODES.QUERY_SUCCESS = 
CODES.RECORD_FOUND  = CODES.SUCCESS;

// Postgres reference: https://github.com/brianc/node-postgres/wiki/Query


function NullQueryError(msg)
{
    Error.call( this, msg );
    this.message = msg;
    this.name = 'Null Query';
}

util.inherits( NullQueryError, Error );

function InvalidSQLValues(msg)
{
    Error.call( this, msg );
    this.message = msg;
    this.name = 'Invalid SQL Values';
}
util.inherits( InvalidSQLValues, Error );

function InvalidConnect(conString)
{
    var msg = 'Could not connect to database using: ' +  conString;
    Error.call( this, msg );
    this.message = msg;
    this.name = 'Invalid Connect';
}
util.inherits( InvalidConnect, Error );

function table(client, bindingObj, defaultCallback, values)
{
    this.client = client;
    this.binder = bindingObj || this;
    this.defCallback = defaultCallback;
    this.values = values || [ ];
}

// smooth out differences in 
// node-postgre lib versions
function _rcnt(result) {
    if( result.hasOwnProperty('rowCount') )
        return result.rowCount;
    return result.rows.length;
}

var tablePrototype = {

    _getQ: function( sql, a, cb )
    {
        var args = a || this.values;
        //console.log( [sql,args] );
        var query = this.client.query( sql, args ); // do NOT pass a callback here
        if( !query )
        {
            // get out of Dodge, but caught in this module
            // the real SQL error will show up on another thread
            throw new NullQueryError(sql);
        }
        var me = this;
        var callback = cb || this.defCallback;
        query.on( 'error', 
            function( err ) { 
                callback.apply(me.binder,[CODES.SQL_ERROR,err]); 
            } );
        return query;
    },
    
    
    deleteSingleRecord: function( sql, args, cb ) {
        var me = this;
        var callback = cb || this.defCallback;
        var query = this._getQ(sql,args,callback);        
        query.on( 'end', function(result) {
            var len = _rcnt(result);
            if( len < 1 )
                callback( [CODES.NO_RECORDS_DELETED, this] );
            else
                callback( [CODES.SUCCESS, len] );
            });
    },

    /*
            callback( CODES.SUCCESS, value );
            
            'value' can be field in 'returning' syntax or
            if no returning statement found then the
            result object from node-postregsql
    */
    insertSingleRecord: function( sql, args, cb ) {
        var callback = cb || this.defCallback;
        var idName = null;
        try { idName = sql.match(/returning\s+([^\s+]+)/i)[1]; }
        catch( e ) {}
        var value = null;            
        var me = this;
        var query = this._getQ(sql,args,callback);
        query.on('row', function(row) { value = idName ? row[idName] : row; } );
        query.on( 'end', function(result) {
            var len = _rcnt(result);
            if( len < 1 )
                callback.apply( me.binder, [CODES.NO_RECORDS_INSERTED] );
            else
                callback.apply( me.binder,  [CODES.INSERT_SINGLE, value] );
            });            
    },

   
    /*
            callback( table.SUCCESS, value );
            
            'value' can be field in 'returning' syntax or
            if no returning statement found then the
            result object from node-postregsql
    */
    updateSingleRecord: function( sql, args, cb ) {
        var callback = cb || this.defCallback;
        var idName = null;
        try { idName = sql.match(/returning\s+([^\s+]+)/i)[1]; }
        catch( e ) {}
        var value = null;            
        var me = this;
        var query = this._getQ(sql,args,callback);
        query.on('row', function(row) {  value = idName ? row[idName] : row; } );
        query.on( 'end', function(result) {
            var len = _rcnt(result);
            if( len < 1 )
                callback.apply( me.binder, [CODES.NO_RECORDS_UPDATED] );
            else
                callback.apply( me.binder,  [CODES.SUCCESS, value] );
            });            
    },

    /*
        callback( table.SUCCESS, row )
        callback( table.SQL_ERROR, err )
        callback( table.NO_RECORDS_FOUND );
        callback( table.MULTIPLE_RECORDS_FOUND, last_row_found );
    */
    findSingleRecord: function(sql,args,cb) {    
        var callback = cb || this.defCallback;
        var row = null;
        var query = this._getQ(sql,args,callback);
        var me = this;
        query.on( 'row', function(_row) { row = _row } );
        query.on( 'end', function(result) {
            var len = _rcnt(result);
            if( len < 1 ) 
                callback.apply( me.binder,  [CODES.NO_RECORDS_FOUND] );
            else if( len > 1 )
                callback.apply( me.binder,  [CODES.MULTIPLE_RECORDS_FOUND, row] );
            else
                callback.apply( me.binder, [CODES.SUCCESS, row] );
            });        
    },
    
    findbyRow: function( sql, args, cb ) {
        var callback = cb || this.defCallback;
        var query = this._getQ(sql,args,callback);
        var me = this;
        query.on( 'row', function(_row) { callback.apply( me.binder, [CODES.QUERY_ROW, _row] ); } );
        query.on( 'end', function(result) { callback.apply( me.binder, [CODES.QUERY_NO_MORE_ROWS, result] ); } );
    },
    
    findAllRows: function( sql, args, cb ) {
        var callback = cb || this.defCallback;
        var rows = [];
        var query = this._getQ(sql,args,callback);
        var me = this;
        query.on( 'row', function(_row) { rows.push(_row); } );
        query.on( 'end', function(result) { 
            callback.apply( me.binder,  [CODES.QUERY_SUCCESS, rows, result] ); 
            } );    
    },
    
    getCount: function( sql, args, cb ) {
        var callback = cb || this.defCallback;
        var query = this._getQ(sql,args,callback);
        var me = this;
        query.on( 'row', function(_row) 
            { 
                var c = typeof(_row.count) == 'undefined' ? _row : _row.count;
                callback.apply( me.binder, [CODES.QUERY_COUNT, c] );
            });
        query.on( 'end', function(result) { callback.apply( me.binder, [CODES.QUERY_NO_MORE_ROWS, result] ); } );
    }
    
}; 

utils.extend( table, tablePrototype );

exports.getClient = getClient;
exports.CODES = CODES;
exports.ModelPerformer = ModelPerformer;
