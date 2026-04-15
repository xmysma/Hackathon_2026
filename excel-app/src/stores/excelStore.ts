import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as XLSX from 'xlsx'

export const useExcelStore = defineStore('excel', () => {
  const headers = ref<string[]>([])
  const rows = ref<Record<string, unknown>[]>([])
  const rawSheet = ref<unknown[][]>([])
  const fileName = ref<string>('')
  const sheetNames = ref<string[]>([])
  const activeSheet = ref<string>('')

  function loadFile(file: File) {
    fileName.value = file.name
    const reader = new FileReader()

    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })

      sheetNames.value = workbook.SheetNames
      activeSheet.value = workbook.SheetNames[0]

      loadSheet(workbook, activeSheet.value)
    }

    reader.readAsArrayBuffer(file)
  }

  function loadSheet(workbook: XLSX.WorkBook, sheetName: string) {
    const worksheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' })
    rawSheet.value = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })

    if (json.length > 0) {
      headers.value = Object.keys(json[0])
      rows.value = json
    } else {
      headers.value = []
      rows.value = []
    }
  }

  function clear() {
    headers.value = []
    rows.value = []
    rawSheet.value = []
    fileName.value = ''
    sheetNames.value = []
    activeSheet.value = ''
  }

  return { headers, rows, rawSheet, fileName, sheetNames, activeSheet, loadFile, clear }
})
