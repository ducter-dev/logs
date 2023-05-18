import { boot } from "quasar/wrappers";
import { useIntervalFn } from "@vueuse/core";

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  const { pause, resume, isActive } = useIntervalFn(() => {
    console.log("el job master se esta ejecutando cada 1000");
  }, 1000);
});
