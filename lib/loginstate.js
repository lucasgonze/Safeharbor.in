var debug = require('./debug.js');

var global_isUserLoggedIn = false;

exports.getID = function(req) {
    if( !req )
        throw new Error( 'Bad arg assert: missing "req" in getID' );
    return req.session.userid || null;
}

exports.getUser = function(req) {
    if( !req )
        throw new Error( 'Bad arg assert: missing "req" in getID' );
    return req.session.user || null;
}

exports.logstate = function(req){
    debug.save();
    debug.setVolume(1);
    var dbg = 
        { sessionID: req.sessionID,
          user: req.session.user || ('no user'),
            global_isUserLoggedIn: global_isUserLoggedIn };
	debug.out(dbg);
	debug.restore();
}

exports.enable = function(req,user){
	global_isUserLoggedIn = true;
	req.session.userid = user.acctid;
	req.session.user = user;
}

exports.disable = function(req){
	global_isUserLoggedIn = false;
	req.session.userid = null;	
	req.session.user = null;	
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
