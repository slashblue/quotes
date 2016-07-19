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

echo "Building app $APP_VERSION / $BUILD_VERSION"
electron-packager . "Quotes" --platform=darwin --arch=x64 --app-version="$APP_VERSION" --build-version="$BUILD_VERSION" --icon ./img/logo.icns

if [ -f Quotes-darwin-x64/Quotes.app/Contents/Resources/electron.icns ]; then
	echo "Replacing icon ..."
	cp ./img/icon.icns Quotes-darwin-x64/Quotes.app/Contents/Resources/electron.icns
fi

#electron-packager . "Quotes" --platform=win32 --arch=x64 --app-version="$APP_VERSION" --build-version="$BUILD_VERSION" --icon ./img/logo.ico