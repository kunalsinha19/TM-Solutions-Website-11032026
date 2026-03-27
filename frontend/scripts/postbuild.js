const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

const root = path.join(__dirname, "..");
const standaloneRoot = path.join(root, ".next", "standalone");

copyDir(path.join(root, ".next", "static"), path.join(standaloneRoot, ".next", "static"));
copyDir(path.join(root, "public"), path.join(standaloneRoot, "public"));
