
var volume = 0;

exports.setVolume = function(v)
{
    volume = v;
}

exports.out = function()
{
    if( volume > 0 )
    {
        var args = Array.prototype.slice.call(arguments);
        console.log.apply(console.log,args);
    }
}
        