
var volume = 0;

exports.setVolume = function(v)
{
    volume = v;
}

exports.getVolume = function()
{
    return volume;
}

var states = [ ];

exports.save = function() 
{
    states.push( { volume: volume } );
}

exports.restore = function()
{
    var state = states.pop();
    
    volume = state.volume;
}


exports.out = function()
{
    if( volume > 0 )
    {
        var args = Array.prototype.slice.call(arguments);
        console.log.apply(console.log,args);
    }
}
        
exports.render = function( res )
{
    var args = Array.prototype.slice.call(arguments,1);
    if( args.length == 1 )
        args = args[0];
    html = '<!DOCTYPE html PUBLIC \'-//W3C//DTD HTML 4.01//EN\'><html><head><title>dumper</title></head>' +
           '<body><pre> ' + require('util').inspect(args,true,null) + '</pre></body></html>';
    res.write(html);
    res.end();
}