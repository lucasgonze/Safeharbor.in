
function copy( t, s )
{
    for( var n in s )
        t[n] = s[n];
}

var u = require('util');
var i = function(o) { return u.inspect(o,true,null); }
var o = console.log;


function test(opts)
{
//    Object.seal( this );
    
    for( var n in opts )
        this[n] = opts[n];
}

test.prototype.op1 = '1';
test.prototype.op2 = '2';
test.prototype.op3 = '3';


var T = new test( { op1: 'foo', bar: 'xxx' } );


for( var x in T )
{
    o( x, ': ', T[x] );
}
