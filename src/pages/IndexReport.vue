  
<script setup>
import { ref, reactive, watch, onMounted } from "vue"
import { api } from '../boot/axios'
import { useQuasar, exportFile } from 'quasar'
import { useSettingStore } from "../stores/setting-store"
import { db } from "src/boot/database";
import xlsx from 'xlsx/dist/xlsx.full.min';

const base = '/api/v2/monitor/fortiview/statistics'

const currentDate = new Date();
const currentDay = currentDate.getDay();
const daysToMonday = 1 - currentDay;
const previousMonday = new Date(currentDate);
previousMonday.setDate(currentDate.getDate() + (daysToMonday - 1));

const mondayOfPreviousWeek = new Date(previousMonday);
mondayOfPreviousWeek.setDate(previousMonday.getDate() - 6);

const fechasInicioFinDia = ref([]);
const canDownload = ref(false);


const $q = useQuasar()
const settings = useSettingStore()

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

const threats = ref([])
const polices = ref([])
const destinations = ref([])
const origins = ref([])

const search = () => {

    searchTrheats()
    searchPolices()
    fetchDestinations()
    fetchTraffic()
}

const generateDownloadableReport = () => {

    const title = [{ A: 'Reporte Semanal' }]

    let originsTable = [
        {
            A: 'Usuario',
            B: 'Fuente',
            C: 'Enviado MB',
            D: 'Recibido MB'
        }
    ]

    let destinationsTable = [
        {
            A: 'Destino',
            B: 'Resolved',
            C: 'Enviado MB',
            D: 'Recibido MB'
        }
    ]

    let threatsTable = [
        {
            A: 'Amenaza',
            B: 'Categoria',
            C: 'Nivel',
            D: 'Accion',
            E: 'Comentarios',
            F: 'Dias detectado',
            G: 'Recurrente',
        }
    ]

    let policesTable = [
        {
            A: 'Fecha',
            B: 'GB Enviado',
            C: 'GB Recibido'
        }
    ]


    origins.value.forEach((element) => {
        originsTable.push({
            A: '',
            B: element.srcip,
            C: Math.round(element.sentbyte / 1000000),
            D: Math.round(element.rcvdbyte / 1000000)
        })
    })

    destinations.value.forEach((element) => {
        destinationsTable.push({
            A: element.dstip,
            B: element.resolved,
            C: Math.round(element.sentbyte / 1000000),
            D: Math.round(element.rcvdbyte / 1000000)
        })
    })

    polices.value.forEach((element) => {
        policesTable.push({
            A: element.date,
            B: element.rcvdbyteGB,
            C: element.sentbyteGB,
        })
    })

    threats.value.forEach((element) => {
        threatsTable.push({
            A: element.name,
            B: element.category,
            C: element.textLevel,
            D: element.action,
            E: element.comments,
            F: element.detectedDate,
            G: element.recurrent == true ? 'Si' : 'No',
        })
    })

    originsTable = [""].concat([""])
        .concat([{ A: "Origenes" }])
        .concat(originsTable)
        .concat([""])
        .concat([""])
        .concat([{ A: "Destinos" }])
        .concat(destinationsTable)
        .concat([""])
        .concat([""])
        .concat([{ A: "Politicas" }])
        .concat(policesTable)
        .concat([""])
        .concat([""])
        .concat([{ A: "Amenazas" }])
        .concat(threatsTable);

    const finalData = [...title, ...originsTable];

    const XLSX = xlsx;
    const workbook = XLSX.utils.book_new();


    const sheet = XLSX.utils.json_to_sheet(finalData, {
        skipHeader: true,
    });

    XLSX.utils.book_append_sheet(workbook, sheet, "report");

    XLSX.writeFile(workbook, 'reporteSemanal.xlsx');
}

