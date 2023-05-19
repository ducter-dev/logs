<template>
  <q-page class="q-pa-md">

    <div class="row q-col-gutter-lg">
      <div class="col-lg-4 col-md-4 col-xs-12 col-sm-12">
        <q-card class="no-shadow" bordered>

          <div class="row">
            <div class="col">
              <q-card-section>
                <div class="text-h5 q-mt-sm q-mb-xs text-grey-8">Subir archivo</div>
                <div>
                  Selecciona el archivo .log
                </div>
              </q-card-section>
              <q-card-actions>
                <q-file style="width: 40%;" filled bottom-slots v-model="file" label="Archivo" accept=".log" counter
                  ref="file" @update:model-value="readHeaders()" clearable>
                  <template v-slot:prepend>
                    <q-icon name="cloud_upload" @click.stop.prevent />
                  </template>
                </q-file>
              </q-card-actions>
            </div>
          </div>
          <div class="row q-pa-sm" v-if="headersDetected">
            <div class="col-2 q-pa-xs" v-for="item in headersDetected" :key="item">
              <q-toggle v-model="options" :label="item" :val="item" dense />
            </div>
          </div>

          <div class="row" v-if="headersDetected">
            <q-card-actions>
              <div class="flex flex-center q-mt-md q-mr-sm">
                <q-btn :disable="options.length <= 0" color="primary" icon="download" label="Descargar" class="q-mr-sm"
                  @click="generateDownloadableFormat()" />

                <q-btn color="grey-6" text-color="white" label="Cancelar" @click="clear()" />
              </div>
            </q-card-actions>
          </div>
        </q-card>
      </div>
    </div>

  </q-page>
</template>

<script>
import { exportFile } from "quasar";
import { useQuasar } from "quasar";

export default {
  data() {
    return {
      file: null,
      options: ["date", "time", "srcip", "dstip", "hostname", "url"],
      model: null,
      data: [],
      dataToExport: null,
      content: null,
      headersDetected: null,
      fileOutputName: null,
    };
  },
  watch: {
    // whenever question changes, this function will run
    headersDetected(newQuestion, oldQuestion) {
      if (newQuestion != null) {
        if (!newQuestion.includes("poluuid")) {
          this.$q.notify({
            type: "negative",
            message: `El formato del archivo .log es erroneo.`,
          });
          this.headersDetected = null;
          this.data = [];
        }
      }
    },
  },
  methods: {
    generateDownloadableFormat() {
      this.data;

      this.fileOutputName = `datos_${this.getDateString()}.xls`;

      this.readFile();

      const status = exportFile(this.fileOutputName, this.dataToExport);
    },
    clear() {
      this.file = null
      this.model = null
      this.data = []
      this.dataToExport = null
      this.content = null
      this.headersDetected = null
      this.fileOutputName = null
    },
    readFile() {
      var data = "";
      var header = "";

      this.options.forEach((option) => {
        header += option + "\t";
      });

      header += "\n";

      this.data.forEach((item, index) => {
        var line = "";

        this.headersDetected.forEach((option) => {
          if (this.options.includes(option)) {
            if (option == "url") {
              line += item[option].replaceAll('"', "") + "\t";
            } else {
              line += item[option] + "\t";
            }
          }
        });

        line += "\n";

        data += line;
      });

      this.dataToExport = header += data;
    },
    readHeaders() {
      if (this.file == null) {
        this.headersDetected = null;
        this.data = [];
        return;
      }
      const reader = new FileReader();
      reader.onload = (res) => {
        res.target.result.split(/\r?\n/).forEach((line, index) => {
          const objectLine = line.match(/(?:[^\s"]+|"[^"]*")+/g);
          const newObject = {};
          const headers = [];

          if (objectLine !== null) {
            objectLine.forEach((element) => {
              var key = this.getPropValue(element, 0);
              newObject[key] = this.getPropValue(element, 1);
              headers.push(key);
            });
            this.headersDetected = headers;
            this.data.push(newObject);
          }
        });
      };
      reader.onerror = (err) => console.log(err);
      reader.readAsText(this.file);
    },
    getPropValue(prop, index) {
      const result = prop.split("=");
      return result[index];
    },
    getDateString() {
      const date = new Date();
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    },
  },
};
</script>
