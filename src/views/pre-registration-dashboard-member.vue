<!-- pre-registration-dashboard-member.vue -->
<template>
  <div class="wrapper" ref="wrapperRef" :class="{ 'capture-mode': isCapturing }">
    <div class="container grid">
      <div class="header-row">
        <h5 class="header-title">Sales Thailand</h5>
        <div class="btn-capture" @click="exportJpg">Export Graph</div>
      </div>

      <h4>Member</h4>

      <FiltersMember :options="options" v-model="filters" />

      <div class="grid">
        <KPImember :metrics="kpiMetrics" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import domtoimage from 'dom-to-image'

import { uniq } from '@/utils'

import FiltersMember from '@/components/Dashboard/FiltersMember.vue'
import KPImember from '@/components/Dashboard/KPImember.vue'

dayjs.extend(isBetween)

const todayStr = () => dayjs().format('YYYY-MM-DD')
const startOfYearStr = (d = dayjs()) => d.startOf('year').format('YYYY-MM-DD')

// Static mock data
const mockData = {
  memberInfo: {
    data: [
      // October 2024
      {
        RegisterDate: '2024-10-15T08:30:00Z',
        MemberDisplayId: '001001',
        FirstName: 'สมชาย',
        LastName: 'ใจดี',
        Email: 'somchai@email.com',
        Phone: '081-234-5678',
        Newsletter: 'On',
        LineConnected: 'Yes',
      },
      {
        RegisterDate: '2024-10-20T10:15:00Z',
        MemberDisplayId: '001002',
        FirstName: 'สุดา',
        LastName: 'รักดี',
        Email: 'suda@email.com',
        Phone: '082-345-6789',
        Newsletter: 'Off',
        LineConnected: 'No',
      },
      // November 2024
      {
        RegisterDate: '2024-11-05T14:20:00Z',
        MemberDisplayId: '001003',
        FirstName: 'วิชัย',
        LastName: 'มั่นคง',
        Email: 'wichai@email.com',
        Phone: '083-456-7890',
        Newsletter: 'On',
        LineConnected: 'Yes',
      },
      {
        RegisterDate: '2024-11-12T09:45:00Z',
        MemberDisplayId: '001004',
        FirstName: 'นิรันดร์',
        LastName: 'สุขใส',
        Email: 'niran@email.com',
        Phone: '084-567-8901',
        Newsletter: 'On',
        LineConnected: 'Yes',
      },
      {
        RegisterDate: '2024-11-25T16:30:00Z',
        MemberDisplayId: '001005',
        FirstName: 'อนุชา',
        LastName: 'เจริญ',
        Email: 'anucha@email.com',
        Phone: '085-678-9012',
        Newsletter: 'Off',
        LineConnected: 'No',
      },
      // December 2024
      {
        RegisterDate: '2024-12-03T11:20:00Z',
        MemberDisplayId: '001006',
        FirstName: 'ปรีชา',
        LastName: 'วิทยากร',
        Email: 'preecha@email.com',
        Phone: '086-123-4567',
        Newsletter: 'On',
        LineConnected: 'Yes',
      },
      {
        RegisterDate: '2024-12-15T13:45:00Z',
        MemberDisplayId: '001007',
        FirstName: 'มนัสวี',
        LastName: 'สุขสันต์',
        Email: 'manaswee@email.com',
        Phone: '087-234-5678',
        Newsletter: 'On',
        LineConnected: 'Yes',
      },
      {
        RegisterDate: '2024-12-28T15:10:00Z',
        MemberDisplayId: '001008',
        FirstName: 'สุรชัย',
        LastName: 'แกล้วกล้า',
        Email: 'surachai@email.com',
        Phone: '088-345-6789',
        Newsletter: 'Off',
        LineConnected: 'No',
      },
      // January 2025
      {
        RegisterDate: '2025-01-05T08:15:00Z',
        MemberDisplayId: '001009',
        FirstName: 'วราภรณ์',
        LastName: 'สุขเกษม',
        Email: 'waraporn@email.com',
        Phone: '089-456-7890',
        Newsletter: 'On',
        LineConnected: 'Yes',
      },
      {
        RegisterDate: '2025-01-12T10:30:00Z',
        MemberDisplayId: '001010',
        FirstName: 'ธนากร',
        LastName: 'มั่งคั่ง',
        Email: 'thanakorn@email.com',
        Phone: '090-567-8901',
        Newsletter: 'On',
        LineConnected: 'Yes',
      },
      {
        RegisterDate: '2025-01-18T14:45:00Z',
        MemberDisplayId: '001011',
        FirstName: 'สิริพร',
        LastName: 'เจริญรุ่ง',
        Email: 'siriporn@email.com',
        Phone: '091-678-9012',
        Newsletter: 'Off',
        LineConnected: 'No',
      },
      {
        RegisterDate: '2025-01-22T16:20:00Z',
        MemberDisplayId: '001012',
        FirstName: 'ชัยวัฒน์',
        LastName: 'ประสบสุข',
        Email: 'chaiwat@email.com',
        Phone: '092-789-0123',
        Newsletter: 'On',
        LineConnected: 'Yes',
      },
    ],
  },
}

