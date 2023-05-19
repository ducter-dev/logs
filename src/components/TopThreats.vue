<script setup>
import { ref, reactive, watch } from "vue"
import { api } from '../boot/axios'
import { useQuasar, exportFile } from 'quasar'
import { useSettingStore } from "../stores/setting-store"
import { db } from "src/boot/database";

const loading = ref(null)
const result = ref([])
const newData = ref([])

const base = '/api/v2/monitor/fortiview/statistics'
const baseDetails = '/api/v2/log/forticloud/traffic/threat'

const currentDate = new Date();
const currentDay = currentDate.getDay();
const daysToMonday = 1 - currentDay;
const previousMonday = new Date(currentDate);
previousMonday.setDate(currentDate.getDate() + (daysToMonday - 1));

const mondayOfPreviousWeek = new Date(previousMonday);
mondayOfPreviousWeek.setDate(previousMonday.getDate() - 6);

const formatDateTo = (date) => {
  return date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2) +
    " " +
    "23" +
    ":" +
    "59" +
    ":" +
    "59";
}

const formatDateFrom = (date) => {
  return date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2) +
    " " +
    "00" +
    ":" +
    "00" +
    ":" +
    "00";
}

const form = reactive({
  from: ref(formatDateFrom(mondayOfPreviousWeek)),
  to: ref(formatDateTo(previousMonday)),
})

const $q = useQuasar()
const settings = useSettingStore()

const convertToTimestamp = (dateString) => {
  const date = new Date(dateString);
  return Math.floor(date.getTime() / 1000);
}

const threatLevel = (level) => {
  switch (level) {
    case 1:
      return "Bajo"
    case 2:
      return "Medio"
    case 3:
      return "Alto"
    case 4:
      return "Crítico"
    default:
      return "Desconocido"

  }
}

watch(result, async (newResult, oldREsult) => {
  if (newResult.length > 0) {
    $q.loading.show({
      message: 'Preparando información.'
    })

    result.value.forEach((element) => {
      fetchDetail(0, element)
    });

    setTimeout(() => {
      $q.loading.hide()
    }, 20000);

  }
})

