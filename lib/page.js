/**

Rendering Pages
================

SIMPLE TEXT
--------------
To put simple text or HTML to a screen:
  
        res.render( { body_text: 'Hello <b>world</b>' } );
    
    
TEMPLATE
---------
To put a specific template (like a form) with variables:
  
        res.render( 'box/form.html', { username: name, phone: phone } );
    
STATUS MESSAGES
-----------------
To ouput specific status messages:
    
        var page = safeharbor.page;
        
        res.outputMessage( page.MESSAGE_LEVELS.warning,
                           'Warning Title',
                           'Some warning text goes here' );
                           
You can have multiple of these output message on the same page. Later,
you can then call res.render() as above. This allows for the following
scenario:
     
            if( onSubmit && (some_error == true) ) 
            {
                // on submit there was some error
                res.outputMessage( page.MESSAGE_LEVELS.error,
                                   'Try again',
                                   'Some error text goes here' );
            }
            
            // on first time render OR error re-submit:
            
            res.render( 'box/form.html', postargs );


STATUS (ONLY) PAGES
---------------------
If all you want to output is the message (no template):
      
            res.outputMessage( page.MESSAGE_LEVELS.success,
                               'Wonderful',
                               'Some happy text goes here' );
                               
            res.render( page.MESSAGE_VIEW, { pageTitle: 'Happy Joy' } );

        
AJAX-STYLE HTML SNIPPETS
--------------------------
To return a snippet of HTML (either as 'body_text', message or template) use 
the same techniques as above but the layout option:
    
            res.render( { layout: page.SNIPPET, 
                          body_text: 'This text is for embedding' } );
        
Also works for templates:
        
            res.render( 'profile/acct_email.html', // <-- template for embedded editing
                         { layout: page.SNIPPET } )
        
@module lib
@submodule page
      
**/
var loginstate = require('./loginstate.js'),
    ROLES      = require('./roles.js'),
    utils      = require('./utils.js');

exports.MESSAGE_VIEW      = // alias for...
exports.BODY_TEXT_VIEW    = 'shared/body_text.html';
exports.DEFAULT_LAYOUT    = 'shared/main.html';
exports.SNIPPET           = 'shared/ajax_html.html';
    
var MESSAGE_LEVELS = exports.MESSAGE_LEVELS = {
    info:     'info',
    success:  'success',
    warning:  'warning',
    danger:   'danger',    // app error
    error:    'error'      // sys error
};

function buildMenu( req, res ) {
    
    var cmds = {};
    
    function cmd( group, url, link, help )
    {
        this.url = url;
        this.link = link;
        this.help = help;
        if(!cmds[group]) { cmds[group] = {}; cmds[group].items = [ ] };
        cmds[group].items.push(this);
    }
    
    var user = loginstate.getUser(req);
    
    new cmd('safeharbor', '/about',   'About', 'Learn about Safe Harbor');
    new cmd('safeharbor', '/learn',   'Learn', 'Learn about your rights and the DMCA');
    new cmd('safeharbor', '/support', 'Support', 'Ask us stuff');
    
    if( user ) 
    {
        new cmd('user', '/dash',           'Dashboard', 'Manage your disputes' );
   //   new cmd('user', '/passwordreset',  'Password reset', 'Change your password');
        new cmd('user', '/account',     'Account settings', 'Change your email and other settings');
        new cmd('user', '/accountdeleter', 'Delete your account', 'hrumph');
        new cmd('user', '/logout',         'Log out', 'bye for now' );
        
        new cmd('site', '/siteeditor','Edit your site properties');

        new cmd('tablinks', '/disputes', 'Past Disputes', 'Your dispute history' );
        new cmd('tablinks', '/form', 'Future Disputes', 'Your dispute future' );
        
        var r = user.role>>>0; // WTF?
        if( r <= ROLES.admin )
        {
            new cmd('admin', '/admin', 'Admin stuff', '' );
            
            if( r == ROLES.developer )
            {
                new cmd('developer', '/dev', 'Developer stuff', '' );
            }
        }
    }
    else
    {
        new cmd( 'user', '/login', 'Login', 'For existing accounts' );
        new cmd( 'user', '/reg',  'Register', 'For creating new accounts' );
        new cmd( 'user', '/lostpassword', 'Lost password', 'For existing, if forgetful accounts');
    }    
    
    return cmds;
}

