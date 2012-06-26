
var express = require('express'),
    Store = express.session.Store,
    fs = require('fs');

var CONFIG = {
    filename: 'sh_session.txt'
}


/**
 * Initialize a new `SessionStore`.
 *
 * @api public
 */

var SessionStore = module.exports = function SessionStore() {
    this.loadFromStore();
}

/**
 * Inherit from `Store.prototype`.
 */

SessionStore.prototype.__proto__ = Store.prototype;

SessionStore.prototype.loadFromStore = function() {
  var raw = fs.readFileSync( __dirname + '/' + CONFIG.filename, 'utf8' );
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


/**
 * Attempt to fetch session by the given `sid`.
 *
 * @param {String} sid
 * @param {Function} fn
 * @api public
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

/**
 * Commit the given `sess` object associated with the given `sid`.
 *
 * @param {String} sid
 * @param {Session} sess
 * @param {Function} fn
 * @api public
 */

SessionStore.prototype.set = function(sid, sess, fn){
  var self = this;
  process.nextTick(function(){
    self.sessions[sid] = JSON.stringify(sess);
    self.saveToStore();
    fn && fn();
  });
};

/**
 * Destroy the session associated with the given `sid`.
 *
 * @param {String} sid
 * @api public
 */

SessionStore.prototype.destroy = function(sid, fn){
  var self = this;
  process.nextTick(function(){
    delete self.sessions[sid];
    self.saveToStore();
    fn && fn();
  });
};

/**
 * Invoke the given callback `fn` with all active sessions.
 *
 * @param {Function} fn
 * @api public
 */

SessionStore.prototype.all = function(fn){
  var arr = []
    , keys = Object.keys(this.sessions);
  for (var i = 0, len = keys.length; i < len; ++i) {
    arr.push(this.sessions[keys[i]]);
  }
  fn(null, arr);
};

/**
 * Clear all sessions.
 *
 * @param {Function} fn
 * @api public
 */

SessionStore.prototype.clear = function(fn){
  this.sessions = {};
  fn && fn();
};

/**
 * Fetch number of sessions.
 *
 * @param {Function} fn
 * @api public
 */

SessionStore.prototype.length = function(fn){
  fn(null, Object.keys(this.sessions).length);
};
