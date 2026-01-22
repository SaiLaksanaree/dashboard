<template>
  <div style="text-align: center;">จำนวนสมาชิกและเชื่อมต่อไลน์รายเดือน</div>
  <div ref="refEl" :style="{ width: widthPx, height: heightPx }"></div>
</template>

<script setup>
import * as echarts from 'echarts';
import { onMounted, onBeforeUnmount, ref, nextTick, defineProps, watch, computed } from 'vue';

const props = defineProps({
  option: { required: true },
  width: { default: '100%' },
  height: { default: '360px' },
  autoHover: { default: false },
  hoverEveryMs: { default: 6000 },
  barWidth: { default: null },
  barMaxWidth: { default: null },
  barMinWidth: { default: null },
  barGap: { default: null },
  barCategoryGap: { default: null },
  colorMap: {
    default: () => ({
      'สมาชิก': '#b30000',
      'เชื่อมต่อ line': '#e06b2d',
    })
  },
});

const fallbackColors = ['#b30000', '#e06b2d', '#666'];

let refEl = ref(null);
let chart = null;
let timer = null;
let pausedUntil = 0;
let lastIndex = -1;

function render() {
  if (!refEl.value) return;

  if (!chart) {
    chart = echarts.init(refEl.value);
    chart.on('mouseover', () => { pausedUntil = Date.now() + props.hoverEveryMs * 2; });
  }

  const baseOption = {
    backgroundColor: '#fff',
    textStyle: { fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif' },
    title: {
      // text: 'จำนวนสมาชิกและเชื่อมต่อไลน์รายเดือน',
      left: 'center',
      textStyle: { color: '#6b7280', fontWeight: 'normal', fontSize: 16 }
    },
    legend: {
      bottom: 10,
      left: 'center',
      orient: 'horizontal',
      itemWidth: 36,
      itemHeight: 8,
      icon: 'roundRect',
      textStyle: { fontSize: 12, color: '#666', fontWeight: 500 }
    },
    grid: { top: 0, left: 40, right: 30, bottom: 70, containLabel: true }
    ,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      borderRadius: 6
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { fontSize: 12, color: '#595959', margin: 18 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { fontSize: 12, color: '#666', margin: 12 }
    }
  };

  const newOption = echarts.util.merge({}, baseOption, true);
  echarts.util.merge(newOption, props.option, true);

  if (newOption.series) {
    newOption.series = newOption.series.map((s, i) => {
      const base = { ...s };

      // บังคับให้เป็นเส้น
      if (!base.type || base.type === 'bar') base.type = 'line';

      const seriesName = base.name ?? `series_${i}`;
      const seriesColor = props.colorMap[seriesName] ?? fallbackColors[i % fallbackColors.length];

      base.smooth = false;
      base.showSymbol = 'auto';        
      base.emphasis = { focus: 'none' }; 
      base.symbolSize = 6;
      base.lineStyle = { width: 5, cap: 'round' };
      base.itemStyle = { ...(base.itemStyle || {}), color: base.itemStyle?.color ?? seriesColor };

      const PAD = 4;

      const baseOption = {
        // ...
        labelLayout: (p) => {
          const isEndPoint = p.dataIndex === p.seriesDataCount - 1;
          if (!isEndPoint) return;

          const r = p.labelRect;   // กล่องของเลเบล
          const v = p.viewRect;    // พื้นที่กริด
          const rightLimit = v.x + v.width - PAD;

          const overflowRight = r.x + r.width > rightLimit;

          if (overflowRight) {
            return { x: rightLimit - r.width, align: 'left' };
          }
          return { align: 'right' };
        }
      };


      base.label = { show: false };

      base.endLabel = {
        show: true,
        formatter: ({ value }) => String(value),
        fontSize: 12,
        fontWeight: 600,
        color: '#404040',
        align: 'right',     
        offset: [10, 0]      
      };
      base.clip = false;   
      delete base.barWidth; delete base.barMaxWidth;
      delete base.barMinWidth; delete base.barGap; delete base.barCategoryGap;

      return base;
    });
  }

  chart.setOption(newOption, true);
  setupAutoHover();
}

function toCssSize(v) {
  if (typeof v === 'number') return `${v}px`;
  if (typeof v === 'string' && /^\d+$/.test(v)) return `${v}px`;
  return v;
}
const widthPx = computed(() => toCssSize(props.width));
const heightPx = computed(() => toCssSize(props.height));

function setupAutoHover() {
  if (!props.autoHover) { clearInterval(timer); timer = null; return; }
  clearInterval(timer);
  timer = setInterval(autoStep, props.hoverEveryMs);
}

// ปรับ autoStep ให้ไม่ highlight เส้น (กันภาพลวงตาเส้นซ้อน)
function autoStep() {
  if (!chart) return;
  if (Date.now() < pausedUntil) return;
  const opt = chart.getOption();
  if (!opt.series || !opt.series.length) return;
  const len = (opt.series[0].data && opt.series[0].data.length) || 0;
  if (!len) return;

  const nextIndex = (lastIndex + 1) % len;

  chart.dispatchAction({ type: 'hideTip' });
  chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: nextIndex });

  lastIndex = nextIndex;
}

onMounted(async () => {
  await nextTick();
  render();
  window.addEventListener('resize', () => chart && chart.resize());
});

onBeforeUnmount(() => {
  if (chart && !chart.isDisposed?.()) {
    chart.dispose()
  }
})


watch(() => props.option, render, { deep: true });
watch(() => props.autoHover, setupAutoHover);
watch(() => props.hoverEveryMs, setupAutoHover);
watch(() => [props.width, props.height], () => chart && chart.resize());
</script>
