<template>
  <div>
    <Card title="Test Drive" noborder>
      <div class="btnExport">
        <Button @click="exportAllToExcel" text="Export All" btnClass="btn-dark " />
        <Button @click="exportFilteredToExcel" text="Export as to result" btnClass="btn-dark ml-2" />
      </div>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3" style="justify-content: end">

        <div style="padding-right: 20px;">
          <InputGroup v-model="searchTerm" placeholder="Search" type="text" prependIcon="heroicons-outline:search"
            merged />
        </div>

        <FromGroup label="" name="d5">
          <flat-pickr class="form-control" id="d5" placeholder="Select Date Period" v-model="rangeDate"
            :config="{ mode: 'range', dateFormat: 'd-m-Y' }" />
        </FromGroup>
        <div style="padding-left: 10px;">
          <div v-if="searchTerm || rangeDate" style="padding-left: 10px;">
            <Button @click="clearDate()" icon="heroicons-solid:x-circle"
              btnClass="p-0 h-10 w-10 flex items-center justify-center rounded-full" />
          </div>
        </div>

      </div>
      <vue-good-table :columns="columns" styleClass="vgt-table bordered centered" :rows="paginatedFilteredData"
        :pagination-options="{
          enabled: true,
          perPage: perpage,
        }" :current-page.sync="current">
        <template v-slot:table-row="props">
          <!-- <span v-if="props.column.field == 'title'">{{ props.row.title }} </span> -->
          <span v-if="props.column.field == 'memberOwner'">
            {{ props.row.memberOwner === 1 ? "ใช่" : (props.row.memberOwner != 1 ? "ไม่ใช่" :
              props.row.needToTestDrive) }}
          </span>
          <span v-if="props.column.field == 'firstName'">{{ props.row.firstName }}</span>
          <span v-if="props.column.field == 'lastName'">{{ props.row.lastName }}</span>
          <span v-if="props.column.field == 'sex'">{{ props.row.sex }}</span>
          <span v-if="props.column.field == 'phoneNumber'">
            {{ props.row.phoneNumber.toString().padStart(10, "0") }}
          </span>
          <span v-if="props.column.field == 'email'">{{ props.row.email }}</span>
          <span v-if="props.column.field == 'lineId'">
            {{ props.row.lineId !== '' ? props.row.lineId : '-' }}
          </span>
          <span v-if="props.column.field == 'selectedDate'">{{ formatDateToThai(props.row.selectedDate, false) }}</span>
          <span v-if="props.column.field == 'selectedTime'">{{ formatSelectedTimeRange(props.row.selectedTime) }}</span>
          <span v-if="props.column.field == 'selectedDealer'">{{ props.row.selectedDealer }}</span>
          <span v-if="props.column.field == 'selectedProvince'">{{ props.row.selectedProvince }}</span>
          <span v-if="props.column.field == 'needToTestDrive'">
            {{ props.row.needToTestDrive === 1 ? "สนใจ" : (props.row.needToTestDrive != 1 ? "ไม่สนใจ" :
              props.row.needToTestDrive) }}
          </span>


          <span v-if="props.column.field == 'dateSubmit'">{{
            formatDateToThai(props.row.dateSubmit, true)
          }}</span>
          <span v-if="
            props.column.field == 'modelsInterested' &&
            props.row.testDriveStatus == true
          " class="block w-full">
            <span class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25" :class="`${props.row.testDriveStatus === 1
              ? 'text-success-500 bg-success-500'
              : ''
              }
              `">
              สำเร็จ
            </span>

          </span>

          <span v-if="
            props.column.field == 'testDriveStatus' &&
            props.row.testDriveStatus == false
          " class="block w-full">
            <span class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25" :class="`${props.row.testDriveStatus === 0
              ? 'text-warning-500 bg-warning-500'
              : ''
              }
              `">
              -
            </span>
          </span>

          <span v-if="props.column.field == 'testDriveStatusDate'">{{ props.row.testDriveStatusDate ?
            formatDateToThai(props.row.testDriveStatusDate, true) : "-" }}
            <span style="padding-left: 5px;">
              <Tooltip placement="top" arrow theme="dark">
                <template #button>
                  <div @click="openShow(props.row)" class="action-btn">
                    <Icon icon="heroicons:pencil-square" />
                  </div>
                </template>
                <span> แก้ไข</span>
              </Tooltip>
            </span>
          </span>

          <span v-if="
            props.column.field == 'reviewStatus' &&
            props.row.reviewStatus == true
          " class="block w-full">
            <span class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25" :class="`${props.row.reviewStatus === 1
              ? 'text-success-500 bg-success-500'
              : ''
              }
              `">
              สำเร็จ
            </span>
          </span>

          <span v-if="
            props.column.field == 'reviewStatus' &&
            props.row.reviewStatus == false
          " class="block w-full">
            <span class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25" :class="`${props.row.reviewStatus === 0
              ? 'text-warning-500 bg-warning-500'
              : ''
              }
              `">
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

      <div class="modal-groups">
        <Modal title="อัพเดทข้อมูลทดลองขับ" label="" labelClass="btn-outline-dark" ref="modal1">
          <div class="text-base text-slate-600 dark:text-slate-300">
            <div style="display: flex;">
              <div>ชื่อ-นามสกุล : </div>
              <div style="padding-left: 10px;"> <strong>{{ nameModol }} {{ lastNameModol }}</strong></div>
            </div>

            <div style="display: flex; padding-top: 10px;">
              <div>รุ่นรถ : </div>
              <div style="padding-left: 10px;"> <strong>{{ modelsInterestedModol }}</strong></div>
            </div>

            <div style="display: flex;  padding-top: 10px;">
              <div>วันที่นัดหมายทดลองขับ : </div>
              <div style="padding-left: 10px;"> <strong>{{ formatDateToThai(selectedDateModol, true) }} </strong></div>
            </div>

            <div style="display: flex;  padding-top: 10px;">
              <div>ช่วงเวลาที่นัดหมายทดลองขับ : </div>
              <div style="padding-left: 10px;"> <strong> {{ formatSelectedTimeRange(selectedTimeModol) }}</strong></div>
            </div>

            <div style="padding-top: 30px;">
              <FromGroup label="" name="d2">
                <flat-pickr v-model="UpdateTime" class="form-control" placeholder="เวลาที่ทำการทดลองขับ" id="d2"
                  :config="pickerConfig" />
              </FromGroup>

              <div v-if="showWorrng" style="color: red; font-size: 10px;">*กรุณาเลือกวันที่</div>
            </div>
          </div>

          <template v-slot:footer>
            <Button loading="loadingModol" text="ปิด" btnClass="btn-outline-dark " @click="$refs.modal1.closeModal()" />
            <Button text="ยืนยัน" :isLoading="loadingModol" btnClass="btn-dark "
              @click="updateStatus(plainDataPostUpdataStatus)" />
          </template>
        </Modal>
      </div>

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
import Textinput from "@/components/Textinput";
import FormsModal from "@/views/components/modal/modals/FormsModal.vue";
import { useField, useForm } from "vee-validate";
import { useKanbanStore } from "@/store/kanban";
import * as yup from "yup";
import { ref } from "vue";
import { v4 as uuidv4 } from "uuid";
import { formatDateToThai, convertTimeToThai, convertDateTimePostDataApi, formatSelectedTimeRange, getTomorrowDate, getNextYearDate } from '@/plugins/funcation.js'; // สมมติว่าไฟล์อยู่ในโฟลเดอร์ utils
import FromGroup from "@/components/FromGroup";
import * as XLSX from "xlsx"; // เพิ่มการนำเข้า XLSX.js
import { useRoute } from 'vue-router';

