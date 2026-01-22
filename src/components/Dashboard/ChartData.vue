<!-- ChartData.vue -->

<template>
  <div class="card">
    <!-- label เดียว เปลี่ยนตาม state -->
    <div class="label">
      {{ isDaily ? 'ยอดจองสิทธิ์รายวัน' : 'ยอดจองสิทธิ์รายเดือน' }}
    </div>

    <!-- ใช้ v-show ซ่อน/แสดงตามกราฟที่ใช้งาน -->
    <div id="monthly-chart" style="width: 100%; height: 350px;" v-show="!isDaily"></div>

    <div id="daily-chart" style="width: 100%; height: 350px;" v-show="isDaily"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import axios from 'axios';
import dayjs from 'dayjs';

const API_BASE = import.meta.env.VITE_API_BASE;
const API_KEY = import.meta.env.VITE_API_TOKEN;

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  if (API_KEY) {
    config.headers.Authorization = `Bearer ${API_KEY}`;
  }
  return config;
});

function initChartById(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const exist = echarts.getInstanceByDom(el);
  if (exist) exist.dispose();
  return echarts.init(el);
}

export default {
  name: 'ChartData',
  props: {
    dateMin: { type: String, required: true },
    dateMax: { type: String, required: true },
    dailyThreshold: { type: Number, default: 7 },
    dealer: { type: String, required: true },
    zone: { type: String, default: '' },
  },

  data() {
    return {
      isDaily: false,
    };
  },

  watch: {
    dateMin: 'updateCharts',
    dateMax: 'updateCharts',
    dealer: 'updateCharts',
    zone: 'updateCharts',

  },

  mounted() {
    this.updateCharts();
  },

  methods: {
    rangeDays(a, b) {
      return (
        dayjs(b).endOf('day').diff(dayjs(a).startOf('day'), 'day') + 1
      );
    },

    async updateCharts() {
      const days = this.rangeDays(this.dateMin, this.dateMax);
      const useDaily = days > 0 && days <= this.dailyThreshold;

      // อัพเดต state ให้ label และ v-show ใช้
      this.isDaily = useDaily;

      if (useDaily) {
        await this.updateDailyChart();
        // ให้ Vue จัดการซ่อน/แสดงผ่าน v-show แทน style.display
        this.$nextTick(() => {
          echarts
            .getInstanceByDom(document.getElementById('daily-chart'))
            ?.resize();
        });
      } else {
        await this.updateMonthlyChart();
        this.$nextTick(() => {
          echarts
            .getInstanceByDom(document.getElementById('monthly-chart'))
            ?.resize();
        });
      }
    },

    isSameMonth(dateMin, dateMax) {
      const minDate = dayjs(dateMin);
      const maxDate = dayjs(dateMax);
      return (
        minDate.year() === maxDate.year() &&
        minDate.month() === maxDate.month()
      );
    },

    async updateDailyChart() {
      const chart = initChartById('daily-chart');
      if (!chart) return;

      try {
        const hasDealer = !!this.dealer;
        const hasZone = !!this.zone;

        const endpoint = hasDealer
          ? `/api/dashboard/registerbyday/${encodeURIComponent(this.dealer)}?`
          : hasZone
            ? `/api/dashboard/registerbydayzone/${encodeURIComponent(this.zone)}?`
            : `/api/dashboard/registerbyday/`; 
        const { data } = await api.get(endpoint, {
          params: { date_min: this.dateMin, date_max: this.dateMax },
        });

        if (!Array.isArray(data) || data.length === 0) {
          console.warn('No data found for daily chart');
          chart.clear();
          return;
        }

        const allDays = [];
        let current = dayjs(this.dateMin);
        const end = dayjs(this.dateMax);
        while (current.isBefore(end) || current.isSame(end, 'day')) {
          allDays.push(current.format('YYYY-MM-DD'));
          current = current.add(1, 'day');
        }
        const dayMap = data.reduce((acc, item) => {
          acc[item.DAY] = Number(item.COUNT) || 0;
          return acc;
        }, {});
        const days = allDays;
        const counts = allDays.map((d) => dayMap[d] ?? 0);
        const maxValue = Math.max(...counts);

        chart.setOption({
          grid: {
            top: 40,
            left: 40,
            right: 20,
            bottom: 40,
            containLabel: true,
          },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: days },
          yAxis: {
            type: 'value',
            min: 0,
            max: maxValue === 0 ? 1 : maxValue + 1,
          },
          series: [
            {
              data: counts,
              type: 'line',
              smooth: true,
              lineStyle: { width: 3 },
              label: {
                show: true,
                position: 'top',
                distance: 8,
              },
            },
          ],
        });

      } catch (error) {
        console.error('Error fetching daily chart data:', error);
      }
    },

    async updateMonthlyChart() {
      const chart = initChartById('monthly-chart');
      if (!chart) return;

      try {
        const hasDealer = !!this.dealer;
        const hasZone = !!this.zone;

        const endpoint = hasDealer
          ? `/api/dashboard/registerbymonth/${encodeURIComponent(this.dealer)}?`
          : hasZone
            ? `/api/dashboard/registerbymonthzone/${encodeURIComponent(this.zone)}?`
            : `/api/dashboard/registerbymonth/`; 
        const { data } = await api.get(endpoint, {
          params: { date_min: this.dateMin, date_max: this.dateMax },
        });

        if (!Array.isArray(data) || data.length === 0) {
          console.warn('No data found for monthly chart');
          chart.clear();
          return;
        }

        const allMonths = [];
        let current = dayjs(this.dateMin).startOf('month');
        const end = dayjs(this.dateMax).endOf('month');
        while (current.isBefore(end) || current.isSame(end, 'month')) {
          allMonths.push(current.format('YYYY-MM'));
          current = current.add(1, 'month');
        }
        const monthMap = data.reduce((acc, item) => {
          acc[item.MONTH] = Number(item.COUNT) || 0;
          return acc;
        }, {});
        const months = allMonths;
        const counts = allMonths.map((m) => monthMap[m] ?? 0);
        const maxValue = Math.max(...counts);

        chart.setOption({
          grid: {
            top: 40,
            left: 40,
            right: 20,
            bottom: 40,
            containLabel: true,
          },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: months },
          yAxis: {
            type: 'value',
            min: 0,
            max: maxValue === 0 ? 1 : maxValue + 1,
          },
          series: [
            {
              data: counts,
              type: 'line',
              smooth: false,
              lineStyle: { width: 3 },
              label: {
                show: true,
                position: 'top',
                distance: 8,
              },
            },
          ],
        });

      } catch (error) {
        console.error('Error fetching monthly chart data:', error);
      }
    }

  },
};
</script>

<style scoped>
#monthly-chart,
#daily-chart {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100%;
}

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
