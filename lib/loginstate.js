var debug = require('./debug.js');

exports.getID = function(req) {
    if( !req )
        throw new Error( 'Bad arg assert: missing "req" in getID' );
    return req.session.userid || null;
}

exports.logstate = function(req){
    debug.save();
    debug.setVolume(1);
	debug.out("req.session.userid",  req.session.userid || '(not set)' )
	debug.out("global_isUserLoggedIn: ", global_isUserLoggedIn);
	debug.restore();
}

exports.enable = function(req,userid){
	global_isUserLoggedIn = true;
	req.session.userid = userid;
}

exports.disable = function(req){
	global_isUserLoggedIn = false;
	req.session.userid = null;	
}

exports.initFromReq = function(req){
    global_isUserLoggedIn = !!req.session.userid; 
}

exports.isLoggedIn = function(){
	// This variable is reset on every request. It's used to control display of the 
	// options in the global nav bar for handling account state. 
	//
	// It was declared in app.js before requiring this module, so is always visible in context.
	return(global_isUserLoggedIn);
}


