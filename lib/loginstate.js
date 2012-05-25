
exports.getID = function(req){
	if( typeof req !== "undefined" && 
		typeof req.session !== "undefined" &&
		typeof req.session.userid !== "undefined")
		return(req.session.userid);
	return(null);
}

exports.logstate = function(req){
	console.log("req.session.userid");
	if( typeof req === "object" && typeof req.session === "object" && typeof req.session.userid !== "undefined")
		console.log(req.session.userid);
	else 
		console.log('not set');

	console.log("global_isUserLoggedIn: ");
	if( typeof global_isUserLoggedIn === "undefined" )
		console.log(typeof global_isUserLoggedIn);
	else
		console.log(global_isUserLoggedIn);
}

exports.enable = function(req,userid){
	global_isUserLoggedIn = true;
	req.session.userid = userid;
	exports.logstate(req);
}

exports.disable = function(req){
	global_isUserLoggedIn = false;
	req.session.userid = null;	
}

exports.initFromReq = function(req){
	if( typeof req === "object" &&
		typeof req.session === "object" &&
		typeof req.session.userid !== "undefined" &&
		req.session.userid !== null )
		global_isUserLoggedIn = true; 
}

exports.isLoggedIn = function(){
	// This variable is reset on every request. It's used to control display of the 
	// options in the global nav bar for handling account state. 
	//
	// It was declared in app.js before requiring this module, so is always visible in context.
	return(global_isUserLoggedIn);
}