export default {
  components: {
    FromGroup,
    FormsModal,
    // DateRangePicker,
    Pagination,
    Icon,
    Tooltip,
    Card,
    InputGroup,
    Button,
    Modal,
    Textinput,
  },
  props: {
    labelClass: {
      type: String,
      default: "btn-primary",
    },
    centered: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "Basic Modal",
    },
    label: {
      type: String,
      default: "Basic Modal",
    },
    disableBackdrop: {
      type: Boolean,
      default: false,
    },
    noFade: {
      type: Boolean,
      default: false,
    },
    themeClass: {
      type: String,
      default:
        "bg-slate-900 dark:bg-slate-800 dark:border-b dark:border-slate-700",
    },
    sizeClass: {
      type: String,
      default: "max-w-xl",
    },
    scrollContent: {
      type: Boolean,
      default: false,
    },
    activeModal: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const isOpen = ref(props.activeModal);
    const route = useRoute();
    const query = route.query;
    // open
    const openModal = () => {
      isOpen.value = !isOpen.value;
    };
    // close
    const closeModal = () => {
      isOpen.value = false;
    };

    return { closeModal, openModal, isOpen, query };
  },
  data() {
    const today = new Date();
    const pastWeek = new Date();
    pastWeek.setDate(today.getDate() - 7);
    return {
      urlEnv: import.meta.env.VITE_APP_API_URL,
      pickerConfig: {
        enableTime: true,
        dateFormat: 'd-m-Y H:i',
        minDate: pastWeek,
        maxDate: today,
      },
      formattedDateThai: '',
      formattedDateInternational: '',
      formattedYearThaiBuddhist: '',
      multiDate: null,
      rangeDate: null,
      leadData: [], // ข้อมูลดิบทั้งหมด
      leadDataAll: [],
      current: 1,
      perpage: 10,
      pageRange: 5,
      totalRows: 0, // จำนวนรายการทั้งหมด
      searchTerm: "",
      columns: [
        // { label: "คำนำหน้า", field: "title", width: "100px" },
        { label: "เป็นเจ้าของรถมาสด้า", field: "memberOwner", width: "200px" },
        { label: "ชื่อ", field: "firstname", width: "150px" },
        { label: "นามสกุล", field: "lastname", width: "150px" },
        // { label: "เพศ", field: "sex", width: "80px" },
        { label: "เบอร์โทรศัพท์", field: "phoneNumber", width: "100px" },
        { label: "อีเมล", field: "email", width: "200px" },
        { label: "ไลน์ไอดี", field: "lineId", formatter: (value) => value || '-',width: "150px" },
        { label: "จังหวัด", field: "province", width: "120px" },
        {
          label: "สนใจทดลองขับ",
          field: "needToTestDrive",
          width: "170px",
        },
        // { label: "จังหวัด", field: "selectedProvince", width: "120px" },
        // { label: "รุ่นรถ", field: "modelsInterested", width: "200px" },
        // { label: "วันที่ลงทะเบียน", field: "dateSubmit", width: "300px" },
        // { label: "สถานะทดลองขับ (Dealer)", field: "testDriveStatus", width: "250px", },
        // { label: "วันที่ทดลองขับ (Dealer)", field: "testDriveStatusDate", width: "300px" },
        // { label: "สถานะ review (Customer)", field: "reviewStatus", width: "200px" },

      ],
      options: [
        { value: "10", label: "10" },
        { value: "25", label: "25" },
        { value: "50", label: "50" },
      ], // ตัวเลือกจำนวนรายการต่อหน้า
      nameModol: "",
      lastNameModol: "",
      selectedDateModol: "",
      modelsInterestedModol: "",
      UpdateTime: "",
      loadingModol: false,
      showWorrng: false,
    };
  },
  watch: {
    UpdateTime() {
      if (this.UpdateTime) {
        this.showWorrng = false
      } else {
        this.showWorrng = true
      }
    }
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
        if (!item.dateSubmit) return false;
        const itemDate = item.dateSubmit;
        const dateSubstring = itemDate.toString().substring(0, 10)
        return dateSubstring >= formattedStartDate && dateSubstring <= formattedEndDate;
      });
      return dataFilter.sort((a, b) => new Date(b.dateSubmit) - new Date(a.dateSubmit));
      // return dataFilter;
    },

    filteredData() {
      const filteredByDate = this.filteredDataByDate;
      if (this.searchTerm) {
        return filteredByDate.filter((item) => {
          return (
            item.firstName.includes(this.searchTerm) ||
            item.lastName.includes(this.searchTerm) ||
            item.email.includes(this.searchTerm) ||
            item.phone.includes(this.searchTerm)
          );
        });
      }
      return filteredByDate;
    },

    paginatedFilteredData() {
      const start = (this.current - 1) * this.perpage;
      const end = start + this.perpage;
      return this.filteredData.slice(start, end);
    }
  },
  methods: {
    clearDate() {
      this.searchTerm = "";
      this.rangeDate = "";
    },
    convertDate(inputDate) {
      // แยกวันที่ออกเป็นส่วนๆ
      let [day, month, year] = inputDate.split("-");

      // แปลงเป็น Date object
      let date = new Date(`${year}-${month}-${day}`);

      // Format ให้เป็น "YYYY-MM-DD HH:MM:SS"
      let formattedDate = date.toISOString().split("T")[0];

      return formattedDate;
    },
    async updateStatus(data) {
      if (this.UpdateTime == '' || this.UpdateTime == null) {
        this.showWorrng = true
        return
      } else {
        this.showWorrng = false
      }
      const result = confirm("คุณต้องการดำเนินการต่อหรือไม่?");
      if (result) {
        this.loadingModol = true;
        try {
          const response = await axios.put(this.urlEnv + '/lead-form/test-drive-status', {
            phone: data.phone,
            testDriveStatus: true,
            testDriveStatusDate: convertDateTimePostDataApi(this.UpdateTime),
            campaignName: "joyatfirstdrive",
          });
          if (response.status === 200) {
            this.loadingModol = false;
            this.$refs.modal1.closeModal()
            alert('บันทึกสำเร็จ')
            this.fetchLeadData();
          }
        } catch (error) {
          this.loadingModol = false;
          console.error('Error updating test drive status:', error);
        }
      } else {
        alert('คุณยกเลิกการดำเนินการ')
      }
    },
    openShow(data) {
      const plainData = JSON.parse(JSON.stringify(data));
      this.plainDataPostUpdataStatus = plainData;
      this.nameModol = plainData.firstName;
      this.lastNameModol = plainData.firstName;
      this.selectedDateModol = plainData.selectedDate;
      this.selectedTimeModol = plainData.selectedTime;
      this.modelsInterestedModol = plainData.modelsInterested;
      this.$refs.modal1.openModal()
    },
    exportAllToExcel() {
      this.exportToExcel(this.leadDataAll);
    },
    exportFilteredToExcel() {
      const filteredData = this.filteredData;
      console.log('filteredData', filteredData);
      this.exportToExcel(filteredData);
    },
    async fetchLeadData() {
      const user = localStorage.getItem('activeUser');
      const userData = JSON.parse(user)
      console.log('userData', userData)
      console.log(this.query.campaignName);
      try {
        const response = await axios.get(this.urlEnv + "/forms");
        this.leadData = response.data.sort((a, b) => new Date(b.dateSubmit) - new Date(a.dateSubmit));
        this.leadDataAll = response.data.map(item => {
          if (item.title === "นาย") {
            item.sex = "ชาย";
          } else {
            item.sex = "หญิง";
          }
          return item;
        }).sort((a, b) => new Date(b.dateSubmit) - new Date(a.dateSubmit));
        this.totalRows = this.leadDataAll.length;
        console.log('this.leadDataAll', this.leadDataAll)
      } catch (error) {
        console.error("Error fetching lead data:", error);
      }
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
        console.error("Data is not an array:", data);
        return;
      }
      const exportData = data.map((item) => ({
        // คำนำหน้า: item.title,
        เป็นเจ้าของรถมาสด้า: item.memberOwner == 1 ? 'ใช่' : 'ไม่ใช่',
        ชื่อ: item.firstname,
        นามสกุล: item.lastname,
        // เพศ: item.title == 'นาย' ? 'ชาย' : 'หญิง',
        เบอร์โทรศัพท์: item.phoneNumber.toString().padStart(10, "0"),
        อีเมล: item.email,
        ไลน์ไอดี: item.lineId || '-',
        // "วันที่นัดหมายทดลองขับ": item.selectedDate ? formatDateToThai(item.selectedDate, false) : '-',
        // ช่วงเวลาที่นัดหมาย: this.formatSelectedTimeRange(item.selectedTime),
        // ตัวแทนจำหน่าย: item.selectedDealer,
        จังหวัด: item.province,
        สนใจทดลองขับ: item.needToTestDrive == 1 ? 'สนใจ' : 'ไม่สนใจ',
        // รุ่นรถ: Array.isArray(item.modelsInterested) ? item.modelsInterested.join(", ") : item.modelsInterested,
        // วันที่ลงทะเบียน: formatDateToThai(item.dateSubmit, true),
        // 'สภานะทดลองขับ (DEALER)': item.testDriveStatus == true ? 'สำเร็จ' : '-',
        // 'วันที่ทดลองขับ (DEALER)': item.testDriveStatusDate ? formatDateToThai(item.testDriveStatusDate, true) : "-",
        // 'วันที่ทดลองขับ (DEALER)': item.reviewStatus == true ? 'สำเร็จ' : "-",

      }));

      const exportDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const fileName = `ยืนยันนัดหมายทดลองขับ_${exportDate}.xlsx`;
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ยืนยันนัดหมายทดลองขับ");
      XLSX.writeFile(wb, fileName);
    },

    convertTimeToThai,
    formatDateToThai,
    convertDateTimePostDataApi,
    formatSelectedTimeRange,
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

.btn-clear {
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-clear:hover {
  background-color: #d32f2f;
  padding-left: 10px;
}
</style>