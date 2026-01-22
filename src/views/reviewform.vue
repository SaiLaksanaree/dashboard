<template>
  <div>
    <Card title="Review Form" noborder>
      <div class="btnExport">
        <Button @click="exportAllToExcel" text="Export All" btnClass="btn-dark " />
        <Button @click="exportFilteredToExcel" text="Export as to result" btnClass="btn-dark ml-2" />
      </div>

      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3" style="justify-content: end">
        <div style="padding-right: 20px;">
          <InputGroup v-model="searchTerm" placeholder="Search" type="text" prependIcon="heroicons-outline:search"
            merged @input="handleSearch" />
        </div>

        <FromGroup label="" name="d5">
          <flat-pickr class="form-control" id="d5" placeholder="Select Date Period" v-model="rangeDate"
            :config="{ mode: 'range', dateFormat: 'd-m-Y' }" @input="handleSearch" />
        </FromGroup>
        <!-- ปุ่มเคลียร์ข้อมูล -->
        <div v-if="searchTerm || rangeDate" style="padding-left: 10px;">
          <Button @click="clearDate()" icon="heroicons-solid:x-circle"
            btnClass="p-0 h-10 w-10 flex items-center justify-center rounded-full" />
        </div>

      </div>

      <vue-good-table :columns="columns" styleClass="vgt-table bordered centered" :rows="paginatedFilteredData"
        :pagination-options="{
          enabled: true,
          perPage: perpage,
        }" :current-page.sync="current">
        <template v-slot:table-row="props">

          <span v-if="props.column.field == 'selectedDate'">{{ formatDateToThai(props.row.selectedDate) }}</span>
          <span v-if="props.column.field == 'selectedTime'">{{ formatSelectedTimeRange(props.row.selectedTime) }}</span>
          <span v-if="props.column.field == 'dateSubmit'">{{ formatDateToThai(props.row.dateSubmit) }}</span>
          <span v-if="props.column.field == 'testDriveStatus' && props.row.testDriveStatus == true"
            class="block w-full">
            <span class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25"
              :class="'text-success-500 bg-success-500'">
              สำเร็จ
            </span>
          </span>

          <span v-if="props.column.field == 'testDriveStatus' && props.row.testDriveStatus == false"
            class="block w-full">
            <span class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25"
              :class="'text-warning-500 bg-warning-500'">
              -
            </span>
          </span>

          <span v-if="props.column.field == 'reviewStatusDate'">
            {{ formatDateToThai(props.row.reviewStatusDate, true) }}
          </span>

          <span v-if="props.column.field == 'reviewStatus' && props.row.reviewStatus == true" class="block w-full">
            <span class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25"
              :class="'text-success-500 bg-success-500'">
              สำเร็จ
            </span>
          </span>

          <span v-if="props.column.field == 'reviewStatus' && props.row.reviewStatus == false" class="block w-full">
            <span class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25"
              :class="'text-warning-500 bg-warning-500'">
              -
            </span>
          </span>
        </template>

        <template #pagination-bottom="props">
          <div class="py-4 px-3">
            <Pagination :total="totalRows" :current.sync="current" :per-page="perpage" :pageRange="pageRange"
              @page-changed="handlePageChange" @per-page-changed="handlePerPageChange" />
          </div>
        </template>
      </vue-good-table>
    </Card>
  </div>
</template>

<script>
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import Tooltip from "@/components/Tooltip";
import Pagination from "@/components/Pagination";
import InputGroup from "@/components/InputGroup";
import axios from "axios";
import Button from "@/components/Button";
import Modal from "@/components/Modal/Modal";
import FromGroup from "@/components/FromGroup";
import * as XLSX from "xlsx";
import { ref, watch } from 'vue';
import { formatDateToThai, formatSelectedTimeRange, getTomorrowDate, getNextYearDate, convertTimeToThai } from '@/plugins/funcation.js';
import { useRoute } from 'vue-router';

