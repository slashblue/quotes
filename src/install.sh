#!/bin/bash

BUNDLES="electron appdirectory electron-json-storage jquery jquery-ui jquery.scrollto lodash lowdb winston winston-logrotate zlib"
DEV_BUNDLES="electron-debug electron-prebuilt electron-packager"

for BUNDLE in $BUNDLES; do
	echo "----------------------------------------------------------------------"
	echo "Installing bundle $BUNDLE ..."
	sudo npm install --save $BUNDLE
	sudo npm install -g --save $BUNDLE
done

for BUNDLE in $DEV_BUNDLES; do
	echo "----------------------------------------------------------------------"
	echo "Installing developer bundle $BUNDLE ..."
	sudo npm install --save-dev $BUNDLE
	sudo npm install -g --save-dev $BUNDLE
done