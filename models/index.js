
/*
*/
var Performer = require('../lib/performer.js').Performer;
var utils = require('../lib/utils.js');
var debug = require('../lib/debug.js');
var util  = require('util');

/* ----------------------
* Static function
***************************/

var globalClient = null;

var getClient = function() 
{
    if( !globalClient )
    {
        var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
		var conString = 
			process.env.HEROKU_POSTGRESQL_BLUE_URL|| // new heroku postgres
			process.env.DATABASE_URL || // old heroku generic shared db
			"tcp://postgres:EMbr4EDS@localhost:5433/safeharborin"; // on my local machine
		console.log("Connect to database at ",conString);
        var client = new pg.Client(conString);
        if( !client )
            throw new InvalidConnect(conString);
        client.connect();
        globalClient = client;
    }
	return(globalClient);
}

/* ----------------------
* Generic status codes
***************************/

var CODES  = 
{
    /**
    * @property {string} SUCCESS
    * @static
    * @for CODES
    */ 
    SUCCESS:   'ok',
    /**
    * @property {string} SQL_ERROR
    * @static
    * @for CODES
    */ 
    SQL_ERROR: 'sqlerr',
    /**
    * @property {string} INVALID_ARGS
    * @static
    * @for CODES
    */ 
    INVALID_ARGS: 'bogusargs',

    /**
    * @property {string} NO_RECORDS_DELETED
    * @static
    * @for CODES
    */ 
    NO_RECORDS_DELETED: 'norecdel',
    /**
    * @property {string} NO_RECORDS_INSERTED
    * @static
    * @for CODES
    */ 
    NO_RECORDS_INSERTED: 'norecins',    
    /**
    * @property {string} NO_RECORDS_FOUND
    * @static
    * @for CODES
    */ 
    NO_RECORDS_FOUND: 'norecsfound',
    /**
    * @property {string} NO_RECORDS_UPDATED
    * @static
    * @for CODES
    */ 
    NO_RECORDS_UPDATED: 'norecsup',
    /**
    * @property {string} MULTIPLE_RECORDS_FOUND
    * @static
    * @for CODES
    */ 
    MULTIPLE_RECORDS_FOUND: 'multirecsfound',
    /**
    * @property {string} QUERY_NO_MORE_ROWS
    * @static
    * @for CODES
    */ 
    QUERY_NO_MORE_ROWS: 'qdone',
    /**
    * @property {string} QUERY_ROW
    * @static
    * @for CODES
    */ 
    QUERY_ROW: 'qrow',
    /**
    * @property {string} QUERY_COUNT
    * @static
    * @for CODES
    */ 
    QUERY_COUNT: 'qcount',
    /**
    * @property {string} INSERT_SINGLE
    * @static
    * @for CODES
    */ 
    INSERT_SINGLE: 'ins'
}

/**
* Alias for SUCCESS
* @property {string} OK
* @static
* @for CODES
*/ 
CODES.OK            = 
/**
* Alias for SUCCESS
* @property {string} QUERY_SUCCESS
* @static
* @for CODES
*/ 
CODES.QUERY_SUCCESS = 
/**
* Alias for SUCCESS
* @property {string} RECORD_FOUND
* @static
* @for CODES
*/ 
CODES.RECORD_FOUND  = CODES.SUCCESS;

