
/*
*/
var Performer = require('../lib/performer.js').Performer;
var utils = require('../lib/utils.js');
var debug = require('../lib/debug.js');
var util  = require('util');

/**************************
* Static function
***************************/

var globalClient = null;

var getClient = function() 
{
    if( !globalClient )
    {
        var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
        var conString = process.env.DATABASE_URL || "tcp://postgres:EMbr4EDS@localhost/safeharborin"; // on heroku and on my local dev box
        var client = new pg.Client(conString);
        if( !client )
            throw new InvalidConnect(conString);
        client.connect();
        globalClient = client;
    }
	return(globalClient);
}

/**************************
* Generic status codes
***************************/

var CODES  = 
{
    SUCCESS:   'ok',
    SQL_ERROR: 'sqlerr',
    INVALID_ARGS: 'bogusargs',
    APP_ERROR: 'apperr', // ?? 
    NO_RECORDS_DELETED: 'norecdel',
    NO_RECORDS_INSERTED: 'norecins',    
    NO_RECORDS_FOUND: 'norecsfound',
    NO_RECORDS_UPDATED: 'norecsup',
    MULTIPLE_RECORDS_FOUND: 'multirecsfound',
    QUERY_NO_MORE_ROWS: 'qdone',
    QUERY_ROW: 'qrow',
    QUERY_COUNT: 'qcount',
    INSERT_SINGLE: 'ins'
}

CODES.OK            = 
CODES.QUERY_SUCCESS = 
CODES.RECORD_FOUND  = CODES.SUCCESS;

/**************************
* Exceptions
***************************/

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


/***********************************
* Chainable performer for psql access
*************************************/

/*
    Don't even think about looking at this before understanding
    the Performer object in lib/performer.js
    
    ModelPerformer is a specialization of Performer that
    exposes a table API wrapper inside your performer 
    function. The API is accessable via the 'this.table' 
    property:
    
        new ModelPerformer( { callback: function(statusCode, param) { ... },
                              performer: function() {
                                 this.table.findSingleRecord( 'SELECT * FROM foo LIMIT 1' );
                                }
                            );

    See the 'table' object below for particulars of the table API.
    
    SQL PARAMETERS
    ----------------
    If you have parameterized SQL you have 3 ways to deal with those.
    
    1. Passing them directly in the table call as an array in the second parameter:

        new ModelPerformer( { callback: function(statusCode, param) { ... },
                              performer: function() {
                                 var sql = 'SELECT * FROM foo WHERE id = $1';                                 
                                 this.table.findSingleRecord( sql, [someId] );
                                 //---------------------------------^^^^^^^--------
                                 
                                }
    
    2: Passing them as 'values' element in the ctor:
    
        new ModelPerformer( { values: [someId],
                            //--------^^^^^^^^------
                              callback: function(statusCode, param) { ... },
                              performer: function() {
                                 var sql = 'SELECT * FROM foo WHERE id = $1';
                                 this.table.findSingleRecord( sql );
                                }
                            })
                            
        Note that you do NOT pass the arguments into the findSingleRecord()
        call. That will be done automagically for you. (Doing it this
        way gives other Performer objects in your chain access
        to your .values[] property.)

    3. Passing them as 'unparsed' objects in the ctor. This is useful for
       situations like request.body. Say your POST form yields something
       like:
             request.body = { password: '1234', user: 'Jon John' };
             
        and your SQL looks like:
            
            var SQL = 'INSERT INTO people (user,pw) VALUES ($1,$2)';
            
        you can setup a performer to extract the proper values from the
        request.body object in the right order:
        
           new ModelPerformer( { parseObj: request.body,
                                 names: [ 'user', 'password' ]

                                 callback: function(statusCode, param) { ... },
                                 performer: function() {
                                    this.table.findSingleRecord( SQL );
                                }

        
      CALLBACKS and STATUS CODES
      ---------------------------
      
      All callbacks for the ModelPerformer have the same shape:
      
            function callback( statusCode, param ) { }
            
      The statusCode will one of the CODES found in this module. CODES are
      exported from here and should be re-exported in every model module
      to the routes modules. 
      
      Theses CODES are emitted from the table API and the safest thing
      to do BEFORE you use a specific table API method is to look at
      what CODES it emits.
      
      The 'param' value will depend on what the code is. 
      
      ERROR HANDLING
      ----------------
      
      It is very easy to get into a race condition when the errors start
      cascading. The trick is to catch the first fatal error and stop
      the chain, report the error as quickly as possible before other,
      later errors obscure the root cause error.
      
      The best way to handle this is to call handlerErrors() method between
      instantiation and calls to Perform():
      
         var performer = new ModelPerformer( ... );
         
         performer.handlerErrors( req, res );
         
         performer.Perform();
         
      This will setup a default error handler for fatal errors that happen at
      the SQL level. Once a fatal error is hit: no more callbacks will be called,
      the chain will be stopped and an exception will be displayed in the browser
      killing the current request. 
      
      There are two errors that are currently being checked for: errors that 
      come back the database and coding errors (missing parameters, etc.) from
      this instance of ModelPeformer. 
      
      If you want addition errors to be checked for and treated as fatal errors
      add them as a third parameter:
      
         performer.handlerErrors( req, res );
        
      Be warned: there is no soft error here, this will be treated like a fatal
      system crash-worthy event.
      
      If you want to land softer (like an unsucceful search) then handle that
      in your callback.
      
            new Performer( { callback: function( code, result ) {
                                if( code == CODES.NO_RECORDS_FOUND )
                                   ....
                                else if( code == CODES.SUCCESS )
                                    ....                        
                            }
      
*/
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
    else if( this.paramNames )
    {
        console.log( 'MISSING parseObj - you are toast' );
        throw new Error('Coding bug: MISSING parseObj');
    }
    else
    {
        this.invalidargs = false;
    }

    if( util.isArray && !util.isArray( this.values ) )
    {
        console.log( 'Values must be an array - you are burnt toast');
        throw new Error('Coding bug: ModelPerformer values must be an array');        
    }
    
    this.validargs = !this.invalidargs;
    
}

