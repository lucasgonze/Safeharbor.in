/* Author:
Lucas Gonze <lucas@gonze.com>
*/

var initValidation = function(){

	/* http://docs.jquery.com/Plugins/Validation#List_of_built-in_Validation_methods */
	$("#reg1form").validate({	
		rules: {
			email: {
				required: true,	
				email: true		
			},
			password: {
				required: true,
				minlength: 4
			},
			confirm: {
				required: true,						
				equalTo: "#password"		
			}	
		}
	});
	
	$("#lostpasswordform").validate({	
		rules: {
			password: {
				required: true,
				minlength: 4
			},
			confirm: {
				required: true,						
				equalTo: "#password"		
			}		
		}	
	});	

	$("form#newsite").validate({	
		rules: {
			sitename: {
				required: true
			},
			domain: {
				required: true
			},
			mailing: {
				required: true,
				minlength: 12
			},
			agentemail: {
				required: true,
				email: true
			}
		}
	});

	$("#loginform").validate({	
		rules: {
			email: {
				required: true,	
				email: true		
			},
			password: {
				required: true,
				minlength: 4
			}	
		}
	});

	$("#passwordresetform").validate({	
		rules: {
			current: {
				required: true,
				minlength: 4
			},	
			newpassword: {
				required: true,
				minlength: 4
			},	
			confirm: {
				equalTo: "#newpassword"	
			}	
		}
	});
	
	$("form#request").validate({	
		rules: {
			page: {
				required: true,
				url: true
			},	
			where: {
				// not required
			},	
			description: {
				required: true
			},	
			email: {
				email: true
			},	
			phone: {
				required: true
			},	
			country: {
				required: true
			},	
			postal: {
				required: true
			},	
			authorized: {
				required: true
			},	
			belief: {
				required: true
			},	
		},
		
		errorElement: "span",
        errorPlacement: function(error, element) { 
			error.appendTo(element.parent());
        }

	});	
	
}

// When you go into an entry field in the takedown request form, show a fairly 
// long and detailed help message. See routes/box-routes.js.
function initContextSensitiveHelp(){
	
	$("#request input, #request textarea").focus(function(){
		$(this).closest(".control-group").addClass("show-block");
	});
	$("#request input, #request textarea").blur(function(){
		$(this).closest(".control-group").removeClass("show-block");
	});

	// the .focus and .blur events above aren't triggered on checkboxes. (except
	// maybe for keyboard nav. fixme: check keyboard nav events).
	$(':checkbox, label.checkbox').hover( 
		function handlerIn(eventObject){
			$(this).closest(".control-group").addClass("show-block");
		} , function handlerOut(eventObject){
			$(this).closest(".control-group").removeClass("show-block");			
		}
	);

	// we don't do this to set focus - the autofocus attr does that. we do this 
	// because the input with autofocus won't get a focus event otherwise, and thus
	// won't show the context sensitive help.
	$("input[autofocus]").focus();

}

// client side JS specific to the takedown request pages at /box/:id 
function initInbox(){
	initContextSensitiveHelp();
	$("button#add-another-work").click(function(){
		console.log("bp");
		var newNode = $(this).closest("fieldset").find("div.control-group").get(0).cloneNode(true);
		newNode.id = "description-"+Math.ceil(Math.random() * 100000000);
		this.parentElement.insertBefore(newNode,this);
	});
}

function initAjaxForms(){

	$('#loginform').submit(function() { 
		
		$.ajax({
			type: 'POST',
			url: '/login',
			data: $("#loginform").serialize(),
			success: function success(data){
				window.location = "/dash";
			},
			error: function err(data){
				$(".hideerroruntilfail").addClass("fail");
				var clearfail = function clearfail(){
					$(".hideerroruntilfail").removeClass("fail");
					$("#loginform input[type=text], #loginform input[type=password]").off('keypress', clearfail);
				};
				$("#loginform input[type=text], #loginform input[type=password]").on('keypress', clearfail);
			}		
		});
		
		return false; 
	}); 

}

