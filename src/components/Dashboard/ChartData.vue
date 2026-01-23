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
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

// Mock data - ใช้ static data แทน
const mockData = {
  chartData: {
    dailyRegistrations: [
      { "date": "2025-01-01", "count": 12 },
      { "date": "2025-01-02", "count": 18 },
      { "date": "2025-01-03", "count": 15 },
      { "date": "2025-01-04", "count": 22 },
      { "date": "2025-01-05", "count": 19 },
      { "date": "2025-01-06", "count": 25 },
      { "date": "2025-01-07", "count": 28 },
      { "date": "2025-01-08", "count": 21 },
      { "date": "2025-01-09", "count": 24 },
      { "date": "2025-01-10", "count": 30 },
      { "date": "2025-01-11", "count": 27 },
      { "date": "2025-01-12", "count": 33 },
      { "date": "2025-01-13", "count": 29 },
      { "date": "2025-01-14", "count": 1 },
      { "date": "2025-01-15", "count": 2 },
      { "date": "2025-01-16", "count": 2 },
      { "date": "2025-01-17", "count": 2 },
      { "date": "2025-01-18", "count": 2 },
      { "date": "2025-01-19", "count": 2 },
      { "date": "2025-01-20", "count": 2 },
      { "date": "2025-01-21", "count": 2 },
      { "date": "2025-01-22", "count": 2 },
      { "date": "2025-01-23", "count": 2 },
      { "date": "2024-12-01", "count": 20 },
      { "date": "2024-12-02", "count": 23 },
      { "date": "2024-12-03", "count": 18 },
      { "date": "2024-12-04", "count": 25 },
      { "date": "2024-12-05", "count": 22 },
      { "date": "2024-12-06", "count": 27 },
      { "date": "2024-12-07", "count": 24 },
      { "date": "2024-12-08", "count": 29 },
      { "date": "2024-12-09", "count": 26 },
      { "date": "2024-12-10", "count": 31 },
      { "date": "2024-12-11", "count": 28 },
      { "date": "2024-12-12", "count": 33 },
      { "date": "2024-12-13", "count": 30 },
      { "date": "2024-12-14", "count": 35 },
      { "date": "2024-12-15", "count": 32 },
      { "date": "2024-12-16", "count": 37 },
      { "date": "2024-12-17", "count": 34 },
      { "date": "2024-12-18", "count": 39 },
      { "date": "2024-12-19", "count": 36 },
      { "date": "2024-12-20", "count": 41 },
      { "date": "2024-12-21", "count": 38 },
      { "date": "2024-12-22", "count": 43 },
      { "date": "2024-12-23", "count": 40 },
      { "date": "2024-12-24", "count": 45 },
      { "date": "2024-12-25", "count": 42 },
      { "date": "2024-12-26", "count": 47 },
      { "date": "2024-12-27", "count": 44 },
      { "date": "2024-12-28", "count": 49 },
      { "date": "2024-12-29", "count": 46 },
      { "date": "2024-12-30", "count": 51 },
      { "date": "2024-12-31", "count": 48 },
      { "date": "2024-11-01", "count": 15 },
      { "date": "2024-11-02", "count": 18 },
      { "date": "2024-11-03", "count": 16 },
      { "date": "2024-11-04", "count": 21 },
      { "date": "2024-11-05", "count": 19 },
      { "date": "2024-11-06", "count": 23 },
      { "date": "2024-11-07", "count": 20 },
      { "date": "2024-11-08", "count": 25 },
      { "date": "2024-11-09", "count": 22 },
      { "date": "2024-11-10", "count": 27 },
      { "date": "2024-11-11", "count": 24 },
      { "date": "2024-11-12", "count": 29 },
      { "date": "2024-11-13", "count": 26 },
      { "date": "2024-11-14", "count": 31 },
      { "date": "2024-11-15", "count": 28 },
      { "date": "2024-11-16", "count": 33 },
      { "date": "2024-11-17", "count": 30 },
      { "date": "2024-11-18", "count": 35 },
      { "date": "2024-11-19", "count": 32 },
      { "date": "2024-11-20", "count": 37 },
      { "date": "2024-11-21", "count": 34 },
      { "date": "2024-11-22", "count": 39 },
      { "date": "2024-11-23", "count": 36 },
      { "date": "2024-11-24", "count": 41 },
      { "date": "2024-11-25", "count": 38 },
      { "date": "2024-11-26", "count": 43 },
      { "date": "2024-11-27", "count": 40 },
      { "date": "2024-11-28", "count": 45 },
      { "date": "2024-11-29", "count": 42 },
      { "date": "2024-11-30", "count": 47 }
    ]
  }
};

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
    dailyThreshold: { type: Number, default: 30 }, // เพิ่มจาก 7 เป็น 30 วัน
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
      // ใช้ logic ปกติ: รายวันถ้า <= 31 วัน, รายเดือนถ้ามากกว่า
      const useDaily = days > 0 && days <= 31;

      console.log('ChartData Debug:', {
        dateMin: this.dateMin,
        dateMax: this.dateMax,
        days: days,
        useDaily: useDaily,
        isDaily: this.isDaily
      });

