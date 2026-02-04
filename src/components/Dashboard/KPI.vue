<template>
  <div class="card kpis">
    <div class="row">
      <div class="info-card">
        <div class="card-item">
          <div class="label">ยอดจองสิทธิ์</div>
          <div class="badge">{{ total }}</div>
        </div>
      </div>

      <div class="info-card">
        <div class="card-item">
          <div class="label">ยินยอมรับข่าวสาร ​<br>
            e-Newsletter ของ</div>
          <div class="badge">{{ newsletterOn }}</div>
        </div>
        <a> **ยินยอมใน pre-registration flow เท่านั้น​</a>
      </div>
    </div>

    <!-- <div class="chart-container">
      <Chart height="300px" :barWidth="25" :autoHover="autoHover"  :hoverEveryMs="6000" />
    </div> -->
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Chart from './Chart.vue'

// ---------- props (คงไว้เพื่อ backward compat) ----------
const props = defineProps({
  months: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    required: true
  },
  newsletterOn: {
    type: Number,
    required: true
  },
    autoHover: {
    type: Boolean,
    default: false
  }
})


// ---------- consent stats ----------
function isYes(v) {
  const s = String(v ?? '').trim().toLowerCase()
  return s === 'On' || s === 'y' || s === 'true' || s === '1'
}

function isNo(v) {
  const s = String(v ?? '').trim().toLowerCase()
  return s === 'Off' || s === 'n' || s === 'false' || s === '0'
}

function pickStatus(row) {
  return row.Newsletter ?? row.associatedPerson?.Newsletter ?? null
}

const NewsletterStats = computed(() => {
  const list = props.Newsletter ?? []
  let On = 0,
    Off = 0,
    unknown = 0
  for (const r of list) {
    const v = pickStatus(r)
    if (isYes(v)) On++
    else if (isNo(v)) Off++
    else unknown++
  }
  return { On, Off, unknown }
})

const NewsletterCount = computed(() => NewsletterStats.value.On)
</script>

<style>
/* (เดิมทั้งหมด) */
:root {
  --bg: #f5f6f8;
  --card: #ffffff;
  --text: #1f2937;
  --muted: #6b7280;
  --accent: #ef4444;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, Arial, sans-serif;
}

.container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.grid {
  display: grid;
  gap: 16px;
}

.card {
  background: var(--card);
  border-radius: 16px;
  box-shadow: none;
  padding: 16px;
}

.info-card {
  text-align: center;
  flex: 1;
}

.card-item {
  background: var(--card);
  background-color: #ffffff;
  border-radius: 16px;
  border: 0.5px solid #bdbdbd;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  width: 100%;
  min-height: 120px;
  padding: 20px 24px;
}

.card-item .label,
.card-item .badge {
  display: block;
}

hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 12px 0;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th,
.table td {
  padding: 10px;
  border-bottom: 1px solid #eee;
  text-align: left;
  white-space: nowrap;
}

.table tbody tr:hover {
  background: #fafafa;
}

.controls input,
.controls select {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
}

.controls .group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.kpis {
  display: flex;
  flex-direction: row;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
}

.row {
  display: flex;
  gap: 30px;
  flex: 1;
  padding: 20px;
}

.chart-container {
  flex: 1;
}

.label {
  color: var(--muted);
  font-size: 16px;
}

.badge {
  color: #111827;
  border-radius: 12px;
  padding: 6px 12px;
  font-weight: 600;
  font-size: 20px;
  display: inline-block;
}

.pagination {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}

button {
  padding: 8px 12px;
  border: none;
  border-radius: 10px;
  background: #111827;
  color: #fff;
  cursor: pointer;
}

button.ghost {
  background: #e5e7eb;
  color: #111827;
}

a {
  color: var(--muted);
  font-size: 12px;
}

@media (max-width:900px) {
  .kpis {
    grid-template-columns: 1fr;
  }
}
</style>
