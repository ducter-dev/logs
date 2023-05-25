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
          <q-table :rows="threats" :columns="columnsThreats" row-key="id" :pagination="{ rowsPerPage: 10 }" />
        </q-tab-panel>

        <q-tab-panel name="policies">
          <q-table :rows="polices" :columns="columnsPolices" row-key="id" :pagination="{ rowsPerPage: 10 }" />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { liveQuery } from "dexie";
import { useObservable } from "@vueuse/rxjs";
import { db } from "src/boot/database";

const threats = useObservable(
  liveQuery(() => db.threat.toArray())
)

const polices = useObservable(
  liveQuery(() => db.policy.toArray())
)

const columnsThreats = [
  { name: 'id', align: 'center', label: 'Id', field: 'id' },
  { name: 'name', align: 'center', label: 'Amenaza', field: 'name' },
  { name: 'category', align: 'center', label: 'Categoría', field: 'category' },
  { name: 'textLevel', label: 'Nivel', field: 'textLevel', sortable: true },
  { name: 'action', label: 'Acción', field: 'action' },
  { name: 'comments', label: 'Comentarios', field: 'comments' },
  { name: 'detectedDate', label: 'Días detectado', field: 'detectedDate', sortable: true },
  { name: 'recurrent', label: 'Recurrente', field: row => row.recurrent ? 'si' : 'no' }
]

const columnsPolices = [
  { name: 'id', align: 'center', label: 'Id', field: 'id' },
  { name: 'date', align: 'center', label: 'Fecha', field: 'date', sortable: true },
  { name: 'sentbyteGB', align: 'center', label: 'GB Enviado', field: row => `${row.sentbyteGB} GB`, sortable: true },
  { name: 'rcvdbyteGB', align: 'center', label: 'GB Recibido', field: row => `${row.rcvdbyteGB} GB`, sortable: true },
  { name: 'bytesGB', align: 'center', label: 'Total', field: row => `${row.bytesGB} GB`, sortable: true },
]
const tab = ref('threats')
</script>
