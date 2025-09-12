const rimraf = require("rimraf");
const paths = [
  "node_modules",
  "apps/*/node_modules",
  "libs/*/node_modules",
  "plugins/*/node_modules",
  "apps/*/package-lock.json",
  "libs/*/package-lock.json",
  "plugins/*/package-lock.json"
];

paths.forEach(p => {
  rimraf(p, {}, err => {
    if (err) console.error(err);
  });
});
