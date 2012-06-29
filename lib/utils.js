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
    function addFunc(o,f,imp)
    {
        o.prototype[f] = imp;
        var pd = Object.getOwnPropertyDescriptor(o.prototype,f);
        pd.enumerable = false;
        Object.defineProperty(o.prototype,f,pd);
    }
    
    addFunc( Array, 'contains', function(x) 
                                { return this.indexOf(x) != -1 } );

    addFunc( Object, 'toArray', function() 
                                { var arr = []; 
                                  for( var x in this ) 
                                    { arr.push(this[x]); } 
                                  return arr; 
                                });

    Object.__sh_utils_installed = true;
}

exports.page = function( res, body_text, title, alert_type, icon_type )
{
    var vars = {
                    layout: "shared/main.html",
                    pageTitle: title || 'A page',
                    body_text: body_text,
                    alert_type: alert_type || 'alert-success',
                    icon_type: icon_type || 'icon-ok'
                }
    res.render( "page.html", vars );
}