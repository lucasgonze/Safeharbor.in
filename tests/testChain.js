var models = require('../models');
var CODES = models.CODES;
var ModelPerformer = models.ModelPerformer;
var Performer = require('../lib/performer.js').Performer;

/*

  PUBLIC
  =======
Performer( params ) 
    params.callback
    params.performer 

Performer.chain( node )
Performer.perform()

  HELPERS FOR INSIDE YOUR PERFORM
  -------------------------------
    Performer.bound_callback( c, result )
    Performer.findValue(name)

  HELPERS FOR DERIVED CLASSES
  ---------------------------
    Performer.first()
    Performer.last()
    Performer.stopChain() 
    Performer.each( cb )
  
  NOT-SO PUBLIC
  =============

Performer.callback( c, result )
Performer.normalize()
Performer.postPerform(err)
Performer.prePerform()
Performer.release()
Performer.releaseAll()


ModelPerformer( params ) 
    params.parseObj
    params.names
    params.values

ModelPerformer.handleErrors( req, res, codes )


ModelPerformer._parseValues( onThis, paramNames)
ModelPerformer.callback( c, result )
ModelPerformer.getAPI()
ModelPerformer.normalize()
ModelPerformer.parseValues()
ModelPerformer.postPerform( err )
ModelPerformer.prePerform()

*/

/*
    TEST 1
    =======
    Perform and Callback in Context
*/
function someAPI( cb )
{
    this.cb = cb;

    var me = this;
    this.id = setTimeout( function() { me.callback() }, 550 );

    this.callback = function()
    {
        clearTimeout(this.id);
        this.cb();
    }
}


function getP1(add)
{
    return new Performer ( 
                        { performer: function() 
                            {
                                this.msg = 'Wasssup? you called?';
                                console.log( 'hello, I am performing: ' + add );
                                new someAPI( this.bound_callback() );
                            }, 
                         callback: function() 
                            {
                                 console.log( this.msg + ' ' + add );
                             }
                         });

}

var p1 = getP1('v1');
p1.perform();



/*
    TEST 2
    =======
    Simple chain
*/

var p1again = getP1('v2');

var p2 = new Performer ( 
                        { performer: function() 
                            {
                                var msg = this.findValue('msg');
                                this.xmsg = msg = ' (Testing chain) ';
                                console.log( 'hello, I too am performing' );
                                new someAPI( this.bound_callback() );
                            }, 
                         callback: function() 
                            {
                                 console.log( this.xmsg );
                             }
                         });

p1again.chain( p2 );
p1again.perform();


function wait()
{
    setTimeout( wait, 500 );
}
wait();