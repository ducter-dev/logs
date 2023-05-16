<template>
  <q-layout view="lHh Lpr lFf">
    <q-tabs dense class="bg-red text-white shadow-2">
      <q-route-tab icon="router" to="/" label="Forticloud-webfilter" exact />
      <q-route-tab icon="router" to="/log2" label="Analítica" exact />
    </q-tabs>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "MainLayout",

  components: {},

  setup() {
    const leftDrawerOpen = ref(false);

    return {};
  },
});
</script>
