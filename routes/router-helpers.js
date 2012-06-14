var errout = require("../lib/error.js").errout();

/*--------------------------
    HELPERS
----------------------------*/
exports.checkStringParams = function( req, res, onThis, paramMeta  )
{
    var ret = {};
    var numParams = paramMeta.length;

    for( var n = 0; n < numParams; i++ )
    {
        var name = paramMeta[n];
        if( typeof onThis[name] !== 'string' )
        {
            errout( req, res, err( 400, "Missing or invalid type for parameter: " + name));
            return false;
        }
        else
        {
            ret[name] = onThis[name];
        }
    }
    return ret;   
}


