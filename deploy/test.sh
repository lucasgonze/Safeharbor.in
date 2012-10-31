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

function test_for_substring {
	URL=$1
	EXPECTSUBSTRING=$2

	if [ "$3" != "" ]
		then
		POSTDATA="--data $3"
	else
		POSTDATA=
	fi

	set -xv
	curl -v --include $COOKIES $POSTDATA "http://$HOST/$URL" | tee | grep -q "$SUBSTRING"
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

function test_for_http_status {
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
test_for_http_status test/nop 204

# GET should just return the page
test_for_http_status login 200
# POST with wrong password should throw Forbidden
test_for_http_status login 403 'email=wrong&password=wrong'
# POST with right password redirects to your personalized home page
test_for_http_status login 303 'email=lucas@gonze.com&password=abcd' 
# verify that you stayed logged-in across requests
test_for_http_status test/loggedin 204 

# logging out should redirect you to /login on success
test_for_http_status logout 303 'method=post'
# check it in two different ways
test_for_http_status test/loggedout 204
test_for_http_status test/loggedin 302 

# check role "admin"
test_for_http_status login 303 'email=adminuser@safeharbor.in&password=abcd'; test_for_http_status test/admin 204
test_for_http_status login 303 'email=loggedinuser@safeharbor.in&password=abcd'; test_for_http_status test/admin 403

# check error handlers
test_for_http_status test/500 500
test_for_http_status test/404 404
test_for_http_status test/400 400
test_for_http_status test/runtimeException 500

# GET on creating a new site should not cooperate until we actually implement it
test_for_http_status newsite 500

test_for_substring test/alerts "This is an informational message."

echo
echo "======================================================"
echo "Failed test count: $EXITSTATUS"
exit $EXITSTATUS

