<template>
  <div>
    <!-- <Breadcrumb /> -->
    <div class="card-auto space-y-5">
      <div class="grid grid-cols-12 gap-5">
        <div class="lg:col-span-12 col-span-12 space-y-5">
          <Card>
            <div style="display: flex; justify-content: space-around">
              <div v-for="(item, i) in statistics" :key="i" :class="item.bg" style="width: 32%;"
                class="rounded-md p-4 bg-opacity-[0.15] dark:bg-opacity-25 relative z-[1]">
                <div class="overlay absolute left-0 top-0 w-full h-full z-[-1]">
                  <img :src="item.img" alt="" draggable="false" class="w-full h-full object-contain" />
                </div>
                <span class="block mb-6 text-sm text-slate-900 dark:text-white font-medium">{{ item.title }}</span>
                <span class="block mb- text-2xl text-slate-900 dark:text-white font-medium mb-6">{{ item.count }}</span>
              </div>
            </div>
          </Card>
          <Card>
            <header class="md:flex md:space-y-0 space-y-4">
              <h6 class="flex-1 text-slate-900 dark:text-white capitalize">
                Summary Report Joy at first drive
              </h6>
              <div class="flex-none">
                <!-- <FromGroup>
                    <flat-pickr class="form-control bg-white" placeholder="Select date range" v-model="rangeDate"
                      :config="{ mode: 'range' }" />
                  </FromGroup> -->
              </div>
            </header>

            <div class="legend-ring">
              <apexchart type="bar" height="410" :options="this.$store.themeSettingsStore.isDark
                ? stackedDark.chartOptionsStacked
                : this.chartOptionsStacked
                " :series="this.chartOptionsStacked.series" />
            </div>
          </Card>
        </div>
        <div class="lg:col-span-4 col-span-12 space-y-5">
          <Card title=" Owner">
            <!-- <template #header>
                <SelectMonth />
              </template> -->
            <div class="legend-ring3">
              <apexchart type="pie" height="335" :options="this.$store.themeSettingsStore.isDark
                ? pieChartDark.chartmemberOwner
                : this.chartmemberOwner
                " :series="this.chartmemberOwner.series" />
            </div>
          </Card>
          <Card title="trends calcultation">
            <!-- <template #header>
                <SelectMonth />
              </template> -->
            <div class="legend-ring3">
              <apexchart type="pie" height="335" :options="this.$store.themeSettingsStore.isDark
                ? pieChartDark.chartOptions
                : this.chartOptions
                " :series="this.chartOptions.series" />
            </div>
          </Card>
        </div>
      </div>
      <!-- <Card title="Latest Transaction" noborder>
          <template #header>
            <DropEvent />
          </template>
          <div class="-mx-6">
            <CrmTable />
          </div>
        </Card> -->
    </div>
  </div>
</template>
<script>
import Breadcrumb from "@/views/home/Analytics-Component/Breadcrumbs";
import Card from "@/components/Card";
import FromGroup from "@/components/FromGroup";
import Icon from "@/components/Icon";
import CrmTable from "@/views/home/Analytics-Component/CrmTable";
import axios from "axios";
import {
  pieChart,
  pieChartDark,
  stacked,
  stackedDark,
} from "@/views/home/Analytics-Component/data";
import DropEvent from "@/views/home/Analytics-Component/DropEvent";
import SelectMonth from "@/views/home/Analytics-Component/SelectMonth";

// Import Images
import shade1 from "@/assets/images/all-img/shade-1.png"
import shade2 from "@/assets/images/all-img/shade-2.png"
import shade3 from "@/assets/images/all-img/shade-3.png"
import shade4 from "@/assets/images/all-img/shade-4.png"
import { useRoute } from 'vue-router';

