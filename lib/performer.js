var debug = require('../lib/debug.js');

/*

    A Performer is a chainable task.
    
    Takes two function parameters:
        performer
        callback

    CONTEXT
    -------------------------
    
    The performer will be called with 'this' context set to the Performer
    attached to it.
    
    You are responsible for calling the callback from inside the performer,
    HOWEVER you must call using this.callback(), not your callback directly.
    
    ***** NOTE: Do NOT, as in NOT call this.callback() from inside the 
    callback you pass in. 
    
    So...
            new Performer( { callback: function() {
                                  this.callback(); // BAD
                                },
                             performer: function() {
                                  this.callback(); // GOOD
                             } );
    
    If you need to hand out the callback function to an 3rd party (like
    sendGrid) then call the .bound_callback() method to get a version
    of the callback bound to this Performer object. For example:
    
            performer: function() {
            
                someApiThatRequiresACallback( this.bound_callback() );
            }
    
    
    PERFORMING
    ----------------------------
    
    Call the .perform() object to start the performance.
    
    Call the .chain() method to serialize Performer objects. The .chain() 
    method always appends to the end of the chain.
    
    ******** NOTE: the perform() method is dumb, in that it doesn't know 
    the beginning of the chain so always make sure you call it on the 
    first Performer in the chain.
    
    
    SHARING RESULTS
    ----------------------------
    
    You can pass data long to Performers later in the chain by attaching 
    values to your 'this' context and retrieve it using .findValue()
    method.
    
    So:
            var p1 = new Performer( { callback: function(someValue) { 
                                            this.myValue = someValue;
                                        },
                                        performer: function() {
                                            var generatedValue = generateSomeValue();
                                            this.callback( generatedValue );
                                        } );

    Then we can dig it out later, in another performer:
    
            var p2 = new Performer({ callback: function() {
                                            // ....
                                     },
                                    performer: function() {
                                        var gotIT = this.findValue('myValue');
                                        
                                        //....
                                    } );
                                    
    Now you chain them together and perform:
    
           p1.chain( p2 ).perform();
        
    See ModelPerformer for specialized version for dealing with postgresql
*/
function Performer( params ) 
{
    this.ucallback  = params.callback;
    this.performer  = params.performer;
    
    // for error output only
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
        console.log( 'ERROR in Peformer: ', err );
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