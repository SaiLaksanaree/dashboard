<!-- KPImember.vue -->
<template>
  <div class="card kpis">
    <div class="row">
      <div class="info-card">
        <div class="card-item">
          <div class="label">สมาชิก</div>
          <div class="badge">{{ totalAll }}</div>
        </div>
      </div>

      <div class="info-card">
        <div class="card-item">
          <div class="label">เชื่อมต่อไลน์</div>
          <div class="badge">{{ lineConnectedAll }}</div>
        </div>
        <a> ​</a>
      </div>
    </div>

    <div class="chart-container">
      <ChartMember :option="option" height="300px" :barWidth="25" :autoHover="autoHover"  :hoverEveryMs="6000" />
    </div>
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import ChartMember from './ChartMember.vue'


const props = defineProps({
  metrics: { type: Object, default: null },
  totalsByMonth: { type: Object, default: null },
  lineConnectedByMonth: { type: Object, default: null },
    autoHover: {
    type: Boolean,
    default: false
  }
})

// รวมแหล่งข้อมูลให้เหลือชุดเดียว
const data = computed(() => {
  const m = props.metrics ?? {}
  return {
    total: m.total ?? props.totalsByMonth ?? {},
    lineConnected: m.lineConnected ?? props.lineConnectedByMonth ?? {}
  }
})

// เตือนถ้าไม่มีข้อมูลเข้ามา
watchEffect(() => {
  const hasAny =
    (data.value.total && Object.keys(data.value.total).length) ||
    (data.value.lineConnected && Object.keys(data.value.lineConnected).length)
  if (!hasAny) {
    console.warn('[KPImember] No data provided. Pass metrics={ total:{}, lineConnected:{} } or the two props.')
  }
})

// แกนเดือน (YYYY-MM) เรียงเวลา
const months = computed(() => {
  const keys = new Set([
    ...Object.keys(data.value.total ?? {}),
    ...Object.keys(data.value.lineConnected ?? {})
  ])
  return Array.from(keys).sort() // YYYY-MM เรียง lexicographical ได้
})

// ซีรีส์ตามเดือน
const totalSeries = computed(() => months.value.map(m => Number(data.value.total?.[m] ?? 0)))
const lineConnectedSeries = computed(() => months.value.map(m => Number(data.value.lineConnected?.[m] ?? 0)))

// รวมยอดสำหรับ badge
const sum = arr => arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)
const totalAll = computed(() => sum(totalSeries.value))
const lineConnectedAll = computed(() => sum(lineConnectedSeries.value))

// ตัวเลือกกราฟ (สไตล์ ECharts)
const option = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['สมาชิก', 'เชื่อมต่อไลน์'] },
  grid: { left: 20, right: 20, top: 30, bottom: 40, containLabel: true },
  xAxis: { type: 'category', data: months.value },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    { name: 'สมาชิก', type: 'bar', data: totalSeries.value, barGap: '20%' },
    { name: 'เชื่อมต่อไลน์', type: 'bar', data: lineConnectedSeries.value }
  ]
}))
</script>

<style>
/* ใช้สไตล์เดิมของคุณทั้งหมด */
:root {
  --bg: #f5f6f8;
  --card: #ffffff;
  --text: #1f2937;
  --muted: #6b7280;
  --accent: #ef4444;
}

* {
  box-sizing: border-box
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, Arial, sans-serif
}

.container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto
}

.grid {
  display: grid;
  gap: 16px
}

.card {
  background: var(--card);
  border-radius: 16px;
  box-shadow: none;
  padding: 16px
}

.card-item {
  background: #fff;
  border-radius: 16px;
  border: .5px solid #bdbdbd;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  width: 100%;
  min-height: 120px;
  padding: 20px 24px
}

.card-item .label,
.card-item .badge {
  display: block
}

.kpis {
  display: flex;
  flex-direction: row;
  gap: 16px;
  justify-content: space-between;
  align-items: center
}

.row {
  display: flex;
  flex-direction: column;
  gap: 30px;
  flex: 1;
  padding: 20px;
  align-items: center
}

.info-card {
  flex: 0 0 auto;
  width: 260px
}

.chart-container {
  flex: 1
}

.label {
  color: var(--muted);
  font-size: 16px
}

.badge {
  color: #111827;
  border-radius: 12px;
  padding: 6px 12px;
  font-weight: 600;
  font-size: 20px;
  display: inline-block
}

@media (max-width:900px) {
  .kpis {
    grid-template-columns: 1fr
  }
}
</style>
