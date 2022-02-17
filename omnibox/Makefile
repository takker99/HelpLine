js:
	deno bundle --no-check content_script.ts > content_script.js
	deno bundle --no-check background.ts > background.js
	deno bundle --no-check setting.ts > setting.js


#
# Chromeエクステンション公開用のzipを作る
#

ZIPFILES=\
	manifest.json \
	background.js \
	content_script.js \
	setting.js \
	setting.html \
	helpline-16.png \
	helpline-32.png \
	helpline-48.png \
	helpline-96.png \
	helpline-128.png \
	helpline-192.png

BUNDLED_FILE=\
	background.js \
	content_script.js \
	setting.js \

zip: js
	/bin/rm -f helpline.zip
	zip -r helpline.zip ${ZIPFILES}
	/bin/rm ${BUNDLED_FILE}


# all:
#		cd ..; make all
#
# # suggests.jsにヘルプデータを書いておくバージョン
# conv:
#		ruby conv.rb > suggests.js
