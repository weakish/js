const fs = require("fs");
const path = require("path");
const express = require("express");
const marked = require("marked");
const hljs = require("highlight.js");

const server = express();

server.options("/*", async (_, res) => {
  res.set("Allow", "OPTIONS, GET").end();
});

/** @type{function(string): string?} */
const indexPage = dir => {
  const indexPath = path.join(dir, "index.md");
  const readmePath = path.join(dir, "README.md");
  if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
    return indexPath;
  } else if (fs.existsSync(readmePath) && fs.statSync(readmePath).isFile()) {
    return readmePath;
  } else {
    return null;
  }
};

/** @type{function(string, string): string} */
const htmlTemplate = (filePath, markdown) => `<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${filePath}</title>
    <link rel="stylesheet" href="https://mmap.page/assets/css/style.css">
    <link rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.17.1/build/styles/default.min.css">
</head>
<body>
  <div class="container-lg px-3 my-5 markdown-body">

    ${markdown}
    <div class="footer border-top border-gray-light mt-5 pt-3 text-gray">
        <p>
        Powered by <a href="https://expressjs.com">express</a> and <a href="https://marked.js.org">marked</a>.
        </p>
        <p>
        This site does not use cookies or tracking codes.
        </p>
        <noscript>
        <p>
        This site does not use JavaScript.
        </p>
        </noscript>
    </div>
  </div>
</body>
</html>`;

/** @type{function(string, string): string} */
const highlight = (code, lang) => {
  if (hljs.getLanguage(lang) === undefined) {
    return hljs.highlightAuto(code).value;
  } else {
    return hljs.highlight(lang, code).value;
  }
};

/** @type{function(string, './' | '../'): string} */
// Because `/a/b/` may route to `/a/b/README.md` or `/a/b.md`,
// we will prepend `../` or `./` to avoid broken relative links.
const markdownify = (filePath, baseUrl) =>
  htmlTemplate(
    filePath,
    marked(fs.readFileSync(filePath, "utf-8"), { baseUrl, highlight })
  );

server.get("/", (_, res) => {
  const index = indexPage("");
  if (index === null) {
    res
      .status(404)
      .send("There is no README.md or index.md file under this directory!");
  } else {
    res.send(markdownify(index, "./"));
  }
});

server.get("/*", (req, res) => {
  const filePath = req.path.substring(1);
  if (fs.existsSync(filePath)) {
    if (fs.statSync(filePath).isDirectory()) {
      const index = indexPage(filePath);
      if (index === null) {
        res.sendStatus(404);
      } else {
        res.send(markdownify(index, "./"));
      }
    } else if (fs.statSync(filePath).isFile()) {
      res.sendFile(path.join(__dirname, filePath));
    } else {
      res.sendStatus(404);
    }
  } else {
    const mdPath = filePath.substring(0, filePath.length - 1) + ".md";
    if (fs.existsSync(mdPath) && fs.statSync(mdPath).isFile()) {
      res.send(markdownify(mdPath, "../"));
    } else {
      res.sendStatus(404);
    }
  }
});

server.listen(3000, () => console.log("server listening on 3000"));
