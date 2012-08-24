#!/bin/bash

# This is not a proper unit test. Yet. For now it's just an ad hoc thing for checking to see what happens when malformed goo is sent the inbox POST.

TGT="http://localhost:5000/box/6c8349cc7260ae62e3b1396831a8398f"
OFN=
FN="John+Doe"
JT=
E=lucas@gonze.com
F=
PH="800+555+1212"
PO="123+Dark+St+Gotham+City"
PG="http://example.com"
AN="Way down in the blog roll"
DE="Let's+Stay+Together"
PT=
AU=
BE=on
PARAMS="owners_full_name=$OFN&full_name=$FN&job_title=$JT&email=$E&fax=$F&phone=$PH&postal=$PO&page=$PG&anchor=$AN&description=$DE&person-type=$PT&authorized=$AU&belief=$BE"
curl -d "$PARAMS" "$TGT"




