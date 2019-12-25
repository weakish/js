all: dist/markdowntation/index.js dist/loom/index.js

dist/markdowntation/index.js: markdowntation/markdowntation.js
	ncc build markdowntation/markdowntation.js --minify --out dist/markdowntation
	cp dist/markdowntation/index.js dist/markdowntation.js

dist/loom/index.js: loom/loom.js
	ncc build loom/loom.js --minify --out dist/loom
	cp dist/loom/index.js dist/loom.js

install-deps:
	@cat ../package-lock.json | jq '.dependencies[].resolved' | xargs npm i --no-package-lock
