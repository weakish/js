# My Monorepo Experiment with Git and JavaScript

Just my personal choices:

- ts-check to [check types in JSDoc comments][ts-check]
- eslint with [seven rules][eslint]
- [Prettier] with default configuration
- [lefthook] to run `tsc`, `eslint`, and `prettier` pre-commit hooks
- [0BSD] license
- [no package.json]

[ts-check]: https://mmap.page/dive-into/ts-check/ "Fight for Type Safety. Stand with JavaScript."
[eslint]: https://mmap.page/dive-into/eslint/ "An Optioned Guide to ESLint"
[Prettier]: https://prettier.io
[lefthook]: https://github.com/Arkweid/lefthook/blob/master/docs/node.md
[0BSD]: https://landley.net/toybox/license.html "Why 0BSD?"
[no package.json]: https://mmap.page/dive-into/npm/ "Use npm without package.json"

## Develop

### Dependencies

- git
- Node.js (tested on 12)
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
cd js
make install-deps # install dependencies
make # packaging with ncc
```

## Markdowntation

Serve your documentation with zero-configuration and without client side JavaScript.
Inspired by [GitHub Pages] and [docsify].

[GitHub Pages]: https://pages.github.com/
[docsify]: https://docsify.js.org/

### Features
 Inspired by [GitHub Pages] and [docsify].
- Simple (97 CLOC) and lightweight (1380kB compiled as a single file).
- No statically built html files.
- No JavaScript at client side.
- Zero configuration.

### Usage

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