const generateDownloadableReport2 = () => {

    const title = [{ A: 'Reporte Semanal' }]

    let headers = [
        {
            A: 'Usuario',
            B: 'Fuente',
            C: 'Enviado MB',
            D: 'Recibido MB',
            E: '',
            F: '',
            G: 'Destino',
            H: 'Resolved',
            I: 'Enviado MB',
            J: 'Recibido MB',
            K: '',
            L: '',
            M: 'Amenaza',
            N: 'Categoria',
            O: 'Nivel',
            P: 'Accion',
            Q: 'Comentarios',
            R: 'Dias detectado',
            S: 'Recurrente',
            T: '',
            U: '',
            V: 'Fecha',
            W: 'GB Enviado',
            X: 'GB Recibido'
        }
    ]
    var arr = [];
    var len = origins.value.length;
    for (var i = 0; i < len; i++) {
        arr.push({
            A: '',
            B: isset(() => origins.value[i]) ? origins.value[i].srcip : '',
            C: isset(() => origins.value[i]) ? Math.round(origins.value[i].sentbyte / 1000000) : '',
            D: isset(() => origins.value[i]) ? Math.round(origins.value[i].rcvdbyte / 1000000) : '',
            E: '',
            F: '',
            G: isset(() => destinations.value[i]) ? destinations.value[i].dstip : '' ,
            H: isset(() => destinations.value[i]) ? destinations.value[i].resolved : '',
            I: isset(() => destinations.value[i]) ? Math.round(destinations.value[i].sentbyte / 1000000) : '',
            J: isset(() => destinations.value[i]) ? Math.round(destinations.value[i].rcvdbyte / 1000000) : '',
            K: '',
            L: '',
            M:isset(() => threats.value[i]) ? threats.value[i].name : '',
            N: isset(() => threats.value[i]) ? threats.value[i].category : '',
            O: isset(() => threats.value[i]) ? threats.value[i].textLevel : '',
            P: isset(() => threats.value[i]) ? threats.value[i].action : '',
            Q: isset(() => threats.value[i]) ? threats.value[i].comments : '',
            R: isset(() => threats.value[i]) ? threats.value[i].detectedDate : '',
            S: isset(() => threats.value[i]) ? threats.value[i].recurrent == true ? 'Si' : 'No' : '',
            T: '',
            U: '',
            V: isset(() => polices.value[i]) ? polices.value[i].date : '',
            W: isset(() => polices.value[i]) ? polices.value[i].rcvdbyteGB : '',
            X: isset(() => polices.value[i]) ? polices.value[i].sentbyteGB : ''
        });
    }


    headers = [""].concat([""])
        .concat(headers)
        .concat(arr);

    const finalData = [...title, ...headers];

    const XLSX = xlsx;
    const workbook = XLSX.utils.book_new();


    const sheet = XLSX.utils.json_to_sheet(finalData, {
        skipHeader: true,
    });

    XLSX.utils.book_append_sheet(workbook, sheet, "report");

    XLSX.writeFile(workbook, 'reporte.xlsx');

}

/**
 * Checks to see if a value is set.
 *
 * @param   {Function} accessor Function that returns our value
 * @returns {Boolean}           Value is not undefined or null
 */
 function isset (accessor) {
  try {
    // Note we're seeing if the returned value of our function is not
    // undefined or null
    return accessor() !== undefined && accessor() !== null
  } catch (e) {
    // And we're able to catch the Error it would normally throw for
    // referencing a property of undefined
    return false
  }
}


const searchTrheats = async () => {
    const result = await db.threat.where({
        from: form.from,
        to: form.to,
    }).toArray();

    threats.value = result
}

const searchPolices = async () => {

    generarFechasInicioFinDia()

    fechasInicioFinDia.value.forEach(async (element) => {

        const result = await db.policy.where({
            from: element.inicioStore,
            to: element.finStore,
        }).toArray();

        if (result.length > 0) {
            polices.value.push(result[0])
        }
    })
}

function generarFechasInicioFinDia() {
    const fechas = [];
    let fechaActual = new Date(form.from);
    let fechaFin = new Date(form.to);

    while (fechaActual <= fechaFin) {
        var inicioDia = new Date(fechaActual);

        var inicioStore = formatDateFrom(inicioDia)


        var finDia = new Date(fechaActual);
        var finStore = formatDateTo(finDia)

        fechas.push({ inicioStore, finStore });

        fechaActual.setDate(fechaActual.getDate() + 1);
    }

    fechasInicioFinDia.value = fechas;
}

