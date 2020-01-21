all: dist/markdowntation/index.js

dist/markdowntation/index.js: markdowntation/markdowntation.js
	ncc build markdowntation/markdowntation.js --minify --out dist/markdowntation
	cp dist/markdowntation/index.js dist/markdowntation.js

install-deps:
	@cat ../package-lock.json | jq '.dependencies[].resolved' | xargs npm i --no-package-lock
