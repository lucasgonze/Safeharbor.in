
var models     = require('../models/dash-models.js');
var profile    = require('../models/profile-models.js');
var loginstate = require('../lib/loginstate.js');
var errlib     = require("../lib/error.js");

var exp            = errlib.err;
var errout         = errlib.errout();
var checkForSQLErr = errlib.errout( [ models.CODES.SQL_ERROR ] );

/* stub to fill in later */
function getDisputes(req,res)
{
    res.render( '../views/disputes/all.html',
                {
                   layout: 'signedin.html',
                   pageTitle: 'Safe Harbor - Disputes',
                   bodyClass: 'disputes'
                } );
}

/*
    here's what one record looks like:
    
 { ownerid: 1,
    auditid: 1,
    opname: 'takedownRequest',
    creation: Wed, 20 Jun 2012 14:58:56 GMT,
    resetsecret: null,
    attachment: '',
    resetdate: null,
    email: 'victor.stone@gmail.com',
    domain: 'assoverteakettle.org',
    acctid: 1,
    agentaddress: '7 foo Ln., Bar Park, IL',
    formatted_date: 'June 20, 2012',
    siteid: 40,
    password: 'qqqq',
    agentemail: 'assoverteakettle.org@gmail.com',
    sitename: 'Ass Over Tea Kettle',
    takedownRequests: 
     [ { page: 'http://some.page.com',
         trackingid: 1,
         email: 'foo@bar.com',
         description: 'stairway to heaven',
         phone: '555-099-9888',
         postal: '39 PO BOX, Kentucky, WA, 90087',
         anchor: 'http://some.page.com/foo.mp3' },
       { page: 'http://some.page.com',
         trackingid: 1,
         email: 'foo@bar.com',
         description: 'all girls go to heaven',
         phone: '555-099-9888',
         postal: '39 PO BOX, Kentucky, WA, 90087',
         anchor: 'http://some.page.com/bar.mp3' }
  }
*/
function getDash( req, res )
{
    var uid = loginstate.getID(req);
    
    if( !uid ) {
	    errout( req, res, exp( 400, "Only somebody signed in can see site info." ) );
        return(false);
    }

    var sql = 'SELECT *, ' +
              "to_char(creation, 'FMMonth FMDD, YYYY' ) as formatted_date " +
              'FROM audit, site, acct ' +
              'WHERE audit.siteid = site.siteid ' +
              '  AND site.ownerid = acct.acctid ' +
              '  AND acct.acctid = $1 ' +
              'ORDER BY creation DESC ';
              
    var AllRows = new ModelPerformer( { values: [uid],
                             performer: function() { this.table.findAllRows(sql); },
                             callback: function( code, rows ) 
                                 {
                                    if( code == models.CODES.SUCCESS )
                                        this.allRows = rows;
                                    else
                                        this.callback(code,rows);
                                 },
                             });

    var sql2 = 'SELECT * FROM requests WHERE trackingid = $1';                             
    var subSqlPerformer = new ModelPerformer( 
                                { 
                                    callback: callback,
                                    performer: function() 
                                    {
                                        var rows = this.findValue('allRows');
                                        var me = this, len = rows.length;
                                        
                                        function indexCallback(index,row) {
                                            return function(code, trRows) {
                                                    if( code == models.CODES.SUCCESS )
                                                    {
                                                        code = models.CODES.QUERY_ROW;
                                                        row.takedownRequests = trRows;
                                                    }
                                                    me.callback(code,trRows,row);
                                                    if( index == len - 1 )
                                                        me.callback(models.CODES.SUCCESS,rows);
                                                }  
                                        }
                                
                                        for( var i = 0; i < len; i++ )
                                        {
                                            this.table.findAllRows(sql2, [rows[i].auditid], indexCallback(i,rows[i]) );
                                        }
                                        
                                    }
                                });
                                    
    return AllRows.chain( subSqlPerformer );

}

var statusLevels = {
    important: 'High',
    warning: 'Medium',
    info: 'Low',
    success: 'None'
};

exports.install = function(app) 
{
    app.get( '/dash', getDash );
    app.get( '/disputes', getDisputes );
    /*
	// Dealing with takedown requests for logged in customers
	trivialRoute('/dash','home','dash','Todo');
	trivialRoute('/dash/list','list','dash','List');
	trivialRoute('/dash/stats','stats','dash','Stats');
	*/    
}