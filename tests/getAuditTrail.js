
var dm = require('../models/dash-models.js');
var ac = require('../models/actions.js');

function getDash( req, resp )
{
    dm.getAuditTrail( null, 'all', function( err, row, results ) {
        console.log( results );
        if( !!err )
        {
            console.log( err ); // right, supposed to do something here
            return;
        }

        if( row )
            console.log(row);    
    });

}

getDash( null, null );