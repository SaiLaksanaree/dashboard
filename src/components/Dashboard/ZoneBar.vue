<template>
  <div class="card">
    <div class="label">ยอดจองสิทธิ์ตาม Zone</div>
    <Chart :option="option" height="450px" :barWidth="25" :autoHover="autoHover" :hoverEveryMs="6000" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Chart from './Chart.vue'

const props = defineProps({
  dealer: {
    type: Array,
    required: true
  },
  values: {
    type: Array,
    required: true
  }, 
  autoHover: {
    type: Boolean,
    default: false
  }
})

// ฟังก์ชันคืนค่าของแต่ละ index (คงไว้ถ้าจำเป็นที่อื่น)
const getTotal = (categoryIndex) => {
  return props.values[categoryIndex] ?? 0
}

// สร้าง option โดยเรียงคู่ (dealer, value) จากมากไปน้อย
const option = computed(() => {
  const pairs = (props.dealer || []).map((d, i) => ({
    label: d,
    value: props.values?.[i] ?? 0,
    idx: i
  }))

  pairs.sort((a, b) => b.value - a.value) // มาก -> น้อย

  return {
    grid: { left: 80, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'value' },
    // ใส่ inverse: true เพื่อให้รายการตัวแรกแสดงบนสุด
    yAxis: { type: 'category', inverse: true, data: pairs.map(p => p.label) },
    series: [{ type: 'bar', data: pairs.map(p => p.value) }],
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      position: (point, params, dom, rect, size) => {
        return [size.viewSize[0] - dom.offsetWidth, 10] // ขวาบน
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
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100%;
}

.label {
  font-size: 12px;
}
</style>
