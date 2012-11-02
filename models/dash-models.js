var model      = require( './index.js' );
var profile    = require('./profile-models.js');
var debug      = require( '../lib/debug.js' );

var getClient  = require('../models/index.js').getClient;

var ModelPerformer = model.ModelPerformer;
var CODES = exports.CODES = model.CODES;

/********************
 * public           *
 ********************/

exports.appendAuditLog = function( obj, callback )
{
    var sql ='INSERT INTO audit (site, opname, attachment) VALUES ($1,$2,$3) RETURNING auditid';
    return new ModelPerformer( { 
                             parseObj:obj, 
                             names:['siteid','opname','attachment'], 
                             performer: function(){ 
                                this.table.insertSingleRecord(sql); 
                                },
                             callback: function( code, auditid ) {
                                if( code != CODES.SUCCESS )
                                    callback( code, auditid );
                                else
                                    this.auditid = auditid;
                             }
                            });
}

exports.logTakeDownRequest = function( siteIdOrHash, contactInfo, mediaInfo, callback )
{
    function extractValues(body,names)
    {
        var ret = [];
        for( var n in names )
            ret.push(body[names[n]]);
        return ret;
    }
    
    /*
        Log the contact info to get that ID first
    */
    var contactFieldNames = [ "owners_full_name",
                            "full_name",
                            "job_title",
                            "email",
                            "phone",
                            "fax",
                            "postal",
							"signature"
 							];

    var contactSQL = "insert into contact ( " + contactFieldNames.join(', ') + ") values ($1,$2,$3,$4,$5,$6,$7,$8) returning contactid";
    var contactValues = extractValues(contactInfo,contactFieldNames);
    
    var contact = new ModelPerformer( {  callback:  function(code,contactId) {
                                                if( code == CODES.INSERT_SINGLE ) 
                                                    this.contactId = contactId;
                                                else
                                                    callback.apply( this, [code, contactId] );
                                            },
                                         performer: function() { 
                                                this.table.insertSingleRecord(contactSQL,contactValues);} 
                                            } );

    /*
        the 'siteIdOrHash' argument might be a hash of the actual siteid 
        
        now... the truth is, the siteId is going to be there in the chain already
        because of the caller from dash-routes, but we're pretending to ignore that
        (safety first and all that but costly for sure...)
    */
    var eatOK = function(code, err) { if( code != CODES.OK ) callback.apply(this,[code,err]); };
    var siteId = profile.normalizeSiteId( siteIdOrHash, eatOK );
    
    contact.chain( siteId );
    
    /*
        Log the audit trail info next to get that ID
    */
    var auditSQL = 'insert into audit (opname,site,contact) values ($1,$2,$3) returning auditid';
                        
    var audit = new ModelPerformer( {  callback:  function(code,auditId) {
                                                if( code == CODES.INSERT_SINGLE ) 
                                                    this.auditId = auditId;
                                                else
                                                    callback.apply( this, [code, auditId] );
                                            },
                                         performer: function() { 
                                                var siteId  = this.findValue('siteId'),
                                                    contact = this.findValue('contactId'),
                                                    values = [ 'takedownRequest', siteId, contact ];
                                                this.table.insertSingleRecord(auditSQL,values);} 
                                            } 
                                    );

    contact.chain( audit );
    
    /*
        Log each media infringement
    */
    var mediaSQL   = 'insert into media (page,anchor,description,media_url,audit) values ($1,$2,$3,$4,$5)';
    var mediaNames = ['page','anchor','description','media_url'];
    
    for( var i = 0; i < mediaInfo.length; i++ )
    {
        var mediaValues = extractValues( mediaInfo[i], mediaNames );
        
        function getPerformer( values ) {
            return function() {
                var auditId = this.findValue('auditId');
                values.push(auditId);
                this.table.insertSingleRecord(mediaSQL,values);
            }
        }
        
        var media = new ModelPerformer( { callback: callback,
                                      performer: getPerformer(mediaValues) } );
        
        // this will chain it to the end (append)
        contact.chain( media );
    }
    
    return contact;
}

function getTakedownRequests( callback )
{
    var sql2 = 'SELECT * FROM media WHERE audit = $1';                             
    return new ModelPerformer( { 
                callback: callback,
                performer: function() 
                {
                    var rows = this.findValue('allRows'),
                        me = this, 
                        len = rows.length;

                    if( !len )
                    {
                        // is this right?
                        me.callback(CODES.SUCCESS,rows);
                        return;
                    }
                
                    function indexCallback(index,row) {
                        return function(code, trRows) {
                                if( code == CODES.SUCCESS )
                                {
                                    code = CODES.QUERY_ROW;
                                    row.takedownRequests = trRows;
                                }
                                // call the user callback directly 
                                // so we don't trigger a traversal
                                // of the performer chain
                                callback.apply(this,[code,trRows,row]);
                                
                                // TODO: this should be a counter up to 'len'
                                if( index == len - 1 )
                                {
                                    // now call through 'this' so we
                                    // continue down the Performer
                                    // chain
                                    me.callback(CODES.SUCCESS,rows);
                                }
                            }  
                    }
            
                    for( var i = 0; i < len; i++ )
                    {
                        this.table.findAllRows(sql2, [rows[i].auditid], indexCallback(i,rows[i]) );
                    }
                    
                }
            });
}

