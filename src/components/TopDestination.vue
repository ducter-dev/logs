<script setup>
import { ref, reactive, onMounted } from "vue"
import { api } from '../boot/axios'
import { useQuasar, exportFile } from 'quasar'
import { useSettingStore } from "../stores/setting-store"

const currentDate = new Date();
const currentDay = currentDate.getDay();
const daysToMonday = 1 - currentDay;
const previousMonday = new Date(currentDate);
previousMonday.setDate(currentDate.getDate() + daysToMonday);

const mondayOfPreviousWeek = new Date(previousMonday);
mondayOfPreviousWeek.setDate(previousMonday.getDate() - 7);


const loading = ref(null)
const result = ref([])

const base = '/api/v2/monitor/fortiview/statistics'

const fechaFormateada = previousMonday.getFullYear() + '-' + ('0' + (previousMonday.getMonth() + 1)).slice(-2) + '-' + ('0' + previousMonday.getDate()).slice(-2) + ' ' + ('0' + previousMonday.getHours()).slice(-2) + ':' + ('0' + previousMonday.getMinutes()).slice(-2) + ':' + ('0' + previousMonday.getSeconds()).slice(-2);
const fechaFormateada2 = mondayOfPreviousWeek.getFullYear() + '-' + ('0' + (mondayOfPreviousWeek.getMonth() + 1)).slice(-2) + '-' + ('0' + mondayOfPreviousWeek.getDate()).slice(-2) + ' ' + ('0' + mondayOfPreviousWeek.getHours()).slice(-2) + ':' + ('0' + mondayOfPreviousWeek.getMinutes()).slice(-2) + ':' + ('0' + mondayOfPreviousWeek.getSeconds()).slice(-2);



const form = reactive({
  from: ref(fechaFormateada2),
  to: ref(fechaFormateada),
})

const $q = useQuasar()
const settings = useSettingStore()

const myLocale = {
  /* starting with Sunday */
  days: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
  daysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
  firstDayOfWeek: 1, // 0-6, 0 - Sunday, 1 Monday, ...
  format24h: true,
  pluralDay: 'dias'
}


const convertToTimestamp = (dateString) => {
  const date = new Date(dateString);
  return Math.floor(date.getTime() / 1000);
}

const columns = [
  { name: 'dstip', align: 'left', label: 'Destino', field: 'dstip' },
  { name: 'resolved', align: 'left', label: 'Resolved', field: 'resolved' },
  { name: 'sentbyte', align: 'center', label: 'Enviado MB', field: 'sentbyte' },
  { name: 'rcvdbyte', align: 'center', label: 'Recibido MB', field: 'rcvdbyte' },
  { name: 'bytes', align: 'center', label: 'Total MB', field: 'bytes' },
]

async function makeRequest(retryCount = 0, sessionid) {
  const maxRetries = 50;

  $q.loading.show({
    message: 'Consultando información.'
  })
  try {

    const params = new URLSearchParams();
    params.append('vdom', 'root');
    params.append('count', 100);
    params.append('device', 'forticloud');
    params.append('end', convertToTimestamp(form.to));
    params.append('filter', `{"policytype":["policy","security-policy","local-in-policy","local-in-policy6","sniffer"],"srcintfrole":["lan","dmz","undefined"]}`);
    params.append('ip_version', 'ipboth');
    params.append('realtime', false);
    params.append('report_by', 'destination');
    if (sessionid) {
      params.append('sessionid', sessionid);
    }
    params.append('sort_by', 'bytes');
    params.append('start', convertToTimestamp(form.from));
    params.append('vdom', 'root');
    params.append('access_token', settings.getCurrentData.token);

    const response = await api.get(settings.getCurrentData.url + base, { params: params });

    if (Object.keys(response.data.results.details).length === 0) {
      if (retryCount < maxRetries) {
        return makeRequest(retryCount + 1, response.data.results.sessionid);
      } else {
        $q.notify({
          color: 'negative',
          message: 'Se alcanzó el límite de reintento.'
        })
        $q.loading.hide()
        return null;
      }
    } else {
      $q.notify({
        color: 'positive',
        message: 'Información consultada correctamente.'
      })
      result.value = response.data.results.details.slice(0, 10)
      $q.loading.hide()
      return response.data;
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: `Error en la petición:${error}`
    })
    if (retryCount < maxRetries) {
      return makeRequest(retryCount + 1);
    } else {
      $q.notify({
        color: 'negative',
        message: 'Se alcanzó el límite de reintento.'
      })
      $q.loading.hide()
      return null;
    }
  }
}

function wrapCsvValue(val, formatFn, row, colName) {
  let formatted = formatFn !== void 0
    ? formatFn(val, row)
    : val

  formatted = formatted === void 0 || formatted === null
    ? ''
    : String(formatted)

  formatted = formatted.split('"').join('""')
  /**
   * Excel accepts \n and \r in strings, but some other CSV parsers do not
   * Uncomment the next two lines to escape new lines
   */
  // .split('\n').join('\\n')
  // .split('\r').join('\\r')

  if (colName == 'sentbyte' || colName == 'rcvdbyte' || colName == 'bytes') {

    return `"${Math.round(formatted / 1000000)}"`
  }
  return `"${formatted}"`
}


const exportTable = () => {
  // naive encoding to csv format
  const content = [columns.map(col => wrapCsvValue(col.label))].concat(
    result.value.map(row => columns.map(col => wrapCsvValue(
      typeof col.field === 'function'
        ? col.field(row)
        : row[col.field === void 0 ? col.name : col.field],
      col.format,
      row,
      col.name
    )).join(','))
  ).join('\r\n')

  const status = exportFile(
    'destinos.csv',
    content,
    'text/csv'
  )

  if (status !== true) {
    $q.notify({
      message: 'Browser denied file download...',
      color: 'negative',
      icon: 'warning'
    })
  }
}
</script>
<template>
  <div class="row q-gutter-md" style="margin-bottom: 20px;">
    <div class="col-3">
      <q-input filled v-model="form.from" label="Desde">
        <template v-slot:prepend>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date :locale="myLocale" v-model="form.from" mask="YYYY-MM-DD HH:mm">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>

        <template v-slot:append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-time v-model="form.from" mask="YYYY-MM-DD HH:mm" format24h>
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
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date :locale="myLocale" v-model="form.to" mask="YYYY-MM-DD HH:mm">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>

        <template v-slot:append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-time v-model="form.to" mask="YYYY-MM-DD HH:mm" format24h>
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
      <q-btn color="primary" label="Buscar" @click="makeRequest()" />
    </div>
  </div>
  <q-table flat dense bordered :rows="result" :columns="columns" row-key="dstip" :loading="loading"
    :rows-per-page-options="[0]" :pagination="{ rowsPerPage: 0, page: 1 }">
    <template v-slot:top-right>
      <q-btn color="green" dense icon-right="archive" label="Exportar csv" no-caps @click="exportTable()"
        :disable="result.length <= 0" />
    </template>
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="dstip" :props="props"> {{ props.row.dstip }} </q-td>
        <q-td key="resolved" :props="props"> {{ props.row.resolved }} </q-td>
        <q-td key="sentbyte" :props="props"> {{ Math.round(props.row.sentbyte / 1000000) }}</q-td>
        <q-td key="rcvdbyte" :props="props"> {{ Math.round(props.row.rcvdbyte / 1000000) }} </q-td>
        <q-td key="bytes" :props="props"> {{ Math.round(props.row.bytes / 1000000) }}</q-td>
      </q-tr>
    </template>
  </q-table>
</template>