exports.Message = function( msgLevel, msgTitle, text, opts )
{
    utils.copy( this, opts || {});
    
    this.level = msgLevel;
    this.title = msgTitle;
    this.text  = text;
    if( !this.status )
    {
        switch( this.level )
        {
            case MESSAGE_LEVELS.info:
            case MESSAGE_LEVELS.success:
                this.status = 'ok';
                break;
                
            case MESSAGE_LEVELS.warning:
            case MESSAGE_LEVELS.danger:
            case MESSAGE_LEVELS.error:
                 this.status = '??'; // TODO fill these info
                 break;        
        }
    }
}


exports.setup = function(app) {

    var Handlebars = require('handlebars');

    Handlebars.registerHelper('loggedInStatusClass', function() {
        var isLoggedIn = loginstate.isLoggedIn();
        if( isLoggedIn )
            return('loggedin'); // that's a CSS selector name
        else
            return('loggedout');
    });
    
    Handlebars.registerHelper('contextDumper', function(a) {
        // I haven't figured out if this context blob
        // is a copy or an actual instance of something
        // important and shared, so we remove the 'app'
        // thingy so the dump is managable...
        var app = a.app;
        a.app = null;
        var text = require('util').inspect(a,true,null);
        
        // ...and then restore it just in case someone
        // else was using it
        a.app = app;
        return text;
    });

    app.register('.html', Handlebars);
    app.set('view engine', 'handlebars');
    
    
    app.dynamicHelpers( {
        // these will all be passed to every page...
        user:       function( req, res ) { var  u = loginstate.getUser(req); 
                                           if( u && u.password ) u.password = '****';
                                           return u; },
        isLoggedIn: function( req, res ) { return !!loginstate.getUser(req); },
        isAdmin:    function( req, res ) { var u = loginstate.getUser(req); 
                                            return u && (u.role>>>0 <= ROLES.admin>>>0); },
        menu:       buildMenu, // we should consider not outputting this on Ajax
        messages:   function( req, res ) { return res.sh_output_messages || [ ] }

        } );

    app.use( function setupPage(req,res,next)
        {
            /**
                Override of the express.response.render method
                in order put our application specific standard
                templates into the call stream.
                
                @method render
                @for Response
                @param {string} view Path to template file (relative to './view')
                @param {Object} opts Can include things like body_text, pageTitle
            **/
            var oldRender = res.render;
            res.render = function(view, opts, fn, parent, sub )
            {
                if( typeof view != 'string' )
                {
                    opts = view;
                    view = exports.BODY_TEXT_VIEW;
                }
                
                if( view == exports.BODY_TEXT_VIEW )
                {
                    if( !opts.body_text )
                        opts.body_text = '';
                }
                
                if( !opts.layout )
                {
                    opts.layout = exports.DEFAULT_LAYOUT; 
                }

                if( !opts.bodyClass )
                {
                    try { opts.bodyClass = view.match(/([a-z0-9]+)\/[^\/]+$/)[1]; } catch( e ) { }
                }
                
                res.render = oldRender;
                return res.render(view, opts, fn, parent, sub );
            }

            if( !res.outputMessage )
            {
                /**
                    Call this to setup a message to be ouput during the
                    res.render() call.
                    
                    @method outputMessage
                    @for Response
                    @param {MESSAGE_LEVELS} msgLevel
                    @param {STRING} msgTitle
                    @param {STRING} text
                    @param {Object} [opts]
                **/
                res.outputMessage = function( msgLevel, msgTitle, text, opts ) {
                    if( !res.sh_output_messages )
                        res.sh_output_messages = [ ];
                    res.sh_output_messages.push( new exports.Message(msgLevel,msgTitle,text,opts) );
                    return res;
                }
            }
            next();
        });    
}

