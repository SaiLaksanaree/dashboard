
<!-- mazda-pre-registration-dashboard -->
<template>
  <div class="wrapper">
    <div class="container grid">
      <div ref="wrapperRef" :class="{ 'capture-mode': isCapturing }" style="padding: 16px;">
        <div class="header-row">
          <h5 class="header-title">Mazda Sales Thailand</h5>
          <div style="margin-left:auto; display:flex; gap:8px; align-items:center;">
            <select v-model="exportFormat" class="btn-capture" aria-label="Export format">
              <option value="jpeg">JPEG</option>
              <option value="pdf">PDF</option>
            </select>
            <div class="btn-capture" @click="exportJpg">Export Graph</div>
          </div>
        </div>
        <h4>Pre-Registration</h4>

        <Filters :options="options" v-model="filters" />

        <div class="grid two-cols">
          <!-- <KPI :total="filtered.length" :months="monthSeries" :status-mazda6e="filtered" /> -->
          <KPI :total="filtered.length" :months="monthSeries" :status-mazda6e="filtered"
            :newsletter-on="newsletterOnCount" :autoHover="!isCapturing" />
<ChartData
  v-if="filters.from && filters.to"
  :dateMin="filters.from"
  :dateMax="filters.to"
  :autoHover="!isCapturing"
  :dealer="filters.DealerCode"
  :zone="filters.ZoneSale"
/>


        </div>

        <div class="grid two-cols">
          <ZoneBar :dealer="byZone.labels" :values="byZone.values" :autoHover="!isCapturing" />
          <DealerBar :dealer="byDealer.labels" :values="byDealer.values" :autoHover="!isCapturing" />
        </div>

        <div class="grid three-cols">
          <PackagePie :items="pkgPie" />
          <StackedColorExterior :categories="extColorCats" :series="extColorSeries" :autoHover="!isCapturing" />
          <StackedColorInterior :categories="intColorCats" :series="intColorSeries" :autoHover="!isCapturing" />
        </div>

      </div>

      <DataTable :items="paged.items" :page="page" :totalPages="paged.totalPages" :sort="sort" :key="filtered.length"
        @sort-change="sort = $event; page = 1" @change-page="page = $event" @export-excel="exportExcel" @view="onView"
        @load-more="loadMore" />
      <DetailModal class="DetailModalStyle" :open="showDetail" v-if="selected" :record="selected"
        @close="showDetail = false; selected = null" />
    </div>
  </div>
</template>
<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

// Components
import Filters from '@/components/Dashboard/Filters.vue'
import KPI from '@/components/Dashboard/KPI.vue'
import StackedColorExterior from '@/components/Dashboard/StackedColorExterior.vue'
import StackedColorInterior from '@/components/Dashboard/StackedColorInterior.vue'
import DealerBar from '@/components/Dashboard/DealerBar.vue'
import ZoneBar from '@/components/Dashboard/ZoneBar.vue'
import PackagePie from '@/components/Dashboard/PackagePie.vue'
import DataTable from '@/components/Dashboard/DataTable.vue'
import DetailModal from '@/components/Dashboard/DetailModal.vue'
import ChartData from '@/components/Dashboard/ChartData.vue'
import * as htmlToImage from 'html-to-image'
import axios from 'axios'
import { jsPDF } from 'jspdf' // <-- new
// ✅ เพิ่ม: ใช้ตัวนับจาก Pinia store
import { useThemeSettingsStore } from '@/store/themeSettings'

import domtoimage from 'dom-to-image';


// Utils & Types
import { uniq, groupBy, withinRange, formatDateTime } from '@/utils'

const API_URL = import.meta.env.VITE_API_URL
const API_KEY = import.meta.env.VITE_BEARER_TOKEN

/** ========= AXIOS ========= */
const api = axios.create()

// ✅ เอา theme store มาใช้ในอินเตอร์เซปเตอร์ (reference count)
const theme = useThemeSettingsStore()

