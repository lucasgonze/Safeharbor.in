
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