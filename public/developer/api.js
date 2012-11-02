YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "CODES",
        "ModelPerformer",
        "Performer",
        "Response",
        "table"
    ],
    "modules": [
        "lib",
        "page"
    ],
    "allModules": [
        {
            "displayName": "lib",
            "name": "lib",
            "description": "The core classes and utilities used by the application"
        },
        {
            "displayName": "page",
            "name": "page",
            "description": "Rendering Pages\n================\nSIMPLE TEXT\n--------------\nTo put simple text or HTML to a screen:\n  \n        res.render( { body_text: 'Hello <b>world</b>' } );\n    \n    \nTEMPLATE\n---------\nTo put a specific template (like a form) with variables:\n  \n        res.render( 'inbox/form.html', { username: name, phone: phone } );\n    \nSTATUS MESSAGES\n-----------------\nTo ouput specific status messages:\n    \n        var page = safeharbor.page;\n        \n        res.outputMessage( page.MESSAGE_LEVELS.warning,\n                           'Warning Title',\n                           'Some warning text goes here' );\n                           \nYou can have multiple of these output message on the same page. Later,\nyou can then call res.render() as above. This allows for the following\nscenario:\n     \n            if( onSubmit && (some_error == true) ) \n            {\n                // on submit there was some error\n                res.outputMessage( page.MESSAGE_LEVELS.error,\n                                   'Try again',\n                                   'Some error text goes here' );\n            }\n            \n            // on first time render OR error re-submit:\n            \n            res.render( 'inbox/form.html', postargs );\nSTATUS (ONLY) PAGES\n---------------------\nIf all you want to output is the message (no template):\n      \n            res.outputMessage( page.MESSAGE_LEVELS.success,\n                               'Wonderful',\n                               'Some happy text goes here' );\n                               \n            res.render( page.MESSAGE_VIEW, { pageTitle: 'Happy Joy' } );\n        \nAJAX-STYLE HTML SNIPPETS\n--------------------------\nTo return a snippet of HTML (either as 'body_text', message or template) use \nthe same techniques as above but the layout option:\n    \n            res.render( { layout: page.SNIPPET, \n                          body_text: 'This text is for embedding' } );\n        \nAlso works for templates:\n        \n            res.render( 'profile/acct_email.html', // <-- template for embedded editing\n                         { layout: page.SNIPPET } )"
        }
    ]
} };
});