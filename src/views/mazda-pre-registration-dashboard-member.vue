<!-- mazda-pre-registration-dashboard-member.vue -->
<template>
  <div class="wrapper" ref="wrapperRef" :class="{ 'capture-mode': isCapturing }">

    <div class="container grid">
      <div class="header-row">
        <h5 class="header-title">Mazda Sales Thailand</h5>
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
import axios from 'axios'
import * as htmlToImage from 'html-to-image'
// Utils (เหลือเฉพาะที่ใช้จริง)
import { uniq } from '@/utils'

import FiltersMember from '@/components/Dashboard/FiltersMember.vue'
import KPImember from '@/components/Dashboard/KPImember.vue'

import domtoimage from 'dom-to-image';

const todayStr = () => dayjs().format('YYYY-MM-DD')
const startOfYearStr = (d = dayjs()) => d.startOf('year').format('YYYY-MM-DD')

// Static mock data
const mockData = {
  memberInfo: {
    total: {
      "2024-10": 45,
      "2024-11": 67,
      "2024-12": 89,
      "2025-01": 123
    },
    lineConnected: {
      "2024-10": 32,
      "2024-11": 48,
      "2024-12": 65,
      "2025-01": 87
    },
    data: [
      {
        "RegisterDate": "2025-01-15T08:30:00Z",
        "MemberDisplayId": "MZ001234",
        "FirstName": "สมชาย",
        "LastName": "ใจดี",
        "Email": "somchai@email.com",
        "Phone": "081-234-5678",
        "Newsletter": "On",
        "LineConnected": "Yes"
      },
      {
        "RegisterDate": "2025-01-14T10:15:00Z",
        "MemberDisplayId": "MZ001235",
        "FirstName": "สุดา",
        "LastName": "รักดี",
        "Email": "suda@email.com",
        "Phone": "082-345-6789",
        "Newsletter": "Off",
        "LineConnected": "No"
      },
      {
        "RegisterDate": "2025-01-13T14:20:00Z",
        "MemberDisplayId": "MZ001236",
        "FirstName": "วิชัย",
        "LastName": "มั่นคง",
        "Email": "wichai@email.com",
        "Phone": "083-456-7890",
        "Newsletter": "On",
        "LineConnected": "Yes"
      }
    ]
  }
};

/* ---------- helpers ที่ยังใช้ ---------- */
function monthFromKey(k) {
  const d = dayjs(k, ['YYYY-MM', 'MMM-YY'], true)
  return d.isValid() ? d.startOf('month') : null
}
function rangeFromMetrics(metricsObj) {
  const entries = Object.entries(metricsObj || {})
    .map(([k, v]) => ({ k, v: Number(v), d: monthFromKey(k) }))
    .filter(x => x.d)
    .sort((a, b) => a.d.valueOf() - b.d.valueOf())
  if (!entries.length) return null
  const positives = entries.filter(x => x.v > 0)
  const first = (positives[0] || entries[0]).d
  const last = (positives[positives.length - 1] || entries[entries.length - 1]).d
  return {
    start: first.format('YYYY-MM-DD'),
    end: last.endOf('month').format('YYYY-MM-DD'),
    firstPositiveMonthKey: (positives[0] || entries[0]).k
  }
}
function intersectOrUnionRanges(a, b) {
  if (a && b) {
    const s = dayjs.max(dayjs(a.start), dayjs(b.start)).format('YYYY-MM-DD')
    const e = dayjs.min(dayjs(a.end), dayjs(b.end)).format('YYYY-MM-DD')
    if (dayjs(s).isAfter(dayjs(e))) {
      return {
        start: dayjs.min(dayjs(a.start), dayjs(b.start)).format('YYYY-MM-DD'),
        end: dayjs.max(dayjs(a.end), dayjs(b.end)).format('YYYY-MM-DD')
      }
    }
    return { start: s, end: e }
  }
  return a || b || null
}