//utils.extend( ModelPerformer, Performer );
util.inherits( ModelPerformer, Performer );

ModelPerformer.prototype.parseValues = function()
{
    return this._parseValues(this.parseObj,this.paramNames);
}

ModelPerformer.prototype._parseValues = function(onThis,paramNames)
{
    var numParams = paramNames.length;
    this.values = [];

    for( var n = 0; n < numParams; n++ )
    {
        var name = paramNames[n];
        if( (typeof onThis[name] !== 'string' && 
            typeof onThis[name] !== 'number') ||
            typeof onThis[name] === 'undefined' )
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
    return this.values;
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
            console.log( 'EXCEPTION in ModelPerformer', err  );
        else if( err instanceof InvalidSQLValues )
            this.callback( CODES.INVALID_ARGS, err );
        else
            Performer.prototype.postPerform.call( this, err );
            
        this.stopChain();        
    }
}

ModelPerformer.prototype.handleErrors = function( req, res, extraCodes )
{
    var errlib = require('../lib/error.js');
    var func = errlib.errout( [CODES.SQL_ERROR,CODES.INVALID_ARGS].concat(extraCodes || []) );
    this.errorhandler = function( code, err ) { 
                            debug.out('return check: ', code, err );
                            return func( req, res, code, err ); 
                            }
    return this;
}

ModelPerformer.prototype.callback = function( c, result )
{
    var eh = this.findValue('errorhandler');
    if( eh && !eh.apply( this, [c,result] ) )
    {
        debug.out('BAILING: Calling stopChain()!');
        this.stopChain();
    }
    else
    {
        Performer.prototype.callback.apply( this, [c, result] );
    }
}

ModelPerformer.prototype.getAPI = function()
{
    return new this.api(getClient(),this,this.callback,this.values);
}



/**********************************************************
* psql table ops wrapper
*
*
* Postgres reference: 
* https://github.com/brianc/node-postgres/wiki/Query
*
***********************************************************/

/*
    Wrapper for table operations, designed to be Performer
    friendly with bindable callbacks with standardized,
    specialized status codes.

*/
function table(client, bindingObj, defaultCallback, values)
{
    this.client = client || getClient();
    this.binder = bindingObj || this;
    this.defCallback = defaultCallback;
    this.values = values || [ ];
}