async function makeRequest(retryCount = 0, sessionid) {
  const maxRetries = 50;

  result.value = []
  newData.value = []

  $q.loading.show({
    message: 'Consultando información.'
  })
  try {

    const params = new URLSearchParams();
    params.append('vdom', 'root');
    params.append('count', 100);
    params.append('device', 'forticloud');
    params.append('end', convertToTimestamp(form.to));
    params.append('filter', `{"srcintfrole":["lan","dmz","undefined"]}`);
    params.append('ip_version', 'ipboth');
    params.append('realtime', false);
    params.append('report_by', 'threat');
    if (sessionid) {
      params.append('sessionid', sessionid);
    }
    params.append('sort_by', 'threatlevel');
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

      result.value = response.data.results.details
      $q.loading.hide()
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

async function fetchDetail(retryCount = 0, element) {
  const maxRetries = 5;

  const params = new URLSearchParams();
  params.append('extra', 'country_id');
  params.append('extra', 'reverse_lookup');
  params.append('filter', `threattype=*"${element.type}"`);
  params.append('filter', `threatname=*"${element.threat}"`);
  params.append('filter', `logcat=*"${element.logcat}"`);
  params.append('filter', `_metadata.timestamp>="${convertToTimestamp(form.from)}000"`);
  params.append('filter', `_metadata.timestamp<="${convertToTimestamp(form.to)}000"`);
  params.append('filter', `srcintfrole=*"lan",srcintfrole=*"dmz",srcintfrole=*"undefined"`);
  params.append('filter', `policytype!*"proxy-policy"`);
  params.append('filter', `subtype=*"forward",subtype=*"sniffer",subtype=*"local"`);
  params.append('rows', 500);
  params.append('serial_no', settings.getCurrentData.serial);
  params.append('start', 0);
  params.append('vdom', 'root');
  params.append('access_token', settings.getCurrentData.token);

  const response = await api.get(settings.getCurrentData.url + baseDetails, { params: params });

  if (Object.keys(response.data.results).length === 0) {
    if (retryCount < maxRetries) {
      return fetchDetail(retryCount + 1, element);
    } else {
      $q.notify({
        color: 'negative',
        message: 'Se alcanzó el límite de reintento.'
      })
      return null;
    }
  } else {
    let obj = {
      ...element, ...{ details: response.data.results.length > 0 ? response.data.results[0] : {} }
    }
    newData.value.push(obj)
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

  if (colName == 'threatlevel') {

    return threatLevel(val)
  }

  if (colName == 'action') {

    return row.details !== undefined ? row.details.hasOwnProperty("action") ?
      row.details.action : '-' : '-'
  }

  if (colName == 'srcip') {

    return row.details !== undefined ? row.details.hasOwnProperty("srcip") ?
      row.details.srcip : '-' : '-'
  }

  if (colName == 'date') {

    return row.details !== undefined ? row.details.hasOwnProperty("date") ?
      row.details.date : '-' : '-'
  }
  return `"${formatted}"`
}

const exportTable = () => {
  // naive encoding to csv format
  const content = [columns.map(col => wrapCsvValue(col.label))].concat(
    newData.value.map(row => columns.map(col => wrapCsvValue(
      typeof col.field === 'function'
        ? col.field(row)
        : row[col.field === void 0 ? col.name : col.field],
      col.format,
      row,
      col.name
    )).join(','))
  ).join('\r\n')

  const status = exportFile(
    'amenazas.csv',
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


const columns = [
  { name: 'threat', align: 'left', label: 'Amenaza', field: 'threat' },
  { name: 'type', align: 'center', label: 'Categoría', field: 'type' },
  { name: 'threatlevel', align: 'center', label: 'Nivel', field: 'threatlevel', sortable: true },
  { name: 'action', align: 'center', label: 'Acción', field: 'action' },
  { name: 'srcip', align: 'center', label: 'Comentarios', field: 'srcip' },
  { name: 'date', align: 'center', label: 'Días detectado', field: 'date' },
]

async function checkIfThreatExists(item) {
  try {
    const res = await db.threat.get({
      name: item.threat,
      comments: item.details !== undefined ? item.details.hasOwnProperty("srcip") ? item.details.srcip : '-' : '-',
      from: form.from,
      to: form.to,
    });
    console.log(res)
    return res !== undefined;
  } catch (error) {
    console.error('Error checking item existence:', error);
    return false;
  }
}

async function checkIfThreatIsRecurrent(item, form) {

  const date1 = new Date(form.from);
  date1.setDate(date1.getDate() - 7);

  const date2 = new Date(form.to);
  date2.setDate(date2.getDate() - 8);
  try {
    const res = await db.threat.get({
      name: item.threat,
      comments: item.details !== undefined ? item.details.hasOwnProperty("action") ? item.details.action : '-' : '-',
      from: formatDateFrom(date1),
      to: formatDateTo(date1),
    });
    return res !== undefined;
  } catch (error) {
    console.error('Error checking item existence:', error);
    return false;
  }
}

const storeData = () => {
  newData.value.forEach((element) => {
    addThreat(element)
  })
}

async function addThreat(item) {
  const threatExists = await checkIfThreatExists(item);
  if (!threatExists) {

    try {
      const isReccurrent = await checkIfThreatIsRecurrent(item, form)
      const id = await db.threat.add({
        name: item.threat,
        category: item.type,
        level: item.threatlevel,
        textLevel: threatLevel(item.threatlevel),
        action: item.details !== undefined ? item.details.hasOwnProperty("action") ? item.details.action : '-' : '-',
        comments: item.details !== undefined ? item.details.hasOwnProperty("srcip") ? item.details.srcip : '-' : '-',
        detectedDate: item.details !== undefined ? item.details.hasOwnProperty("date") ? item.details.date : '-' : '-',
        from: form.from,
        to: form.to,
        recurrent: isReccurrent
      });

      $q.notify({
        color: "positive",
        message: `El registro  ${item.threat} fue guardado correctamente`,
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
      message: `Error al guardar, ya existe un registro de la amenaza ${item.threat} en el mismo rango de fechas`,
    });
  }

};

</script>
<template>
  <div class="row q-gutter-md" style="margin-bottom: 20px;">
    <div class="col-3">
      <q-input filled v-model="form.from" label="Desde">
        <template v-slot:prepend>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date :locale="myLocale" v-model="form.from" mask="YYYY-MM-DD HH:mm:ss">
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
              <q-time v-model="form.from" mask="YYYY-MM-DD HH:mm:ss" format24h with-seconds>
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
              <q-date :locale="myLocale" v-model="form.to" mask="YYYY-MM-DD HH:mm:ss">
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
              <q-time v-model="form.to" mask="YYYY-MM-DD HH:mm:ss" format24h with-seconds>
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
      <q-btn color="primary" label="Buscar" @click="makeRequest()" style="margin-right: 8px" />
      <q-btn color="green" label="Guardar" @click="storeData()" />
    </div>
  </div>

  <q-table flat dense bordered :rows="newData" :columns="columns" row-key="threat" :loading="loading"
    :rows-per-page-options="[0]" :pagination="{ rowsPerPage: 0, page: 1 }">
    <template v-slot:top-right>
      <q-btn color="green" dense icon-right="archive" label="Exportar csv" no-caps @click="exportTable()"
        :disable="newData.length <= 0" />
    </template>
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="threat" :props="props"> {{ props.row.threat }} </q-td>
        <q-td key="type" :props="props"> {{ props.row.type }}</q-td>
        <q-td key="threatlevel" :props="props"> {{ threatLevel(props.row.threatlevel) }} </q-td>
        <q-td key="action" :props="props">
          <q-badge color="primary">{{ props.row.details !== undefined ? props.row.details.hasOwnProperty("action") ?
            props.row.details.action : '-' : '-' }}</q-badge>
        </q-td>
        <q-td key="srcip" :props="props">{{ props.row.details !== undefined ? props.row.details.hasOwnProperty("srcip") ?
          props.row.details.srcip : '-' : '-' }}</q-td>
        <q-td key="date" :props="props"> {{ props.row.details !== undefined ? props.row.details.hasOwnProperty("date") ?
          props.row.details.date : '-' : '-' }}</q-td>
      </q-tr>
    </template>
  </q-table>
</template>
