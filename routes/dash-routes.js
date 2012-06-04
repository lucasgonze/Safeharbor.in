
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
            row.suggested =
                [ { text: 'Not a DMCA takedown request', url: '/dash/action/4' }, // hahahaha
                  { text: 'Take down content', url: '/dash/action/4' }, // hahahaha
                  { text: 'Return to submitter for corrections', url: '/dash/action/4' } ]; // hahahaha
                
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
}