var tablePrototype = {

    _getQ: function( sql, a, cb )
    {
        var args = a || this.values;
        
        debug.out( 'SQL', sql, args );
        
        var query = this.client.query( sql, args ); // do NOT pass a callback here
        
        if( !query )
        {
            // get out of Dodge (caught in this module
            // the real SQL error will show up on another thread)
            throw new NullQueryError(sql);
        }
        
        var me = this,
            callback = cb || this.defCallback;

        query.on( 'error', function( err ) { 
                callback.apply(me.binder,[CODES.SQL_ERROR,err]); 
            });
            
        return query;
    },
    
    
    deleteSingleRecord: function( sql, args, cb ) 
    {
        var me = this,
            callback = cb || this.defCallback;
            
        var query = this._getQ(sql,args,callback);        

        query.on( 'end', function(result) {
            var len = result ? result.rowCount : 0; // this confirmed viable on Heroku
            if( len < 1 )
                callback.apply( me.binder, [CODES.NO_RECORDS_DELETED, this] );
            else
                callback.apply( me.binder, [CODES.SUCCESS, len] );
            });
    },

    /*
            callback( CODES.SUCCESS, value );
            
            'value' can be field in 'returning' syntax or
            if no returning statement found then the
            result object from node-postregsql
    */
    insertSingleRecord: function( sql, args, cb ) 
    {
        var callback = cb || this.defCallback,
            hasReturning = sql.match(/returning/);
            
        var value = null,
            me = this;
            
        var query = this._getQ(sql,args,callback);

        query.on('row', function(row) { 
                if( hasReturning )
                    for( var name in row ) { value = row[name]; break; }
                else
                    value = row;
            });

        query.on( 'end', function(result) {
                var len = result ? result.rowCount : 0;
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
    updateSingleRecord: function( sql, args, cb ) 
    {
        var callback = cb || this.defCallback,
            hasReturning = sql.match(/returning/);
            
        var value = null,
            me = this,
            query = this._getQ(sql,args,callback);

        query.on('row', function(row) {  
                if( hasReturning )
                    for( var name in row ) { value = row[name]; break; }
                else
                    value = row;
            });

        query.on( 'end', function(result) {
                var len = result ? result.rowCount : 0;
                if( len < 1 )
                    callback.apply( me.binder, [CODES.NO_RECORDS_UPDATED] );
                else
                    callback.apply( me.binder,  [CODES.SUCCESS, value] );
            });            
    },

    /*
        callback( table.SUCCESS, row )
        callback( table.NO_RECORDS_FOUND );
        callback( table.MULTIPLE_RECORDS_FOUND, last_row_found );
    */
    findSingleRecord: function(sql,args,cb) 
    {
        this._findSingleThing(sql,args,cb,false);
    },

    /*
        Return a single column from a table
        
        callback( table.SUCCESS, value );
        callback( table.NO_RECORDS_FOUND );                
        callback( table.MULTIPLE_RECORDS_FOUND, last_value_found );
        
        Returns row[0] so whatever your first colum in the
        select statement will be returned.
    */
    findSingleValue: function(sql,args,cb)
    {
        this._findSingleThing(sql,args,cb,true);
    },
    
    _findSingleThing: function(sql,args,cb,isValue)
    {
        var callback = cb || this.defCallback,
            savedRow = null,
            count = 0;
            
        var query = this._getQ(sql,args,callback);
            
        var me = this;
        query.on( 'row', function(row) { 
                savedRow = row; 
                ++count;
            } );
        query.on( 'end', function(result) {
            var len = count;

            if( len < 1 ) 
            {
                callback.apply( me.binder,  [CODES.NO_RECORDS_FOUND] );
            }
            else
            {
                var ret = savedRow,
                    code = len > 1 ? CODES.MULTIPLE_RECORDS_FOUND : CODES.SUCCESS;
                    
                if( isValue )
                {
                    var fieldName = null;
                    for( fieldName in savedRow ) 
                        { ret = ret[fieldName]; break; }
                    
                }
                callback.apply( me.binder, [code, ret ] );
            }
            });        
    },
    
    /*
        call back for every row
    */
    findbyRow: function( sql, args, cb ) 
    {
        var callback = cb || this.defCallback;
        
        var query = this._getQ(sql,args,callback);

        var me = this;
        query.on( 'row', function(_row) { 
                callback.apply( me.binder, [CODES.QUERY_ROW, _row] ); 
            });

        query.on( 'end', function(result) { 
                callback.apply( me.binder, [CODES.QUERY_NO_MORE_ROWS, result] ); 
            });
    },
    
    /*
        call back once with an array of all the rows
    */
    findAllRows: function( sql, args, cb )
    {
        var callback = cb || this.defCallback,
            rows = [];
        
        var query = this._getQ(sql,args,callback);
        
        var me = this;
        
        query.on( 'row', function(_row) { 
                rows.push(_row); 
            });
            
        query.on( 'end', function(result) { 
                callback.apply( me.binder,  [CODES.QUERY_SUCCESS, rows, result] ); 
            });    
    },
    
    getCount: function( sql, args, cb ) 
    {
        var callback = cb || this.defCallback;

        var query = this._getQ(sql,args,callback);
        
        var me = this;
        
        query.on( 'row', function(_row)  { 
                var c = typeof(_row.count) == 'undefined' ? _row : _row.count;
                callback.apply( me.binder, [CODES.QUERY_COUNT, c] );
            });
        
        query.on( 'end', function(result) { 
                callback.apply( me.binder, [CODES.QUERY_NO_MORE_ROWS, result] ); 
            });
    }
    
}; 

utils.extend( table, tablePrototype );

exports.getClient = getClient;
exports.CODES = CODES;
exports.ModelPerformer = ModelPerformer;
exports.Table = table;
