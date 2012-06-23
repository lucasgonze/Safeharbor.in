var models = require('../models');

var rm = require("../models/reg-models.js");

function test()
{
    var d = (new Date()).toString();
    var ds = d.replace(' ','');
    var obj = { acctid: 1,
                sitename: 'test ' + d,
                domain: ds + '.com?', 
                agentaddress: 'agentdadr' + d,
                agentemail: ds + '@gmail.com'
                };
                
  var createSite = rm.createSite( obj , function( code, siteid ) {
     console.log(' RESULT', code, siteid );
     });
     
    createSite.perform();
}
                  


function wait()
{
    setTimeout( wait, 700 );
}
test();
wait();