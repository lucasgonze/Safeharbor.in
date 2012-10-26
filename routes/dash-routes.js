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

	// there are two handlers for '/', depending on whether the user is logged in.
	// this function is the handler for users who are logged in. 
    app.get( '/', logged_in, getOpenDisputes );

	app.get( '/closed', logged_in, getClosedDisputes);
	app.get( '/newsite', logged_in, getNewSite);
	app.get( '/settings', logged_in, getSiteEditor);
	app.post( '/settings', logged_in, saveSiteEdit);
}

// clone of profile-routes.saveSiteEdit
function saveSiteEdit(req,res) {

	var blank = function(name){ 
		if( (req.body[name] ? req.body[name] : '').length < 1 ){
			errlib.page(400,res,"Required argument missing: "+name);
			return(false);
		}
	}			
	if( blank('sitename')
	|| blank('domain')
	|| blank('agentaddress')
	|| blank('agentemail')
	|| blank('agentname')
	|| blank('agentphone')
	|| blank('country')
	) return;

    var uid = loginstate.getID(req);
    
    function callback( code, err ) {
        if( code == CODES.OK )
        {
            var title = "Site Properties";
            res.outputMessage( 
                page.MESSAGE_LEVELS.success,
                title,
                "Changes to site saved."
            );    
			// this way is slow but sure
			getSiteEditor(req,res);
			// this way is fast but flaky
			// res.render( page.MESSAGE_VIEW, {pageTitle:title,layout:'shared/main.html'} );
        }
    }            
    var args = utils.copy( {acct: uid}, req.body );

    profile
        .updateSiteForUser( args, callback )
        .handleErrors( req, res )
        .perform();
}

// clone of profile-routes.emitSiteEditor
function getSiteEditor(req,res){	
	
	var uid = loginstate.getID(req);

    function success(code, site) {
        if( code == CODES.OK )
        {
			var countryList = page.countryList(site.country);
	
            res.render("dash/website_settings.html", utils.copy({
													"is-dash":true,
													layout: 'shared/main.html',
                                                    pageTitle: "Edit Site",
													countryList: countryList,
                                                    bodyClass: "siteeditor" }, site) );
        } else if( code == CODES.MULTIPLE_RECORDS_FOUND ) {
			return(errlib.page(500,res,"Multiple sites not implemented yet."))
		} else {
			return(errlib.page(500,res,"Unexpected code "+code+" in getSiteEditor"))
		}
    }
    
	profile
	    .getSiteForUser( uid, success )
	    .handleErrors( req, res, [CODES.NO_RECORDS_FOUND] )
	    .perform();
}

function getSiteEditor_v1(req,res){
	res.render( 
				'dash/website_settings.html', {  
					"is-dash":true,
					layout: 'shared/main.html',
					pageTitle:"Add a New Website",
					bodyClass:"dash-newsite",
					setSettingsAsActiveTab: 'class="active"'
             } 
	);	
}

function getNewSite(req,res){	
	/* Fixme: 
	- create a new web site with the stub name "Untitled Site"
	- put an item in the site listing dropdown
	- put an [x] next to the item in the site listing dropdown to make it easy to delete the stub site
	- put the user into the site settings edit tab for the new site
	*/
	errlib.page(500,res,"/newsite not implemented yet");
}

function getOpenDisputes(req,res){
	
	dash.getOpenMedia({uid:loginstate.getID(req), callback:function(err,data){
		
		if(err){
			errlib.page(500,res,"error returned from getOpenMedia: "+err);
			return;
		}

		res.render( 
					'dash/panel.html', {  
						"is-dash":true,
						layout: 'shared/main.html',
						pageTitle:"SafeHarbor.in - Panel",
						bodyClass:"dash-index",
						setOpenAsActiveTab: 'class="active"',
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
		
		res.render( 
					'dash/panel.html', {  
						"is-dash":true,
						layout: 'shared/main.html',
						pageTitle:"SafeHarbor.in - Panel",
						bodyClass: bodyClass,
						disputes: data,
						site: site
                 } 
		);
	}});			
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
									"is-dash":true,
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
									"is-dash":true,
		                             bodyClass:"disputes"
		                           } );                            
		          }
		      });
    
    log.handleErrors( req, res ).perform();
}


