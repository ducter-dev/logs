import { boot } from "quasar/wrappers";

import Dexie from "dexie";

const db = new Dexie("threats");

db.version(1).stores({
  threat:
    "++id, name, category, level, textLevel, action, comments, detectedDate, from, to,recurrent",
  policy:
    "++id, date, rcvdbyte, sentbyte, bytes, rcvdbyteGB, sentbyteGB, bytesGB,from,to",
});
// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app }) => {
  app.config.globalProperties.$db = db;
});

export { db };
