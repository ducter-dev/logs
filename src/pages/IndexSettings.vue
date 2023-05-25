<script setup>
import { ref, reactive, onMounted } from "vue"
import { useQuasar } from 'quasar'
import { api } from '../boot/axios'

import { useSettingStore } from "../stores/setting-store"

const form = reactive({
  url: null,
  token: null,
  serial: null,
  version: null,
})

const $q = useQuasar()
const settings = useSettingStore()

const tokenRef = ref(null)
const urlRef = ref(null)
const result = ref([])
const validated = ref(false)
const isPwd = ref(true)

const base = '/api/v2/monitor/fortiview'

const validateUrl = (val) => {
  const urlPattern = /^(https?:\/\/)?(((~[a-z\d]([a-z\d-]*[a-z\d])~*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(#[-a-z\d_]*)?$/i;
  return urlPattern.test(val) || "Por favor, ingrese una URL válida.";
}

const urlRules = [
  val => !!val || 'La url es requerida',
  val => validateUrl(val)
]

const tokenRules = [
  val => !!val || 'La url es requerida'
]

const onSubmit = () => {
  tokenRef.value.validate()
  urlRef.value.validate()

  if (tokenRef.value.hasError || urlRef.value.hasError) {
    // form has error
  }
  else {
    $q.loading.show({
      message: 'Validando conexión'
    })
    api
      .get(form.url + base, { params: { access_token: form.token } })
      .then((response) => {

        result.value = response.data
        form.serial = response.data.serial
        form.version = response.data.version
        validated.value = true
        $q.notify({
          icon: 'done',
          color: 'positive',
          message: 'Se establecio comunicación exitosamente'
        })
        $q.loading.hide()

      })
      .catch((error) => {

        if (error.response) {
          // La respuesta fue hecha y el servidor respondió con un código de estado
          // que esta fuera del rango de 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
          $q.loading.hide()
          validated.value = false

        } else if (error.request) {
          // La petición fue hecha pero no se recibió respuesta
          // `error.request` es una instancia de XMLHttpRequest en el navegador y una instancia de
          // http.ClientRequest en node.js
          console.log('error.request', error.request);
          $q.notify({
            color: 'negative',
            message: 'Conexión rechazada con nuestros servidores. Código de error:000001'
          })
          $q.loading.hide()
          validated.value = false

        } else {
          // Algo paso al preparar la petición que lanzo un Error
          console.log('Error', ' error.message', error.message);
          $q.notify({
            message: ' error.message'
          })
          $q.loading.hide()
          validated.value = false

        }
        console.log('error.config', error.config);
        $q.notify({
          color: 'negative',
          message: 'error.config'
        })
        $q.loading.hide()
        validated.value = false

      });

  }
}

const onStore = () => {
  if (validated.value == true) {
    settings.setConfigDetails(form)
    $q.notify({
      icon: 'done',
      color: 'positive',
      message: 'Se guardo correctamente la información'
    })
  }
}

const resetConfig = () => {
  settings.clearConfig()
  form.token = null,
    form.url = null,
    validated.value = false
  $q.notify({
    icon: 'done',
    color: 'positive',
    message: 'Se elimino correctamente la información'
  })
}


onMounted(() => {

  form.token = settings.getCurrentData.token
  form.url = settings.getCurrentData.url
})
</script>
<template>
  <q-page class="q-pa-md">

    <div class="row q-col-gutter-lg">
      <div class="col-12">
        <q-card class="no-shadow" bordered>
          <div class="row">
            <div class="col">
              <q-card-section>
                <div class="text-h5 q-mt-sm q-mb-xs text-grey-8">Configurar endpoint fortinet</div>
                <div>
                  <q-banner class="bg-blue-6 text-white">
                    Para poder conectar es necesario contar con el token de acceso e indicar la dirección del fortinet.
                  </q-banner>
                </div>
              </q-card-section>
              <div class="row">
                <div class="col">
                  <q-card-section class="q-gutter-md">
                    <div class="row">
                      <div class="col">
                        <q-input ref="urlRef" lazy-rules type="url" :rules="urlRules" v-model="form.url" outlined
                          label="URL" clearable>
                          <template v-slot:prepend>
                            <q-icon name="link" />
                          </template>
                        </q-input>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col">
                        <q-input :type="isPwd ? 'password' : 'text'" ref="tokenRef" lazy-rules outlined
                          :rules="tokenRules" v-model="form.token" label="Token" clearable>
                          <template v-slot:prepend>
                            <q-icon name="vpn_key" />
                          </template>
                          <template v-slot:append>
                            <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                              @click="isPwd = !isPwd" />
                          </template>
                        </q-input>
                      </div>
                    </div>

                  </q-card-section>
                </div>
                <div class="col q-pa-md">
                  <q-list bordered separator v-if="validated">
                    <q-item clickable v-ripple>
                      <q-item-section>
                        <q-item-label>Endpoint</q-item-label>
                        <q-item-label caption>{{ form.url + base }}</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable v-ripple>
                      <q-item-section>
                        <q-item-label>Serial</q-item-label>
                        <q-item-label caption>{{ result.serial }}</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable v-ripple>
                      <q-item-section>
                        <q-item-label overline>Version</q-item-label>
                        <q-item-label>{{ result.version }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item clickable v-ripple>
                      <q-item-section>
                        <q-item-label overline>Estatus</q-item-label>
                        <q-item-label>
                          <span class="text-green">Conectado</span>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
              <q-card-section>
                <div class="flex justify-between q-mt-md q-mr-sm">
                  <div>
                    <q-btn color="blue" icon="check_circle" label="Validar" class="q-mr-sm" @click="onSubmit" />
                    <q-btn color="green" icon="save" label="Guardar" :disabled="!validated" @click="onStore" />
                  </div>
                  <div v-if="settings.getCurrentData.token !== null">
                    <q-btn flat color="primary" label="Eliminar configuración" class="float-right"
                      @click="resetConfig()" />
                  </div>
                </div>

              </q-card-section>
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>


