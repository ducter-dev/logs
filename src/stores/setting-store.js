import { defineStore } from "pinia";

export const useSettingStore = defineStore("settings", {
  state: () => ({
    url: null,
    token: null,
    serial: null,
    version: null,
  }),
  getters: {
    getCurrentData(state) {
      return {
        url: state.url,
        token: state.token,
        serial: state.serial,
        version: state.version,
      };
    },
  },
  actions: {
    setConfigDetails(form) {
      this.$state.url = form.url;
      this.$state.token = form.token;
      this.$state.serial = form.serial;
      this.$state.version = form.version;
    },
    clearConfig() {
      this.$state.url = null;
      this.$state.token = null;
      this.$state.serial = null;
      this.$state.version = null;
    },
  },
  persist: true,
});
