var models = require('../models');

var rm = require("../models/reg-models.js");
var dm = require('../models/dash-models.js');
var ac = require('../models/actions.js');

var numCreated = 0;

function onAuditItem( err, results, mediaId )
{
    if( !!err )
    {
        console.log( 'FAIL (2)');
        console.log( err );
        cleanup();
        return;
    }
}

function onMedia( err, result1 )
{
    if( !!err )
    {
        console.log( 'FAIL');
        console.log( err );
        cleanup();
        return;
    }

    var mediaId = result1.rows[0].id;

    console.log( 'Got media: ' + mediaId );
    
    dm.startAuditTrail( 
        mediaId,         
        ac.ACTION_STATES.received_web_form,
        function( err, results ) { 
            ++numCreated;
            console.log( 'numCreated: ' + numCreated );
            onAuditItem( err, results, mediaId); 
            }
        );
}

function cleanup()
{
    console.log('CLEANING UP...' );
    process.exit();
}

function test()
{
    var client = models.getClient();
    
    var fakeAcct = 0x1002;
    
    rm.createSite(fakeAcct,'AssOverTeakettle','assoverteakettle.org','9 foo st. Bar, CO','foo@bar.org',
        function(err,result){
            if( !!err )
            {
                console.log(err);
                cleanup();
            }
            
            console.log( result );
            var fakeSite = result.id;
            
            dm.logContestedMedia( 
                fakeSite, 
                'Sky Saw', 
                'http://blog.example.com/?entry=2034',
                'http://media.example.com/sky_saw.mp3',
                onMedia
            );
        
            dm.logContestedMedia( 
                fakeSite, 
                'Yammers', 
                'http://blog.example.com/?entry=2035',
                'http://media.example.com/yammers.mp3',
                onMedia
            );
        
            dm.logContestedMedia( 
                fakeSite, 
                'Scrambled Eggs', 
                'http://blog.example.com/?entry=2233',
                'http://media.example.com/yesterday.mp3',
                onMedia
            );
            
        });
}

function waitForEnd()
{
    if( numCreated < 3 )
    {
        setTimeout( waitForEnd, 700 );
        console.log( 'waiting...');
    }
    else
    {
        dm.getAuditTrail(  null, 'all', function( err, row, results ) {
            if( !!err )
            {
                console.log( 'FAIL (3)' );
                console.log( err );
                cleanup()
                return;
            }
            
            if( row )
            {
                console.log( row );
            }
            
            if( results )
            {
                console.log( 'Seems to have worked:');
                process.exit();
            }
        });
    }
}

console.log( 'START...');
test();
waitForEnd();