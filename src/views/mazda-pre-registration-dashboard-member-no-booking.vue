<!-- mazda-pre-registration-dashboard-member-no-booking.vue -->

<template>
  <div class="wrapper" ref="wrapperRef" :class="{ 'capture-mode': isCapturing }">
    <div class="container grid">
      <div class="header-row">
        <h5 class="header-title">Mazda Sales Thailand</h5>
        <!-- <div class="btn-capture" @click="exportJpg">Export Graph</div> -->
      </div>
      <h4>Member no booking</h4>
      <FiltersMember :options="options" v-model="filters" />

      <DataTableForNoBooking :items="paged.items" :page="page" :totalPages="paged.totalPages" :sort="sort"
        :key="filtered.length" @sort-change="onTableSortChange" @change-page="page = $event" @export-excel="exportExcel"
        @view="onView" @load-more="loadMore" />


      <DetailModalForNoBooking :open="showDetail" v-if="selected" :record="selected"
        @close="showDetail = false; selected = null" />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

import * as htmlToImage from 'html-to-image'
import axios from 'axios'

// Utils & Types
import { uniq, groupBy, withinRange, formatDateTime } from '@/utils'

import DataTableForNoBooking from '@/components/Dashboard/DataTableForNoBooking.vue'
import DetailModalForNoBooking from '@/components/Dashboard/DetailModalForNoBooking.vue'
import FiltersMember from '@/components/Dashboard/FiltersMember.vue'

const todayStr = () => dayjs().format('YYYY-MM-DD')

// Static mock data
const mockData = {
  noMember: {
    data: [
      {
        "RegisterDate": "2025-01-15T12:00:00Z",
        "MemberDisplayId": "152234349",
        "FirstName": "ประยุทธ์",
        "LastName": "สมบูรณ์",
        "Email": "prayuth@email.com",
        "Phone": "086-789-0123"
      },
      {
        "RegisterDate": "2025-01-14T15:30:00Z",
        "MemberDisplayId": "324234244",
        "FirstName": "มาลี",
        "LastName": "ดีใจ",
        "Email": "malee@email.com",
        "Phone": "087-890-1234"
      },
      {
        "RegisterDate": "2025-01-13T11:15:00Z",
        "MemberDisplayId": "657345431",
        "FirstName": "สมศักดิ์",
        "LastName": "เก่งกาจ",
        "Email": "somsak@email.com",
        "Phone": "088-901-2345"
      }
    ]
  }
};

