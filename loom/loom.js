const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
const process = require("process");

const { Encryptor } = require("strong-cryptor");
const globby = require("globby");
const makeDir = require("make-dir");
const prompts = require("prompts");
const simpleGit = require("simple-git/promise");

/** @type {string} */
const repo = path.join(os.homedir(), "loom");
/** @type {string} */
const verifyKeyPath = path.join(repo, ".loom-verify.key");
/** @type {function(): boolean} */
const hasVerifyKey = () => hasFileOrDirectory(verifyKeyPath, "file");
/** @type {function(): string} */
const readVerifyKey = () => {
  return fs.readFileSync(verifyKeyPath, "utf-8");
};
/** @type {function(string): void} */
const saveVerifyKey = verifyKey => {
  fs.writeFileSync(verifyKeyPath, verifyKey, "utf-8");
};

/** @typedef {{filePath: string, needEncryption: boolean}} SourceFile */
/** @type{function(string, boolean): SourceFile} */
const newSourceFile = (filePath, needEncryption) => ({
  filePath: path.resolve(filePath),
  needEncryption
});

/** @typedef {{type: 'password', name: string, message: string}} PasswordPrompt */

/** @type {PasswordPrompt} */
const passphrase = {
  type: "password",
  name: "passphrase",
  message: "Type a passphrase to generate encryption key:"
};

/** @type {PasswordPrompt} */
const repeatedPassphrase = {
  type: "password",
  name: "repeatedPassphrase",
  message: "Type a passphrase to generate encryption key:"
};

/** @type {function(string): [string, string]} */
const genKeyFromPass = pass => {
  const sha256Hex = crypto
    .createHash("sha256")
    .update(pass)
    .digest("hex");
  const encryptKey = sha256Hex.substring(0, 32);
  const verifyKey = sha256Hex.substring(32, 64);
  return [encryptKey, verifyKey];
};

/** @type {function(): Promise<string>} */
const genEncryptKey = async () => {
  if (hasVerifyKey()) {
    /** @type{prompts.Answers<"passphrase">} */
    const response = await prompts(passphrase);
    const [encryptKey, verifyKey] = genKeyFromPass(response.passphrase);
    /** @type{string} */
    const existingVerifyKey = readVerifyKey();
    if (verifyKey === existingVerifyKey) {
      return encryptKey;
    } else {
      console.log(
        "Passphrase dose not match record, probably because of typos. Try again."
      );
      return genEncryptKey();
    }
  } else {
    /** @type {prompts.Answers<"passphrase" | "repeatedPassphrase">} */
    const response = await prompts([passphrase, repeatedPassphrase]);
    if (response.passphrase === response.repeatedPassphrase) {
      const [encryptKey, verifyKey] = genKeyFromPass(response.passphrase);
      saveVerifyKey(verifyKey);
      return encryptKey;
    } else {
      console.log("Repeated passphrase does not match. Try again.");
      return genEncryptKey();
    }
  }
};

/** @type {function(SourceFile, string, string): string?} */
const cpSourceFile = (sourceFile, destDir, key) => {
  /** @type {string} */
  const sourcePath = sourceFile.filePath;
  if (sourcePath.startsWith(os.homedir())) {
    /** @type {string} */
    const relativeSourcePath = path.relative(os.homedir(), sourcePath);
    /** @type {string} */
    const dest = path.join(destDir, relativeSourcePath);
    makeDir.sync(path.dirname(dest));
    /** @type {boolean} */
    if (sourceFile.needEncryption) {
      const encryptor = new Encryptor({ key });
      /** @type {string} */
      const encryptedData = encryptor.encryptFile(sourcePath);
      fs.writeFileSync(dest, encryptedData, "utf-8");
    } else {
      fs.copyFileSync(sourceFile.filePath, dest);
    }
    return dest;
  } else {
    console.error(
      `${sourcePath} is not under home directory. Skip copying this file.`
    );
    return null;
  }
};

/** @type {function(string[]): string?} */
const pickOne = candidates => {
  if (candidates.length === 1) {
    return candidates[0];
  } else {
    return null;
  }
};

/** @type {function(): SourceFile[]} */
const firefoxLockwise = () => {
  /** @type{string} */
  const dotFirefox = path.join(os.homedir(), ".mozilla", "firefox");
  /** @type{string[]} */
  /** @type{string[]} */
  const loginsCandidates = globby.sync(`${dotFirefox}/*.default/logins.json`); // ignore nightly etc.
  /** @type{string[]} */
  const key4Candidates = globby.sync(`${dotFirefox}/*.default/key4.db`);

  /** @type {string?} */
  const logins = pickOne(loginsCandidates);
  /** @type {string?} */
  const key4 = pickOne(key4Candidates);
  if (logins === null) {
    if (key4 === null) {
      return [];
    } else {
      return [newSourceFile(key4, true)];
    }
  } else {
    if (key4 === null) {
      return [newSourceFile(logins, false)];
    } else {
      return [newSourceFile(key4, true), newSourceFile(logins, false)];
    }
  }
};

/** @type{function(string, 'file' | 'directory'): boolean} */
const hasFileOrDirectory = (fileOrDirectoryPath, fileOrDirectory) => {
  if (fs.existsSync(fileOrDirectoryPath)) {
    /** @type{fs.Stats} */
    const f = fs.statSync(fileOrDirectoryPath);
    switch (fileOrDirectory) {
      case "file": {
        if (f.isFile()) {
          return true;
        } else {
          console.error(`${fileOrDirectoryPath} must be a file!`);
          return process.exit(1);
        }
      }
      case "directory": {
        if (f.isDirectory()) {
          return true;
        } else {
          console.error(`${fileOrDirectoryPath} must be a directory!`);
          return process.exit(1);
        }
      }
    }
  } else {
    return false;
  }
};

/** @type{function(): boolean} */
const hasLoomRepo = () => hasFileOrDirectory(repo + "/.git", "directory");

/** @type {<T>(things: Array<T | null>) => Array<T>} */
const filterOutNull = things => things.filter(thing => thing !== null);


void (async () => {
  try {
    process.chdir(makeDir.sync(repo));
    const git = simpleGit(repo);
    if (!hasLoomRepo()) {
      await git.init();
    }
    /** @type {string} */
    const encryptKey = await genEncryptKey();
    /** @type {string[]} */
    const destPaths = filterOutNull(
      firefoxLockwise().map(sourceFile =>
        cpSourceFile(sourceFile, repo, encryptKey)
      )
    );
    await git.add(destPaths);
    await git.commit(`:new: ${new Date().toISOString()}`);
    // git push
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
