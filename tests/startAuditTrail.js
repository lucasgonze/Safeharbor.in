var dm = require('../models/dash-models.js');
var models = require('../models');
var ac = require('../models/actions.js');

function test()
{
    var client = models.getClient();
    
    var fakeSite = 0x1001;
    var mediaId  = null;
    var auditLogId = null;
    dm.logContestedMedia( 
        fakeSite, 
        'Sky Saw', 
        'http://blog.example.com/?entry=2034',
        'http://media.example.com/sky_saw.mp3',
        function( err, result1 )
        {
            if( !!err )
            {
                console.log( 'FAIL');
                console.log( err );
                cleanup();
                return;
            }

            mediaId = result1.rows[0].id;

            console.log( 'Got media: ' + mediaId );
            
            dm.startAuditTrail( 
                mediaId,         
                ac.ACTION_STATES.received_web_form,
                function( err, results )
                {
                    if( !!err )
                    {
                        console.log( 'FAIL (2)');
                        console.log( err );
                        cleanup();
                        return;
                    }
                    
                    dm.getAuditTrail(  mediaId, 'full', function( err, results ) {
                        if( !!err )
                        {
                            console.log( 'FAIL (3)' );
                            console.log( err );
                            cleanup()
                            return;
                        }
                        
                        console.log( 'Seems to have worked:');
                        console.log( results );
                        cleanup();
                    });
                });
        });
     
     function cleanup()
     {
        console.log('CLEANING UP: ' + mediaId );
        if( mediaId )
        {
            dm.deleteAuditTrail(mediaId, function( err ) {
                    if( !!err )
                    {
                        console.log( 'FAIL (4)');
                        console.log( err );
                        return;
                    }
                });
            mediaId = null;
        }
     }
}

console.log( 'START...');
test();