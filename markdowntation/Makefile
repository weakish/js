dist/index.js: index.js
	@cat package-lock.json | jq '.dependencies[].resolved' | xargs npm i --no-package-lock
	ncc build index.js --minify

cloc:
	@scc --no-cocomo --no-complexity index.js