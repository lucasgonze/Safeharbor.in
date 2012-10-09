var safeharbor = require('../lib/safeharbor.js');
var debug      = safeharbor.debug;
var utils      = safeharbor.utils;
var errlib     = safeharbor.errors;
var page       = safeharbor.page;
var loginstate = safeharbor.loginstate;

var util = require('util');
var errout = errlib.errout();

var dash       = require('../models/dash-models.js');
var profile    = require('../models/profile-models.js');

var CODES      = dash.CODES;

exports.install = function(app) 
{
    var logged_in = app.checkRole(app.ROLES.logged_in);

	app.get( '/paige', logged_in, getPaige);
	app.get( '/panel', logged_in, getOpenDisputes);
	app.get( '/closed', logged_in, getClosedDisputes);

    app.get( '/dash', logged_in, getDash );
    app.get( '/disputes', logged_in, getDash );
    app.get( '/detail/:auditid([0-9]+)$', logged_in, getDetail );
}

function getOpenDisputes(req,res){
	
	dash.getOpenMedia({uid:loginstate.getID(req), callback:function(err,data){
		
		if(err){
			debug.out("error returned from getOpenMedia");
		    res.outputMessage( page.MESSAGE_LEVELS.error,
		                       'Try again later',
		                       'Fail' );
			res.status(500).render(page.MESSAGE_VIEW, { pageTitle: 'Sad' } );            
			return;
		}

		res.render( 
					'dash/panel.html', {  
						layout: 'dash/outside.html',
						pageTitle:"SafeHarbor.in - Panel",
						bodyClass:"dash-index",
						disputes: data
                 } 
		);
	}});			
}

function getClosedDisputes(req,res){
	
	dash.getClosedMedia({uid:loginstate.getID(req), callback:function(err,data){
				
		if(err){
			debug.out("error returned from getOpenMedia");
		    res.outputMessage( page.MESSAGE_LEVELS.error,
		                       'Try again later',
		                       'Fail' );
			res.status(500).render(page.MESSAGE_VIEW, { pageTitle: 'Sad' } );            
			return;
		}

		/* The view is different depending on whether there is more than one site. 
		   This 'site' variable is only set for users who have a single site. */
		var site = null;
		if( typeof data == 'object' && data.length > 0 ){
			// fixme: implement URL for real as a preference in the site customization dialog
			site = {
				name: data[0].sitename,
				logo: data[0].sitelogo,
				domain: data[0].domain,
				url: 'http://'+data[0].domain			
			}
		}
		for(var i=1; i<data.length; i++){
			console.log("i",i)
			if( data[i-1].sitename !== data[i].sitename ){
				// don't show the site logo up at the top, do show it on each row
				site = null;
				break;
			}
		}

		// set one-site class on the body to tell paige whether there is more than one site
		var bodyClass = "dash-closed one-site";	
		if( site == null )
			bodyClass = "dash-closed";		
		
		console.log("data length",data.length)
		res.render( 
					'dash/panel.html', {  
						layout: 'dash/outside.html',
						pageTitle:"SafeHarbor.in - Panel",
						bodyClass: bodyClass,
						disputes: data,
						site: site
                 } 
		);
	}});			
}

/* sandbox for paige to work on markup */
function getPaige(req,res){

	res.render( 
				'dash/inside.html',
	               {  
					layout: 'dash/outside.html',
					pageTitle:"Safe Harbor - [page title here]",
					bodyClass:"dash-index",
					submissions: []                            
	                } 
	);
}

function getDash( req, res  )
{
    renderDashForAccount( req, res, loginstate.getID(req) );
}

var renderDashForAccount = exports.renderDashForAccount = function( req, res, uid )
{
    var log = dash.getAuditLog(uid,
		function(code,rows) 
		      {
		          if( code != CODES.SUCCESS )
		              return;

		          if( rows && rows.length )
		          {
		              res.render( 'dash/list.html',
		                          {
		                             pageTitle: 'Safe Harbor - Disputes',
		                             bodyClass: 'disputes',
		                             auditItems: rows
		                          } );
		          }
		          else
		          {
		              res.outputMessage( 
		                              page.MESSAGE_LEVELS.success,
		                              "No disputes",
		                              "You have no open DMCA requests."
		                              );
		              res.render( page.MESSAGE_VIEW,
		                          {  pageTitle:"Safe Harbor - Disputes",
		                             bodyClass:"disputes"
		                           } );                            
		          }
		      });
    
    log.handleErrors( req, res ).perform();
}

function getDetail( req, res )
{
    var auditId = req.params.auditid;
    
    var verify = dash.verifyAuditDetailOwner( auditId, loginstate.getID(req), function(){} );
    var detail = dash.getAuditDetail( auditId, function( code, detail ) {
                if( code == CODES.SUCCESS )
                {
                    res.render( 'dash/detail.html',
                                {
                                   pageTitle: 'Safe Harbor - Dispute Detail',
                                   bodyClass: 'disputes',
                                   detail: detail[0] || detail
                                } );
                }
        });
    
    verify.chain(detail).handleErrors(req,res).perform();
}

