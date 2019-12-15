# Markdowntation

Serve your documentation with zero-configuration and without client side JavaScript.
Inspired by [GitHub Pages] and [docsify].

[GitHub Pages]: https://pages.github.com/
[docsify]: https://docsify.js.org/

## Features
 Inspired by [GitHub Pages] and [docsify].
- Simple (97 CLOC) and lightweight (1380kB compiled as a single file).
- No statically built html files.
- No JavaScript at client side.
- Zero configuration.

## Usage

Download the `index.js` file at GitHub releases page, and put it under your documentation directory with markdown files.
Now just run `node index.js` and you can access your documentation site at http://127.0.0.1:3000

### Matching Routes

Suppose you run `node index.js` under `docs` directory, then:

```
docs/README.md        => http://127.0.0.1:3000
docs/guide.md         => http://127.0.0.1:3000/guide/
docs/zh-cn/README.md  => http://127.0.0.1:3000/zh-cn/
docs/zh-cn/guide.md   => http://127.0.0.1:3000/zh-cn/guide/
```

## Develop

### Dependencies

- git
- Node.js (tested on v10 & v12)
- [ncc](https://github.com/zeit/ncc/)
- GNU make or BSD make
- TypeScript (tested on 3.7) and ESLint
- [Prettier] and [lefthook]
- vscode or any other IDEs/editors supporting ESLint and TypeScript with JSDoc commented types

[Prettier]: https://prettier.io
[lefthook]: https://github.com/Arkweid/lefthook/blob/master/docs/node.md

### Coding

```sh
git clone https://github.com/weakish/js.git
cd js/markdowntation
make # install dependencies and package single file
```
  
- Run `npm i -D package-name` to add new dependencies.
  (Always use `-D` since ncc will package every runtime dependencies,
  thus there is no need to distinguish dependencies and devDependencies.)

- Run `node index.js` to see results.

- Currently this project has no tests.
  Pull requests are welcome.
  Please add the command to run tests in Makefile.