function mapApiRecord(r) {
  const d = r.RegisterDate ? dayjs(r.RegisterDate) : null
  return {
    RegisterDate: d && d.isValid() ? d.format('YYYY-MM-DDTHH:mm:ss') : null,
    MemberDisplayId: r.MemberDisplayId || '',
    FirstName: r.FirstName || '',
    LastName: r.LastName || '',
    Email: r.Email || '',
    Phone: r.Phone || '',
    Newsletter: r.Newsletter || '',
    LineConnected: r.LineConnected || '',
    _raw: r,
  }
}

export default {
  components: { FiltersMember, KPImember },
  setup() {
    const raw = ref([])
    const loading = ref(true)
    const error = ref(null)

    // ค่าเริ่มต้นอาจเป็นปีปัจจุบัน (เช่น 2026) แต่เราจะ "override" ตามช่วงข้อมูลครั้งแรกเสมอ
    const filters = ref({
      start: startOfYearStr(),
      end: todayStr(),
    })

    // กัน watcher ไป mark ว่า user เปลี่ยนเอง ตอนที่เราปรับ filters แบบ programmatic
    const settingFiltersProgrammatically = ref(false)
    const initializedFromData = ref(false)
    const userApplied = ref(false)

    const wrapperRef = ref(null)
    const isCapturing = ref(false)

    function withinDateRange(dateStr, startStr, endStr) {
      if (!dateStr || !startStr || !endStr) return false
      const date = dayjs(dateStr)
      const start = dayjs(startStr).startOf('day')
      const end = dayjs(endStr).endOf('day')
      return date.isValid() && start.isValid() && end.isValid() && date.isBetween(start, end, null, '[]')
    }

    const filteredData = computed(() => {
      if (!filters.value.start || !filters.value.end) return raw.value
      return raw.value.filter((r) => withinDateRange(r.RegisterDate, filters.value.start, filters.value.end))
    })

    const filteredMetrics = computed(() => {
      const toKey = (d) => (d && dayjs(d).isValid() ? dayjs(d).format('YYYY-MM') : null)
      const totals = {}
      const lines = {}

      const isOn = (v) => {
        const s = String(v ?? '').trim().toLowerCase()
        return s === 'on' || s === 'yes' || s === 'true' || s === '1' || s === 'y'
      }

      for (const r of filteredData.value) {
        const key = toKey(r.RegisterDate)
        if (!key) continue
        totals[key] = (totals[key] || 0) + 1

        // เดิมคุณนับ connected จาก Newsletter OR LineConnected (คงต้องการนับผู้ที่ “เชื่อมต่อ/รับข่าวสาร”)
        const connected = isOn(r.Newsletter) || isOn(r.LineConnected)
        if (connected) lines[key] = (lines[key] || 0) + 1
      }

      return { total: totals, lineConnected: lines }
    })

    const kpiMetrics = computed(() => filteredMetrics.value)

    async function exportJpg() {
      const node = wrapperRef.value
      if (!node) return

      isCapturing.value = true
      await nextTick()

      try {
        const { width, height } = node.getBoundingClientRect()

        const dataUrl = await domtoimage.toJpeg(node, {
          quality: 0.95,
          pixelRatio: Math.max(2, window.devicePixelRatio || 1),
          backgroundColor: '#ffffff',
          width: Math.round(width),
          height: Math.round(height),
          filter: (el) => {
            if (!el) return true
            if (el.classList) {
              if (
                el.classList.contains('apexcharts-tooltip') ||
                el.classList.contains('echarts-tooltip') ||
                el.classList.contains('chart-tooltip')
              ) {
                return false
              }
              if (el.classList.contains('no-capture')) return false
            } else {
              const cls = el.className || ''
              if (typeof cls === 'string' && cls.includes('tooltip')) return false
            }
            return true
          },
        })

        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `Pre_Registration_Member_${dayjs().format('YYYYMMDD_HHmmss')}.jpg`
        a.click()
      } catch (e) {
        console.error(e)
        alert('บันทึก JPG ไม่สำเร็จ ลองใหม่อีกครั้ง')
      } finally {
        isCapturing.value = false
      }
    }

    async function initFiltersFromDataIfNeeded(normalized) {
      if (initializedFromData.value) return
      if (!Array.isArray(normalized) || normalized.length === 0) return

      const dates = normalized
        .map((r) => r.RegisterDate)
        .filter(Boolean)
        .map((d) => dayjs(d))
        .filter((d) => d.isValid())
        .sort((a, b) => a.valueOf() - b.valueOf())

      if (dates.length === 0) return

      const firstDate = dates[0].format('YYYY-MM-DD')
      const lastDate = dates[dates.length - 1].format('YYYY-MM-DD')

      settingFiltersProgrammatically.value = true
      filters.value = { ...filters.value, start: firstDate, end: lastDate }
      await nextTick()
      settingFiltersProgrammatically.value = false

      initializedFromData.value = true
    }

    async function fetchPrebookings() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300))

        const mockResponse = mockData.memberInfo
        const arr = mockResponse.data || []
        const normalized = arr.map(mapApiRecord)

        raw.value = normalized

        // ✅ ตั้งช่วงวันที่ครั้งแรกตาม data เสมอ (แก้ปัญหา filter ไปอยู่ปี 2026 แล้วข้อมูลไม่ขึ้น)
        await initFiltersFromDataIfNeeded(normalized)
      } catch (e) {
        console.group('%c[API] Fetch ERROR', 'color:#d32f2f;font-weight:700')
        console.error('Mock Data Error:', e?.message || e)
        console.groupEnd()
        error.value = e?.message || 'Fetch failed'
      } finally {
        loading.value = false
        await nextTick()
        window.dispatchEvent(new Event('resize'))
      }
    }

    onMounted(async () => {
      await fetchPrebookings()
    })

    const options = computed(() => ({
      extColors: uniq(raw.value.map((r) => r.exteriorColor || '').filter(Boolean)),
      intColors: uniq(raw.value.map((r) => r.InteriorOption || '').filter(Boolean)),
      dealer: uniq(raw.value.map((r) => r.dealer || '').filter(Boolean)),
      model: uniq(raw.value.map((r) => r.model || '').filter(Boolean)),
      ZoneSale: uniq(raw.value.map((r) => r.ZoneSale || '').filter(Boolean)),
    }))

    watch(
      () => [filters.value.start, filters.value.end],
      ([start, end]) => {
        if (!start || !end) return
        if (!dayjs(start).isValid() || !dayjs(end).isValid()) return

        // ถ้า start > end ให้สลับ
        if (dayjs(start).isAfter(dayjs(end))) {
          settingFiltersProgrammatically.value = true
          filters.value = { ...filters.value, start: end, end: start }
          nextTick(() => {
            settingFiltersProgrammatically.value = false
          })
          return
        }

        // mark ว่าผู้ใช้เปลี่ยนเอง เฉพาะตอนที่ไม่ใช่เราตั้งค่าให้เอง
        if (!settingFiltersProgrammatically.value) {
          userApplied.value = true
        }
      }
    )

    return {
      loading,
      error,
      filters,
      options,
      kpiMetrics,
      filteredData,
      wrapperRef,
      isCapturing,
      exportJpg,
    }
  },
}
</script>

<style scoped>
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-inline: 12px;
}

.container.grid {
  display: inline-grid;
  background-color: #fff;
  padding: 16px;
  border-radius: 12px;
  inline-size: min(100%, 1200px);
  max-inline-size: 100%;
  margin-inline: auto;
  overflow: hidden;
  box-sizing: border-box;
}

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

.grid > * {
  min-width: 0;
  overflow: hidden;
}

.grid > *:has(table),
:deep(.apexcharts-canvas),
:deep(.chart) {
  overflow: auto;
}

.capture-mode .container.grid > * {
  overflow: visible !important;
}

.capture-mode .header-row,
.capture-mode .header-row h4,
.capture-mode .header-row h5 {
  overflow: visible !important;
  line-height: 1.4;
  padding-block: 2px;
}

.capture-mode {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-title {
  margin: 0;
  font-weight: 700;
  overflow: visible;
  line-height: 1.4;
}

.btn-capture {
  margin-left: auto;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f7f7f7;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
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