/*
   LG note 9/19/12: I think the below record will also contain a 'signature' field.

    here's what one record looks like:
    
{  
    acct: 1,
    acctid: 1,
    agentaddress: '7 foo Ln., Bar Park, IL',
    agentemail: 'assoverteakettle.org@gmail.com',
    attachment: '',
    auditid: 9,
    contact: 12,
    contactid: 12,
    creation: Thu, 21 Jun 2012 17:34:59 GMT,
    domain: 'assoverteakettle.org',
    email: 'victor.stodne@gmail.com',
    fax: '888393993',
    formatted_date: 'June 21, 2012',
    full_name: 'Victor Stone',
    job_title: 'copy thug' 
    opname: 'takedownRequest',
    owners_full_name: 'fullNaming',
    password: 'qqqq',
    phone: '5107175153',
    postal: 'aefewfijw aweifjaew few ',
    resetdate: null,
    resetsecret: null,
    site: 40,
    siteid: 40,
    sitename: 'Ass Over Tea Kettle',

    takedownRequests: 
     [ { 
         anchor: 'ch work is be',
         audit: 9,
         description: 'work is being',
         media_url: 'http://somemedia.mp3',
         mediaid: 2,
         page: 'http://localhost.com/inbox/24738',
        }, 
       { 
         anchor: 'page2',
         audit: 9,
         description: 'desc2',
         media_url: 'http://someothermedia.mp3',
         mediaid: 3,
         page: 'http://localhost.net/inbox/24738'
        }
      ],
    
    },
*/
exports.getAuditLog = function( uid, callback )
{
    // TODO: add paging
    
    var sql = 'SELECT *, ' +
              "to_char(creation, 'FMMonth FMDD, YYYY' ) as formatted_date " +
              'FROM audit, site, acct, contact ' +
              'WHERE site    = siteid ' +
              '  AND acct    = acctid ' +
              '  AND contact = contactid ' + 
              '  AND acctid  = $1 ' +
              'ORDER BY audit.creation DESC ';
              
    var AllRows = new ModelPerformer( { values: [uid],
                             performer: function() { this.table.findAllRows(sql); },
                             callback: function( code, rows ) 
                                 {
                                    if( code == CODES.SUCCESS )
                                        this.allRows = rows;
                                    else
                                        callback.apply(this,[code,rows]);
                                 },
                             });

    var subSqlPerformer = getTakedownRequests( callback );
    
    return AllRows.chain( subSqlPerformer );

}

exports.verifyAuditDetailOwner = function( auditId, owner, callback )
{
    var sql = 'SELECT acct FROM site, audit ' +
               'WHERE site = siteid ' +
               'AND   acct = $1 ' +
               'AND   auditid = $2 ';
               
    return new ModelPerformer( {
                           values: [ owner, auditId ],
                           callback: function( code, result ) {
                                // eat OK so performers later in the
                                // chain won't think we're done with
                                // the whole chain
                                if( code != CODES.SUCCESS ) 
                                    callback(code,result)   
                                },
                            performer: function() {
                                this.table.findSingleRecord( sql );
                            } } );
}

exports.getAuditDetail = function( auditId, callback )
{
    
    if( typeof(auditId) == 'function' )
    {
        callback = auditId;
        auditId = 0;
    }
    
    var sql = 'SELECT *, ' +
              "to_char(creation, 'FMMonth FMDD, YYYY' ) as formatted_date " +
              'FROM audit, site, acct, contact ' +
              'WHERE site     = siteid ' +
              '  AND acct     = acctid ' +
              '  AND contact  = contactid ' + 
              '  AND auditid  = $1 ' 
              'ORDER BY audit.creation DESC ';
              
    var audit = new ModelPerformer( { 
                        performer: function() 
                        {
                            var id = auditId || this.findValue('auditId');
                            this.table.findSingleRecord(sql,[id]); 
                        },
                        callback: function( code, row ) 
                        {
                            if( code == CODES.SUCCESS )
                            {
                                this.auditDetail = row;
                                this.allRows = [ row ];
                            }
                            else
                            {
                                callback.apply( this, [code,row] );
                            }
                        },
                    });

    var subSqlPerformer = getTakedownRequests( callback );
    
    return audit.chain( subSqlPerformer );

}

