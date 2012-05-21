/* Author:
Lucas Gonze <lucas@gonze.com>
*/

$(document).ready(function() {
	$("#reg1form").validate({
		
		/* http://docs.jquery.com/Plugins/Validation#List_of_built-in_Validation_methods */
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

});


