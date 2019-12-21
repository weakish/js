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

/**
 * @template T, U
 * @typedef {U & { readonly __TYPE__: T}} Opaque */

/** @typedef {Opaque<'path', string>} Path */
/** @type {function(string): Path} */
const newPath = filePath => {
  if (filePath.includes("\0")) {
    throw new Error("path cannot contain NUL character");
  } else {
    return /** @type Path */ (filePath);
  }
};

/** @type {Path} */
const repo = newPath(path.join(os.homedir(), "loom"));
/** @type {Path} */
const verifyKeyPath = newPath(path.join(repo, ".loom-verify.key"));
/** @type {function(): boolean} */
const hasVerifyKey = () => hasFileOrDirectory(verifyKeyPath, "file");

/** @typedef {Opaque<'verifyKey', string>} VerifyKey */
/** @type {function(string): VerifyKey} */
const newVerifyKey = k => {
  if (/^[0-9a-fA-F]{8}$/.test(k)) {
    return /** @type {VerifyKey} */ (k);
  } else {
    throw new Error("verify key length must be a hex string of length 8");
  }
};
/** @type {function(): VerifyKey} */
const readVerifyKey = () => {
  return newVerifyKey(fs.readFileSync(verifyKeyPath, "utf-8"));
};
/** @type {function(VerifyKey): void} */
const saveVerifyKey = verifyKey => {
  fs.writeFileSync(verifyKeyPath, verifyKey, "utf-8");
};
/** @typedef {Opaque<'encryptKey', string>} EncryptKey */
/** @type {function(string): EncryptKey} */
const newEncryptKey = k => {
  if (/^[0-9a-fA-F]{32}$/.test(k)) {
    return /** @type {EncryptKey} */ (k);
  } else {
    throw new Error("encrypt key length must be a hex string of length 32");
  }
};

/** @typedef {{filePath: Path, needEncryption: boolean}} SourceFile */
/** @type{function(Path, boolean): SourceFile} */
const newSourceFile = (filePath, needEncryption) => ({
  filePath: newPath(path.resolve(filePath)),
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

/** @type {function(string): [EncryptKey, VerifyKey]} */
const genKeyFromPass = pass => {
  /** @type {string} */
  const sha256Hex = crypto
    .createHash("sha256")
    .update(pass)
    .digest("hex");
  /** @type {EncryptKey} */
  const encryptKey = newEncryptKey(sha256Hex.substring(0, 32));
  /** @type {VerifyKey} */
  const verifyKey = newVerifyKey(sha256Hex.substring(56, 64));
  return [encryptKey, verifyKey];
};

/** @type {function(): Promise<EncryptKey>} */
const genEncryptKey = async () => {
  if (hasVerifyKey()) {
    /** @type {prompts.Answers<"passphrase">} */
    const response = await prompts(passphrase);
    /** @type {[EncryptKey, VerifyKey]} */
    const [encryptKey, verifyKey] = genKeyFromPass(response.passphrase);
    /** @type {VerifyKey} */
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
      /** @type {[EncryptKey, VerifyKey]} */
      const [encryptKey, verifyKey] = genKeyFromPass(response.passphrase);
      saveVerifyKey(verifyKey);
      return encryptKey;
    } else {
      console.log("Repeated passphrase does not match. Try again.");
      return genEncryptKey();
    }
  }
};

/** @type {function(SourceFile, Path, EncryptKey): Path?} */
const cpSourceFile = (sourceFile, destDir, key) => {
  /** @type {Path} */
  const sourcePath = sourceFile.filePath;
  if (sourcePath.startsWith(os.homedir())) {
    /** @type {Path} */
    const relativeSourcePath = newPath(path.relative(os.homedir(), sourcePath));
    /** @type {Path} */
    const dest = newPath(path.join(destDir, relativeSourcePath));
    makeDir.sync(path.dirname(dest));
    if (sourceFile.needEncryption) {
      /** @type {Encryptor} */
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

/** @type {function(string[]): Path?} */
const pickOnePath = candidates => {
  if (candidates.length === 1) {
    return newPath(candidates[0]);
  } else {
    return null;
  }
};

/** @type {function(): SourceFile[]} */
const firefoxLockwise = () => {
  /** @type{string} */
  const dotFirefox = path.join(os.homedir(), ".mozilla", "firefox");
  /** @type{string[]} */
  const loginsCandidates = globby.sync(`${dotFirefox}/*.default/logins.json`); // ignore nightly etc.
  /** @type{string[]} */
  const key4Candidates = globby.sync(`${dotFirefox}/*.default/key4.db`);

  /** @type {Path?} */
  const logins = pickOnePath(loginsCandidates);
  /** @type {Path?} */
  const key4 = pickOnePath(key4Candidates);
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

/** @type{function(Path, 'file' | 'directory'): boolean} */
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

/** @type {function(): boolean} */
const hasLoomRepo = () =>
  hasFileOrDirectory(newPath(repo + "/.git"), "directory");

/** @typedef {Opaque<'git-remote', string>} GitRemote */
/** @type {function(string): GitRemote} */
const newGitRemote = url => /** @type {GitRemote} */ (url);

// Assume current username is same as github user name.
/** @type {GitRemote} */
const remoteRepo = newGitRemote(
  `git@github.com:${os.userInfo().username}/loom.git`
);

/** @type {<T>(things: Array<T | null>) => Array<T>} */
const filterOutNull = things => things.filter(thing => thing !== null);

void (async () => {
  try {
    /** @typedef { import("simple-git/promise").SimpleGit } Git */
    /** @type {Git} */
    const git = simpleGit();
    if (!hasLoomRepo()) {
      await git.clone(remoteRepo, repo);
    }
    process.chdir(makeDir.sync(repo));
    git.cwd(repo);
    /** @type {EncryptKey} */
    const encryptKey = await genEncryptKey();
    /** @type {Path[]} */
    const destPaths = filterOutNull(
      firefoxLockwise().map(sourceFile =>
        cpSourceFile(sourceFile, repo, encryptKey)
      )
    );
    await git.add(destPaths);
    await git.add(".loom-verify.key");
    await git.commit(`:new: ${new Date().toISOString()}`);
    await git.push(remoteRepo, "master");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