// ตรวจว่า payload เป็น "รายการดิบ" ได้ไหม (โดยไม่ throw)
function isArrayPayload(payload) {
  const cands = [payload, payload?.data, payload?.items, payload?.rows, payload?.result?.items, payload?.result?.rows]
  return cands.some(a => Array.isArray(a))
}
function extractArray(payload) {
  const cands = [payload, payload?.data, payload?.items, payload?.rows, payload?.result?.items, payload?.result?.rows]
  const arr = cands.find(a => Array.isArray(a))
  if (!arr) throw new Error('Unexpected API shape, no array found')
  return arr
}
function mapApiRecord(r) {
  const d = r.RegisterDate ? dayjs(r.RegisterDate) : null
  return {
    RegisterDate: d && d.isValid() ? d.format('YYYY-MM-DDTHH:mm:ss') : null, // กัน timezone เลื่อนวัน
    MemberDisplayId: r.MemberDisplayId || '',
    FirstName: r.FirstName || '',
    LastName: r.LastName || '',
    Email: r.Email || '',
    Phone: r.Phone || '',
    _raw: r
  }
}

/** ========= COMPONENT ========= */
export default {
  components: { FiltersMember, KPImember },
  setup() {
    const totalsByMonthFromApi = ref({})
    const lineConnectedByMonthFromApi = ref({})
    const kpiMetrics = computed(() => ({
      total: totalsByMonthFromApi.value,
      lineConnected: lineConnectedByMonthFromApi.value
    }))

    const raw = ref([])
    const loading = ref(true)
    const error = ref(null)
    const filters = ref({
      start: startOfYearStr(),
      end: todayStr(),
    })

    const userApplied = ref(false)
    let probingFirstDayDone = false // กันลูปยิงซ้ำ
    let fetchTimer = null


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

        // สร้างลิงก์ดาวน์โหลด
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `Pre_Registration_Member_${dayjs().format('YYYYMMDD_HHmmss')}.jpg`;
        a.click();
      } catch (e) {
        console.error(e);
        alert('บันทึก JPG ไม่สำเร็จ ลองใหม่อีกครั้ง');
      } finally {
        isCapturing.value = false;
      }
    }



    async function fetchPrebookings({ startOverride, endOverride } = {}) {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Use static mock data
        const mockResponse = mockData.memberInfo
        if (mockResponse && typeof mockResponse === 'object'
          && mockResponse.total && mockResponse.lineConnected) {
          // === metrics mode ===
          totalsByMonthFromApi.value = mockResponse.total || {}
          lineConnectedByMonthFromApi.value = mockResponse.lineConnected || {}
          raw.value = []

          const fromTotals = rangeFromMetrics(totalsByMonthFromApi.value)
          const fromLines = rangeFromMetrics(lineConnectedByMonthFromApi.value)
          const range = intersectOrUnionRanges(fromTotals, fromLines)

          if (range) {
            // ตั้งช่วงกว้างก่อน
            filters.value = { ...filters.value, start: range.start, end: range.end }
            // พยายาม “ล็อกเป็นวันแรกที่มีข้อมูลจริง” ด้วยการ probe เดือนแรกที่เป็นบวก
            if (!probingFirstDayDone) {
              probingFirstDayDone = true
              const monthKey = (fromTotals?.firstPositiveMonthKey) || (fromLines?.firstPositiveMonthKey)
              const m = monthFromKey(monthKey || '')
              if (m) {
                await probeFirstDayInMonth(m)
              }
            }
          }

        } else {
          // === list mode ===
          const arr = mockResponse.data || []
          const normalized = arr.map(mapApiRecord)
          raw.value = normalized

          // สร้าง metrics จากรายการดิบ (เผื่อใช้กับ KPI)
          const toKey = d => (d && dayjs(d).isValid()) ? dayjs(d).format('YYYY-MM') : null
          const totals = {}; const lines = {}
          const isOn = v => {
            const s = String(v ?? '').trim().toLowerCase()
            return s === 'on' || s === 'yes' || s === 'true' || s === '1' || s === 'y'
          }
          for (const r of normalized) {
            const key = toKey(r.RegisterDate)
            if (!key) continue
            totals[key] = (totals[key] || 0) + 1
            const connected = isOn(r.Newsletter) || isOn(r.LineConnected)
            if (connected) lines[key] = (lines[key] || 0) + 1
          }
          totalsByMonthFromApi.value = totals
          lineConnectedByMonthFromApi.value = lines

          // >>> หา "วันแรกจริง" จากรายการดิบ
          const first = normalized
            .map(r => r.RegisterDate)
            .filter(Boolean)
            .map(d => dayjs(d))
            .filter(d => d.isValid())
            .sort((a, b) => a.valueOf() - b.valueOf())[0]
          if (first) {
            const endKeep = (filters.value.end && dayjs(filters.value.end).isValid())
              ? dayjs(filters.value.end).format('YYYY-MM-DD')
              : todayStr()
            filters.value = { ...filters.value, start: first.format('YYYY-MM-DD'), end: endKeep }
          }
        }

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

    // ยิงซ้ำเฉพาะ “เดือนแรกที่มีข้อมูล” เพื่อหา first day จริง (ถ้า API ยอมส่ง list)
    async function probeFirstDayInMonth(monthStart) {
      const start = monthStart.format('YYYY-MM-DD')
      const end = monthStart.endOf('month').format('YYYY-MM-DD')
      try {
        const res = await api.get(ENDPOINT_PREBOOKINGS, { params: { start, end } })
        if (isArrayPayload(res?.data)) {
          const arr = extractArray(res.data).map(mapApiRecord)
          if (arr.length) {
            const first = arr
              .map(r => r.RegisterDate).filter(Boolean)
              .map(d => dayjs(d)).filter(d => d.isValid())
              .sort((a, b) => a.valueOf() - b.valueOf())[0]
            if (first) {
              const keepEnd = (filters.value.end && dayjs(filters.value.end).isValid())
                ? dayjs(filters.value.end).format('YYYY-MM-DD')
                : end
              filters.value = { ...filters.value, start: first.format('YYYY-MM-DD'), end: keepEnd }
            }
          }
        }
        // ถ้ายังได้เป็น metrics → ปล่อย start = วันแรกของเดือนตามเดิม
      } catch (e) {
        console.warn('[probeFirstDayInMonth] skip:', e?.message || e)
      }
    }

    onMounted(async () => {
      await fetchPrebookings() // ใช้ filters.start / filters.end ที่เพิ่งตั้ง
      userApplied.value = true
    })


    /* ---------- options สำหรับตัวกรอง ---------- */
    const options = computed(() => ({
      extColors: uniq(raw.value.map(r => r.exteriorColor || '').filter(Boolean)),
      intColors: uniq(raw.value.map(r => r.InteriorOption || '').filter(Boolean)),
      dealer: uniq(raw.value.map(r => r.dealer || '').filter(Boolean)),
      model: uniq(raw.value.map(r => r.model || '').filter(Boolean)),
      ZoneSale: uniq(raw.value.map(r => r.ZoneSale || '').filter(Boolean))
    }))

    /* ---------- watch filters เพื่อยิง API ใหม่ ---------- */
    watch(
      () => [filters.value.start, filters.value.end],
      ([start, end]) => {
        if (!start || !end) return
        if (dayjs(start).isValid() && dayjs(end).isValid() && dayjs(start).isAfter(dayjs(end))) {
          const fixed = { ...filters.value, start: end, end: start }
          filters.value = fixed
        }
        if (fetchTimer) clearTimeout(fetchTimer)
        fetchTimer = setTimeout(() => {
          userApplied.value = true
          fetchPrebookings()
        }, 400)
      }
    )

    return {
      loading, error,
      filters, options,
      kpiMetrics,
      totalsByMonthFromApi, lineConnectedByMonthFromApi
      ,
      wrapperRef, isCapturing, exportJpg
    }
  }
}
</script>