exports.countryList = function(selectedElementName){
	var json = [
	{name:"Afghanistan","data-alternative-spellings":"AF افغانستان"}
	,{name:"Åland Islands","data-alternative-spellings":"AX Aaland Aland","data-relevancy-booster":"0.5"}
	,{name:"Albania","data-alternative-spellings":"AL"}
	,{name:"Algeria","data-alternative-spellings":"DZ الجزائر"}
	,{name:"American Samoa","data-alternative-spellings":"AS","data-relevancy-booster":"0.5"}
	,{name:"Andorra","data-alternative-spellings":"AD","data-relevancy-booster":"0.5"}
	,{name:"Angola","data-alternative-spellings":"AO"}
	,{name:"Anguilla","data-alternative-spellings":"AI","data-relevancy-booster":"0.5"}
	,{name:"Antarctica","data-alternative-spellings":"AQ","data-relevancy-booster":"0.5"}
	,{name:"Antigua And Barbuda","data-alternative-spellings":"AG","data-relevancy-booster":"0.5"}
	,{name:"Argentina","data-alternative-spellings":"AR"}
	,{name:"Armenia","data-alternative-spellings":"AM Հայաստան"}
	,{name:"Aruba","data-alternative-spellings":"AW","data-relevancy-booster":"0.5"}
	,{name:"Australia","data-alternative-spellings":"AU","data-relevancy-booster":"1.5"}
	,{name:"Austria","data-alternative-spellings":"AT Österreich Osterreich Oesterreich "}
	,{name:"Azerbaijan","data-alternative-spellings":"AZ"}
	,{name:"Bahamas","data-alternative-spellings":"BS"}
	,{name:"Bahrain","data-alternative-spellings":"BH البحرين"}
	,{name:"Bangladesh","data-alternative-spellings":"BD বাংলাদেশ","data-relevancy-booster":"2"}
	,{name:"Barbados","data-alternative-spellings":"BB"}
	,{name:"Belarus","data-alternative-spellings":"BY Беларусь"}
	,{name:"Belgium","data-alternative-spellings":"BE België Belgie Belgien Belgique","data-relevancy-booster":"1.5"}
	,{name:"Belize","data-alternative-spellings":"BZ"}
	,{name:"Benin","data-alternative-spellings":"BJ"}
	,{name:"Bermuda","data-alternative-spellings":"BM","data-relevancy-booster":"0.5"}
	,{name:"Bhutan","data-alternative-spellings":"BT भूटान"}
	,{name:"Bolivia","data-alternative-spellings":"BO"}
	,{name:"Bonaire,Sint Eustatius and Saba","data-alternative-spellings":"BQ"}
	,{name:"Bosnia and Herzegovina","data-alternative-spellings":"BA Босна и Херцеговина"}
	,{name:"Botswana","data-alternative-spellings":"BW"}
	,{name:"Bouvet Island","data-alternative-spellings":"BV"}
	,{name:"Brazil","data-alternative-spellings":"BR Brasil","data-relevancy-booster":"2"}
	,{name:"British Indian Ocean Territory","data-alternative-spellings":"IO"}
	,{name:"Brunei Darussalam","data-alternative-spellings":"BN"}
	,{name:"Bulgaria","data-alternative-spellings":"BG България"}
	,{name:"Burkina Faso","data-alternative-spellings":"BF"}
	,{name:"Burundi","data-alternative-spellings":"BI"}
	,{name:"Cambodia","data-alternative-spellings":"KH កម្ពុជា"}
	,{name:"Cameroon","data-alternative-spellings":"CM"}
	,{name:"Canada","data-alternative-spellings":"CA","data-relevancy-booster":"2"}
	,{name:"Cape Verde","data-alternative-spellings":"CV Cabo"}
	,{name:"Cayman Islands","data-alternative-spellings":"KY","data-relevancy-booster":"0.5"}
	,{name:"Central African Republic","data-alternative-spellings":"CF"}
	,{name:"Chad","data-alternative-spellings":"TD تشاد‎ Tchad"}
	,{name:"Chile","data-alternative-spellings":"CL"}
	,{name:"China","data-relevancy-booster":"3.5","data-alternative-spellings":"CN Zhongguo Zhonghua Peoples Republic 中国/中华"}
	,{name:"Christmas Island","data-alternative-spellings":"CX","data-relevancy-booster":"0.5"}
	,{name:"Cocos (Keeling) Islands","data-alternative-spellings":"CC","data-relevancy-booster":"0.5"}
	,{name:"Colombia","data-alternative-spellings":"CO"}
	,{name:"Comoros","data-alternative-spellings":"KM جزر القمر"}
	,{name:"Congo","data-alternative-spellings":"CG"}
	,{name:"Congo,the Democratic Republic of the","data-alternative-spellings":"CD Congo-Brazzaville Repubilika ya Kongo"}
	,{name:"Cook Islands","data-alternative-spellings":"CK","data-relevancy-booster":"0.5"}
	,{name:"Costa Rica","data-alternative-spellings":"CR"}
	,{name:"Côte d'Ivoire","data-alternative-spellings":"CI Cote dIvoire"}
	,{name:"Croatia","data-alternative-spellings":"HR Hrvatska"}
	,{name:"Cuba","data-alternative-spellings":"CU"}
	,{name:"Curaçao","data-alternative-spellings":"CW Curacao"}
	,{name:"Cyprus","data-alternative-spellings":"CY Κύπρος Kýpros Kıbrıs"}
	,{name:"Czech Republic","data-alternative-spellings":"CZ Česká Ceska"}
	,{name:"Denmark","data-alternative-spellings":"DK Danmark","data-relevancy-booster":"1.5"}
	,{name:"Djibouti","data-alternative-spellings":"DJ جيبوتي‎ Jabuuti Gabuuti"}
	,{name:"Dominica","data-alternative-spellings":"DM Dominique","data-relevancy-booster":"0.5"}
	,{name:"Dominican Republic","data-alternative-spellings":"DO"}
	,{name:"Ecuador","data-alternative-spellings":"EC"}
	,{name:"Egypt","data-alternative-spellings":"EG","data-relevancy-booster":"1.5"}
	,{name:"El Salvador","data-alternative-spellings":"SV"}
	,{name:"Equatorial Guinea","data-alternative-spellings":"GQ"}
	,{name:"Eritrea","data-alternative-spellings":"ER إرتريا ኤርትራ"}
	,{name:"Estonia","data-alternative-spellings":"EE Eesti"}
	,{name:"Ethiopia","data-alternative-spellings":"ET ኢትዮጵያ"}
	,{name:"Falkland Islands (Malvinas)","data-alternative-spellings":"FK","data-relevancy-booster":"0.5"}
	,{name:"Faroe Islands","data-alternative-spellings":"FO Føroyar Færøerne","data-relevancy-booster":"0.5"}
	,{name:"Fiji","data-alternative-spellings":"FJ Viti फ़िजी"}
	,{name:"Finland","data-alternative-spellings":"FI Suomi"}
	,{name:"France","data-alternative-spellings":"FR République française","data-relevancy-booster":"2.5"}
	,{name:"French Guiana","data-alternative-spellings":"GF"}
	,{name:"French Polynesia","data-alternative-spellings":"PF Polynésie française"}
	,{name:"French Southern Territories","data-alternative-spellings":"TF"}
	,{name:"Gabon","data-alternative-spellings":"GA République Gabonaise"}
	,{name:"Gambia","data-alternative-spellings":"GM"}
	,{name:"Georgia","data-alternative-spellings":"GE საქართველო"}
	,{name:"Germany","data-alternative-spellings":"DE Bundesrepublik Deutschland","data-relevancy-booster":"3"}
	,{name:"Ghana","data-alternative-spellings":"GH"}
	,{name:"Gibraltar","data-alternative-spellings":"GI","data-relevancy-booster":"0.5"}
	,{name:"Greece","data-alternative-spellings":"GR Ελλάδα","data-relevancy-booster":"1.5"}
	,{name:"Greenland","data-alternative-spellings":"GL grønland","data-relevancy-booster":"0.5"}
	,{name:"Grenada","data-alternative-spellings":"GD"}
	,{name:"Guadeloupe","data-alternative-spellings":"GP"}
	,{name:"Guam","data-alternative-spellings":"GU"}
	,{name:"Guatemala","data-alternative-spellings":"GT"}
	,{name:"Guernsey","data-alternative-spellings":"GG","data-relevancy-booster":"0.5"}
	,{name:"Guinea","data-alternative-spellings":"GN"}
	,{name:"Guinea-Bissau","data-alternative-spellings":"GW"}
	,{name:"Guyana","data-alternative-spellings":"GY"}
	,{name:"Haiti","data-alternative-spellings":"HT"}
	,{name:"Heard Island and McDonald Islands","data-alternative-spellings":"HM"}
	,{name:"Holy See (Vatican City State)","data-alternative-spellings":"VA","data-relevancy-booster":"0.5"}
	,{name:"Honduras","data-alternative-spellings":"HN"}
	,{name:"Hong Kong","data-alternative-spellings":"HK 香港"}
	,{name:"Hungary","data-alternative-spellings":"HU Magyarország"}
	,{name:"Iceland","data-alternative-spellings":"IS Island"}
	,{name:"India","data-alternative-spellings":"IN भारत गणराज्य Hindustan","data-relevancy-booster":"3"}
	,{name:"Indonesia","data-alternative-spellings":"ID","data-relevancy-booster":"2"}
	,{name:"Iran,Islamic Republic of","data-alternative-spellings":"IR ایران"}
	,{name:"Iraq","data-alternative-spellings":"IQ العراق‎"}
	,{name:"Ireland","data-alternative-spellings":"IE Éire","data-relevancy-booster":"1.2"}
	,{name:"Isle of Man","data-alternative-spellings":"IM","data-relevancy-booster":"0.5"}
	,{name:"Israel","data-alternative-spellings":"IL إسرائيل ישראל"}
	,{name:"Italy","data-alternative-spellings":"IT Italia","data-relevancy-booster":"2"}
	,{name:"Jamaica","data-alternative-spellings":"JM"}
	,{name:"Japan","data-alternative-spellings":"JP Nippon Nihon 日本","data-relevancy-booster":"2.5"}
	,{name:"Jersey","data-alternative-spellings":"JE","data-relevancy-booster":"0.5"}
	,{name:"Jordan","data-alternative-spellings":"JO الأردن"}
	,{name:"Kazakhstan","data-alternative-spellings":"KZ Қазақстан Казахстан"}
	,{name:"Kenya","data-alternative-spellings":"KE"}
	,{name:"Kiribati","data-alternative-spellings":"KI"}
	,{name:"Korea,Democratic People's Republic of","data-alternative-spellings":"KP North Korea"}
	,{name:"Korea,Republic of","data-alternative-spellings":"KR South Korea","data-relevancy-booster":"1.5"}
	,{name:"Kuwait","data-alternative-spellings":"KW الكويت"}
	,{name:"Kyrgyzstan","data-alternative-spellings":"KG Кыргызстан"}
	,{name:"Lao People's Democratic Republic","data-alternative-spellings":"LA"}
	,{name:"Latvia","data-alternative-spellings":"LV Latvija"}
	,{name:"Lebanon","data-alternative-spellings":"LB لبنان"}
	,{name:"Lesotho","data-alternative-spellings":"LS"}
	,{name:"Liberia","data-alternative-spellings":"LR"}
	,{name:"Libyan Arab Jamahiriya","data-alternative-spellings":"LY ليبيا"}
	,{name:"Liechtenstein","data-alternative-spellings":"LI"}
	,{name:"Lithuania","data-alternative-spellings":"LT Lietuva"}
	,{name:"Luxembourg","data-alternative-spellings":"LU"}
	,{name:"Macao","data-alternative-spellings":"MO"}
	,{name:"Macedonia,The Former Yugoslav Republic Of","data-alternative-spellings":"MK Македонија"}
	,{name:"Madagascar","data-alternative-spellings":"MG Madagasikara"}
	,{name:"Malawi","data-alternative-spellings":"MW"}
	,{name:"Malaysia","data-alternative-spellings":"MY"}
	,{name:"Maldives","data-alternative-spellings":"MV"}
	,{name:"Mali","data-alternative-spellings":"ML"}
	,{name:"Malta","data-alternative-spellings":"MT"}
	,{name:"Marshall Islands","data-alternative-spellings":"MH","data-relevancy-booster":"0.5"}
	,{name:"Martinique","data-alternative-spellings":"MQ"}
	,{name:"Mauritania","data-alternative-spellings":"MR الموريتانية"}
	,{name:"Mauritius","data-alternative-spellings":"MU"}
	,{name:"Mayotte","data-alternative-spellings":"YT"}
	,{name:"Mexico","data-alternative-spellings":"MX Mexicanos","data-relevancy-booster":"1.5"}
	,{name:"Micronesia,Federated States of","data-alternative-spellings":"FM"}
	,{name:"Moldova,Republic of","data-alternative-spellings":"MD"}
	,{name:"Monaco","data-alternative-spellings":"MC"}
	,{name:"Mongolia","data-alternative-spellings":"MN Mongγol ulus Монгол улс"}
	,{name:"Montenegro","data-alternative-spellings":"ME"}
	,{name:"Montserrat","data-alternative-spellings":"MS","data-relevancy-booster":"0.5"}
	,{name:"Morocco","data-alternative-spellings":"MA المغرب"}
	,{name:"Mozambique","data-alternative-spellings":"MZ Moçambique"}
	,{name:"Myanmar","data-alternative-spellings":"MM"}
	,{name:"Namibia","data-alternative-spellings":"NA Namibië"}
	,{name:"Nauru","data-alternative-spellings":"NR Naoero","data-relevancy-booster":"0.5"}
	,{name:"Nepal","data-alternative-spellings":"NP नेपाल"}
	,{name:"Netherlands","data-alternative-spellings":"NL Holland Nederland","data-relevancy-booster":"1.5"}
	,{name:"New Caledonia","data-alternative-spellings":"NC","data-relevancy-booster":"0.5"}
	,{name:"New Zealand","data-alternative-spellings":"NZ Aotearoa"}
	,{name:"Nicaragua","data-alternative-spellings":"NI"}
	,{name:"Niger","data-alternative-spellings":"NE Nijar"}
	,{name:"Nigeria","data-alternative-spellings":"NG Nijeriya Naíjíríà","data-relevancy-booster":"1.5"}
	,{name:"Niue","data-alternative-spellings":"NU","data-relevancy-booster":"0.5"}
	,{name:"Norfolk Island","data-alternative-spellings":"NF","data-relevancy-booster":"0.5"}
	,{name:"Northern Mariana Islands","data-alternative-spellings":"MP","data-relevancy-booster":"0.5"}
	,{name:"Norway","data-alternative-spellings":"NO Norge Noreg","data-relevancy-booster":"1.5"}
	,{name:"Oman","data-alternative-spellings":"OM عمان"}
	,{name:"Pakistan","data-alternative-spellings":"PK پاکستان","data-relevancy-booster":"2"}
	,{name:"Palau","data-alternative-spellings":"PW","data-relevancy-booster":"0.5"}
	,{name:"Palestinian Territory,Occupied","data-alternative-spellings":"PS فلسطين"}
	,{name:"Panama","data-alternative-spellings":"PA"}
	,{name:"Papua New Guinea","data-alternative-spellings":"PG"}
	,{name:"Paraguay","data-alternative-spellings":"PY"}
	,{name:"Peru","data-alternative-spellings":"PE"}
	,{name:"Philippines","data-alternative-spellings":"PH Pilipinas","data-relevancy-booster":"1.5"}
	,{name:"Pitcairn","data-alternative-spellings":"PN","data-relevancy-booster":"0.5"}
	,{name:"Poland","data-alternative-spellings":"PL Polska","data-relevancy-booster":"1.25"}
	,{name:"Portugal","data-alternative-spellings":"PT Portuguesa","data-relevancy-booster":"1.5"}
	,{name:"Puerto Rico","data-alternative-spellings":"PR"}
	,{name:"Qatar","data-alternative-spellings":"QA قطر"}
	,{name:"Réunion","data-alternative-spellings":"RE Reunion"}
	,{name:"Romania","data-alternative-spellings":"RO Rumania Roumania România"}
	,{name:"Russian Federation","data-alternative-spellings":"RU Rossiya Российская Россия","data-relevancy-booster":"2.5"}
	,{name:"Rwanda","data-alternative-spellings":"RW"}
	,{name:"Saint Barthélemy","data-alternative-spellings":"BL St. Barthelemy"}
	,{name:"Saint Helena","data-alternative-spellings":"SH St."}
	,{name:"Saint Kitts and Nevis","data-alternative-spellings":"KN St."}
	,{name:"Saint Lucia","data-alternative-spellings":"LC St."}
	,{name:"Saint Martin (French Part)","data-alternative-spellings":"MF St."}
	,{name:"Saint Pierre and Miquelon","data-alternative-spellings":"PM St."}
	,{name:"Saint Vincent and the Grenadines","data-alternative-spellings":"VC St."}
	,{name:"Samoa","data-alternative-spellings":"WS"}
	,{name:"San Marino","data-alternative-spellings":"SM"}
	,{name:"Sao Tome and Principe","data-alternative-spellings":"ST"}
	,{name:"Saudi Arabia","data-alternative-spellings":"SA السعودية"}
	,{name:"Senegal","data-alternative-spellings":"SN Sénégal"}
	,{name:"Serbia","data-alternative-spellings":"RS Србија Srbija"}
	,{name:"Seychelles","data-alternative-spellings":"SC","data-relevancy-booster":"0.5"}
	,{name:"Sierra Leone","data-alternative-spellings":"SL"}
	,{name:"Singapore","data-alternative-spellings":"SG Singapura  சிங்கப்பூர் குடியரசு 新加坡共和国"}
	,{name:"Sint Maarten (Dutch Part)","data-alternative-spellings":"SX"}
	,{name:"Slovakia","data-alternative-spellings":"SK Slovenská Slovensko"}
	,{name:"Slovenia","data-alternative-spellings":"SI Slovenija"}
	,{name:"Solomon Islands","data-alternative-spellings":"SB"}
	,{name:"Somalia","data-alternative-spellings":"SO الصومال"}
	,{name:"South Africa","data-alternative-spellings":"ZA RSA Suid-Afrika"}
	,{name:"South Georgia and the South Sandwich Islands","data-alternative-spellings":"GS"}
	,{name:"South Sudan","data-alternative-spellings":"SS"}
	,{name:"Spain","data-alternative-spellings":"ES España","data-relevancy-booster":"2"}
	,{name:"Sri Lanka","data-alternative-spellings":"LK ශ්‍රී ලංකා இலங்கை Ceylon"}
	,{name:"Sudan","data-alternative-spellings":"SD السودان"}
	,{name:"Suriname","data-alternative-spellings":"SR शर्नम् Sarnam Sranangron"}
	,{name:"Svalbard and Jan Mayen","data-alternative-spellings":"SJ","data-relevancy-booster":"0.5"}
	,{name:"Swaziland","data-alternative-spellings":"SZ weSwatini Swatini Ngwane"}
	,{name:"Sweden","data-alternative-spellings":"SE Sverige","data-relevancy-booster":"1.5"}
	,{name:"Switzerland","data-alternative-spellings":"CH Swiss Confederation Schweiz Suisse Svizzera Svizra","data-relevancy-booster":"1.5"}
	,{name:"Syrian Arab Republic","data-alternative-spellings":"SY Syria سورية"}
	,{name:"Taiwan,Province of China","data-alternative-spellings":"TW 台灣 臺灣"}
	,{name:"Tajikistan","data-alternative-spellings":"TJ Тоҷикистон Toçikiston"}
	,{name:"Tanzania,United Republic of","data-alternative-spellings":"TZ"}
	,{name:"Thailand","data-alternative-spellings":"TH ประเทศไทย Prathet Thai"}
	,{name:"Timor-Leste","data-alternative-spellings":"TL"}
	,{name:"Togo","data-alternative-spellings":"TG Togolese"}
	,{name:"Tokelau","data-alternative-spellings":"TK","data-relevancy-booster":"0.5"}
	,{name:"Tonga","data-alternative-spellings":"TO"}
	,{name:"Trinidad and Tobago","data-alternative-spellings":"TT"}
	,{name:"Tunisia","data-alternative-spellings":"TN تونس"}
	,{name:"Turkey","data-alternative-spellings":"TR Türkiye Turkiye"}
	,{name:"Turkmenistan","data-alternative-spellings":"TM Türkmenistan"}
	,{name:"Turks and Caicos Islands","data-alternative-spellings":"TC","data-relevancy-booster":"0.5"}
	,{name:"Tuvalu","data-alternative-spellings":"TV","data-relevancy-booster":"0.5"}
	,{name:"Uganda","data-alternative-spellings":"UG"}
	,{name:"Ukraine","data-alternative-spellings":"UA Ukrayina Україна"}
	,{name:"United Arab Emirates","data-alternative-spellings":"AE UAE الإمارات"}
	,{name:"United Kingdom","data-alternative-spellings":"GB Great Britain England UK Wales Scotland Northern Ireland","data-relevancy-booster":"2.5"}
	,{name:"United States","data-relevancy-booster":"3.5","data-alternative-spellings":"US USA United States of America"}
	,{name:"United States Minor Outlying Islands","data-alternative-spellings":"UM"}
	,{name:"Uruguay","data-alternative-spellings":"UY"}
	,{name:"Uzbekistan","data-alternative-spellings":"UZ Ўзбекистон O'zbekstan O‘zbekiston"}
	,{name:"Vanuatu","data-alternative-spellings":"VU"}
	,{name:"Venezuela","data-alternative-spellings":"VE"}
	,{name:"Vietnam","data-alternative-spellings":"VN Việt Nam","data-relevancy-booster":"1.5"}
	,{name:"Virgin Islands,British","data-alternative-spellings":"VG","data-relevancy-booster":"0.5"}
	,{name:"Virgin Islands,U.S.","data-alternative-spellings":"VI","data-relevancy-booster":"0.5"}
	,{name:"Wallis and Futuna","data-alternative-spellings":"WF","data-relevancy-booster":"0.5"}
	,{name:"Western Sahara","data-alternative-spellings":"EH لصحراء الغربية"}
	,{name:"Yemen","data-alternative-spellings":"YE اليمن"}
	,{name:"Zambia","data-alternative-spellings":"ZM"}
	,{name:"Zimbabwe","data-alternative-spellings":"ZW"}
	];

	var html = "";
	
	// Provide a "Select Country" leader element, but only if there is no pre-selected item. 
	// This is to prevent users who have previously selected a country from setting an empty country.
	if( !selectedElementName || selectedElementName.length < 1)
		html = '<option value="" selected="selected">Select Country</option>\n';

	json.forEach(function(element, index, array){
		
		var str =  '<option value="' + element.name+'"';
		if( element.name == selectedElementName )
			str += " selected ";
		
		var helper=function(field){
			if( typeof element[field] != "string" ) return("");
			if( element[field].length == 0 ) return("");
			return(" "+field+'="'+element[field]+'" ');
		}

		str += helper("data-alternative-spellings");
		str += helper("data-relevancy-booster");
			
		str += ">"+element.name+"</option>\n";
		
		html += str;
	})

	return(html);

}

