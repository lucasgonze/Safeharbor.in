
/*
    Error handling
    ---------------
    
    The standard Javascript 'Error' object is to be used to expressed errors. A helper
    is provided below to make HTTP friendly versions:
    
        var errlib = require('../lib/error.js');
        
        var error = errlib.err( 400, 'Missing file' );
    
    Or inline:
    
        function foobaz( param, callback ) {
        
            if( param < 0 )
            {
                callback( errlib.err( 500, 'foobaz death' ) );
            }
            else
            {
                callback( null, 'alive' );
            }
        }
        
    Model code should never handle errors, only Router code.
    
    From a Router you use the helper below to process potential errors.
        
        // top of file:
        var errout = errlib.errout( [ CODES.SQL_ERROR, 
                                      CODES.FATAL_ERROR, 
                                      CODES.OTHER_CATASTROPHY ] );
                                      
        // inside router
        function myRouter( req, res )
        {
            model.someModelCall( req.body, function(c, result) {
                errout( req, res, c, result );  // <<<=============
                
                if( c == CODES.OK )
                {
                    // success code here
                }
            });
        }
    
    Why:
    
    In normal MVC operations, Error objects are created and returned as part of callback
    scheme. Error object that are 'throw'n are caught by express.app.error() callbacks.
    During development, we capture those and route them to expressed 'exceptionHandler' 
    method. (TODO: for production we should clean up the 'render' method below for that)
    
    HOWEVER, the express.app.error() handlers only work on the main response thread. Error
    objects that are generated on IO threads (sockets, postregSQL, fileIO) just lie around
    and if you 'throw' one, they will NOT be caught by the express.app.error() handlers.
    
    Wait, why:
    
    Because the postgreSQL errors are coming well AFTER express' HTTP request code has
    run and returned. (Actually that code is in the 'connect' lib at Server.prototype.handle )
    

*/
var utils = require('./utils.js');

/* Utilities related to error handling */

var handler = null;

exports.err = function( code, msg )
{
    var E = new Error(msg);
    E.statusCode = code;
    return E;
}

exports.errout = function( failcodes )
{
    if( failcodes )
    {
        return function( req, res, c, err )
        {
            if( Array.contains(failcodes,c) )
            {
                if( !(err instanceof Error) )
                    err = exports.err( 500, 'App Runtime exception: ' + c );
                console.log( ' ON ERROR *******************', c, err );
                if( !res._headerSent )
                    handler( err, req, res );
            }
        }
    }
    
    return function( req, res, err ) 
        { 
            console.log( ' ON ERROR *******************', err );
            if( !res._headerSent )
                handler( err, req, res ) 
        };
}

// obsolete
exports.render = function(res,msg,code,debugInfo)
{
    console.log("Error handler in lib/error/render invoked.");
    if( typeof debugInfo !== "undefined" ){
        console.log("debugInfo:");		
        console.log(debugInfo);	
        console.trace("*** Stack trace to help locate the error. ***")	
    }
    console.log(msg);
    
    res.render('error/error.html',{layout:'global.html',pageTitle:'Error','bodyClass':'error',message:msg,code:code});
    
	return false;
};

exports.handleException = function( err, req, res )
{
    /*
        SQL error:
        {   toString() { "error: function xcount() does not exist" },
            length: 193,
            name: 'error',
            severity: 'ERROR',
            code: '42883',
            detail: undefined,
            hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
            position: '8',
            internalPosition: undefined,
            internalQuery: undefined,
            where: undefined,
            file: 'parse_func.c',
            line: '304',
            routine: 'ParseFuncOrColumn' 
        }
    */  
    if( err.hint )
    {
       var s = err.toString() + ' (' + err.hint + ')';
       err.toString = function() { return s; }
    }

    handler( err, req, res );
}

exports.init = function( errHandler )
{
    handler = errHandler;
}