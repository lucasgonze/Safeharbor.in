
var models = require("../models/profile-models.js");
var loginstate = require('../lib/loginstate.js');
var errlib = require("../lib/error.js");

/**********
 * validation helpers
**********/

exports.validateString = function(name,value,minlength){
	
	if( typeof value !== "string"){
		console.log("validation failure for string "+name);
		console.log("typeof was: "+(typeof value));
		return(false);
	}

	if( typeof minlength === "number" && value.length < minlength ){
		console.log("validation failure for string "+name);
		console.log("length was: "+ value.length);
		return(false);
	}
	
	return(true);
}

/**********
 * base class for route handlers
**********/

function RouteHandler(req,res,view){
	this.req = req;
	this.res = res;
	this.view = view;
}

exports.RouteHandler = RouteHandler;

/*
 * Parts of RouteHandler that a child class will usually override
 */

RouteHandler.prototype.validate = function(){
	// if an error happens, need to render it to the browser using the res object
	// e.g. errlib.render(this.res,"Bad param","400",this.req.body)
	return(true);
};	

// returns sql statement used in model
RouteHandler.prototype.sql = function(){
	return("select true");
}

// returns an array corresponding to $1, $2 etc in this.sql
RouteHandler.prototype.values = function(){
	return([]);
}

RouteHandler.prototype.handleSuccess = function(rows){
	this.res.render(this.view,{"layout":"global.html"});	
};

/*
* Stuff that a child class will usually leave alone
 */

RouteHandler.prototype.model = function(sql,values,callback){
	var client = require('../models').getClient();
	var query = client.query({
		"text": sql,
		"values": values
	});
	query.on('error', function(error) { callback(error); }); // problem at the postgres level
	query.on('row', function(row) { callback(null,row); }); // perfect
	query.on('end',function(result){
		if( typeof result !== 'undefined'){
			if( result.rowCount < 1){
				callback(null,null); // not found - that's an error in our application flow						
			}
		}
	});	
} 

RouteHandler.prototype.handleDatabaseError = function(err){
	return(errlib.render(this.res,"Internal error (83)","500",err));
};
RouteHandler.prototype.handleNoRows = function(){
	return(errlib.render(this.res,"Internal error (84)","500"));
};
RouteHandler.prototype.modelCallback = function(err,result){
	if( err !== null ){ this.handleDatabaseError(err); }
	if( result === null ){ this.handleNoRows();}
	this.handleSuccess(result);
}

// get the ball rolling
RouteHandler.prototype.start = function(){
	if( ! this.validate() ){return;}
	this.model(this.sql(),this.values(),this.modelCallback.bind(this));
};	
	
	
/**********
 * terse wrapper for all of the above
**********/

exports.handleRoute = function(opts){

	function OOPRouter(req,res,view){ exports.RouteHandler.call(this,opts.req,opts.res,opts.view);}
	OOPRouter.prototype = new exports.RouteHandler();
	OOPRouter.prototype.constructor = OOPRouter;

	OOPRouter.prototype.handleSuccess = function(row){
		opts.res.render(this.view,opts.viewVars(row));
	};
	
	OOPRouter.prototype.sql = function(){
		return(opts.sql);
	}

	OOPRouter.prototype.values = function(){
		return(opts.sqlParams);
	}

	var opts = opts;
	this.opts = opts;
	OOPRouter.prototype.validate = opts.validate;
	var handler = new OOPRouter(opts.req,opts.res,opts.view);
	handler.start();
	
}


