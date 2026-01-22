<!-- DealerBar.vue -->
<template>
  <div class="card" :style="cardStyle">
    <div class="label">ยอดจองสิทธิ์ตามผู้จำหน่าย</div>

    <!-- wrapper กำหนดความสูงจริงของ chart ตาม chartHeightPx -->
    <div
      class="chart-wrap"
      :style="{ height: chartHeightPx }"
      @wheel.prevent="onWheelForward"
    >
      <Chart
        :key="chartKey"
        class="chart"
        :option="option"
        :barWidth="25"
        width="100%"
        :height="chartHeightPx"
        :autoHover="autoHover"
        :hoverEveryMs="6000"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Chart from './Chart.vue'

const props = defineProps({
  dealer: { type: Array, default: () => [] },
  values: { type: Array, default: () => [] },
  autoHover: {
    type: Boolean,
    default: false
  }
})

// เก็บคู่และเรียงจากมาก->น้อย
const pairsSorted = computed(() => {
  const pairs = (props.dealer || []).map((d, i) => ({
    label: d,
    value: props.values?.[i] ?? 0,
    idx: i
  }))
  pairs.sort((a, b) => b.value - a.value)
  return pairs
})

const option = computed(() => {
  const pairs = pairsSorted.value
  return {
    // ลด right มากขึ้นเพื่อให้แท่งชิดกับ scrollbar มากขึ้น
    grid: { left: 80, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', inverse: true, data: pairs.map(p => p.label) },
    series: [{
      type: 'bar',
      data: pairs.map(p => p.value),
      label: {
        show: true,
        position: 'right',
        distance: 8,
        color: '#333',
        formatter: params => {
          try { return Number(params.value).toLocaleString() } catch { return params.value }
        }
      },
      labelLayout: { hideOverlap: true }
    }],
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      position: (point, params, dom, rect, size) => {
        return [size.viewSize[0] - dom.offsetWidth, 10]
      },
      formatter: function (params) {
        const p = pairs[params.dataIndex]
        return `
          <div style="color: #000; text-align: center;">
            <strong>${p.label}</strong><br/>
            ยอดรวม: ${p.value}<br/>
          </div>
        `
      },
      transitionDuration: 0,
    },
  }
})

// ค่าเดียวกับ ZoneBar (ให้ทั้งสองฝั่งสอดคล้อง)
const ROW_HEIGHT = 36
const VISIBLE_ROWS = 10
const LABEL_HEIGHT = 36
const CHART_PADDING = 80 // เผื่อ grid/top-bottom + margin
const MIN_CHART_HEIGHT = 450 // ความสูงขั้นต่ำ (ไม่ให้ย่อเมื่อข้อมูลน้อย)

// คำนวณความสูงจริง (อย่างน้อย MIN_CHART_HEIGHT)
const chartHeight = computed(() => {
  const count = pairsSorted.value.length || 0
  const desired = count * ROW_HEIGHT + CHART_PADDING
  return Math.max(desired, MIN_CHART_HEIGHT)
})
// ส่งเป็น string "NNNpx" ให้ Chart.vue ชัดเจน
const chartHeightPx = computed(() => `${chartHeight.value}px`)

const cardStyle = computed(() => {
  const count = pairsSorted.value.length || 0
  if (count > VISIBLE_ROWS) {
    // ให้ card แสดง scrollbar แต่สูงสุดที่สอดคล้องกับ MIN_CHART_HEIGHT
    const max = Math.max(VISIBLE_ROWS * ROW_HEIGHT + CHART_PADDING + LABEL_HEIGHT, MIN_CHART_HEIGHT + LABEL_HEIGHT)
    return { maxHeight: `${max}px`, overflowY: 'auto' }
  }
  return {}
})

// เพิ่ม computed key เพื่อ remount chart เมื่อ labels/values เปลี่ยน
const chartKey = computed(() =>
  pairsSorted.value.map(p => `${p.label}:${p.value}`).join('|')
)

// forward wheel from inner chart-wrap to outer .card so only one scroll is active
function onWheelForward(e) {
  // find closest scrollable parent .card
  const wrap = e.currentTarget
  const card = wrap && wrap.closest && wrap.closest('.card')
  if (!card) return
  // scroll the parent by wheel delta
  card.scrollTop += e.deltaY
}
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  text-align: center;
  min-height: 0;
  min-width: 0;
  padding-right: 0;
}

.chart-wrap {
  overflow: visible;
  width: 100%;
  min-width: 0;
  flex: 0 0 auto;
  box-sizing: border-box;
  padding-right: 0;
}

.chart {
  width: 100% !important;
  height: 100% !important;
  min-width: 0;
  flex: 0 0 auto;
  box-sizing: border-box;
}

.card > *:last-child {
  flex: 0 0 auto;
  min-height: 0;
  align-self: stretch;
}

.label {
  font-size: 12px;
  padding: 8px 0;
}
</style>
