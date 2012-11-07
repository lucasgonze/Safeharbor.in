#!/bin/bash

if [ "$1" == "" ]
then
	echo "Missing HOST:PORT argument"
	exit 1
fi

HOST=$1
EXITSTATUS=0

COOKIEFILE=/tmp/cookie.test
COOKIES="--cookie-jar $COOKIEFILE --cookie $COOKIEFILE"
if [ -f $COOKIEFILE ]
	then
	rm $COOKIEFILE
fi

# Are we redirected to a specific target?
function test_redirect_target {
	URL=$1
	TARGET=$2

	if [ "$3" != "" ]
		then
		POSTDATA="--data $3"
	else
		POSTDATA=
	fi

	set -xv
	curl -v --include $COOKIES $POSTDATA "http://$HOST/$URL" | tee | grep "Location:" | grep "$TARGET"
	STATUS=$?
	set +xv
		
	if [ $STATUS == 0 ]
	then
		echo PASS
	else
		echo FAIL $1
		EXITSTATUS=`echo $(($EXITSTATUS + 1))`
		exit $EXITSTATUS
	fi
	echo "******************************************************"	
}

function test_substring {
	URL=$1
	EXPECTSUBSTRING=$2

	if [ "$3" != "" ]
		then
		POSTDATA="--data $3"
	else
		POSTDATA=
	fi

	set -xv
	curl -v --include $COOKIES $POSTDATA "http://$HOST/$URL" | tee | grep -q "$EXPECTSUBSTRING"
	STATUS=$?
	set +xv
		
	if [ $STATUS == 0 ]
	then
		echo PASS
	else
		echo FAIL $1
		EXITSTATUS=`echo $(($EXITSTATUS + 1))`
		exit $EXITSTATUS
	fi
	echo "******************************************************"	
}

function test_http_status {
	URL=$1
	EXPECTSTATUS=$2

	if [ "$3" != "" ]
		then
		POSTDATA="--data $3"
	else
		POSTDATA=
	fi

	set -xv
	curl -v --include $COOKIES $POSTDATA "http://$HOST/$URL" | tee | head -1 | grep $EXPECTSTATUS
	STATUS=$?
	set +xv
		
	if [ $STATUS == 0 ]
	then
		echo PASS
	else
		echo FAIL $1
		EXITSTATUS=`echo $(($EXITSTATUS + 1))`
		exit $EXITSTATUS
	fi
	echo "******************************************************"
}

# baseline
test_http_status test/nop 204

# GET should just return the page
test_http_status login 200
# POST with wrong password should throw Forbidden
test_http_status login 403 'email=wrong&password=wrong'
# POST with right password redirects to your personalized home page
test_http_status login 303 'email=lucas@gonze.com&password=abcd' 
# verify that you stayed logged-in across requests
test_http_status test/loggedin 204 

# logging out should redirect you to / on success
test_http_status logout 303 'method=post'
# check it in two different ways
test_http_status test/loggedout 204
test_http_status test/loggedin 302 

# check role "admin"
test_http_status login 303 'email=adminuser@safeharbor.in&password=abcd'
test_http_status test/admin 204
test_http_status login 303 'email=loggedinuser@safeharbor.in&password=abcd'; test_http_status test/admin 403

# check error handlers
test_http_status test/500 500
test_http_status test/404 404
test_http_status test/400 400
test_http_status test/runtimeException 500

# GET on creating a new site should not cooperate until we actually implement it
test_http_status newsite 500

test_substring test/alerts "This is an informational message."

# Test that that being detoured to force login properly restores the original URL
echo '* Start from a clean slate by logging out'
test_http_status logout 303 'method=post'
echo '* Aim for a URL that will detour if not signed in'
test_http_status myinbox 302
echo '* Sign in and see if we are redirected to the original URL'
test_redirect_target login /myinbox 'email=adminuser@safeharbor.in&password=abcd'

# verify that the /err500 page to always return an application error is indeed returning 500
test_http_status err500 500

echo
echo "======================================================"
echo "Failed test count: $EXITSTATUS"
exit $EXITSTATUS