/* ----------------------
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


/**

Don't even think about looking at this before understanding
the {{#crossLink "Performer"}}{{/crossLink}} object.

ModelPerformer is a specialization of Performer that
exposes a table API wrapper inside your performer 
function. The API is accessable via the 'this.table' 
property:
    
        new ModelPerformer( { callback: function(statusCode, param) { ... },
                              performer: function() {
                                 this.table.findSingleRecord( 'SELECT * FROM foo LIMIT 1' );
                                }
                            );

See the {{#crossLink "table"}}{{/crossLink}} object below for particulars of the table API.

SQL PARAMETERS
==============
If you have parameterized SQL you have 3 ways to deal with those.

1. Direct
---------
Passing them directly in the table call as an array in the second parameter:
        
        new ModelPerformer( { callback: function(statusCode, param) { ... },
                              performer: function() {
                                 var sql = 'SELECT * FROM foo WHERE id = $1';                                 
                                 this.table.findSingleRecord( sql, [someId] );
                                                               //   ^^^^^^                                 
                                }})

2. Values in ctor
------------------
Passing them as 'values' element in the ctor:
        
        new ModelPerformer( { values: [someId],
                   //         ^^^^^^
                             callback: function(statusCode, param) { ... },
                             performer: function() {
                                var sql = 'SELECT * FROM foo WHERE id = $1';
                                this.table.findSingleRecord( sql );
                            }})
                                
Note that you do NOT pass the arguments into the findSingleRecord()
call. That will be done automagically for you. (Doing it this
way gives other Performer objects in your chain access
to your .values[] property.)


3. Dynamically Parsed
----------------------
Passing them as 'unparsed' objects in the ctor. This is useful for
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
            
The statusCode will one of the {{#crossLink "CODES"}}{{/crossLink}} found in this module. {{#crossLink "CODES"}}{{/crossLink}} are
exported from here and should be re-exported in every model module
to the routes modules. 
      
Theses {{#crossLink "CODES"}}{{/crossLink}} are emitted from the table API and the safest thing
to do __before__ you use a specific table API method is to look at
what {{#crossLink "CODES"}}{{/crossLink}} it emits.

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
         
         performer.handlerErrors( req, res ).perform();
         
This will setup a default error handler for fatal errors that happen at
the SQL level. Once a fatal error is hit: no more callbacks will be called,
the chain will be stopped and an exception will be displayed in the browser
killing the current request. 
      
There are two errors that are currently being checked for: errors that 
come back the database and coding errors (missing parameters, etc.) from
this instance of ModelPeformer. 

If you want addition errors to be checked for and treated as fatal errors
add them as a third parameter:
      
         performer.handlerErrors( req, res, [ CODES.NO_RECORDS_FOUND ] );
        
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

@class ModelPerformer
@extends Performer
@constructor
@param {Object} params Your functions this instance will wrap
    @param {function} params.performer A function to call when it's turn comes up in the chain
    @param {function} params.callback A function that will be called at the completion of the 
             ``performer`` function. The signature is: ``callback( {{#crossLink "CODES"}}{{/crossLink}}, data )``
             where ``data`` depends on which {{#crossLink "table"}}{{/crossLink}} method you called in 
             your ``performer`` function.
    @param {array} [params.values] Array of values to pass along with {{#crossLink "table"}}{{/crossLink}} in 
             your ``performer`` function.
    @param {object} [params.parseObj] Hash object of values to pass along with {{#crossLink "table"}}{{/crossLink}} in 
             your ``performer`` function. You can not have this parameter __and__ a ``values`` parameters. This
             parameter requires a ``names`` parameter.
    @param {array} [params.names] Required for the ``parseObj`` An array of names in the order to extact them from
             the ``parseObj`` parameter.
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

/**
Setup a default Error handler to catch 'em as they 
fly out of psql. 

This method will setup a watch for ``SQL_ERROR`` and ``INVALID_ARGS``
and kill the performance of the chain and try to return error
to the callback at the current position in the train.

You can engage more fatal errors pass them in an array
in the third parameters.

@method handlerErrors
@for ModelPerformer
@param {object} req HTTP request object from express
@param {object} res HTTP response object form express
@param {array} [extraCodes] Array of {{#crossLink "CODES"}}{{/crossLink}} to treat as fatal.
**/
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



/* ----------------------********************************
* psql table ops wrapper
*
*
* Postgres reference: 
* https://github.com/brianc/node-postgres/wiki/Query
*
***********************************************************/

