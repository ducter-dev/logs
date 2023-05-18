<script setup>
import { ref, reactive, computed } from "vue";
import { api } from "../boot/axios";
import { useQuasar, exportFile } from "quasar";
import { useSettingStore } from "../stores/setting-store";
import { db } from "src/boot/database";

const currentDate = new Date();
const oneDayInMillis = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
const previousDate = new Date(currentDate.getTime() - oneDayInMillis);

const canStore = ref(false);
const loading = ref(null);
const result = ref([]);

const base = "/api/v2/monitor/fortiview/statistics";

const dateToStore = ref(null);

const fechaFormateada =
  previousDate.getFullYear() +
  "-" +
  ("0" + (previousDate.getMonth() + 1)).slice(-2) +
  "-" +
  ("0" + previousDate.getDate()).slice(-2) +
  " " +
  "23" +
  ":" +
  "59" +
  ":" +
  "59";
const fechaFormateada2 =
  previousDate.getFullYear() +
  "-" +
  ("0" + (previousDate.getMonth() + 1)).slice(-2) +
  "-" +
  ("0" + previousDate.getDate()).slice(-2) +
  " " +
  "00" +
  ":" +
  "00" +
  ":" +
  "00";

const form = reactive({
  from: ref(fechaFormateada2),
  to: ref(fechaFormateada),
});

const $q = useQuasar();
const settings = useSettingStore();