<style scoped>
/* (style เดิม) */
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-inline: 12px
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
  box-sizing: border-box
}

.container.grid * {
  box-sizing: border-box;
  max-inline-size: 100%
}

.grid {
  display: grid;
  gap: 16px;
  inline-size: 100%;
  min-width: 0
}

.grid:not(.two-cols):not(.three-cols) {
  grid-template-columns: 1fr
}

.grid.two-cols {
  grid-template-columns: repeat(2, minmax(0, 1fr))
}

.grid.three-cols {
  grid-template-columns: repeat(3, minmax(0, 1fr))
}

.grid>* {
  min-width: 0;
  overflow: hidden
}

.grid>*:has(table),
:deep(.apexcharts-canvas),
:deep(.chart) {
  overflow: auto
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
  white-space: normal
}

.container.grid :where(img, canvas, svg, video) {
  display: block;
  max-inline-size: 100%;
  height: auto
}

:deep(.data-table) {
  max-inline-size: 100%;
  overflow: auto
}

:deep(.data-table table) {
  width: 100%;
  table-layout: fixed
}

:deep(.data-table th),
:deep(.data-table td) {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap
}

:deep(.apexcharts-canvas),
:deep(.chart-root),
:deep(.chart-container) {
  inline-size: 100% !important;
  max-inline-size: 100% !important;
  min-width: 0 !important;
  contain: content
}

h4,
h5 {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis
}
</style>
