var express_utils = require('../node_modules/express/lib/utils.js');


function copy( target )
{
    var args = Array.prototype.slice.call(arguments);
    for( var i = 1; i < args.length; i++ )
    {   
        var src = args[i];
        for( var x in src )
            target[x] = src[x];
    }
    return target;
}

copy( exports, express_utils );

exports.copy = copy;

exports.extend = function( obj, withThis )
{
    copy( obj.prototype, withThis.prototype || withThis );
}

if( !Object.__sh_utils_installed )
{
    Array.prototype.contains = function(x) { return this.indexOf(x) != -1 }
    Object.prototype.toArray = function() { var arr = []; for( var x in this ) { if( typeof(this[x]) !== 'function') arr.push(this[x]); } return arr; }
    Object.__sh_utils_installed = true;
}