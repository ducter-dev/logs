<template>
    <q-page class="q-pa-lg">
      <q-card class="no-shadow" bordered>
        <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary" align="left"
          narrow-indicator>
          <q-tab name="threats" label="Top Amenazas" />
          <q-tab name="policies" label="Politicas" />
        </q-tabs>
        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="threats">
            <div class="text-h6">threats</div>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </q-tab-panel>

          <q-tab-panel name="policies">
            <div class="text-h6">policies</div>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </q-page>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const tab = ref('threats')
  </script>
  