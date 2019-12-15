# Markdowntation

Serve your documentation with zero-configuration.
Inspired by [GitHub Pages] and [docsify].

[GitHub Pages]: https://pages.github.com/
[docsify]: https://docsify.js.org/

## Features

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
docs/zh-cn/guide.md   => http://domain.com/zh-cn/guide/
```

### Compile `index.js` from Source

Dependencies:

- Node.js (tested on v10 & v12)
- [ncc](https://github.com/zeit/ncc/)
- GNU make or BSD make

```sh
git clone https://github.com/weakish/js.git
cd js/markdowntation
make
```