/**
Wrapper for table operations with friendly bindable callbacks with standardized,
specialized status codes. Designed to be used from inside your
{{#crossLink "ModelPerformer"}}{{/crossLink}} performer method. 

@class table
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
    
    /**
    @method deleteSingleRecord
    @param {string} sql 
    @param {array} [args] These can be passed in several ways. See {{#crossLink "ModelPerformer"}}{{/crossLink}} for details.
    @param {array} [callback] You can override this with your own callback, but that will break any {{#crossLink "Performer"}}{{/crossLink}} chain
    @return {CODES} Emits ``NO_RECORDS_DELETED`` or ``SUCCESS`` codes.
    **/
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

    /**
        If you have any 'returning' section of your sql statement, it will 
        be returned as a the second parameter in callback on SUCCESS.
        
    @method insertSingleRecord
    @param {string} sql 
    @param {array} [args] These can be passed in several ways. See {{#crossLink "ModelPerformer"}}{{/crossLink}} for details.
    @param {array} [callback] You can override this with your own callback, but that will break any {{#crossLink "Performer"}}{{/crossLink}} chain
    @return Emits ``NO_RECORDS_INSERTED`` or ``INSERT_SINGLE`` codes.
    **/
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

   
    /**
        If you have any 'returning' section of your sql statement, it will 
        be returned as a the second parameter in callback on SUCCESS.
        
    @method updateSingleRecord
    @param {string} sql 
    @param {array} [args] These can be passed in several ways. See {{#crossLink "ModelPerformer"}}{{/crossLink}} for details.
    @param {array} [callback] You can override this with your own callback, but that will break any {{#crossLink "Performer"}}{{/crossLink}} chain
    @return Emits ``NO_RECORDS_UPDATED`` or ``SUCCESS`` codes.
    **/
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

    /**
    @method findSingleRecord
    @param {string} sql 
    @param {array} [args] These can be passed in several ways. See {{#crossLink "ModelPerformer"}}{{/crossLink}} for details.
    @param {array} [callback] You can override this with your own callback, but that will break any {{#crossLink "Performer"}}{{/crossLink}} chain
    @return Emits  ``MULTIPLE_RECORDS_FOUND``,``NO_RECORDS_FOUND`` or ``SUCCESS`` codes.
    **/
    findSingleRecord: function(sql,args,cb) 
    {
        this._findSingleThing(sql,args,cb,false);
    },

    /**
    Returns whatever your first colum in the
    select statement.
    
    @method findSingleValue
    @param {string} sql 
    @param {array} [args] These can be passed in several ways. See {{#crossLink "ModelPerformer"}}{{/crossLink}} for details.
    @param {array} [callback] You can override this with your own callback, but that will break any {{#crossLink "Performer"}}{{/crossLink}} chain
    @return Emits  ``MULTIPLE_RECORDS_FOUND``,``NO_RECORDS_FOUND`` or ``SUCCESS`` codes.
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
    
    /**
    Call back for every row.
    
    @method findbyRow
    @param {string} sql 
    @param {array} [args] These can be passed in several ways. See {{#crossLink "ModelPerformer"}}{{/crossLink}} for details.
    @param {array} [callback] You can override this with your own callback, but that will break any {{#crossLink "Performer"}}{{/crossLink}} chain
    @return Emits  ``QUERY_ROW`` or ``QUERY_NO_MORE_ROWS`` codes.
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
    
    /**
    call back once with an array of all the rows
    
    @method findAllRow
    @param {string} sql 
    @param {array} [args] These can be passed in several ways. See {{#crossLink "ModelPerformer"}}{{/crossLink}} for details.
    @param {array} [callback] You can override this with your own callback, but that will break any {{#crossLink "Performer"}}{{/crossLink}} chain
    @return Emits  ``QUERY_SUCCESS`` code.
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
    
    /**
    @method getCount
    @param {string} sql 
    @param {array} [args] These can be passed in several ways. See {{#crossLink "ModelPerformer"}}{{/crossLink}} for details.
    @param {array} [callback] You can override this with your own callback, but that will break any {{#crossLink "Performer"}}{{/crossLink}} chain
    @return Emits  ``QUERY_COUNT`` or ``QUERY_NO_MORE_ROWS`` code.
    */
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
