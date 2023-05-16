import { defineStore } from "pinia";

export const useSettingStore = defineStore("settings", {
  state: () => ({
    url: null,
    token: null,
  }),
  getters: {
    getCurrentData(state) {
      return {
        url: state.url,
        token: state.token,
      };
    },
  },
  actions: {
    setConfigDetails(form) {
      this.$state.url = form.url;
      this.$state.token = form.token;
    },
    clearConfig() {
      this.$state.url = null;
      this.$state.token = null;
    },
  },
  persist: true,
});
