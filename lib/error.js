
// added by LG October 15 2012
exports.page = function(code,res,debugInfo){
	res.status(code);
	res.render( 
		'shared/error.html',
		{ 
			layout: 'shared/no-tabs.html', 
			bodyClass: 'error-page error-'+code,
			debugInfo: debugInfo,
			pageTitle: "Fail"				
		} );
}

//***
//* Stuff below is from the summer '12 vintage code
//***

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

exports.renderExp = function( res, err )
{	
    var debugInfo = '<pre>' + err.toString() + "\n\n" + (err.stack || 'no stack available') + '</pre>';	
	exports.page( (err.statusCode||500), res, debugInfo);
}

/* Do not call this in new code - the style is too obtuse.
	-LG 10/15/2012
*/
exports.errout = function( failcodes )
{
    if( failcodes )
    {
        return function( req, res, c, err )
        {
            if( failcodes.contains(c) )
            {
                if( !(err instanceof Error) ){
                    err = exports.err( 500, 'App Runtime exception: ' + c );	
				}
                exports.renderExp( res, err );
                return false;
            }
            
            return true;
        }
    }
    
    return function( req, res, err ) 
        { 
            handler( err, req, res ) 
        };
}

exports.handleException = function( err, req, res )
{
    if( err.hint )
    {
       var s = err.toString() + ' (' + err.hint + ')';
       err.toString = function() { return s; }
    }

    handler( err, req, res );
}

exports.setup = function( app )
{
	/*
	Victor original:
    var express = require('express');
    
    handler = express.errorHandler( { dumpExceptions: true, 
                                      showStack: true, 
                                      showMessage: true } );
                                      
    express.errorHandler.title = 'Safe Harbor: Geek Error <h4>please report this to the proper authorities</h4>';

	Lucas replacement:
	*/
	handler = function(err, req, res, next) {
		/* Be ultra careful inside this handler and any function it calls, because this handler will not be 
		 *  called recursively, and therefore bugs will not use the pretty error page. 
		 */
		if( ! err.statusCode )
			if( res.statusCode != 200 )
				err.statusCode = res.statusCode;
			else
				err.statusCode = 500;
		exports.renderExp(res, err);		
	}

    app.use(function(req, res, next){ 
        res.status(404);
        throw new Error("Not found!? " + req.originalUrl );
    });

    // misc exceptions
    app.use(function(err, req, res, next) {
        if( err.statusCode !== undefined ){
            res.statusCode = err.statusCode; 
		}
        exports.handleException( err, req, res );
    });
    
/* disabled by LG 10/15/2012
    app.configure('development',
        function() {
            app.use(express.errorHandler({
                dumpExceptions: true,
                showStack: true
            }));
        });
    
    app.configure('production',
        function() {
            app.use(express.errorHandler());
        });
*/
        
    process.on('uncaughtException', function (err) {
        // by the time you get to this point
        // the session is screwed. The app will
        // continue to run for other users and
        // this user can use browser's 'back' to
        // unhork. 
        // TODO: notify admin when this happens...
          console.log(['******* Caught-uncaught exception: ', err] );
        console.log( err.stack );
        console.trace('call stack:');
        });
}