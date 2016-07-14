#!/bin/bash

source "./build.conf"

./cleanup.sh

if [ "$1" == "prod" ]; then 

	if [ -z $BUILD_VERSION ]; then
		BUILD_VERSION=1
	else
		BUILD_VERSION=`expr $BUILD_VERSION + 1`
	fi

	if [ -z "$BUILD_VERSION" ]; then
		BUILD_VERSION=1
	fi

	if [ $BUILD_VERSION -le 0 ]; then
		BUILD_VERSION=1
	fi

	echo "BUILD_VERSION=$BUILD_VERSION" > ./build.conf

fi

APP_VERSION=`cat "./package.json" | grep "version" | egrep -o '[0-9]+.[0-9]+.[0-9]+'`

electron-packager . "Quotes" --platform=darwin --arch=x64 --app-version="$APP_VERSION" --build-version="$BUILD_VERSION" --icon ./img/logo.icns

electron-packager . "Quotes" --platform=win32 --arch=x64 --app-version="$APP_VERSION" --build-version="$BUILD_VERSION" --icon ./img/logo.ico