<!-- PackagePie.vue -->
<template>
  <div class="card">
    <div class="label">ยอดจองสิทธิ์ตามข้อเสนอพิเศษ</div>
    <Chart :option="option" height="280px" :barWidth="25" :autoHover="autoHover" :hoverEveryMs="6000" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Chart from './Chart.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  autoHover: {
    type: Boolean,
    default: false
  }
})

const MAX_CHARS_PER_LINE = 12 // ปรับได้ตามต้องการ

function wrapByWord(text, maxPerLine = MAX_CHARS_PER_LINE) {
  if (!text) return ''
  const words = text.split(' ')      // แยกด้วย space
  const lines = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word
    if (testLine.length > maxPerLine && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines.join('\n')            // ใช้ \n ให้ ECharts ขึ้นบรรทัดใหม่
}

function getColor(index) {
  const colors = ['#a6a6a6', '#c00000', '#414550', '#a27f61', '#6f9fbf', '#8561c5']
  return colors[index % colors.length]
}

const option = computed(() => {
  const items = props.items ?? []
  const isSingle = items.length === 1

  return {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      position: function (point, params, dom, rect, size) {
        return [size.viewSize[0] - dom.offsetWidth, 0] // ขวาบน
      },
      formatter: function (params) {
        return `
          <div style="color: #000; text-align: center;">
            <strong>${params.name}</strong><br/>
            ยอดรวม: ${params.value}<br/>
            เปอร์เซ็นต์: ${params.percent}%
          </div>
        `;
      },
      transitionDuration: 0,  // ทำให้ tooltip ปรากฏขึ้นทันที
    },
    series: [
      {
        type: 'pie',
        radius: isSingle ? ['0%', '60%'] : '60%',
        startAngle: 270,
        center: ['50%', '55%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'outside',
          formatter: (params) => {
            const name = wrapByWord(params.name)
            return `${name}\nยอดรวม : ${params.value} (${params.percent}%)`
          },
          fontSize: 11,
          color: '#414550',
          width: 90,
          overflow: 'break',
          lineHeight: 14,
        },
        labelLine: {
          show: true,
          length: 14,
          length2: 10,
          smooth: true,
        },
        data: items
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, 'th'))
          .map((item, index) => ({
            ...item,
            itemStyle: {
              color: getColor(index),
              borderColor: '#fff',
              borderWidth: 2,
            },
          }))
      }
    ],
  }
})
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 90%;
  box-shadow: none;
}

.label {
  font-size: 12px;
  margin-bottom: 20px;
}
</style>
