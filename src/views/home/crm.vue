<template>
  <div>
    <!-- <Breadcrumb /> -->
    <div class="card-auto space-y-5">
      <div class="grid grid-cols-12 gap-5">
        <div class="lg:col-span-8 col-span-12 space-y-5">
          <Card>
            <div class="grid xl:grid-cols-4 lg:grid-cols-2 col-span-1 gap-3">
              <div v-for="(item, i) in statistics" :key="i" :class="item.bg"
                class="rounded-md p-4 bg-opacity-[0.15] dark:bg-opacity-25 relative z-[1]">
                <div class="overlay absolute left-0 top-0 w-full h-full z-[-1]">
                  <img :src="item.img" alt="" draggable="false" class="w-full h-full object-contain" />
                </div>
                <span class="block mb-6 text-sm text-slate-900 dark:text-white font-medium">{{ item.title }}</span>
                <span class="block mb- text-2xl text-slate-900 dark:text-white font-medium mb-6">{{ item.count }}</span>
                <!-- <div class="flex space-x-2 rtl:space-x-reverse">
                  <div class="flex-none text-xl" :class="item.text">
                    <Icon :icon="item.icon" />
                  </div>
                  <div class="flex-1 text-sm">
                    <span class="block mb-[2px]" :class="item.percentClass">{{
                      item.percent
                    }}</span>
                    <span class="block mb-1 text-slate-600 dark:text-slate-300"
                      >From last week</span
                    >
                  </div>
                </div> -->
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
          <Card title="Campaigns">
            <!-- <template #header>
              <DropEvent />
            </template> -->
            <ul class="divide-y divide-slate-100 dark:divide-slate-700">
              <li v-for="(item, i) in Campaigns" :key="i"
                class="first:text-xs text-sm first:text-slate-600 text-slate-600 dark:text-slate-300 py-2 first:uppercase">
                <div class="flex justify-between">
                  <span>{{ item.name }}</span>
                  <span>{{ item.count }}</span>
                </div>
              </li>
            </ul>
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
import Breadcrumb from "./Analytics-Component/Breadcrumbs";
import Card from "@/components/Card";
import FromGroup from "@/components/FromGroup";
import Icon from "@/components/Icon";
import CrmTable from "./Analytics-Component/CrmTable";
import axios from "axios";
import {
  pieChart,
  pieChartDark,
  stacked,
  stackedDark,
} from "./Analytics-Component/data";
import DropEvent from "./Analytics-Component/DropEvent";
import SelectMonth from "./Analytics-Component/SelectMonth";

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
      testDriveCount: 0,
      reviewCount: 0,
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
          title: "ทดลองขับไปแล้วทั้งหมด",
          count: this.testDriveCount,
          bg: "bg-info-500",
          text: "text-primary-500",
          percent: "8.67%",
          icon: "heroicons:arrow-trending-up",
          img: shade2,
          percentClass: "text-primary-500",
        },
        {
          title: "รีวิวไปแล้วทั้งหมด",
          count: this.reviewCount,
          bg: "bg-primary-500",
          text: "text-danger-500",
          percent: "1.67%  ",
          icon: "heroicons:arrow-trending-down",
          img: shade3,
          percentClass: "text-danger-500",
        },
        {
          title: "แจกคูปองไปแล้วทั้งหมด",
          count: this.couponCodeCount,
          bg: "bg-success-500",
          text: "text-primary-500",
          percent: "11.67%  ",
          icon: "heroicons:arrow-trending-up",
          img: shade4,
          percentClass: "text-primary-500",
        },
      ],
      Campaigns: [
        {
          name: "ข้อมูล",
          // count: "roi",
        },
        {
          name: "สมัครสมาชิกทั้งหมด",
          count: this.totalMembers,
        },
        {
          name: "ทดลองขับไปแล้วทั้งหมด",
          count: this.testDriveCount,
        },
        {
          name: "รีวิวไปแล้วทั้งหมด",
          count: this.reviewCount,
        },
        {
          name: "แจกคูปองไปแล้วทั้งหมด",
          count: this.couponCodeCount,
        },
      ],
      chartOptions: {
        series: [0, 0, 0], // Initial values, will be updated in mounted()
        labels: ["ทดลองขับไปแล้วทั้งหมด", "รีวิวไปแล้วทั้งหมด", "แจกคูปองไปแล้วทั้งหมด"],
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

  watch: {
    '$route.query.campaignName': {
      immediate: true, // Call fetchLeadData on component mount
      handler(newCampaignName) {
        if (newCampaignName) {
          this.fetchLeadData(newCampaignName);
        }
      },
    },
  },

  methods: {
    async fetchLeadData(campaignName) {
      const user = localStorage.getItem('activeUser');
      const userData = JSON.parse(user);
      console.log('userData', userData)

      try {
        const response = await axios.post(this.urlEnv + "/lead-form/find-by-dealer-code", {
          dealerCode: userData.userRole === 'master' ? '' : userData.userCode,
          campaignName: campaignName
        });

        // Initialize arrays to count per month
        this.reviewStatusByMonth = new Array(12).fill(0);  // 12 months initialized to 0
        this.testDriveStatusByMonth = new Array(12).fill(0); // 12 months initialized to 0

        this.leadData = response.data.sort((a, b) => new Date(b.dateSubmit) - new Date(a.dateSubmit));
        this.leadDataAll = response.data.map(item => {
          if (item.title === "นาย") {
            item.sex = "ชาย";
          } else {
            item.sex = "หญิง";
          }

          // Check the month from selectedDate
          const month = new Date(item.selectedDate).getMonth();

          // Increment counters if conditions are true
          if (item.reviewStatus === true) {
            this.reviewStatusByMonth[month]++;
          }
          if (item.testDriveStatus === true) {
            this.testDriveStatusByMonth[month]++;
          }

          return item;
        }).sort((a, b) => new Date(b.dateSubmit) - new Date(a.dateSubmit));

        // Set counts for display
        this.totalRows = this.leadDataAll.length;
        this.totalMembers = this.leadDataAll.length;
        this.testDriveCount = this.leadDataAll.filter(item => item.testDriveStatus === true).length;
        this.reviewCount = this.leadDataAll.filter(item => item.reviewStatus === true).length;
        this.couponCodeCount = this.leadDataAll.filter(item => item.couponCode !== null).length;

        // Update chart series dynamically after data is fetched
        this.chartOptionsStacked.series = [
          {
            name: "จำนวนคนที่รีวิว",
            data: this.reviewStatusByMonth,  // Dynamically updated data
          },
          {
            name: "จำนวนคนที่ทดลองขับ",
            data: this.testDriveStatusByMonth,  // Dynamically updated data
          }
        ];

      } catch (error) {
        console.error("Error fetching lead data:", error);
      }
    },
  },
  mounted() {
    this.fetchLeadData().then(() => {
      // Update statistics and campaigns after fetching data
      this.statistics[0].count = this.totalMembers;
      this.statistics[1].count = this.testDriveCount;
      this.statistics[2].count = this.reviewCount;
      this.statistics[3].count = this.couponCodeCount;

      this.Campaigns = [
        {
          name: "ข้อมูล",
        },
        {
          name: "สมัครสมาชิกทั้งหมด",
          count: this.totalMembers,
        },
        {
          name: "ทดลองขับไปแล้วทั้งหมด",
          count: this.testDriveCount,
        },
        {
          name: "รีวิวไปแล้วทั้งหมด",
          count: this.reviewCount,
        },
        {
          name: "แจกคูปองไปแล้วทั้งหมด",
          count: this.couponCodeCount,
        },
      ];

      // Update pie chart data as well
      this.chartOptions.series = [
        this.testDriveCount,
        this.reviewCount,
        this.couponCodeCount,
      ];
    });
  }




};
</script>
<style lang=""></style>