function mapApiRecord(r) {
  return {
    RegisterDate: r.RegisterDate ? new Date(r.RegisterDate).toISOString() : null,
    MemberDisplayId: r.MemberDisplayId || '',
    FirstName: r.FirstName || '',
    LastName: r.LastName || '',
    Email: r.Email || '',
    Phone: r.Phone || '',
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
  const arr = Array.isArray(payload) ? payload : (payload?.data || [])
  return arr.map(mapApiRecord)
}

/** ========= COMPONENT ========= */
export default {
  components: {
    FiltersMember, DataTableForNoBooking, DetailModalForNoBooking
  },
  setup() {
    const raw = ref([])
    const loading = ref(true)
    const error = ref(null)

    // filters ที่ bind กับ FiltersMember
    const filters = ref({
      start: '',
      end: '',
      extColor: '',
      intColor: '',
      dealer: '',
      model: '',
      ZoneSale: ''
    })

    // กันไม่ให้ watcher ยิง API ตอนเราเซ็ตช่วงครั้งแรกเอง
    const canFetchOnFilterChange = ref(false)

    const wrapperRef = ref(null)
    const isCapturing = ref(false)

    async function exportJpg() {
      try {
        const node = wrapperRef.value
        if (!node) return

        isCapturing.value = true
        await nextTick()
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready
        }

        const { width, height } = node.getBoundingClientRect()

        const dataUrl = await htmlToImage.toJpeg(node, {
          quality: 0.95,
          pixelRatio: Math.max(2, window.devicePixelRatio || 1),
          backgroundColor: '#ffffff',
          cacheBust: true,
          width: Math.round(width),
          height: Math.round(height),
          filter: (el) => !el.classList?.contains('no-capture')
        })

        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `Member_No_Booking_${dayjs().format('YYYYMMDD_HHmmss')}.jpg`
        a.click()
      } catch (e) {
        console.error(e)
        alert('บันทึก JPG ไม่สำเร็จ ลองใหม่อีกครั้ง')
      } finally {
        isCapturing.value = false
      }
    }

    // --------- FETCH API ---------
    async function fetchPrebookings({ startOverride, endOverride } = {}) {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Use static mock data
        raw.value = toBase(mockData.noMember)
      } catch (e) {
        console.group('%c[API] Fetch ERROR', 'color:#d32f2f;font-weight:700')
        console.error('Mock Data Error:', e.message)
        console.groupEnd()
        error.value = e?.message || 'Fetch failed'
      } finally {
        loading.value = false
        await nextTick()
        window.dispatchEvent(new Event('resize'))
      }
    }

    onMounted(async () => {
      // 1) โหลดกว้าง ๆ ก่อนเพื่อ satisfy start/end validation
      await fetchPrebookings({ startOverride: '2025-01-01', endOverride: todayStr() })

      // 2) จากข้อมูล หา min/max RegisterDate แล้วตั้งเป็นช่วงบน filter
      const valid = raw.value
        .map(r => dayjs(r.RegisterDate))
        .filter(d => d.isValid())

      if (valid.length) {
        const min = dayjs(Math.min(...valid.map(d => d.valueOf())))
        const max = dayjs(Math.max(...valid.map(d => d.valueOf())))

        filters.value = {
          ...filters.value,
          start: min.format('YYYY-MM-DD'),
          end: max.format('YYYY-MM-DD')
        }
      } else {
        const t = todayStr()
        filters.value = { ...filters.value, start: t, end: t }
      }

      await nextTick()
      canFetchOnFilterChange.value = true
    })

    // --------- COMPUTED / FILTERS ---------
    const options = computed(() => ({
      extColors: uniq(raw.value.map(r => r.exteriorColor || '').filter(Boolean)),
      intColors: uniq(raw.value.map(r => r.InteriorOption || '').filter(Boolean)),
      dealer: uniq(raw.value.map(r => r.dealer || '').filter(Boolean)),
      model: uniq(raw.value.map(r => r.model || '').filter(Boolean)),
      ZoneSale: uniq(raw.value.map(r => r.ZoneSale || '').filter(Boolean))
    }))

    const filtered = computed(() => {
      if (!filters.value.start || !filters.value.end) return raw.value
      const fromMs = dayjs(filters.value.start).startOf('day').valueOf()
      const toMs = dayjs(filters.value.end).endOf('day').valueOf()
      return raw.value.filter(r => {
        const t = dayjs(r.RegisterDate).valueOf()
        if (!Number.isFinite(t) || t < fromMs || t > toMs) return false
        if (filters.value.extColor && r.exteriorColor !== filters.value.extColor) return false
        if (filters.value.intColor && r.InteriorOption !== filters.value.intColor) return false
        if (filters.value.dealer && r.dealer !== filters.value.dealer) return false
        if (filters.value.ZoneSale && r.ZoneSale !== filters.value.ZoneSale) return false
        if (filters.value.model && r.model !== filters.value.model) return false
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
      if (!filters.value.start || !filters.value.end) return []
      const labels = monthLabelsBetween(filters.value.start, filters.value.end)
      const byMonth = groupBy(filtered.value, r => dayjs(r.RegisterDate).format('MMM-YY'))
      return labels.map(label => ({ label, value: byMonth[label]?.length ?? 0 }))
    })

    // --------- SORT (ใช้กับ DataTableForNoBooking) ---------
    // key ต้องตรงกับหัวคอลัมน์ใน DataTableForNoBooking.vue
    const sort = ref({ key: 'RegisterDate', dir: 'desc' })

    const sorted = computed(() => {
      const arr = [...filtered.value]
      const { key, dir } = sort.value
      const factor = dir === 'asc' ? 1 : -1

      arr.sort((a, b) => {
        let av = a[key]
        let bv = b[key]

        if (key === 'RegisterDate') {
          av = av ? new Date(av).getTime() : 0
          bv = bv ? new Date(bv).getTime() : 0
        } else {
          av = (av ?? '').toString().toLowerCase()
          bv = (bv ?? '').toString().toLowerCase()
        }

        if (av > bv) return 1 * factor
        if (av < bv) return -1 * factor
        return 0
      })

      return arr
    })

    function onTableSortChange(val) {
      // ดูใน console ได้ว่า event มาจริงไหม
      console.log('[NoBooking] sort-change:', val)
      sort.value = val
      page.value = 1
    }

    const newsletterOnCount = computed(() => {
      return filtered.value.filter(r => r.Newsletter === 'On').length
    })

    const page = ref(1)
    const paged = computed(() => ({
      items: sorted.value,
      totalPages: 1,
    }))

    // --------- WATCH FILTERS → REFETCH ตอน user เปลี่ยน ---------
    let fetchTimer = null
    watch(
      () => [filters.value.start, filters.value.end],
      ([start, end]) => {
        if (!canFetchOnFilterChange.value) return
        if (!start || !end) return

        if (dayjs(start).isValid() && dayjs(end).isValid() && dayjs(start).isAfter(dayjs(end))) {
          const fixed = { ...filters.value, start: end, end: start }
          filters.value = fixed
          start = fixed.start
          end = fixed.end
        }

        if (fetchTimer) clearTimeout(fetchTimer)
        fetchTimer = setTimeout(() => {
          page.value = 1
          fetchPrebookings()
        }, 400)
      }
    )

    // --------- EXPORT / DETAIL ---------
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
      const data = sorted.value.map(r => ({
        'วันเวลาที่สมัคร': formatDateTime(r.RegisterDate),
        'Mazda ID': r.MemberDisplayId,
        'ชื่อ': r.FirstName,
        'นามสกุล': r.LastName,
        'อีเมล': r.Email || '',
        'เบอร์โทร': r.Phone || '',
      }))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, 'Pre Registration')
      XLSX.writeFile(wb, 'Pre Registration Member No Booking.xlsx')
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

      // computed data
      filtered, monthSeries,

      // table / sort
      sort, sorted, page, paged, newsletterOnCount,
      onTableSortChange,

      // actions
      exportExcel, showDetail, selected, onView, loadMore,
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
  /* min-height: 100vh; */
  padding-inline: 12px;
}

.container.grid {
  display: inline-grid;
  background-color: #ffffff;
  padding: 16px;
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
  background: #f7f7f7;
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
</style>