this.isDaily = useDaily;

await this.$nextTick(); // <-- เพิ่มบรรทัดนี้

if (useDaily) {
  await this.updateDailyChart();
} else {
  await this.updateMonthlyChart();
}

      
      this.$nextTick(() => {
        const dailyChart = echarts.getInstanceByDom(document.getElementById('daily-chart'));
        const monthlyChart = echarts.getInstanceByDom(document.getElementById('monthly-chart'));
        
        if (useDaily && dailyChart) {
          dailyChart.resize();
        } else if (!useDaily && monthlyChart) {
          monthlyChart.resize();
        }
      });
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
      console.log('=== updateDailyChart START ===');
      
      const chart = initChartById('daily-chart');
      if (!chart) {
        console.error('❌ Daily chart element not found');
        return;
      }

      try {
        // ใช้ข้อมูลที่ตรงกับช่วงวันที่ในระบบ (14-23 ม.ค. 2025)
        const actualData = [
          { date: '2025-01-14', count: 1 },
          { date: '2025-01-15', count: 2 },
          { date: '2025-01-16', count: 2 },
          { date: '2025-01-17', count: 2 },
          { date: '2025-01-18', count: 2 },
          { date: '2025-01-19', count: 2 },
          { date: '2025-01-20', count: 2 },
          { date: '2025-01-21', count: 2 },
          { date: '2025-01-22', count: 2 },
          { date: '2025-01-23', count: 2 }
        ];

        // Filter data based on date range
        const filteredData = actualData.filter(item => {
          const itemDate = dayjs(item.date);
          return itemDate.isBetween(dayjs(this.dateMin), dayjs(this.dateMax), 'day', '[]');
        });

        // Create all days in range
        const allDays = [];
        let current = dayjs(this.dateMin);
        const end = dayjs(this.dateMax);
        while (current.isBefore(end) || current.isSame(end, 'day')) {
          allDays.push(current.format('YYYY-MM-DD'));
          current = current.add(1, 'day');
        }
        
        // Map filtered data to days
        const dayMap = filteredData.reduce((acc, item) => {
          acc[item.date] = Number(item.count) || 0;
          return acc;
        }, {});
        
        const days = allDays;
        const counts = allDays.map((d) => dayMap[d] ?? 0);
        const maxValue = Math.max(...counts);

        console.log('📊 Daily chart data:', { 
          dateRange: `${this.dateMin} to ${this.dateMax}`,
          allDays: allDays,
          filteredData: filteredData,
          dayMap: dayMap,
          counts: counts,
          maxValue: maxValue
        });

        const option = {
          grid: {
            top: 40,
            left: 50,
            right: 30,
            bottom: 50,
            containLabel: true,
          },
          tooltip: { 
            trigger: 'axis',
            formatter: function(params) {
              return `วันที่: ${params[0].axisValue}<br/>จำนวน: ${params[0].value} รายการ`;
            }
          },
          xAxis: { 
            type: 'category', 
            data: days.map(d => dayjs(d).format('DD/MM'))
          },
          yAxis: {
            type: 'value',
            min: 0,
            max: maxValue === 0 ? 5 : Math.max(maxValue + 1, 3)
          },
          series: [
            {
              name: 'จำนวนการจอง',
              data: counts,
              type: 'line',
              smooth: true,
              lineStyle: { width: 3, color: '#1976d2' },
              itemStyle: { color: '#1976d2' },
              label: {
                show: true,
                position: 'top',
                distance: 8,
                color: '#333'
              },
              symbol: 'circle',
              symbolSize: 6
            },
          ],
        };

        chart.setOption(option);
        console.log('✅ Daily chart updated successfully');

      } catch (error) {
        console.error('❌ Error in updateDailyChart:', error);
      }
    },

    async updateMonthlyChart() {
      const chart = initChartById('monthly-chart');
      if (!chart) return;

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use static mock data
        const dailyData = mockData.chartData.dailyRegistrations;
        
        // Group daily data by month
        const monthlyMap = {};
        dailyData.forEach(item => {
          const month = dayjs(item.date).format('YYYY-MM');
          if (!monthlyMap[month]) {
            monthlyMap[month] = 0;
          }
          monthlyMap[month] += item.count;
        });

        // Convert to array format
        const data = Object.entries(monthlyMap).map(([month, count]) => ({
          MONTH: month,
          COUNT: count
        }));

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