const convertToTimestamp = (dateString) => {
    const date = new Date(dateString);
    return Math.floor(date.getTime() / 1000);
}

async function fetchDestinations(retryCount = 0, sessionid) {
    $q.loading.show({
        message: 'Consultando información.'
    })
    const maxRetries = 50;
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
                return fetchDestinations(retryCount + 1, response.data.results.sessionid);
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
                message: 'Información de destinos consultada correctamente.'
            })
            destinations.value = response.data.results.details.slice(0, 10)
            canDownload.value = true
            $q.loading.hide()
            return response.data;
        }
    } catch (error) {
        $q.notify({
            color: 'negative',
            message: `Error en la petición:${error}`
        })

        if (retryCount < maxRetries) {
            return fetchDestinations(retryCount + 1);
        } else {
            $q.notify({
                color: 'negative',
                message: 'Se alcanzó el límite de reintento.'
            })

            return null;
        }
        $q.loading.hide()
    }
}

async function fetchTraffic(retryCount = 0, sessionid) {
    $q.loading.show({
        message: 'Consultando información.'
    })
    const maxRetries = 50;

    try {

        const params = new URLSearchParams();
        params.append('vdom', 'root');
        params.append('count', 100);
        params.append('device', 'forticloud');
        params.append('end', convertToTimestamp(form.to));
        params.append('filter', `{"policytype":["policy","security-policy","local-in-policy","local-in-policy6","sniffer"],"srcintfrole":["lan","dmz","undefined"]}`);
        params.append('ip_version', 'ipboth');
        params.append('realtime', false);
        params.append('report_by', 'source');
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
                return fetchTraffic(retryCount + 1, response.data.results.sessionid);
            } else {
                $q.notify({
                    color: 'negative',
                    message: 'Se alcanzó el límite de reintentos.'
                })
                $q.loading.hide()

                return null;
            }
        } else {
            $q.notify({
                color: 'positive',
                message: 'Información de origenes consultada correctamente.'
            })
            origins.value = response.data.results.details.slice(0, 20)
            canDownload.value = true

            $q.loading.hide()
            return response.data;
        }
    } catch (error) {
        $q.notify({
            color: 'negative',
            message: `Error en la petición:${error}`
        })
        if (retryCount < maxRetries) {
            return fetchTraffic(retryCount + 1);
        } else {
            $q.notify({
                color: 'negative',
                message: 'Se alcanzó el límite de reintento..'
            })

            return null;
        }
        $q.loading.hide()
    }
}

const readfile = () => {


    const XLSX = xlsx;

    var workbook = XLSX.readFile('src/assets/template.xlsx');

    // Crear una nueva hoja de trabajo con datos de ejemplo
    var ws_data = [['Nuevo dato 1', 'Nuevo dato 2']];
    var newWorksheet = XLSX.utils.aoa_to_sheet(ws_data);

    // Agregar la nueva hoja de trabajo al libro de trabajo existente
    var newSheetName = "Nueva Hoja";
    workbook.SheetNames.push(newSheetName);
    workbook.Sheets[newSheetName] = newWorksheet;

    // Guardar el libro de trabajo actualizado en un nuevo archivo xlsx
    XLSX.writeFile(workbook, 'archivo_actualizado.xlsx');
}

onMounted(() => {
    //readfile()
})
</script>
  
<template>
    <q-page class="q-pa-lg">
        <q-card class="no-shadow q-pa-lg" bordered style="margin-bottom: 20px;">
            <div class="row q-gutter-md">
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
                    <q-btn color="primary" label="Buscar" @click="search()" style="margin-right: 8px" />
                   <!-- <q-btn color="green" label="Descargar" @click="generateDownloadableReport()" :disable="!canDownload" />-->
                    <q-btn color="green" label="Descargar" @click="generateDownloadableReport2()" :disable="!canDownload"/>
                </div>
            </div>
        </q-card>
    </q-page>
</template>
