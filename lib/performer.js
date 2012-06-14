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
    if( this.next && !this.cancelChain )
    {
        this.next.prev = this;
        this.next.perform();
        this.next.prev = null;
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
            //console.log( '------------PERFORMING----------------');
            //console.log( this.performer.toString() );
            this.performer(this);
            this.postPerform(null);
        }
    }
    catch( err )
    {
        this.postPerform(err);
    }
}


Performer.prototype.chain = function( next )
{
    this.next = next;
    return this;
}

Performer.prototype.stopChain = function() {
    this.cancelChain = true;
}

exports.Performer = Performer;