export default {
  components: {
    FromGroup,
    Pagination,
    Icon,
    Tooltip,
    Card,
    InputGroup,
    Button,
    Modal,
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

  data() {
    return {
      urlEnv: import.meta.env.VITE_APP_API_URL,
      pickerConfig: {
        enableTime: true,
        dateFormat: 'd-m-Y H:i',
        minDate: getTomorrowDate(),
        maxDate: getNextYearDate()
      },
      rangeDate: null,
      leadData: [],
      leadDataAll: [],
      current: 1,
      perpage: 10,
      pageRange: 5,
      totalRows: 0,
      searchTerm: "",
      columns: [
        { label: "วันที่ review", field: "reviewStatusDate", width: "240px", sort: true },
        { label: "คำนำหน้า", field: "title", width: "100px" },
        { label: "ชื่อ", field: "firstName", width: "150px" },
        { label: "นามสกุล", field: "lastName", width: "150px" },
        { label: "เพศ", field: "sex", width: "60px" },
        { label: "อายุ", field: "age", width: "80px" },
        { label: "เบอร์โทรศัพท์", field: "phone", width: "100px" },
        { label: "อีเมล", field: "email", width: "200px" },
        { label: "ตัวแทนจำหน่าย", field: "selectedDealer", width: "250px" },
        { label: "จังหวัด", field: "selectedProvince", width: "120px" },
        { label: "เเบรนด์รถ", field: "carBrand", width: "120px" },
        { label: "รุ่นรถ", field: "carModel", width: "120px" },
        { label: "ปี", field: "carYear", width: "50px" },
        { label: "ดีไซน์ภายนอก (คะเเนน)", field: "exteriorDesignScore", width: "100px" },
        { label: "ดีไซน์ภายนอก", field: "exteriorDesignComment", width: "200px" },
        { label: "ดีไซน์ภายใน (คะเเนน)", field: "interiorDesignScore", width: "100px" },
        { label: "ดีไซน์ภายใน", field: "interiorDesignComment", width: "200px" },
        { label: "สมรรถนะการขับขี่ (คะเเนน)", field: "drivingPerformanceScore", width: "100px" },
        { label: "สมรรถนะการขับขี่", field: "drivingPerformanceComment", width: "200px" },
        { label: "เทคโนโลยีความปลอดภัย (คะเเนน)", field: "securityTechnologyScore", width: "80px" },
        { label: "เทคโนโลยีความปลอดภัย", field: "securityTechnologyComment", width: "200px" },
        { label: "ความสะดวกสบายของห้องโดยสาร (คะเเนน)", field: "comfortOfTheCabin", width: "100px" },
        { label: "ความสะดวกสบายของห้องโดยสาร", field: "comfortOfTheCabinComment", width: "200px" },
        { label: "การให้ข้อมูลของที่ปรึกษาการขาย (คะเเนน)", field: "dealerServiceScore", width: "100px" },
        { label: "การให้ข้อมูลของที่ปรึกษาการขาย", field: "dealerServiceComment", width: "200px" },
        { label: "ความพึงพอใจโดยรวมหลังทดลองขับ (คะเเนน)", field: "satisfactionScore", width: "100px" },
        { label: "ความพึงพอใจโดยรวมหลังทดลองขับ", field: "satisfactionComment", width: "200px" },
        { label: "ความมั่นใจหลังการทดลองขับ", field: "confidenceAfterTheTestDrive", width: "200px" },
        { label: "ความมั่นใจหลังการทดลองขับ (เหตุผล)", field: "confidenceAfterTheTestDriveReason", width: "200px" },
        { label: "คำแนะนำเพิ่มเติม", field: "additionalSuggestions", width: "400px" },
      ],
      nameModol: "",
      lastNameModol: "",
      selectedDateModol: "",
      modelsInterestedModol: "",
      UpdateTime: "",
      loadingModol: false,
      showWorrng: false,
      parsedData: [],
    };
  },
  computed: {
    filteredDataByDate() {
      // Check if rangeDate is defined and has a valid format
      if (!this.rangeDate) {
        return this.leadData;
      }
      let startDate, endDate;
      if (this.rangeDate.includes(" to ")) {
        [startDate, endDate] = this.rangeDate.split(" to ");
      } else {
        startDate = endDate = this.rangeDate;
      }
      // Ensure startDate and endDate are valid and defined
      if (!startDate || !endDate) {
        return this.leadData;
      }
      const formattedStartDate = this.convertDate(startDate)
      const formattedEndDate = this.convertDate(endDate);
      const dataFilter = this.leadData.filter((item) => {
        if (!item.reviewStatusDate) return false;
        const itemDate = item.reviewStatusDate;
        const dateSubstring = itemDate.toString().substring(0, 10)
        return dateSubstring >= formattedStartDate && dateSubstring <= formattedEndDate;
      });
      return dataFilter;
    },
    filteredData() {
      const filteredByDate = this.filteredDataByDate;
      if (this.searchTerm) {
        return filteredByDate.filter((item) => {
          return (
            (item.firstName && item.firstName.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
            (item.lastName && item.lastName.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
            (item.email && item.email.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
            (item.phone && item.phone.includes(this.searchTerm))
          );
        });
      }
      return filteredByDate;
    },
    paginatedFilteredData() {
      const start = (this.current - 1) * this.perpage;
      const end = start + this.perpage;
      return this.filteredData.slice(start, end);
    },
    totalRows() {
      return this.filteredData.length;
    },
  },
  methods: {
    formatDateToThai,
    formatSelectedTimeRange,
    getTomorrowDate,
    convertTimeToThai,
    getNextYearDate,
    convertDate(inputDate) {
      // แยกวันที่ออกเป็นส่วนๆ
      let [day, month, year] = inputDate.split("-");

      // แปลงเป็น Date object
      let date = new Date(`${year}-${month}-${day}`);

      // Format ให้เป็น "YYYY-MM-DD HH:MM:SS"
      let formattedDate = date.toISOString().split("T")[0];

      return formattedDate;
    },
    clearDate() {
      this.searchTerm = "";
      this.rangeDate = "";
      this.handleSearch();
    },
    handleSearch() {
      this.current = 1;
    },
    exportAllToExcel() {
      this.exportToExcel(this.leadDataAll);
    },
    exportFilteredToExcel() {
      const filteredData = this.filteredData;
      console.log('filteredData', filteredData);
      this.exportToExcel(filteredData);
    },
    async fetchLeadData(campaignName) {
      const user = localStorage.getItem('activeUser');
      const userData = JSON.parse(user)
      console.log('userData', userData)

      try {
        // A336
        const response = await axios.post(this.urlEnv + '/surveys/find-by-dealer-code', {
          dealerCode: userData.role === 'master' ? '' : userData.dealerCode,
          campaignName: campaignName
          // dealerCode: userData.userRole === 'master' ? '': 'A336'
        });
        this.responseData = response.data;
        if (response.data) {
          this.parsedData = response.data.survey.sort((a, b) => new Date(b.reviewStatusDate) - new Date(a.dateSubmit)) || [];
          // console.log('parsedData',this.parsedData)
        }
      } catch (error) {
        this.error = error.response ? error.response.data : 'An error occurred';
      } finally {
        this.loading = false;
      }
      this.leadData = this.parsedData;
      this.leadDataAll = this.parsedData.map(item => {
        item.sex = item.title === "นาย" ? "ชาย" : "หญิง";
        return item;
      });
      this.totalRows = this.leadDataAll.length;
    },

    handlePageChange(newPage) {
      this.current = newPage;
    },
    handlePerPageChange(newPerPage) {
      this.perpage = newPerPage;
      this.current = 1;
    },
    exportToExcel(data) {
      if (!Array.isArray(data)) {
        return;
      }
      const exportData = data.map((item) => ({
        'วันที่ review': item.reviewStatusDate ? formatDateToThai(item.reviewStatusDate, true) : '-',
        'คำนำหน้า': item.title || '-',
        'ชื่อ': item.firstName || '-',
        'นามสกุล': item.lastName || '-',
        'เพศ': item.sex || '-',
        'อายุ': item.age || '-',
        'เบอร์โทรศัพท์': item.phone || '-',
        'อีเมล': item.email || '-',
        'ตัวแทนจำหน่าย': item.selectedDealer || '-',
        'จังหวัด': item.selectedProvince || '-',
        'เเบรนด์รถ': item.carBrand || '-',
        'รุ่นรถ': item.carModel || '-',
        'ปี': item.carYear || '-',
        'ดีไซน์ภายนอก (คะเเนน)': item.exteriorDesignScore || '-',
        'ดีไซน์ภายนอก': item.exteriorDesignComment || '-',
        'ดีไซน์ภายใน (คะเเนน)': item.interiorDesignScore || '-',
        'ดีไซน์ภายใน': item.interiorDesignComment || '-',
        'สมรรถนะการขับขี่ (คะเเนน)': item.drivingPerformanceScore || '-',
        'สมรรถนะการขับขี่': item.drivingPerformanceComment || '-',
        'เทคโนโลยีความปลอดภัย (คะเเนน)': item.securityTechnologyScore || '-',
        'เทคโนโลยีความปลอดภัย': item.securityTechnologyComment || '-',
        'ความสะดวกสบายของห้องโดยสาร (คะเเนน)': item.comfortOfTheCabin || '-',
        'ความสะดวกสบายของห้องโดยสาร': item.comfortOfTheCabinComment || '-',
        'การให้ข้อมูลของที่ปรึกษาการขาย (คะเเนน)': item.dealerServiceScore || '-',
        'การให้ข้อมูลของที่ปรึกษาการขาย': item.dealerServiceComment || '-',
        'ความพึงพอใจโดยรวมหลังทดลองขับ (คะเเนน)': item.satisfactionScore || '-',
        'ความพึงพอใจโดยรวมหลังทดลองขับ': item.satisfactionComment || '-',
        'ความมั่นใจหลังการทดลองขับ': item.confidenceAfterTheTestDrive || '-',
        'ความมั่นใจหลังการทดลองขับ (เหตุผล)': item.confidenceAfterTheTestDriveReason || '-',
        'คำแนะนำเพิ่มเติม': item.additionalSuggestions || '-'
      }));

      const exportDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const fileName = `ยืนยันนัดหมายทดลองขับ_${exportDate}.xlsx`;
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ยืนยันนัดหมายทดลองขับ");
      XLSX.writeFile(wb, fileName);
    },
  },
  mounted() {
    this.fetchLeadData();
  },
};
</script>

<style lang="scss" scoped>
.action-btn {
  @apply h-6 w-6 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 rounded;
}

.btnExport {
  text-align: right;
  margin-top: 20px;
  margin-bottom: 25px;
}
</style>