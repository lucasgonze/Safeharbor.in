var debug = require('../lib/debug.js');

function Performer( params ) 
{
    this.ucallback  = params.callback;
    this.performer  = params.performer;
    this.req        = params.req;
    this.res        = params.res;
        
    this.next = null;
    this.prev = null;
    this.cancelChain = false;
}

Performer.prototype.bound_callback = function( c, result )
{
    var me = this;
    return function(c,result) { me.callback(c,result); }
}

Performer.prototype.error_output = function( req, res )
{
    this.req = req;
    this.res = res;
}

Performer.prototype.callback = function( c, result )
{
    this.ucallback( c, result );
    debug.out('back from ucallback, cancel: ' + this.cancelChain + ' or next: ' + !!this.next );
    if( this.next && !this.cancelChain )
    {
        this.next.perform();
    }
    else
    {
        this.releaseAll();
    }
}

Performer.prototype.prePerform = function()
{
    return true;
}

Performer.prototype.postPerform = function(err)
{    
    if( err )
    {
        if( this.req )
        {
            require('./error.js').handleException( err, this.req, this.res );
        }
    }
}

Performer.prototype.perform = function()
{
    try
    {
        if( this.prePerform() )
        {
            debug.out( '------------PERFORMING----------------');
            debug.out( this.performer.toString() );
            this.performer(this);
            this.postPerform(null);
        }
    }
    catch( err )
    {
        this.postPerform(err);
    }
}


Performer.prototype.chain = function( node )
{
    var last = this.last();
    last.next = node;
    node.prev = last;
    return this;
}

Performer.prototype.last = function()
{
    var last = this;
    while( last.next )
        last = last.next;
    return last;
}

Performer.prototype.releaseAll = function()
{
    var node = this.last();
    while( node )
    {
        var next = node.next;
        if( next )
        {
            next.prev = null;
            node.next = null;
        }
        node = node.prev;
    }
}

Performer.prototype.findValue = function(name)
{
    // N.B. this only work while performing
    // b/c 'prev' pointers are destoryed
    // right after nesting is over.
    
    var perf = this.last();
    while( perf )
    {
        if( perf[name] )
            return perf[name];
        perf = perf.prev;
    }
    
    return null;
}

Performer.prototype.stopChain = function() 
{
    this.cancelChain = true;
}

exports.Performer = Performer;