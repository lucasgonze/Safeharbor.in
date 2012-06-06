
var dm = require('../models/dash-models.js');
var ac = require('../models/actions.js');

function getDash( req, resp )
{
    var rows = [];
    dm.getAuditTrail( null, 'all', function( err, row, results ) {
        if( !!err )
        {
            console.log( err ); // right, supposed to do something here
            return;
        }
        if( row )
        {
            var action = ac.ACTIONS[row.action];
            row.caption = action.cap;
            row.suggested = [];
            for( var i in action.flowsTo )
            {
                var actionID = action.flowsTo[i];
                console.log( 'flowsTo: ' + actionID );
                row.suggested.push( { url: '/dash/' + row.id + '/perform/' + actionID,
                                      text: ac.ACTIONS[actionID].cap } );
            }
                
            rows.push(row);
        }
        else if( results ) 
        {
            // we're done
            resp.render( '../views/dash/home.html',
                        {
                           layout: 'global.html',
                           pageTitle: 'Safe Harbor Dashboard',
                           bodyClass: 'dash',
                           auditItems: rows
                        } );
        }    
    });
}

exports.install = function(app) 
{
    app.get( '/dash', getDash );
    /*
	// Dealing with takedown requests for logged in customers
	trivialRoute('/dash','home','dash','Todo');
	trivialRoute('/dash/list','list','dash','List');
	trivialRoute('/dash/stats','stats','dash','Stats');
	*/
    
}