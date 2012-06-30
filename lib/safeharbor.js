/**
    The core classes and utilities used by the application
    
@module lib
**/
exports.routes     = require('../routes');
exports.models     = require('../models');
exports.session    = require('./session.js');
exports.page       = require('./page.js');
exports.errors     = require('./error.js');
exports.loginstate = require('./loginstate.js');
exports.utils      = require('./utils.js');
exports.debug      = require('./debug.js');
exports.page       = require('./page.js');

exports.Performer  = require('./performer.js').Performer;


exports.UPDATE_EVENT_NAME = 'APP_VERSION_UPDATE';
