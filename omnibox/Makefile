js:
	deno bundle content_script.js | deno run --allow-net=registry.npmjs.org --allow-read --allow-write=$HOME/.cache/esbuild --allow-run --allow-env --no-check https://deno.land/x/esbuild@v0.14.11/mod.js --minify > content_script.min.js
	deno bundle background.js | deno run --allow-net=registry.npmjs.org --allow-read --allow-write=$HOME/.cache/esbuild --allow-run --allow-env --no-check https://deno.land/x/esbuild@v0.14.11/mod.js --minify > background.min.js
	deno bundle setting.js | deno run --allow-net=registry.npmjs.org --allow-read --allow-write=$HOME/.cache/esbuild --allow-run --allow-env --no-check https://deno.land/x/esbuild@v0.14.11/mod.js --minify > setting.min.js


#
# Chromeエクステンション公開用のzipを作る
#

ZIPFILES=\
	manifest.json \
	background.min.js \
	content_script.min.js \
	setting.min.js \
	setting.html \
	jquery-2.1.4.min.js \
	helpline-16.png \
	helpline-32.png \
	helpline-48.png \
	helpline-96.png \
	helpline-128.png \
	helpline-192.png

MINIFIED_FILES=\
	background.min.js \
	content_script.min.js \
	setting.min.js \

zip: js
	/bin/rm -f helpline.zip
	zip -r helpline.zip ${ZIPFILES}
	/bin/rm ${MINIFIED_FILES}


# all:
#		cd ..; make all
#
# # suggests.jsにヘルプデータを書いておくバージョン
# conv:
#		ruby conv.rb > suggests.js