exports.getOpenMedia_correctButBroken = function( uid, callback ){
    
	var sql = ''
		+ 'select '
		+ 'site.sitename, site.sitelogo, site.domain, '
		+ 'media.description, media.media_url, '
		+ 'audit.creation, '
		+ '\'OPEN\' as status, ' // fixme: real actual flag in DB
		+ 'contact.owners_full_name, contact.full_name, contact.job_title, contact.email, contact.phone, contact.fax, contact.postal '
		+ 'from audit, acct, site, media, contact '
		+ 'where '
		+ 'acct.acctid = $1 '
		+ 'and acct.acctid = site.acct '
		+ 'and site.siteid = audit.site '
		+ 'and audit.auditid = media.audit '
		+ 'and audit.contact = contact.contactid ';

	 var AllRows = new ModelPerformer( { 
		values: [uid],
		performer: function() {this.table.findAllRows(sql); },
		callback: function( code, rows ){			
			if( code == CODES.SUCCESS )
			    this.allRows = rows;
			else
			    callback.apply(this,[code,rows]);
		},
    });
	return(AllRows);
}

/*
See getOpenMedia
*/
exports.getClosedMedia = function(params){
	params.closed = true;
	exports.getOpenMedia(params);
}

/*
The getOpenMedia_correctButBroken function was my first attempt at this. I couldn't make it work, though. 
The standard template of these things that Victor set up doesn't seem that hard, but I 
spent most of a day debugging without mastering the complexities and had to move on, 
so I did the naively simple version below, which I'm sure has horrible fatal bugs in wait 
that the Victor approach would have prevented.

params: {
uid: int,
offset: starting row,
limit: rows per fetch,
callback: the callback,
closed: any true value
}
*/
exports.getOpenMedia = function(params){
	
	var closedFlag = "is null ";
	if( params.closed )
		closedFlag = "is not null "
	
	var sql = ''
		+ 'select '
		+ 'site.sitename, site.sitelogo, site.domain, '
		+ 'media.description, media.media_url, '
		+ 'audit.creation, '
		+ 'contact.owners_full_name, contact.full_name, contact.job_title, contact.email, contact.phone, contact.fax, contact.postal '
		+ 'from audit, acct, site, media, contact '
		+ 'where '
		+ 'acct.acctid = $1 '
		+ 'and media.takedown_date '+closedFlag
		+ 'and acct.acctid = site.acct '
		+ 'and site.siteid = audit.site '
		+ 'and audit.auditid = media.audit '
		+ 'and audit.contact = contact.contactid ';

	var query = getClient().query(sql,[params.uid]);

	if( !query ){
		debug.out("(Null query error for sql: ",sql);
		params.callback("Null query error");
		return;
	}

	var gotErr = false;
	query.on('error',function(err){
		debug.out('ERROR',err);
		gotErr = true;
		params.callback(err);
	});

	var rows = [];
	query.on('row',function(data){
		rows.push(data);
	});

	query.on('end',function(data){
		if( !gotErr )
			params.callback(false,rows);
	});
	
}

exports.searchOpenMedia = function(params){
	
	var closedFlag = "is null ";
	if( params.closed )
		closedFlag = "is not null ";
		
	// fixme: prevent problems with nulls in fields using SELECT COALESCE(description, short_description, '(none)') ...
	var sql = 
		"select site.sitename, site.sitelogo, site.domain, media.description, media.media_url, audit.creation, contact.owners_full_name, contact.full_name, contact.job_title, contact.email, contact.phone, contact.fax, contact.postal from audit, acct, site, media, contact"
		+ " where acct.acctid = $1 and media.takedown_date is null and acct.acctid = site.acct and site.siteid = audit.site and audit.auditid = media.audit and audit.contact = contact.contactid"
		+ " and"
		+ " to_tsvector('english',site.sitename||' '||site.sitelogo||' '||site.domain||' '||media.description||' '||media.media_url||' '||audit.creation||' '||contact.owners_full_name||' '||contact.full_name||' '||contact.job_title||' '||contact.email||' '||contact.phone||' '||contact.fax||' '||contact.postal)"
		+ " @@ plainto_tsquery('english',$2)";	

	var query = getClient().query(sql,[params.uid,params.needle]);

	if( !query ){
		debug.out("(Null query error for sql: ",sql);
		params.callback("Null query error");
		return;
	}

	var gotErr = false;
	query.on('error',function(err){
		debug.out('ERROR',err);
		gotErr = true;
		params.callback(err);
	});

	var rows = [];
	query.on('row',function(data){
		rows.push(data);
	});

	query.on('end',function(data){
		if( !gotErr )
			params.callback(false,rows);
	});
	
}

