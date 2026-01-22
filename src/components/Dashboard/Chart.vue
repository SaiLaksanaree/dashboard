<!-- chart.vue (เวอร์ชันตัด auto-hover ออกหมด) -->
<template>
  <!-- เพิ่ม overflow:hidden และจับ wheel ที่นี่ เพื่อ forward ไปยัง .card -->
  <div
    ref="refEl"
    :style="{ width: widthPx, height: heightPx, overflow: 'hidden' }"
    @wheel.prevent="onWheelForward"
  ></div>
</template>
<script setup>
import * as echarts from 'echarts'
import {
  onMounted,
  onBeforeUnmount,
  ref,
  nextTick,
  defineProps,
  watch,
  computed,
} from 'vue'

const props = defineProps({
  option: { required: true },
  width: { default: '100%' },
  height: { default: '24px' },
  // จะมี prop ไว้ก็ได้ แต่เราไม่ใช้
  autoHover: { type: Boolean, default: false },
  hoverEveryMs: { default: 6000 },
  barWidth: { default: null },
  barMaxWidth: { default: null },
  barMinWidth: { default: null },
  barGap: { default: null },
  barCategoryGap: { default: null },
  colorMap: { default: () => ({}) },
})

const fallbackColors = ['#a6a6a6', '#666666', '#d30000']

const refEl = ref(null)
let chart = null
let resizeHandler = null

function toCssSize(v) {
  if (typeof v === 'number') return `${v}px`
  if (typeof v === 'string' && /^\d+$/.test(v)) return `${v}px`
  return v
}

const widthPx = computed(() => toCssSize(props.width))
const heightPx = computed(() => toCssSize(props.height))

function render() {
  if (!refEl.value) return

  // init
  if (!chart || chart.isDisposed?.()) {
    chart = echarts.init(refEl.value)

    // เวลาเมาส์ออก ให้ซ่อน tooltip
    chart.getZr().on('globalout', () => {
      chart.dispatchAction({ type: 'hideTip' })
    })
  }

  // clone option แล้วแต่งเรื่อง bar + สี
  const newOption = { ...props.option }

  if (newOption.series) {
    newOption.series = newOption.series.map((s, i) => {
      const base = { ...s }

      if (base.type === 'bar') {
        if (props.barWidth != null) base.barWidth = props.barWidth
        if (props.barMaxWidth != null) base.barMaxWidth = props.barMaxWidth
        if (props.barMinWidth != null) base.barMinWidth = props.barMinWidth
        if (props.barGap != null) base.barGap = props.barGap
        if (props.barCategoryGap != null) base.barCategoryGap = props.barCategoryGap
      }

      const seriesName = base.name ?? `series_${i}`
      const seriesColor =
        props.colorMap[seriesName] ?? fallbackColors[i % fallbackColors.length]

      base.itemStyle = {
        ...(base.itemStyle || {}),
        color: base.itemStyle?.color ?? seriesColor,
      }

      return base
    })
  }

  chart.setOption(newOption, true)

  // ❗ สำคัญ: ทุกครั้งที่ render ให้ซ่อน tooltip ไปก่อน
  chart.dispatchAction({ type: 'hideTip' })
}

onMounted(async () => {
  await nextTick()
  render()

  resizeHandler = () => {
    if (chart && !chart.isDisposed?.()) {
      chart.resize()
      chart.dispatchAction({ type: 'hideTip' })
    }
  }
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
  if (chart && !chart.isDisposed?.()) {
    chart.dispose()
    chart = null
  }
})

// ถ้า option เปลี่ยนก็แค่ render ใหม่
watch(() => props.option, render, { deep: true })

// ถ้าเปลี่ยนขนาดก็ resize แล้วซ่อน tooltip
watch(() => [props.width, props.height], () => {
  if (chart && !chart.isDisposed?.()) {
    chart.resize()
    chart.dispatchAction({ type: 'hideTip' })
  }
})

// forward wheel from chart element to nearest .card (same logic as DealerBar/ZoneBar)
function onWheelForward(e) {
  const el = refEl.value
  if (!el || !e) return
  const card = el.closest && el.closest('.card')
  if (!card) return
  card.scrollTop += e.deltaY
}
</script>