async function makeRequest(retryCount = 0, sessionid) {
  var dat = new Date(form.from);
  dateToStore.value =
    dat.getFullYear() +
    "-" +
    ("0" + (dat.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + dat.getDate()).slice(-2);

  const maxRetries = 50;

  $q.loading.show({
    message: "Consultando información.",
  });
  result.value = []
  try {
    const params = new URLSearchParams();
    params.append("vdom", "root");
    params.append("count", 100);
    params.append("device", "forticloud");
    params.append("end", convertToTimestamp(form.to));
    params.append(
      "filter",
      `{"policytype":["policy","security-policy","local-in-policy","local-in-policy6","sniffer"]}`
    );
    params.append("ip_version", "ipboth");
    params.append("realtime", false);
    params.append("report_by", "policy");
    if (sessionid) {
      params.append("sessionid", sessionid);
    }
    params.append("sort_by", "bytes");
    params.append("start", convertToTimestamp(form.from));
    params.append("vdom", "root");
    params.append("access_token", settings.getCurrentData.token);

    const response = await api.get(settings.getCurrentData.url + base, {
      params: params,
    });

    if (Object.keys(response.data.results.details).length === 0) {
      if (retryCount < maxRetries) {
        return makeRequest(retryCount + 1, response.data.results.sessionid);
      } else {
        $q.notify({
          color: "negative",
          message: "Se alcanzó el límite de reintento.",
        });
        $q.loading.hide();
        return null;
      }
    } else {
      $q.notify({
        color: "positive",
        message: "Información consultada correctamente.",
      });
      result.value = response.data.results.details;

      if(result.value.length > 0){
        canStore.value =true
      }else{
        canStore.value =false
      }
      $q.loading.hide();
      return response.data;
    }
  } catch (error) {
    $q.notify({
      color: "negative",
      message: `Error en la petición:${error}`,
    });
    if (retryCount < maxRetries) {
      return makeRequest(retryCount + 1);
    } else {
      $q.notify({
        color: "negative",
        message: "Se alcanzó el límite de reintento.",
      });
      $q.loading.hide();
      return null;
    }
  }
}

const myLocale = {
  /* starting with Sunday */
  days: "Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado".split("_"),
  daysShort: "Dom_Lun_Mar_Mié_Jue_Vie_Sáb".split("_"),
  months:
    "Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre".split(
      "_"
    ),
  monthsShort: "Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic".split("_"),
  firstDayOfWeek: 1, // 0-6, 0 - Sunday, 1 Monday, ...
  format24h: true,
  pluralDay: "dias",
};

const convertToTimestamp = (dateString) => {
  const date = new Date(dateString);
  return Math.floor(date.getTime() / 1000);
};

const columns = [
  { name: "policyid", align: "left", label: "Política", field: "policyid" },
  {
    name: "srcintf",
    align: "left",
    label: "Interface origen",
    field: "srcintf",
  },
  {
    name: "dstintf",
    align: "center",
    label: "Interfaz destino",
    field: "dstintf",
  },
  { name: "rcvdbyte", align: "center", label: "Recibido", field: "rcvdbyte" },
  { name: "sentbyte", align: "center", label: "Enviado", field: "sentbyte" },
  { name: "bytes", align: "center", label: "Total", field: "bytes" },
];

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const sumaRecibido = computed(() => {
  return result.value.reduce((suma, fila) => suma + fila.rcvdbyte, 0);
});

const sumaEnviado = computed(() => {
  return result.value.reduce((suma, fila) => suma + fila.sentbyte, 0);
});

const sumaTotal = computed(() => {
  return result.value.reduce((suma, fila) => suma + fila.bytes, 0);
});

async function checkIfPolicyExists() {
  try {
    const user = await db.policy.get({date: dateToStore.value});
    return user !== undefined;
  } catch (error) {
    console.error('Error checking item existence:', error);
    return false;
  }
}

const addPolice = async () => {
  const userExists = await checkIfPolicyExists();
  if (!userExists) {
    try {
    const id = await db.policy.add({
      date: dateToStore.value,
      rcvdbyte: sumaRecibido.value,
      sentbyte: sumaEnviado.value,
      bytes: sumaTotal.value,
      rcvdbyteGB: Math.round(sumaRecibido.value / 1e9),
      sentbyteGB: Math.round(sumaEnviado.value / 1e9),
      bytesGB: Math.round(sumaTotal.value / 1e9),
      from: form.from,
      to: form.to,
    });

    $q.notify({
      color: "positive",
      message: `El registro del día ${dateToStore.value} fue guardado correctamente, id:${id}`,
    });
  } catch (error) {
    $q.notify({
      color: "negative",
      message: `Error al guardar la información`,
    });
  }
  } else {
    $q.notify({
      color: "negative",
      message: `Error al guardar, ya existe un registro de esta fecha: ${dateToStore.value}`,
    });
  }

};
</script>
<template>
  <div class="row q-gutter-md" style="margin-bottom: 20px">
    <div class="col-3">
      <q-input filled v-model="form.from" label="Desde">
        <template v-slot:prepend>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-date
                :locale="myLocale"
                v-model="form.from"
                mask="YYYY-MM-DD HH:mm:ss"
              >
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>

        <template v-slot:append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-time
                v-model="form.from"
                mask="YYYY-MM-DD HH:mm:ss"
                format24h
                with-seconds
              >
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>
    <div class="col-3">
      <q-input filled v-model="form.to" label="Hasta">
        <template v-slot:prepend>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-date
                :locale="myLocale"
                v-model="form.to"
                mask="YYYY-MM-DD HH:mm:ss"
              >
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>

        <template v-slot:append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-time
                v-model="form.to"
                mask="YYYY-MM-DD HH:mm:ss"
                format24h
                with-seconds
              >
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>
    <div class="col flex content-center">
      <q-btn
        color="primary"
        label="Buscar"
        @click="makeRequest()"
        style="margin-right: 8px"
      />
      <q-btn color="green" label="Guardar" @click="addPolice()" :disable="!canStore" />
    </div>
  </div>
  <q-table
    flat
    dense
    bordered
    :rows="result"
    :columns="columns"
    row-key="policyid"
    :loading="loading"
    :rows-per-page-options="[0]"
    :pagination="{ rowsPerPage: 0, page: 1 }"
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="policyid" :props="props"> {{ props.row.policyid }} </q-td>
        <q-td key="srcintf" :props="props"> {{ props.row.srcintf }} </q-td>
        <q-td key="dstintf" :props="props"> {{ props.row.dstintf }} </q-td>
        <q-td key="rcvdbyte" :props="props">
          <strong>{{ Math.round(props.row.rcvdbyte / 1000000) }}</strong>
          MB</q-td
        >
        <q-td key="sentbyte" :props="props">
          <strong>{{ Math.round(props.row.sentbyte / 1000000) }}</strong>
          MB</q-td
        >

        <q-td key="bytes" :props="props">
          <strong>{{ Math.round(props.row.bytes / 1000000) }} MB</strong></q-td
        >
      </q-tr>
    </template>
    <template v-slot:bottom-row>
      <q-tr class="bg-primary text-white">
        <q-td colspan="3"> Total </q-td>
        <q-td class="text-center">
          {{ Math.round(sumaRecibido / 1e9) }} GB
        </q-td>
        <q-td class="text-center">
          {{ Math.round(sumaEnviado / 1e9) }} GB
        </q-td>
        <q-td class="text-center"> {{ Math.round(sumaTotal / 1e9) }} GB </q-td>
      </q-tr>
    </template>
  </q-table>
</template>
