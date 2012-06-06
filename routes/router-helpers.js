var errlib = require("../lib/error.js");

/*--------------------------
    HELPERS
----------------------------*/
exports.checkStringParams = function( req, res, onThis, paramMeta  )
{
try {
    var ret = {};
    var numParams = paramMeta.length / 2;

    for( var i = 0; i < numParams; i++ )
    {
        var n = i * 2;
        var name = paramMeta[n];
        var len = paramMeta[n+1];
        if( typeof onThis[name] !== 'string' )
        {
            errlib.render(res, "Missing or invalid type for parameter: " + name, "400",req.body);
            return false;
        }
        else if( onThis[name].length < len )
        {
            errlib.render(res, "Invalid length for parameter: " + name, "400",req.body);
            return false;
        }
        else
        {
            ret[name] = onThis[name];
        }
    }
    return ret;   
}
catch( e ) { console.log(e.stack); }

}

function defaultHandler( err, result, res, _params )
{
    if( err !== null ){	
        console.log( [ 'defaultHandler FAIL', err ] );
        errlib.render( res,"No luck.","500", err);
        return true;
    }

    if( result === null ) { // null means not found
        console.log( 'defaultHandler EMPTY RESULT' );
        if( _params.is404 )
        {
            errlib.render(res,"Not found","404",err); // DB error
        }
        else
        {        
            var params = {  t: _params.t ? _params.t : 'error/error.html',
                            p: { layout:    "global.html",
                                bodyClass: "profile",
                                code:      400
                                }
                          };
            
            var fromP = _params.p ? _params.p : _params;
            for( var x in fromP )
                params.p[x] = fromP[x];
            
            res.render( params.t, params.p  );
        }
        return true;		
    }
    
    return false;
}

exports.genCallback = function( req, res, extraParams, success )
{
    return function( err, result ) {
        if( !defaultHandler( err, result, res, extraParams ) && success )
        {
            success( result );
        }
    }
}


