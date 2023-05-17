<template>
  <q-page class="q-pa-lg">
    <q-card class="no-shadow" bordered>
      <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary" align="left"
        narrow-indicator>
        <q-tab name="threats" label="Top Amenazas" />
        <q-tab name="traffic" label="Trafico" />
        <q-tab name="destination" label="Destino" />
      </q-tabs>
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="threats">
          <TopThreats />

        </q-tab-panel>

        <q-tab-panel name="traffic">
          <TopTraffic />
        </q-tab-panel>

        <q-tab-panel name="destination">
          <TopDestination />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import TopThreats from "../components/TopThreats.vue"
import TopTraffic from "../components/TopTraffic.vue"
import TopDestination from 'src/components/TopDestination.vue';

const tab = ref('threats')
</script>
