<template>
  <q-page class="flex flex-center">
    <q-file
      filled
      bottom-slots
      v-model="file"
      label="Archivo"
      accept=".log"
      counter
      ref="file"
      @update:model-value="readHeaders()"
      clearable
    >
      <template v-slot:prepend>
        <q-icon name="cloud_upload" @click.stop.prevent />
      </template>
    </q-file>

    <q-item tag="label" v-ripple v-for="item in headersDetected" :key="item">
      <q-item-section avatar>
        <q-checkbox size="xs" v-model="options" :val="item" />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ item }}</q-item-label>
      </q-item-section>
    </q-item>

    <q-btn
      :disable="options.length <= 0"
      color="primary"
      label="Descargar"
      @click="generateDownloadableFormat"
    />
  </q-page>
</template>

<script>
import { exportFile } from "quasar";
import { useQuasar } from "quasar";

export default {
  data() {
    return {
      file: null,
      options: [],
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