function initTour(){
	
	if( window.location.pathname !== "/demo" && window.location.search.match("autopilot=on") === null )
		return;

	var tourdata = [	
		{
			element: "div#demo0",
			live: 5000,
			html: "Welcome",
			animationIn: 'fadeIn',
			animationOut: 'fadeOut',
			position: "n"
		}, 
		{
			html: "Click the caption block to pause, stop, or skip.",
			element: "div#demo0",
			position: "n"
		}, 
		{
			html: "Please set your browser to full-screen mode.",
			element: "div#demo10 img.tgt",
			position: "nw",
			live: 10000,
			goTo: null
		}
		, {
			html: 'Imagine a web site that hosts content uploaded by its user community. As an example we will use <a href="http://etsy.com">Etsy</a>.',
			element: "div#demo20",
			goTo: null
		}
		, {
			html: "The site has posted a link for copyright complaints.",
			element: "div#demo30"
		}
		, {
			html: "When the site's link is activated, it goes to a page of static legal text.",
			position: "w",
			element: "div#demo40 img"
		}
		, {
			html: "Our web app replaces the text.",
			element: "div#demo50 div.show",
			position: "w",
			goTo: "/box/3416a75f4cea9109507cacd8e2f2aefc?autopilot=on",
		}
		, {
			html: "Human-friendly navigation",
			element: "div#splash",
			position: "n"
		}
		, {
			html: "Education",
			element: "a#learnmorebutton",
			position: "n",
			goTo: "/box/help/learn/3416a75f4cea9109507cacd8e2f2aefc?autopilot=on"
		}
		, {	
			overlayOpacity: false,
			element: "li#Q7 h4",
			position: "e",
			html: "Prevent complaints that aren't about copyright."
		}
		, {		
			element: "li#Q5 h4",
			overlayOpacity: false,
			html: "Pre-written answers to standard questions.",
			position: "e",
			goTo: "/box/3416a75f4cea9109507cacd8e2f2aefc?autopilot=on"
		}, {
			element: "img.sitelogo",
			position: "e",
			html: "Easy customization: just set logo."
		}, {
			element: "#haslowerborder a",
			position: "s",
			html: "Prevent frivolous complaints by setting serious tone."
		}, {
			html: "And all this is BEFORE the main act.",
			element: "a#submitbutton",
			position: "n",
			goTo: "/box/role/3416a75f4cea9109507cacd8e2f2aefc?autopilot=on"
		}, {
			html: "Prevent common causes of bogus complaints.",
			element: "a#authorizedagent",
			goTo: "/box/form/3416a75f4cea9109507cacd8e2f2aefc?autopilot=on&person-type=co"
		}, {
			html: "Usability instead of legalese"
		}, {
			element: "input#anchor",
			position: "e",
			html: "Make it easy to figure out what the notification is in regard to."
		}, {
			element: "button#report_another",
			position: "e",
			html: "Multiple notifications per submission: less work and fewer mistakes."
		}, {
			element: "div#legalrequiredfields",
			position: "n",
			html: "Big type makes copyright owners relaxed instead of mad."
		}, {
			element: "div.row.bottom",
			position: "n",
			html: "A copyright owner must be able to bypass the form, but bypassing the form is more work for the web site. We channel copyright owners into the form by putting the bypass link after the form.",
			goTo: "/box/bymail/3416a75f4cea9109507cacd8e2f2aefc?autopilot=on"
		}, {
			html: "Sites often leave one of these pieces of contact information out, and they are all required by law."
		}
	];
	
	var debugdata = null;
	debugdata = [		
		{
			html: "debug step 1",
			live: 1,
			goTo: "/box/bymail/3416a75f4cea9109507cacd8e2f2aefc?autopilot=on"
		} 
		, {
			html: "Sites often leave one of these pieces of contact information out, and they are all required by law."
		}		
	];
	
//	tourdata = debugdata;

/*	
	background opacity down
	screenshots bigger
	money shot much more clear, bigger, 
	*/
	
	var myTour = jTour(tourdata,{
			showControls: true,
			showProgress: true,
			autostart: true,
			overlayOpacity: .25,
			expose: true
		});
	myTour.start();
}

$(document).ready(function() {
        initValidation();       
        initInbox();
        initAjaxForms();
        initTour();
});



