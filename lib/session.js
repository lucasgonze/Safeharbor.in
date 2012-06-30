
var loginstate = require('./loginstate.js'),
    express = require('express'),
    Store = express.session.Store,
    fs = require('fs');

var CONFIG = {
    filename: 'sh_session.txt'
}


/*
 * Initialize a new `SessionStore`.
 *
 * 
 */

function SessionStore() {
    this.loadFromStore();
}

/*
 * Inherit from `Store.prototype`.
 */

SessionStore.prototype.__proto__ = Store.prototype;

SessionStore.prototype.loadFromStore = function() {
	
	var raw;
	try {
	  raw = fs.readFileSync( __dirname + '/' + CONFIG.filename, 'utf8' );
	} catch (err) {
		console.error("There was an error opening the session file:");
		console.log(err);
	}
	
	if( raw )
	{
	  this.sessions = JSON.parse( raw );
	}
	else
	{
	  this.sessions = {};
	}
}

SessionStore.prototype.saveToStore = function() {
    fs.writeFileSync( __dirname + '/' + CONFIG.filename, JSON.stringify(this.sessions), 'utf8' );
}


/*
 * Attempt to fetch session by the given `sid`.
 *
 * @param {String} sid
 * @param {Function} fn
 * 
 */

SessionStore.prototype.get = function(sid, fn){
  var self = this;
  process.nextTick( function tickGet(){
    var expires
      , sess = self.sessions[sid];
    if (sess) 
    {
      sess = JSON.parse(sess);
      expires = 'string' == typeof sess.cookie.expires
        ? new Date(sess.cookie.expires)
        : sess.cookie.expires;
      if (!expires || new Date < expires) {
        fn(null, sess);
      } else {
        self.destroy(sid, fn);
      }
    } else {
      fn();
    }
  }
 );
};

/*
 * Commit the given `sess` object associated with the given `sid`.
 *
 * @param {String} sid
 * @param {Session} sess
 * @param {Function} fn
 * 
 */

SessionStore.prototype.set = function(sid, sess, fn){
  var self = this;
  process.nextTick(function(){
    self.sessions[sid] = JSON.stringify(sess);
    self.saveToStore();
    fn && fn();
  });
};

/*
 * Destroy the session associated with the given `sid`.
 *
 * @param {String} sid
 * 
 */

SessionStore.prototype.destroy = function(sid, fn){
  var self = this;
  process.nextTick(function(){
    delete self.sessions[sid];
    self.saveToStore();
    fn && fn();
  });
};

/*
 * Invoke the given callback `fn` with all active sessions.
 *
 * @param {Function} fn
 * 
 */

SessionStore.prototype.all = function(fn){
  var arr = []
    , keys = Object.keys(this.sessions);
  for (var i = 0, len = keys.length; i < len; ++i) {
    arr.push(this.sessions[keys[i]]);
  }
  fn(null, arr);
};

/*
 * Clear all sessions.
 *
 * @param {Function} fn
 * 
 */

SessionStore.prototype.clear = function(fn){
  this.sessions = {};
  fn && fn();
};

/*
 * Fetch number of sessions.
 *
 * @param {Function} fn
 * 
 */

SessionStore.prototype.length = function(fn){
  fn(null, Object.keys(this.sessions).length);
};

var ONE_MINUTE = 60000;

exports.setup = function(app) {

	app.use(express.cookieParser());
	app.use(express.session( { secret: 'I loved KH.', 
	                   userid: null, 
	                   store: new SessionStore,
                       cookie: {
                              maxAge: (ONE_MINUTE * 60) * 24 * 30
                           }
	                  }
	                ));

    app.use(function(req, res, next) {
           loginstate.initFromReq(req);
            next();
        });		
}