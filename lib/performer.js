var debug = require('../lib/debug.js');

var globalID = 0;

/**
Performer class exists to serialize a "performance" of several tasks
in an asynchronous environment. Each Performer wraps a single "performance" 
of a task such as sending an email or updating a record in a database.

You chain multiple Performer object together to perform a string of 
related tasks that have to happen in a certain order. The typical
coding pattern is:
           
           var a = new Performer(...)
           var b = new Performer(...)
           
           a.chain(b).perform();

           
If the code above, the ``b`` performer will not happen until ``a`` is 
completed (from the callback for ``a`` actually)
           
CONTEXT
=======
    
You instantiate a Performer with a __performer__ function and a 
__callback__ function. Your performer function and your callback 
function will be called with 'this' context set to the 
Performer attached to it.

If you need to hand out the callback function to an 3rd party (like
sendGrid) then call the .bound_callback() method to get a version
of the callback bound to this Performer object. For example:
    
            performer: function() {            
                someApiThatRequiresACallback( this.bound_callback() );
            }
    
__NOTE__ Do NOT, as in NOT call ``this.callback()`` from inside the 
your callback function, just your performer function. So...

        new Performer( { callback: function() {
                              this.callback(); // BAD
                            },
                         performer: function() {
                              this.callback(); // GOOD
                         } );

__NOTE__ If you plan to chain Performer objects then make sure to
call this.callback() exactly ONCE - not more, not less. 


PERFORMING
==========

Call the ``.perform()`` method to start the performance.

Call the ``.chain()`` method to append one Performer to others to form a chain. 
The ``chain()`` method always appends to the end of the chain.

__NOTE__ the perform() method is dumb, in that it doesn't know 
the beginning of the chain so always make sure you call it on the 
first Performer in the chain.
    
    
SHARING RESULTS
---------------

You can pass data along to Performers later in the chain by attaching 
values to your 'this' context and retrieve it using .findValue()
method. 

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
        
See {{#crossLink "ModelPerformer"}}{{/crossLink}} for specialized version for dealing with postgresql

@class Performer
@constructor
@param {Object} params Your functions this instance will wrap
    @param {function} params.performer A function to call when it's turn comes up in the chain
    @param {function} params.callback A function that will be called at the completion of the 
             ``performer`` function.
**/
function Performer( params ) 
{
    this.objectID = ++globalID;
    
    this.ucallback  = params.callback;
    this.performer  = params.performer;
    
    this.next = null;
    this.prev = null;
    this.cancelChain = false;
}

/**

For use with 3rd party APIs that require a callback. Using
this will gaurantee that this performer will remain the
context for all callbacks on any thread.

__NOTE__ really only make sense from inside your performer()
call.

@method bound_callback
@for Performer
@return {function}

**/

Performer.prototype.bound_callback = function()
{
    var me = this;
    return function(c,result) { me.callback(c,result); }
}

Performer.prototype.callback = function( c, result )
{
    this.ucallback( c, result );
    debug.out('back from ucallback(',this.objectID,'), cancel(' + this.cancelChain + ') next(' + !!this.next + ')' );
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
            require('./error.js').handleException( err, this.req, this.res );
        else
            debug.out( 'Exception in perfomer: ', err );
        
        this.stopChain();
    }
}

/**
Start the performer chain. 
        
__NOTE__ This should only called directly on the first 
Performer object in a chain.

@method perform
@for Performer
**/
Performer.prototype.perform = function()
{
    try
    {
        if( this.prePerform() )
        {
            debug.out( '------------PERFORMING (', this.objectID, ')----------------');
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

/**
Chains Performer objects together.

__NOTE__ The parameter Performer object will be chained to 
the last Performer in this chain which may or may not be
the Performer object you are calling.

@method chain
@chainable
@param {Object} node A Performer object to append to this chain
**/
Performer.prototype.chain = function( node )
{
    var last = this.last(),
        wasFirst = !!node.next;
    
    debug.out( 'Chaining: ', last.objectID , ' -> ', node.objectID );
    last.next = node;
    node.prev = last;
    return this;
}

/**
Return the last Performer object in this chain.

@method last
@for Performer
@return {Object} the last Performer 
**/
Performer.prototype.last = function()
{
    var last = this;
    while( last.next )
        last = last.next;
    return last;
}

/**
Return the first Performer object in this chain. You
should use this if you want to call perform() and you're not
100% sure if you at the head of the chain.

@method first
@for Performer
@return {Object} the first Performer.
**/
Performer.prototype.first = function()
{
    var first = this;
    while( first.prev )
        first = first.prev;
    return first();
}

Performer.prototype.each = function( cb )
{
    var node = this.first();
    while( node )
    {
        cb(node);
        node= node.next;
    }
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

/**
Find a value that's anywhere in this chain. 

Use this method to find a random property of any Performer in this 
chain. 

@method findValue
@param {string} name Name of the value's property name to search for
@return Value of 'name' property or null if not found
**/
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
    var node = this.last();
    while( node )
    {
        node.cancelChain = true;
        node = node.prev;
    }
}

exports.Performer = Performer;