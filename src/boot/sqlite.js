import { boot } from "quasar/wrappers";

import sqlite3 from "sqlite3";
console.log(sqlite3);

const db = new sqlite3.Database("threats.db", (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("db opened");
  }
});

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  // something to do
});
