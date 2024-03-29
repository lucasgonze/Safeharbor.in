/* Author:
Lucas Gonze <lucas@gonze.com>

*/

var initFocus = function(){

	/* If we are opening a window with #login as the hash, try to put focus on the login form. */
	if( typeof window.location.hash == "string" 
		&& window.location.hash == "#login" ){
			$("form[action=/login] input[name=email]").focus();
		}
	
}

var initValidation = function(){

	/* http://docs.jquery.com/Plugins/Validation#List_of_built-in_Validation_methods */
	
	$("body.corphome form[action='/contact']").validate({	
		rules: {
			email: {
				email: true
			}
		}
	});
	
	
	$("#account_settings_form form").validate({	
		rules: {
			input_email: {
				required: true,
				email: true
			}, 
			new_password: {
				minlength: 4
			},
			confirm_password: {
				equalTo: '#new_password'
			}
		}
	});
	
	$("#website_settings_form form").validate({	
		rules: {
			sitename: { required: true },
			domain: { required: true },
			sitelogo: {url: true},
			agentaddress: { required: true },
			agentemail: {
				required: true,
				email: true
			},
			agentname: { required: true },
			agentphone: { required: true }
		}
	});
		
	/* Items below are from the first-gen code */
	
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
// long and detailed help message. See routes/inbox-routes.js.
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

// client side JS specific to the takedown request pages at /inbox/:id 
function initInbox(){
	initContextSensitiveHelp();
	$("button#add-another-work").click(function(){
		console.log("bp");
		var newNode = $(this).closest("fieldset").find("div.control-group").get(0).cloneNode(true);
		newNode.id = "description-"+Math.ceil(Math.random() * 100000000);
		this.parentElement.insertBefore(newNode,this);
	});

	$("a#add-new-dispute-button").click(function() {
		$("a#add-new-dispute-button").click(function() {
			$.fancybox.open({
				href : '/myinbox?template=no',
				type : 'iframe',
				padding : [20,20,20,20],
				height: 1250,
				width: 916
			});
		});
		return(false)
	});
	
}

function initAccountForm(){
	
	$("#account_settings_form #current_password").keyup( function(event){
		if( $("#account_settings_form #current_password").attr("value").length > 0 )
			$("#account_settings_form form input#new_password").attr("disabled",null);
		else {
			$("#account_settings_form form input#new_password").attr("disabled","disabled");
			$("#account_settings_form form input#confirm_password").attr("disabled","disabled");			
		}
	})
	$("#account_settings_form #new_password").keyup( function(event){
		if( $("#account_settings_form #new_password").attr("value").length > 0 )
			$("#account_settings_form form input#confirm_password").attr("disabled",null);
	})
	$("#account_settings_form form").submit( function(event){
		if( $("#account_settings_form #new_password").attr("value") !=
			$("#account_settings_form form input#confirm_password") ){
				
			}
	})
	
}

function initAjaxForms(){

	$("body.corphome form[action='/contact']").submit(function() { 				
		
		$.ajax({
			type: 'POST',
			url: '/contact',
			data: $("form[action='/contact']").serialize(),
			success: function success(data){				
				alert("success: fixme UX");
			},
			error: function err(data){
				alert("failure: fixme UX");
			}		
		});
		
		return false; 
	}); 

	$('#loginform').submit(function() { 
		
		$.ajax({
			type: 'POST',
			url: '/login',
			data: $("#loginform").serialize(),
			success: function success(data){
				window.location = "/";
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

	$("form[action='/settings']").submit(function() { 				
		
		$.ajax({
			type: 'POST',
			url: '/settings',
			data: $("form[action='/settings']").serialize(),
			success: function success(data){				
				var toggler = function(){
					$("div[class='alert alert-success']").hide();
					$("input[type=text]").off('keypress', toggler);					
				}				
				$("div[class='alert alert-success']").show();
				$("input[type=text]").on('keypress', toggler);
			},
			error: function err(data){
				var toggler = function(){
					$("div[class='alert alert-error']").hide();
					$("input[type=text]").off('keypress', toggler);					
				}				
				$("div[class='alert alert-error']").show();
				$("input[type=text]").on('keypress', toggler);
			}		
		});
		
		return false; 
	}); 

	$("a[href='/logout']").click(function(){
		
		$.ajax({
			type: 'POST',
			url: '/logout',
			success: function success(data){
				window.location.href = "/";
			},
			error: function err(data){
				window.location.href = "/err500"; // fixme: create this URL
			}		
		});
		
		return false; 
		
	});

}

function initTour(){

	var tourdata = 
	[	
		{
			html: "Click the caption block to pause, stop, or skip",
			element: "div#demo0",
			position: "n"
		}, 
		{
			html: "Please set your browser window to fill the screen",
			element: "div#demo10 img.tgt",
			position: "nw",
			overlayOpacity: 0.25,
			live: 10000
		}
		, {
			overlayOpacity: .25,
			html: 'Imagine a web site that hosts content uploaded by its user community. We&apos;ll use <a href="http://etsy.com"><em style="font-weight: bold">Etsy</em></a> as an example.',
			element: "div#demo20 img.tgt",
			position: "e"
		}
		, {
			overlayOpacity: .25,
			html: "Etsy has posted a link for copyright complaints",
			element: "div#demo30 img.demo-tgt",
			position: "e"
		}
		, {
			overlayOpacity: .25,
			html: "When the &ldquo;Copyright&rdquo; link is activated by a copyright owner, they arrive at a page of static legal text",
			position: "w",
			element: "div#demo40 div.show"
		}
		, {
			overlayOpacity: .25,
			html: "Our hosted web form replaces that page of static text",
			element: "div#demo50 div.show",
			position: "w",
			expose: true,
			goTo: "/demo/blank"
		}, 
		
		{
			html: "<div class='goal'><h2>Etsy's Goal</h2> Avoid developing their own DMCA forms.</div>",
			position: "c",
			goTo: "/inbox/a87ff679a2f3e71d9181a67b7542122c"
		}, 
		{
			html: "<div class='goal nop'><h2>Solution</h2> We provide a hosted app. It's the only off-the-shelf package on the market.</div>  ",
			position: "c"
		}, 
		{
			html: "Help for users",
			element: "a#learnmorebutton",
			position: "n"
		}, 
		{
			html: "A tool for editing DMCA requests",
			stubbedout_element: "demo-tgt-1",
			element: "a#submitbutton",
			position: "n"			
		},
		{
			element: "#globalnavhighlight a",
			position: "e",
			offset: 20,
			html: "Simple customization (just set logo image)"
		}, 
		{
			html: "Attractive design conveys quality and makes the customer's site look good",
			element: "span.youarehere",
			position: "n", 
			goTo: "/demo/blank"
		},
		

		{
			html: "<div class='goal'><h2>Etsy's Goal</h2> Save time by preventing invalid complaints and streamlining business processes.</div>",
			position: "c",
			goTo: "/inbox/help/learn/a87ff679a2f3e71d9181a67b7542122c"		
		}, 
		{	
			overlayOpacity: false,
			element: "li#Q7 h4",
			position: "e",
			html: "Prevent complaints that aren't about copyright"
		},
		{		
			element: "li#Q5 h4",
			overlayOpacity: false,
			html: "Pre-written answers to standard questions. Web sites can paste them into emails or just send a link",
			position: "n",
			goTo: "/inbox/role/a87ff679a2f3e71d9181a67b7542122c"
		}, 
		{
			html: "Discourage posters who don't have legal standing",
			element: "div.yourrole",
			position: "e",
			goTo: "/inbox/form/a87ff679a2f3e71d9181a67b7542122c"		
		},
		{
			html: "Copyright owners do the data entry for each request, rather than sending an email or paper mail and having the web site copy details into a form",
			element: "#demo-tgt-1 input[type=text]",
			position: "e",
			expose: true
		},		
		{
			element: "#globalnav a.subtitle",
			position: "s",
			html: "Minimize frivolous complaints by using design to convey the seriousness of the act"
		},
		{
			element: "input#anchor",
			position: "e",
			html: "Help copyright owners describe the problem clearly, so that web sites can understand what they're asking for"
		},
		{
			element: "div#demo-tgt-bypass",
			position: "n",
			html: "Guide copyright owners away from email (and into the form) by showing this <em>Bypass</em> link after the form",
			goTo: "/inbox/bymail/a87ff679a2f3e71d9181a67b7542122c"			
		},
		 {
			html: "When copyright owners do use email instead of the form, help them get it right, so that the web site doesn't have to go back and forth with them",
			element: "p.demo-highlight",
			position: "w",
			goTo: "/demo/blank"
		},


		{
			html: "<div class='goal'><h2>Etsy's Goal</h2> Be a hard target for lawsuits.</div>",
			position: "c",
			goTo: "/inbox/bymail/a87ff679a2f3e71d9181a67b7542122c"
		}, 
		{
			html: "Sites often leave one of these pieces of contact information out, and they are all required by law",
			element: "div#demo-tgt-20",
			position: "e",
			goTo: "/inbox/help/learn/a87ff679a2f3e71d9181a67b7542122c",
		},
		{
			html: "The sophisticated look and thorough feature set of our software says that the web site takes the law seriously",
			element: "h3#demo-tgt-200",
			position: "n",
			goTo: "/demo/blank"
		},


		{
			html: "<div class='goal'><h2>Etsy's Goal</h2> Avoid starting a conflict with copyright owners by providing an efficient notification process.</div>",
			position: "c",
			goTo: "/inbox/form/a87ff679a2f3e71d9181a67b7542122c"		
		}, 
		{
			element: "button#report_another",
			position: "e",
			html: "Allow multiple notifications per submission, which means less work and fewer mistakes"
		}, {
			element: "div#legalrequiredfields",
			position: "e",
			html: "Readable typography makes it easier to fill in the form correctly",
			goTo: "/demo/blank"
		},
		
		{
			html: "Demo complete",
			imageOpacity: "0.25"
		}
		
				
	]; 
		
	/* For debugging */
	nottourdata = [	
		{
			html: "nop",
			goTo: "/demo"
		},

	];
	
	var myTour = jTour(tourdata,{
			keyboardNav: true,
			overlayOpacity: 0,
				expose: true,
			onStart: function(current){console.log("onStart step "+current)},
			onPause: function(current){console.log("onPause step "+current)},
			onPlay: function(current){console.log("onPlay step "+current)},
			onChange: function(current){console.log("onChange step "+current)},
			onStop: function(current){
				console.log("onStop step "+current);
				window.location = "/demo";
			},	
			onFinish: function(current){
				console.log("onFinish step "+current);
				window.location = "/demo?autopilot=off#summary";
			}			
		});

	$("a#start-demo").click(function(){		
		myTour.start();
		return(false);
	});
}

$(document).ready(function() {
	initValidation();       
	initInbox();
	initAjaxForms();
	initTour();
	initAccountForm();
	initFocus();
});