export default {
  components: {
    Card,
    Icon,
    CrmTable,
    DropEvent,
    FromGroup,
    SelectMonth,
    Breadcrumb,
  },
  data() {
    return {
      urlEnv: import.meta.env.VITE_APP_API_URL,

      totalMembers: 0,
      memberOwner: 0,
      needToTestDrive: 0,
      couponCodeCount: 0,
      stacked,
      stackedDark,
      rangeDate: null,
      pieChart,
      pieChartDark,
      statistics: [
        {
          title: "สมัครสมาชิกทั้งหมด",
          count: this.totalMembers,
          bg: "bg-warning-500",
          text: "text-primary-500",
          percent: "25.67% ",
          icon: "heroicons:arrow-trending-up",
          img: shade1,
          percentClass: "text-primary-500",
        },
        {
          title: "เป็นเจ้าของรถมาสด้า",
          count: this.memberOwner,
          bg: "bg-info-500",
          text: "text-primary-500",
          percent: "8.67%",
          icon: "heroicons:arrow-trending-up",
          img: shade2,
          percentClass: "text-primary-500",
        },
        {
          title: "สนใจทดลองขับ",
          count: this.needToTestDrive,
          bg: "bg-primary-500",
          text: "text-danger-500",
          percent: "1.67%  ",
          icon: "heroicons:arrow-trending-down",
          img: shade3,
          percentClass: "text-danger-500",
        },
        // {
        //   title: "แจกคูปองไปแล้วทั้งหมด",
        //   count: this.couponCodeCount,
        //   bg: "bg-success-500",
        //   text: "text-primary-500",
        //   percent: "11.67%  ",
        //   icon: "heroicons:arrow-trending-up",
        //   img: shade4,
        //   percentClass: "text-primary-500",
        // },
      ],
      Campaigns: [
        {
          name: "ข้อมูล",
        },
        {
          name: "สมัครสมาชิกทั้งหมด",
          count: this.totalMembers,
        },
        {
          name: "เป็นเจ้าของรถมาสด้า",
          count: this.memberOwner,
        },
        {
          name: "สนใจทดลองขับ",
          count: this.needToTestDrive,
        },
      ],
      chartmemberOwner: {
        series: [0, 0], // Initial values, will be updated in mounted()
        labels: ["เป็นเจ้าของรถมาสด้า", "สมัครสมาชิกทั้งหมด"],
        dataLabels: {
          enabled: true,
        },
        colors: ["#50C793", "#FA916B"],
        legend: {
          position: "bottom",
          fontSize: "12px",
          fontFamily: "Inter",
          fontWeight: 400,
          labels: {
            colors: "#475569",
          },
          markers: {
            width: 6,
            height: 6,
            offsetY: -1,
            offsetX: -5,
            radius: 12,
          },
          itemMargin: {
            horizontal: 10,
            vertical: 0,
          },
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              legend: {
                position: "bottom",
              },
            },
          },
        ],
      },

      chartOptions: {
        series: [0, 0], // Initial values, will be updated in mounted()
        labels: ["สมัครสมาชิกทั้งหมด","เป็นเจ้าของรถมาสด้า" ],
        dataLabels: {
          enabled: true,
        },
        colors: ["#50C793", "#FA916B", "#A3A1FB"],
        legend: {
          position: "bottom",
          fontSize: "12px",
          fontFamily: "Inter",
          fontWeight: 400,
          labels: {
            colors: "#475569",
          },
          markers: {
            width: 6,
            height: 6,
            offsetY: -1,
            offsetX: -5,
            radius: 12,
          },
          itemMargin: {
            horizontal: 10,
            vertical: 0,
          },
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              legend: {
                position: "bottom",
              },
            },
          },
        ],
      },


      chartOptionsStacked: {
        series: [
          {
            name: "จำนวนคนที่รีวิว",
            data: [],
          },
          {
            name: "จำนวนคนที่ทดลองขับ",
            data: [],
          }
        ],
        chart: {
          stacked: true,
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            endingShape: "rounded",
            columnWidth: "55%",
          },
        },
        legend: {
          show: true,
          position: "bottom",
          horizontalAlign: "center",
          fontSize: "12px",
          fontFamily: "Inter",
          offsetY: 0,
          markers: {
            width: 6,
            height: 6,
            offsetY: 0,
            offsetX: -5,
            radius: 12,
          },
          itemMargin: {
            horizontal: 18,
            vertical: 0,
          },
          labels: {
            colors: "#CBD5E1",
          },
        },

        dataLabels: {
          enabled: false,
        },
        stroke: {
          show: true,
          width: 2,
          colors: ["transparent"],
        },

        yaxis: {
          labels: {
            style: {
              colors: "#CBD5E1",
              fontFamily: "Inter",
            },
          },
        },

        xaxis: {
          categories: [
            "Jan 2024",
            "Feb 2024",
            "Mar 2024",
            "Apr 2024",
            "May 2024",
            "Jun 2024",
            "Jul 2024",
            "Aug 2024",
            "Sep 2024",
            "Oct 2024",
            "Nov 2024",
            "Dec 2024",
          ],
          labels: {
            offsetY: -3,
            style: {
              colors: "#CBD5E1",
              fontFamily: "Inter",
            },
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },

        fill: {
          opacity: 1,
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val + " คน";
            },
          },
        },
        colors: ["#4669FA", "#0CE7FA", "#FA916B"],
        grid: {
          show: true,
          borderColor: "#334155",
          strokeDashArray: 10,
          position: "back",
        },
      },
    };
  },

  methods: {
    async fetchLeadData(campaignName) {
      const user = localStorage.getItem('activeUser');
      const userData = JSON.parse(user);
      console.log('userData', userData)

      try {
        const response = await axios.get(this.urlEnv + "/forms");

        this.leadData = response.data.sort((a, b) => new Date(b.dateSubmit) - new Date(a.dateSubmit));
        this.leadDataAll = response.data.map(item => {

          return item;
        }).sort((a, b) => new Date(b.dateSubmit) - new Date(a.dateSubmit));
        // Set counts for display
        this.totalRows = this.leadDataAll.length;
        this.totalMembers = this.leadDataAll.length;
        this.memberOwner = this.leadDataAll.filter(item => item.memberOwner === 1).length;
        this.needToTestDrive = this.leadDataAll.filter(item => item.needToTestDrive === 1).length;

        console.log('totalMembers', this.totalMembers);
        console.log('memberOwner', this.memberOwner);
        console.log('needToTestDrive', this.needToTestDrive);

        // Update chart series dynamically after data is fetched

      } catch (error) {
        console.error("Error fetching lead data:", error);
      }
    },
  },
  mounted() {
    this.fetchLeadData().then(() => {
      // Update statistics and campaigns after fetching data
      this.statistics[0].count = this.totalMembers;
      this.statistics[1].count = this.memberOwner;
      this.statistics[2].count = this.needToTestDrive;


      this.Campaigns = [
        {
          name: "ข้อมูล",
        },
        {
          name: "สมัครสมาชิกทั้งหมด",
          count: this.totalMembers,
        },
        {
          name: "เป็นเจ้าของรถมาสด้า",
          count: this.memberOwner,
        },
        {
          name: "สนใจทดลองขับ",
          count: this.needToTestDrive,
        },
      ];

      // Update pie chart data as well
      this.chartmemberOwner.series = [
        this.totalMembers,
        this.memberOwner,
      ];

      this.chartOptions.series = [
        this.totalMembers,
        this.memberOwner,
        this.needToTestDrive,
        // this.couponCodeCount,
      ];
    });
  }




};
</script>
<style lang=""></style>