api.interceptors.request.use(
  (config) => {
    // เปิดตัวนับทุกครั้งก่อนยิง request
    theme.startLoading()

    // พฤติกรรมเดิมของคุณ
    config.url = API_URL
    config.method = 'get'
    config.headers = config.headers || {}
    if (API_KEY) {
      config.headers.Authorization = `Bearer ${API_KEY}`
    } else {
      console.warn('⚠️ API_KEY is undefined. If the server requires Bearer auth, this will fail with 401.')
    }
    return config
  },
  (error) => {
    // ถ้า request ล้มเหลวก่อนส่งออก ก็ลดตัวนับ
    theme.stopLoading()
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (res) => {
    // ได้ response แล้ว ลดตัวนับ
    theme.stopLoading()
    return res
  },
  (err) => {
    // error ก็ต้องลดตัวนับเหมือนกัน
    theme.stopLoading()
    return Promise.reject(err)
  }
)

function mapApiRecord(r) {
  const person = r.associatedPerson || {}
  const pd = Array.isArray(r.packagedetail)
    ? r.packagedetail[0] || {}
    : (r.packagedetail || {});
  return {
    // ฟิลด์ที่ UI ใช้
    bookingAt: r.BookingCreated ? new Date(r.BookingCreated).toISOString() : null,
    bookingNo: r.ID || '',
    memberDisplayId: r.memberDisplayId || '',
    firstName: person.firstName || '',
    lastName: person.lastName || '',
    Newsletter: r.Newsletter || '',

    ZoneSale: r.ZoneSale || '',
    dealer: r.Dealer || '',
    DealerCode: r.DealerCode || '',
    exteriorColor: r.Color || '',
    InteriorOption: r.InteriorOption || '',
    package: r.PackageName || 'None',
    model: r.Model || '',
    range: r.Grade || '',

    email: person.email || '',
    phone: person.phone || '',
    status: r.Status || '',

    Title: (pd && pd.Title) || r.Title || '',
    Subtitle: (pd && pd.Subtitle) || r.Subtitle || '',
    Detail: (pd && pd.Detail) || r.Detail || '',

    // เก็บต้นฉบับไว้ดูใน modal/debug
    _raw: r
  }
}

function pickArrayFromPayload(payload) {
  const candidates = [
    payload,
    payload?.data,
    payload?.items,
    payload?.rows,
    payload?.result?.items,
    payload?.result?.rows,
  ]
  const arr = candidates.find(a => Array.isArray(a))
  if (!arr) throw new Error('[toBase] Unexpected API shape, no array found')
  return arr
}

function toBase(payload) {
  const arr = pickArrayFromPayload(payload)
  return arr.map(mapApiRecord)
}

/** ========= COMPONENT ========= */
export default {
  components: {
    Filters, KPI, StackedColorExterior, StackedColorInterior,
    DealerBar, ZoneBar, PackagePie, DataTable, DetailModal, ChartData
  },
  setup() {
    const exportFormat = ref('jpeg') // <-- new: 'jpeg' | 'pdf'
     const raw = ref([])
     const loading = ref(true)   // ← local state หน้านี้ (แยกจาก global overlay)
     const error = ref(null)
     const today = dayjs()
     const filters = ref({
       from: '',
       to: '',
       extColor: '',
       intColor: '',
       DealerCode: '',
       model: '',
       ZoneSale: ''
     })

     const userApplied = ref(false)


     const wrapperRef = ref(null)
     const isCapturing = ref(false)


     async function exportJpg() {
       const node = wrapperRef.value;
       if (!node) return;
 
       isCapturing.value = true;
       await nextTick();
 
       try {
         const { width, height } = node.getBoundingClientRect();
 
         // สร้าง Image จาก DOM element
         const dataUrl = await domtoimage.toJpeg(node, {
           quality: 0.95,
           pixelRatio: Math.max(2, window.devicePixelRatio || 1),
           backgroundColor: '#ffffff',
           width: Math.round(width),
           height: Math.round(height),
           filter: (el) => {
             // ปิดการจับภาพ tooltip
             if (!el) return true;
             const cls = el.className || '';
             if (el.classList) {
               if (
                 el.classList.contains('apexcharts-tooltip') ||
                 el.classList.contains('echarts-tooltip') ||
                 el.classList.contains('chart-tooltip')
               ) {
                 return false;
               }
               if (el.classList.contains('no-capture')) return false;
             } else if (typeof cls === 'string' && cls.includes('tooltip')) {
               return false;
             }
             return true;
           },
         });
 
        if (exportFormat.value === 'pdf') {
          // convert image dataURL to Image to get natural size
          const img = new Image();
          img.src = dataUrl;
          await img.decode();
          // create PDF with same pixel size (use 'px' units)
          const pdf = new jsPDF({ unit: 'px', format: [img.width, img.height] });
          pdf.addImage(dataUrl, 'JPEG', 0, 0, img.width, img.height);
          pdf.save(`Pre_Registration_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
        } else {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `Pre_Registration_${dayjs().format('YYYYMMDD_HHmmss')}.jpg`;
          a.click();
        }
       } catch (e) {
         console.error(e);
         alert('บันทึก JPG ไม่สำเร็จ ลองใหม่อีกครั้ง');
       } finally {
         isCapturing.value = false;
       }
     }



    async function fetchPrebookings() {
      try {
        if (!API_URL) throw new Error('VITE_API_URL is not set')
        const res = await api.request({})
        const normalized = toBase(res.data)
        raw.value = normalized
      } catch (e) {
        console.group('%c[API] Fetch ERROR', 'color:#d32f2f;font-weight:700')
        if (e?.response) {
          console.error('HTTP Error:', e.response.status, e.response.data)
        } else if (e?.request) {
          console.error('Network/CORS Error. No response received.', e.message)
        } else {
          console.error('Client Error:', e.message)
        }
        console.groupEnd()
        error.value = e?.message || 'Fetch failed'
      } finally {
        loading.value = false
        await nextTick()
        window.dispatchEvent(new Event('resize'))
      }
    }

    onMounted(fetchPrebookings)

    const dataMin = computed(() => {
      const valid = raw.value.map(r => dayjs(r.bookingAt)).filter(d => d.isValid())
      return valid.length ? dayjs(Math.min(...valid.map(d => d.valueOf()))) : dayjs()
    })

    const dataMax = computed(() => {
      const valid = raw.value.map(r => dayjs(r.bookingAt)).filter(d => d.isValid())
      return valid.length ? dayjs(Math.max(...valid.map(d => d.valueOf()))) : dayjs()
    })

    watch(raw, () => {
      if (!raw.value.length || userApplied.value) return
      const initialFrom = dataMin.value.startOf('day').format('YYYY-MM-DD')
      const initialTo = dataMax.value.format('YYYY-MM-DD') // ไม่หนีบเป็น today
      filters.value = { ...filters.value, from: initialFrom, to: initialTo }
      // console.log('⏱️ init range:', { from: initialFrom, to: initialTo })
    }, { immediate: true })



const options = computed(() => {
  const dealerMap = new Map()

  raw.value.forEach(t => {
    const code = t.DealerCode || ''
    if (!code) return

    if (!dealerMap.has(code)) {
      dealerMap.set(code, {
        name: t.dealer,     
        value: code,          
        zone: t.ZoneSale || '' 
      })
    }
  })

  return {
    extColors: uniq(raw.value.map(r => r.exteriorColor || '').filter(Boolean)),
    intColors: uniq(raw.value.map(r => r.InteriorOption || '').filter(Boolean)),
    dealer: uniq(raw.value.map(r => r.dealer || '').filter(Boolean)),
    dealerCode: uniq(raw.value.map(r => r.DealerCode || '').filter(Boolean)),
    model: uniq(raw.value.map(r => r.model || '').filter(Boolean)),
    ZoneSale: uniq(raw.value.map(r => r.ZoneSale || '').filter(Boolean)),
    dealerRec: [...dealerMap.values()]
  }
})


    const filtered = computed(() => {
      if (!filters.value.from || !filters.value.to) return raw.value
      const effectiveFrom = dayjs(filters.value.from).startOf('day').toISOString()
      const effectiveTo = dayjs(filters.value.to).endOf('day').toISOString()
      return raw.value.filter(r => {
        if (!withinRange(r, effectiveFrom, effectiveTo)) return false
        if (filters.value.extColor && r.exteriorColor !== filters.value.extColor) return false
        if (filters.value.intColor && r.InteriorOption !== filters.value.intColor) return false
        if (filters.value.ZoneSale && r.ZoneSale !== filters.value.ZoneSale) return false
        if (filters.value.model && r.model !== filters.value.model) return false
        if (filters.value.DealerCode && r.DealerCode !== filters.value.DealerCode) return false  // ✅ ตรงนี้
        return true
      })
    })


    function monthLabelsBetween(fromISO, toISO) {
      let cur = dayjs(fromISO).startOf('month')
      const end = dayjs(toISO).startOf('month')
      const labels = []
      while (cur.isBefore(end) || cur.isSame(end)) {
        labels.push(cur.format('MMM-YY'))
        cur = cur.add(1, 'month')
      }
      return labels
    }

    const monthSeries = computed(() => {
      let labels
      if (userApplied.value) {
        labels = monthLabelsBetween(filters.value.from, filters.value.to)
      } else {
        const toMoment = dayjs(filters.value.to || today)
        const start3 = toMoment.startOf('month').subtract(2, 'month')
        labels = monthLabelsBetween(start3.format('YYYY-MM-DD'), toMoment.format('YYYY-MM-DD'))
      }
      const byMonth = groupBy(filtered.value, r => dayjs(r.bookingAt).format('MMM-YY'))
      return labels.map(label => ({ label, value: byMonth[label]?.length ?? 0 }))
    })

    // -------- Stacked Exterior/InteriorOption --------
    const extColorCats = computed(() => uniq(filtered.value.map(r => r.exteriorColor || 'Unknown')).sort())
    const intColorCats = computed(() => uniq(filtered.value.map(r => r.InteriorOption || 'Unknown')).sort())

    function buildStackSeries(records, colorKey, colors) {
      const byModel = groupBy(records, r => (r.model && r.model.trim()) ? r.model : 'All Models')
      const series = Object.entries(byModel).map(([model, items]) => {
        const counts = colors.map(c => items.filter(it => (it[colorKey] || 'Unknown') === c).length)
        return { name: model, data: counts }
      })
      series.sort((a, b) => b.data.reduce((s, v) => s + v, 0) - a.data.reduce((s, v) => s + v, 0))
      return series
    }

    const extColorSeries = computed(() => buildStackSeries(filtered.value, 'exteriorColor', extColorCats.value))
    const intColorSeries = computed(() => buildStackSeries(filtered.value, 'InteriorOption', intColorCats.value))

    const byDealer = computed(() => {
      const g = groupBy(filtered.value, r => r.dealer || 'Unknown')
      const labels = Object.keys(g).sort((a, b) => g[b].length - g[a].length)
      const values = labels.map(l => g[l].length)
      return { labels, values }
    })

    const byZone = computed(() => {
      const g = groupBy(filtered.value, r => r.ZoneSale || 'Unknown')
      const labels = Object.keys(g).sort((a, b) => g[b].length - g[a].length)
      const values = labels.map(l => g[l].length)
      return { labels, values }
    })


    const pkgPie = computed(() => {
      const g = groupBy(filtered.value, r => r.package || 'None')
      return Object.entries(g)
        .filter(([name]) => name !== 'None')
        .map(([name, items]) => ({ name, value: items.length }))
    })

    const sort = ref({ key: 'bookingAt', dir: 'desc' })
    const sorted = computed(() => {
      const arr = [...filtered.value]
      const dir = sort.value.dir === 'asc' ? 1 : -1
      const cmp = (a, b) => (a > b ? 1 : a < b ? -1 : 0) * dir
      arr.sort((a, b) => {
        switch (sort.value.key) {
          case 'bookingAt': return ((new Date(a.bookingAt)).getTime() - (new Date(b.bookingAt)).getTime()) * dir
          case 'bookingNo': return cmp(a.bookingNo, b.bookingNo)
          case 'memberDisplayId': return cmp(a.memberDisplayId, b.memberDisplayId)
          case 'firstName': return cmp(a.firstName, b.firstName)
          case 'lastName': return cmp(a.lastName, b.lastName)
          case 'Newsletter': return cmp(a.Newsletter, b.Newsletter)
          case 'dealer': return cmp(a.dealer, b.dealer)
          default: return 0
        }
      })
      return arr
    })

    const newsletterOnCount = computed(() => filtered.value.filter(r => r.Newsletter === 'On').length)

    const page = ref(1)
    const paged = computed(() => ({
      items: sorted.value,
      totalPages: 1,
    }))

    function formatNewsletter(v) {
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase()
        if (s === 'on') return 'Yes'
        if (s === 'off') return 'No'
      } else if (typeof v === 'boolean') {
        return v ? 'Yes' : 'No'
      }
      if (v == null || v === '') return '-'
      return String(v)
    }

    function exportExcel() {
      console.log('data:', sorted.value);
      const data = sorted.value.map(r => ({
        'วันเวลาที่จอง': formatDateTime(r.bookingAt),
        'หมายเลขการจอง': r.bookingNo,
        'Mazda ID': r.memberDisplayId,
        'ชื่อ': r.firstName,
        'นามสกุล': r.lastName,
        'อีเมล': r.email,
        'เบอร์โทร': r.phone,
        'รุ่นรถ(Model)': r.model,
        'รุ่นย่อย(Sub-Model)': r.Grade,
        'สีภายนอก': r.exteriorColor,
        'วัสดุภายใน': r.InteriorOption,
        'Zone': r.ZoneSale,
        'ผู้จำหน่าย': r.dealer,
        'ยินยอมรับข่าวสาร': formatNewsletter(r.Newsletter),
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, 'Pre Registration')
      XLSX.writeFile(wb, 'Pre Registration.xlsx')
    }

    const showDetail = ref(false)
    const selected = ref(null)
    function onView(r) { selected.value = r; showDetail.value = true }
    function loadMore() { }

    return {
      // fetch state
      loading, error,
 
      // filters
      filters, options,
 
      // export format
      exportFormat,
 
       // computed data
       filtered, monthSeries,
       extColorCats, extColorSeries,
       intColorCats, intColorSeries,
       byDealer, byZone, pkgPie,
 
       // table
       sort, sorted, page, paged, newsletterOnCount,
 
       // actions
       exportExcel, showDetail, selected, onView, loadMore
       ,
       wrapperRef, isCapturing, exportJpg
     }
   }
 }
</script>


<style scoped>
/* --- กรอบนอก --- */
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding-inline: 12px;
}

.container.grid {
  display: inline-grid;
  background-color: #ffffff;
  /* padding: 16px; */
  border-radius: 12px;
  inline-size: min(100%, 1200px);
  max-inline-size: 100%;
  margin-inline: auto;
  overflow: hidden;
  box-sizing: border-box;
}

/* --- กฎกันล้นระดับระบบภายในคอนเทนเนอร์ --- */
.container.grid * {
  box-sizing: border-box;
  max-inline-size: 100%;
}

.grid {
  display: grid;
  gap: 16px;
  inline-size: 100%;
  min-width: 0;
}

.grid:not(.two-cols):not(.three-cols) {
  grid-template-columns: 1fr;

}

.grid.two-cols {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid.three-cols {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid>* {
  min-width: 0;
  overflow: hidden;
}

.grid>*:has(table),
:deep(.apexcharts-canvas),
:deep(.chart) {
  overflow: auto;
}


/* โหมดปกติคงเดิมของคุณ */

.capture-mode .container.grid>* {
  /* คลาย overflow ที่ชอบตัดตัวหนังสือ */
  overflow: visible !important;
}

.capture-mode .header-row,
.capture-mode .header-row h4,
.capture-mode .header-row h5 {
  overflow: visible !important;
  line-height: 1.4;
  /* ยก baseline ให้ปลอดภัย */
  padding-block: 2px;
}

/* ช่วยให้เรนเดอร์ฟอนต์เรียบขึ้น */
.capture-mode {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #ffffff;
  /* ใส่สีพื้นหลังที่ต้องการ */
}


.header-row {
  display: flex;
  align-items: center;
  /* จัดให้อยู่กึ่งกลางแนวตั้ง */
  justify-content: space-between;
  /* หัวข้อซ้าย ปุ่มขวา */
  gap: 12px;
}

.header-title {
  margin: 0;
  font-weight: 700;
  /* กันโดนตัดเวลาแคปเจอร์ */
  overflow: visible;
  line-height: 1.4;
}

.btn-capture {
  margin-left: auto;
  /* เผื่อกรณีมีองค์ประกอบเพิ่มเติม */
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f7f7f7 !important;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
  /* ไม่ตัดบรรทัดปุ่ม */
}

.btn-capture:hover {
  background: #efefef;
}




.container.grid :where(p, span, h1, h2, h3, h4, h5, h6, div) {
  word-wrap: break-word;
  overflow-wrap: anywhere;
  white-space: normal;
}

.container.grid :where(img, canvas, svg, video) {
  display: block;
  max-inline-size: 100%;
  height: auto;
}

.card-table {
  max-height: 500px;
  overflow-y: auto;
  border: none;
  padding: 0;
  background-color: transparent;
}

/* Chrome, Edge, Safari */
.card-table::-webkit-scrollbar {
  width: 8px;
  /* ความกว้าง scrollbar */
  background: transparent;
  /* ทำให้ scrollbar พื้นหลังโปร่งใส */
}

.card-table::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  /* สี thumb โปร่ง ๆ */
  border-radius: 4px;
  /* ทำให้ขอบโค้ง */
}

/* Firefox */
.card-table {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.DetailModalStyle {
  z-index: 10000000 !important;
}


:deep(.data-table) {
  max-inline-size: 100%;
  overflow: auto;
}

:deep(.data-table table) {
  width: 100%;
  table-layout: fixed;
}

:deep(.data-table th),
:deep(.data-table td) {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

:deep(.apexcharts-canvas),
:deep(.chart-root),
:deep(.chart-container) {
  inline-size: 100% !important;
  max-inline-size: 100% !important;
  min-width: 0 !important;
  contain: content;
}

h4,
h5 {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.capture-mode :deep(.apexcharts-tooltip),
.capture-mode :deep(.echarts-tooltip),
.capture-mode [class*="tooltip"] {
  opacity: 0 !important;
  visibility: hidden !important;
}

.capture-mode .header-title {
  white-space: nowrap;
  /* ป้องกันการตัดคำ */
  overflow: hidden;
  /* ป้องกันการล้นของข้อความ */
  text-overflow: ellipsis;
  /* ถ้าพื้นที่ไม่พอ ให้แสดง "..."
  flex: 1 1 auto;  /* ให้พื้นที่ของข้อความขยายออกให้เต็ม */
}

.capture-mode .header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
