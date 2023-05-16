<script setup>
import { ref, reactive, onMounted } from "vue"
import { api } from '../boot/axios'
import { useQuasar } from 'quasar'
import { useSettingStore } from "../stores/setting-store"

const loading = ref(null)
const result = ref([])

const base = '/api/v2/monitor/fortiview/statistics'
const baseDetails = '/api/v2/log/forticloud/traffic/threat'

const form = reactive({
  from: ref('2023-05-08 10:00'),
  to: ref('2023-05-15 10:00'),
})

const $q = useQuasar()
const settings = useSettingStore()

const fetchData = () => {
  console.log(convertToTimestamp(form.from))
  console.log(convertToTimestamp(form.to))

  makeRequest()
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

const fetchDetail = (threat, type) => {
  if (threat == 'www.apps-prodownload.com') {

    const params = new URLSearchParams();
    params.append('extra', 'country_id');
    params.append('extra', 'reverse_lookup');
    params.append('filter', `threattype=*"${type}"`);
    params.append('filter', `threatname=*"${threat}"`);
    params.append('filter', `logcat=*"webfilter"`);
    params.append('filter', `_metadata.timestamp>="${convertToTimestamp(form.from)}000"`);
    params.append('filter', `_metadata.timestamp<="${convertToTimestamp(form.to)}000"`);
    params.append('filter', `srcintfrole=*"lan",srcintfrole=*"dmz",srcintfrole=*"undefined"`);
    params.append('filter', `policytype!*"proxy-policy"`);
    params.append('filter', `subtype=*"forward",subtype=*"sniffer",subtype=*"local"`);
    params.append('rows', 500);
    params.append('serial_no', 'FWF40FTK20012933');
    params.append('start', 0);
    params.append('vdom', 'root');
    params.append('access_token', settings.getCurrentData.token);

    api.get(settings.getCurrentData.url + baseDetails, {
      params: params
    }).then((response) => {

      console.log("respuesta de detalle:", response.data.results);

    }).catch((error) => {
      console.log('error.request', error);
    });
  }

}

async function makeRequest(retryCount = 0, sessionid) {
  const maxRetries = 2;

  $q.loading.show({
    message: 'Consultando información.'
  })

  try {
    const response = await api.get(settings.getCurrentData.url + base, {
      params: {
        access_token: settings.getCurrentData.token,
        vdom: 'root',
        count: 100,
        device: 'forticloud',
        end: convertToTimestamp(form.to),
        filter: { "srcintfrole": ["lan", "dmz", "undefined"] },
        ip_version: 'ipboth',
        realtime: false,
        report_by: 'threat',
        sort_by: 'threatlevel',
        start: convertToTimestamp(form.from),
        vdom: 'root',
        sessionid: sessionid
      }
    });

    if (response.data.results.sessionid !== null) {
      if (retryCount < maxRetries) {
        console.log('Obtenemos token por primera vez, reintento...');
        return makeRequest(retryCount + 1, response.data.results.sessionid);
      } else {
        console.log('Se alcanzó el límite de reintento.');
        result.value = response.data.results.details
        $q.loading.hide()
        return null;
      }
    } else {
      console.log('Respuesta con información:', response.data);
      $q.loading.hide()
      return response.data;
    }
  } catch (error) {
    $q.loading.hide()
    console.error('Error en la petición:', error);
    if (retryCount < maxRetries) {
      return makeRequest(retryCount + 1);
    } else {
      console.log('Se alcanzó el límite de reintento.');
      return null;
    }
  }
}

const convertToTimestamp = (dateString) => {
  const date = new Date(dateString);
  return Math.floor(date.getTime() / 1000);
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



onMounted(() => {

  fetchData()
})
</script>
<template>
  <div class="row q-gutter-md">
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
      <q-btn color="primary" label="Buscar" @click="fetchData()" />
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th scope="col">Amenaza</th>
        <th scope="col">Categoria</th>
        <th scope="col">Nivel</th>
        <th scope="col">Sesiones</th>
        <th scope="col">Accion</th>
        <th scope="col">Comentarios</th>
        <th scope="col">Días detectado</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in result" :key="index">
        <th scope="row">{{ item.threat }}</th>
        <td>{{ item.type }}</td>
        <td>{{ threatLevel(item.threatlevel) }}</td>
        <td>{{ item.sessions }}</td>
        <td>{{ fetchDetail(item.threat, item.type) }}</td>
        <td>@mdo</td>
        <td>@mdo</td>
      </tr>
    </tbody>
  </table>
</template>
