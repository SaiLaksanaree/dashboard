
<!-- pre-registration-dashboard -->
<template>
  <div class="wrapper">
    <div class="container grid">
      <div ref="wrapperRef" :class="{ 'capture-mode': isCapturing }" style="padding: 16px;">
        <div class="header-row">
          <h5 class="header-title"> Sales Thailand</h5>
          <div style="margin-left:auto; display:flex; gap:8px; align-items:center;">
            <select v-model="exportFormat" class="btn-capture" aria-label="Export format">
              <option value="jpeg">JPEG</option>
              <option value="pdf">PDF</option>
            </select>
            <div class="btn-capture" @click="exportJpg">Export Graph</div>
          </div>
        </div>
        <h4>Pre-Registration</h4>

        <Filters :options="options" v-model="filters" />

        <div class="grid two-cols">
          <!-- <KPI :total="filtered.length" :months="monthSeries" :status="filtered" /> -->
          <KPI :total="filtered.length" :months="monthSeries" :status="filtered"
            :newsletter-on="newsletterOnCount" :autoHover="!isCapturing" />
          <ChartData
            v-if="filters.from && filters.to"
            :dateMin="filters.from"
            :dateMax="filters.to"
            :autoHover="!isCapturing"
            :dealer="filters.DealerCode"
            :zone="filters.ZoneSale"
          />


        </div>

        <div class="grid two-cols">
          <ZoneBar :dealer="byZone.labels" :values="byZone.values" :autoHover="!isCapturing" />
          <DealerBar :dealer="byDealer.labels" :values="byDealer.values" :autoHover="!isCapturing" />
        </div>

        <div class="grid three-cols">
          <PackagePie :items="pkgPie" />
          <StackedColorExterior :categories="extColorCatsWithOthers" :series="extColorSeries" :autoHover="!isCapturing" />
          <StackedColorInterior :categories="intColorCatsWithOthers" :series="intColorSeries" :autoHover="!isCapturing" />
        </div>

      </div>

      <DataTable :items="paged.items" :page="page" :totalPages="paged.totalPages" :sort="sort" :key="filtered.length"
        @sort-change="sort = $event; page = 1" @change-page="page = $event" @export-excel="exportExcel" @view="onView"
        @load-more="loadMore" />
      <DetailModal class="DetailModalStyle" :open="showDetail" v-if="selected" :record="selected"
        @close="showDetail = false; selected = null" />
    </div>
  </div>
</template>
<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

// Components
import Filters from '@/components/Dashboard/Filters.vue'
import KPI from '@/components/Dashboard/KPI.vue'
import StackedColorExterior from '@/components/Dashboard/StackedColorExterior.vue'
import StackedColorInterior from '@/components/Dashboard/StackedColorInterior.vue'
import DealerBar from '@/components/Dashboard/DealerBar.vue'
import ZoneBar from '@/components/Dashboard/ZoneBar.vue'
import PackagePie from '@/components/Dashboard/PackagePie.vue'
import DataTable from '@/components/Dashboard/DataTable.vue'
import DetailModal from '@/components/Dashboard/DetailModal.vue'
import ChartData from '@/components/Dashboard/ChartData.vue'
import * as htmlToImage from 'html-to-image'
import axios from 'axios'
import { jsPDF } from 'jspdf' // <-- new
// ✅ เพิ่ม: ใช้ตัวนับจาก Pinia store
import { useThemeSettingsStore } from '@/store/themeSettings'

import domtoimage from 'dom-to-image';


// Utils & Types
import { uniq, groupBy, withinRange, formatDateTime } from '@/utils'

// ✅ เอา theme store มาใช้ในอินเตอร์เซปเตอร์ (reference count)
const theme = useThemeSettingsStore()

// Static mock data
const mockData = {
  preRegistration: {
    data: [
      {
        "ID": "PRE001",
        "BookingCreated": "2025-01-23T10:30:00Z",
        "memberDisplayId": "001234",
        "Newsletter": "On",
        "ZoneSale": "Central",
        "Dealer": " Bangkok",
        "DealerCode": "MBK001",
        "Color": "Soul Red Crystal",
        "InteriorOption": "Black Leather",
        "PackageName": "Premium Package",
        "Model": "CX-5",
        "Grade": "2.5 Turbo AWD",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "CX-5 Premium Experience",
        "Detail": "Complete test drive package with premium features",
        "associatedPerson": {
          "firstName": "สมชาย",
          "lastName": "ใจดี",
          "email": "somchai@email.com",
          "phone": "081-234-5678"
        },
        "packagedetail": [
          {
            "Title": "Premium Package",
            "Subtitle": "Full Feature Experience",
            "Detail": "Includes all premium features and accessories"
          }
        ]
      },
      {
        "ID": "PRE002",
        "BookingCreated": "2025-01-23T14:20:00Z",
        "memberDisplayId": "001235",
        "Newsletter": "Off",
        "ZoneSale": "Northern",
        "Dealer": " Chiang Mai",
        "DealerCode": "MCM002",
        "Color": "Machine Gray Metallic",
        "InteriorOption": "Parchment Leather",
        "PackageName": "Standard Package",
        "Model": "BT-50",
        "Grade": "2.0 SP Hatchback",
        "Status": "Pending",
        "Title": "Test Drive Booking",
        "Subtitle": "BT-50 Standard Experience",
        "Detail": "Standard test drive package",
        "associatedPerson": {
          "firstName": "สุดา",
          "lastName": "รักดี",
          "email": "suda@email.com",
          "phone": "082-345-6789"
        },
        "packagedetail": [
          {
            "Title": "Standard Package",
            "Subtitle": "Essential Features",
            "Detail": "Basic features and standard accessories"
          }
        ]
      },
      {
        "ID": "PRE003",
        "BookingCreated": "2025-01-22T09:15:00Z",
        "memberDisplayId": "001236",
        "Newsletter": "On",
        "ZoneSale": "Eastern",
        "Dealer": " Pattaya",
        "DealerCode": "MPT003",
        "Color": "Snowflake White Pearl",
        "InteriorOption": "Black Cloth",
        "PackageName": "Sport Package",
        "Model": "CX-30",
        "Grade": "2.0 SP AWD",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "CX-30 Sport Experience",
        "Detail": "Sport package with enhanced performance features",
        "associatedPerson": {
          "firstName": "วิชัย",
          "lastName": "มั่นคง",
          "email": "wichai@email.com",
          "phone": "083-456-7890"
        },
        "packagedetail": [
          {
            "Title": "Sport Package",
            "Subtitle": "Performance Enhanced",
            "Detail": "Sport tuned suspension and performance accessories"
          }
        ]
      },
   
      {
        "ID": "PRE005",
        "BookingCreated": "2025-01-21T11:30:00Z",
        "memberDisplayId": "001238",
        "Newsletter": "Off",
        "ZoneSale": "Western",
        "Dealer": " Kanchanaburi",
        "DealerCode": "MKB005",
        "Color": "Jet Black Mica",
        "InteriorOption": "Red Leather",
        "PackageName": "Premium Package",
        "Model": "MX-5",
        "Grade": "2.0 RF GT",
        "Status": "Pending",
        "Title": "Test Drive Booking",
        "Subtitle": "MX-5 Premium Experience",
        "Detail": "Premium roadster experience package",
        "associatedPerson": {
          "firstName": "อนุชา",
          "lastName": "เจริญ",
          "email": "anucha@email.com",
          "phone": "085-678-9012"
        },
        "packagedetail": [
          {
            "Title": "Premium Package",
            "Subtitle": "Roadster Excellence",
            "Detail": "Premium roadster features and performance enhancements"
          }
        ]
      },
      {
        "ID": "PRE006",
        "BookingCreated": "2025-01-21T08:45:00Z",
        "memberDisplayId": "001239",
        "Newsletter": "On",
        "ZoneSale": "Central",
        "Dealer": " Siam Paragon",
        "DealerCode": "MSP006",
        "Color": "Polymetal Gray Metallic",
        "InteriorOption": "White Leather",
        "PackageName": "Signature Package",
        "Model": "CX-60",
        "Grade": "3.3 Turbo PHEV AWD",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "CX-60 Hybrid Experience",
        "Detail": "Latest hybrid technology with premium comfort",
        "associatedPerson": {
          "firstName": "ปรีชา",
          "lastName": "วิทยากร",
          "email": "preecha@email.com",
          "phone": "086-123-4567"
        },
        "packagedetail": [
          {
            "Title": "Signature Package",
            "Subtitle": "Hybrid Excellence",
            "Detail": "Advanced hybrid powertrain with luxury appointments"
          }
        ]
      },
      {
        "ID": "PRE007",
        "BookingCreated": "2025-01-20T15:20:00Z",
        "memberDisplayId": "001240",
        "Newsletter": "Off",
        "ZoneSale": "Northern",
        "Dealer": " Chiang Rai",
        "DealerCode": "MCR007",
        "Color": "Ceramic Metallic",
        "InteriorOption": "Burgundy Leather",
        "PackageName": "Sport Package",
        "Model": "BT-502",
        "Grade": "1.3 Sports High Connect",
        "Status": "Pending",
        "Title": "Test Drive Booking",
        "Subtitle": "BT-502 Compact Experience",
        "Detail": "Efficient and stylish city driving experience",
        "associatedPerson": {
          "firstName": "มนัสวี",
          "lastName": "สุขสันต์",
          "email": "manaswee@email.com",
          "phone": "087-234-5678"
        },
        "packagedetail": [
          {
            "Title": "Sport Package",
            "Subtitle": "Urban Agility",
            "Detail": "Perfect for city driving with sporty enhancements"
          }
        ]
      },
      {
        "ID": "PRE008",
        "BookingCreated": "2025-01-20T12:10:00Z",
        "memberDisplayId": "001241",
        "Newsletter": "On",
        "ZoneSale": "Eastern",
        "Dealer": " Rayong",
        "DealerCode": "MRY008",
        "Color": "Zircon Sand Metallic",
        "InteriorOption": "Beige Cloth",
        "PackageName": "Standard Package",
        "Model": "BT-50",
        "Grade": "3.0 SP Double Cab Hi-Racer",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "BT-50 Pickup Experience",
        "Detail": "Rugged pickup truck for work and adventure",
        "associatedPerson": {
          "firstName": "สุรชัย",
          "lastName": "แกล้วกล้า",
          "email": "surachai@email.com",
          "phone": "088-345-6789"
        },
        "packagedetail": [
          {
            "Title": "Standard Package",
            "Subtitle": "Tough & Reliable",
            "Detail": "Built for durability and performance"
          }
        ]
      },
      {
        "ID": "PRE009",
        "BookingCreated": "2025-01-19T17:30:00Z",
        "memberDisplayId": "001242",
        "Newsletter": "On",
        "ZoneSale": "Southern",
        "Dealer": " Hat Yai",
        "DealerCode": "MHY009",
        "Color": "Eternal Blue Mica",
        "InteriorOption": "Gray Leather",
        "PackageName": "Premium Package",
        "Model": "CX-8",
        "Grade": "2.5 Turbo AWD Exclusive",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "CX-8 Family Experience",
        "Detail": "Spacious 7-seater SUV for family adventures",
        "associatedPerson": {
          "firstName": "วราภรณ์",
          "lastName": "สุขเกษม",
          "email": "waraporn@email.com",
          "phone": "089-456-7890"
        },
        "packagedetail": [
          {
            "Title": "Premium Package",
            "Subtitle": "Family Luxury",
            "Detail": "Premium 7-seater with advanced safety features"
          }
        ]
      },
      {
        "ID": "PRE010",
        "BookingCreated": "2025-01-19T13:45:00Z",
        "memberDisplayId": "001243",
        "Newsletter": "Off",
        "ZoneSale": "Western",
        "Dealer": " Ratchaburi",
        "DealerCode": "MRC010",
        "Color": "Arctic White",
        "InteriorOption": "Charcoal Cloth",
        "PackageName": "Standard Package",
        "Model": "BT-50",
        "Grade": "2.0 C Sedan",
        "Status": "Pending",
        "Title": "Test Drive Booking",
        "Subtitle": "BT-50 Sedan Experience",
        "Detail": "Elegant sedan with premium design",
        "associatedPerson": {
          "firstName": "ธนากร",
          "lastName": "มั่งคั่ง",
          "email": "thanakorn@email.com",
          "phone": "090-567-8901"
        },
        "packagedetail": [
          {
            "Title": "Standard Package",
            "Subtitle": "Elegant Design",
            "Detail": "Sophisticated sedan for professional use"
          }
        ]
      },
      {
        "ID": "PRE011",
        "BookingCreated": "2025-01-18T09:20:00Z",
        "memberDisplayId": "001244",
        "Newsletter": "On",
        "ZoneSale": "Central",
        "Dealer": " Ladprao",
        "DealerCode": "MLP011",
        "Color": "Sonic Silver Metallic",
        "InteriorOption": "Black Leather",
        "PackageName": "Luxury Package",
        "Model": "CX-5",
        "Grade": "2.0 C AWD",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "CX-5 AWD Experience",
        "Detail": "All-wheel drive capability with luxury features",
        "associatedPerson": {
          "firstName": "สิริพร",
          "lastName": "เจริญรุ่ง",
          "email": "siriporn@email.com",
          "phone": "091-678-9012"
        },
        "packagedetail": [
          {
            "Title": "Luxury Package",
            "Subtitle": "AWD Performance",
            "Detail": "Superior traction and control in all conditions"
          }
        ]
      },
      {
        "ID": "PRE012",
        "BookingCreated": "2025-01-18T14:15:00Z",
        "memberDisplayId": "001245",
        "Newsletter": "On",
        "ZoneSale": "Northern",
        "Dealer": " Lampang",
        "DealerCode": "MLP012",
        "Color": "Titanium Flash Mica",
        "InteriorOption": "Brown Leather",
        "PackageName": "Sport Package",
        "Model": "CX-30",
        "Grade": "2.0 SP",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "CX-30 Urban Experience",
        "Detail": "Compact SUV perfect for urban lifestyle",
        "associatedPerson": {
          "firstName": "ชัยวัฒน์",
          "lastName": "ประสบสุข",
          "email": "chaiwat@email.com",
          "phone": "092-789-0123"
        },
        "packagedetail": [
          {
            "Title": "Sport Package",
            "Subtitle": "Urban Mobility",
            "Detail": "Agile handling for city and highway driving"
          }
        ]
      },
      {
        "ID": "PRE013",
        "BookingCreated": "2025-01-17T11:40:00Z",
        "memberDisplayId": "001246",
        "Newsletter": "Off",
        "ZoneSale": "Eastern",
        "Dealer": " Chonburi",
        "DealerCode": "MCB013",
        "Color": "Meteor Gray Mica",
        "InteriorOption": "Ivory Leather",
        "PackageName": "Premium Package",
        "Model": "MX-30",
        "Grade": "Electric",
        "Status": "Pending",
        "Title": "Test Drive Booking",
        "Subtitle": "MX-30 Electric Experience",
        "Detail": "Zero-emission electric vehicle experience",
        "associatedPerson": {
          "firstName": "อรุณี",
          "lastName": "สีเขียว",
          "email": "arunee@email.com",
          "phone": "093-890-1234"
        },
        "packagedetail": [
          {
            "Title": "Premium Package",
            "Subtitle": "Electric Future",
            "Detail": "Experience the future of sustainable mobility"
          }
        ]
      },
      {
        "ID": "PRE014",
        "BookingCreated": "2025-01-17T16:25:00Z",
        "memberDisplayId": "001247",
        "Newsletter": "On",
        "ZoneSale": "Southern",
        "Dealer": " Surat Thani",
        "DealerCode": "MST014",
        "Color": "Rhodium White Premium Metallic",
        "InteriorOption": "Nappa Leather Black",
        "PackageName": "Signature Package",
        "Model": "CX-90",
        "Grade": "3.3 Turbo PHEV AWD",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "CX-90 Flagship Experience",
        "Detail": "Flagship 3-row SUV with hybrid technology",
        "associatedPerson": {
          "firstName": "ประยูร",
          "lastName": "มหาชัย",
          "email": "prayoon@email.com",
          "phone": "094-901-2345"
        },
        "packagedetail": [
          {
            "Title": "Signature Package",
            "Subtitle": "Flagship Excellence",
            "Detail": "Ultimate luxury and performance in a 3-row SUV"
          }
        ]
      },
      {
        "ID": "PRE015",
        "BookingCreated": "2025-01-16T10:50:00Z",
        "memberDisplayId": "001248",
        "Newsletter": "On",
        "ZoneSale": "Western",
        "Dealer": " Phetchaburi",
        "DealerCode": "MPB015",
        "Color": "Crystal White Pearl Mica",
        "InteriorOption": "Terracotta Leather",
        "PackageName": "Premium Package",
        "Model": "BT-506",
        "Grade": "2.5 Turbo Signature",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "BT-506 Executive Experience",
        "Detail": "Executive sedan with turbocharged performance",
        "associatedPerson": {
          "firstName": "กมลชนก",
          "lastName": "รุ่งเรือง",
          "email": "kamonchonok@email.com",
          "phone": "095-012-3456"
        },
        "packagedetail": [
          {
            "Title": "Premium Package",
            "Subtitle": "Executive Performance",
            "Detail": "Turbocharged power with executive refinement"
          }
        ]
      },
      {
        "ID": "PRE016",
        "BookingCreated": "2025-01-16T15:35:00Z",
        "memberDisplayId": "001249",
        "Newsletter": "Off",
        "ZoneSale": "Central",
        "Dealer": " Ramkhamhaeng",
        "DealerCode": "MRK016",
        "Color": "Artisan Red Premium",
        "InteriorOption": "Caturra Brown Nappa Leather",
        "PackageName": "Luxury Package",
        "Model": "CX-5",
        "Grade": "2.5 Turbo Signature AWD",
        "Status": "Pending",
        "Title": "Test Drive Booking",
        "Subtitle": "CX-5 Signature Experience",
        "Detail": "Top-tier CX-5 with signature luxury features",
        "associatedPerson": {
          "firstName": "วิทยา",
          "lastName": "ปัญญาดี",
          "email": "witaya@email.com",
          "phone": "096-123-4567"
        },
        "packagedetail": [
          {
            "Title": "Luxury Package",
            "Subtitle": "Signature Luxury",
            "Detail": "Premium materials and advanced technology"
          }
        ]
      },
      {
        "ID": "PRE017",
        "BookingCreated": "2025-01-15T12:20:00Z",
        "memberDisplayId": "001250",
        "Newsletter": "On",
        "ZoneSale": "Northern",
        "Dealer": " Phitsanulok",
        "DealerCode": "MPS017",
        "Color": "Platinum Quartz Metallic",
        "InteriorOption": "Pure White Leather",
        "PackageName": "Sport Package",
        "Model": "BT-50",
        "Grade": "2.0 Turbo Hatchback",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "BT-50 Turbo Experience",
        "Detail": "High-performance turbocharged hatchback",
        "associatedPerson": {
          "firstName": "นันทนา",
          "lastName": "สุขสวัสดิ์",
          "email": "nantana@email.com",
          "phone": "097-234-5678"
        },
        "packagedetail": [
          {
            "Title": "Sport Package",
            "Subtitle": "Turbo Performance",
            "Detail": "Exhilarating turbocharged driving experience"
          }
        ]
      },
      {
        "ID": "PRE018",
        "BookingCreated": "2025-01-15T08:10:00Z",
        "memberDisplayId": "001251",
        "Newsletter": "On",
        "ZoneSale": "Eastern",
        "Dealer": " Trat",
        "DealerCode": "MTR018",
        "Color": "Magma Red Metallic",
        "InteriorOption": "Ebony Leather",
        "PackageName": "Standard Package",
        "Model": "CX-30",
        "Grade": "2.0 C",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "CX-30 Essential Experience",
        "Detail": "Essential features with  quality",
        "associatedPerson": {
          "firstName": "สุพจน์",
          "lastName": "เก่งการ",
          "email": "supot@email.com",
          "phone": "098-345-6789"
        },
        "packagedetail": [
          {
            "Title": "Standard Package",
            "Subtitle": "Essential Quality",
            "Detail": "Core  experience with essential features"
          }
        ]
      },
      {
        "ID": "PRE019",
        "BookingCreated": "2025-01-14T19:45:00Z",
        "memberDisplayId": "001252",
        "Newsletter": "Off",
        "ZoneSale": "Southern",
        "Dealer": " Krabi",
        "DealerCode": "MKR019",
        "Color": "Snowflake White Pearl",
        "InteriorOption": "Stone Leather",
        "PackageName": "Premium Package",
        "Model": "BT-50",
        "Grade": "1.9 SP Double Cab",
        "Status": "Pending",
        "Title": "Test Drive Booking",
        "Subtitle": "BT-50 Adventure Experience",
        "Detail": "Adventure-ready pickup for outdoor enthusiasts",
        "associatedPerson": {
          "firstName": "จิรายุ",
          "lastName": "ผจญภัย",
          "email": "jirayu@email.com",
          "phone": "099-456-7890"
        },
        "packagedetail": [
          {
            "Title": "Premium Package",
            "Subtitle": "Adventure Ready",
            "Detail": "Built for adventure with premium comfort"
          }
        ]
      },
      {
        "ID": "PRE020",
        "BookingCreated": "2025-01-14T07:30:00Z",
        "memberDisplayId": "001253",
        "Newsletter": "On",
        "ZoneSale": "Western",
        "Dealer": " Prachuap Khiri Khan",
        "DealerCode": "MPK020",
        "Color": "Brilliant Black",
        "InteriorOption": "Garnet Red Leather",
        "PackageName": "Signature Package",
        "Model": "MX-5",
        "Grade": "2.0 RF Club",
        "Status": "Confirmed",
        "Title": "Test Drive Booking",
        "Subtitle": "MX-5 Club Experience",
        "Detail": "Pure driving pleasure with club-spec features",
        "associatedPerson": {
          "firstName": "ธีรพงษ์",
          "lastName": "ใจรักษ์",
          "email": "teerapong@email.com",
          "phone": "080-567-8901"
        },
        "packagedetail": [
          {
            "Title": "Signature Package",
            "Subtitle": "Pure Driving Joy",
            "Detail": "Ultimate roadster experience with club features"
          }
        ]
      }
    ]
  }
};

function mapApiRecord(r) {
  const person = r.associatedPerson || {}
  const pd = Array.isArray(r.packagedetail)
    ? r.packagedetail[0] || {}
    : (r.packagedetail || {});
  return {
    // ฟิลด์ที่ UI ใช้
    bookingAt: r.BookingCreated ? new Date(r.BookingCreated).toISOString() : null,
    bookingNo: r.ID || '',
    memberDisplayId: r.memberDisplayId || '',
    firstName: person.firstName || '',
    lastName: person.lastName || '',
    Newsletter: r.Newsletter || '',

    ZoneSale: r.ZoneSale || '',
    dealer: r.Dealer || '',
    DealerCode: r.DealerCode || '',
    exteriorColor: r.Color || '',
    InteriorOption: r.InteriorOption || '',
    package: r.PackageName || 'None',
    model: r.Model || '',
    range: r.Grade || '',

    email: person.email || '',
    phone: person.phone || '',
    status: r.Status || '',

    Title: (pd && pd.Title) || r.Title || '',
    Subtitle: (pd && pd.Subtitle) || r.Subtitle || '',
    Detail: (pd && pd.Detail) || r.Detail || '',

    // เก็บต้นฉบับไว้ดูใน modal/debug
    _raw: r
  }
}

function pickArrayFromPayload(payload) {
  const candidates = [
    payload,
    payload?.data,
    payload?.items,
    payload?.rows,
    payload?.result?.items,
    payload?.result?.rows,
  ]
  const arr = candidates.find(a => Array.isArray(a))
  if (!arr) throw new Error('[toBase] Unexpected API shape, no array found')
  return arr
}

function toBase(payload) {
  const arr = pickArrayFromPayload(payload)
  return arr.map(mapApiRecord)
}

/** ========= COMPONENT ========= */
export default {
  components: {
    Filters, KPI, StackedColorExterior, StackedColorInterior,
    DealerBar, ZoneBar, PackagePie, DataTable, DetailModal, ChartData
  },
  setup() {
    const exportFormat = ref('jpeg') // <-- new: 'jpeg' | 'pdf'
     const raw = ref([])
     const loading = ref(true)   // ← local state หน้านี้ (แยกจาก global overlay)
     const error = ref(null)
     const today = dayjs()
     const filters = ref({
       from: '',
       to: '',
       extColor: '',
       intColor: '',
       DealerCode: '',
       model: '',
       ZoneSale: ''
     })

     const userApplied = ref(false)


     const wrapperRef = ref(null)
     const isCapturing = ref(false)


     async function exportJpg() {
       const node = wrapperRef.value;
       if (!node) return;
 
       isCapturing.value = true;
       await nextTick();
 
       try {
         const { width, height } = node.getBoundingClientRect();
 
         // สร้าง Image จาก DOM element
         const dataUrl = await domtoimage.toJpeg(node, {
           quality: 0.95,
           pixelRatio: Math.max(2, window.devicePixelRatio || 1),
           backgroundColor: '#ffffff',
           width: Math.round(width),
           height: Math.round(height),
           filter: (el) => {
             // ปิดการจับภาพ tooltip
             if (!el) return true;
             const cls = el.className || '';
             if (el.classList) {
               if (
                 el.classList.contains('apexcharts-tooltip') ||
                 el.classList.contains('echarts-tooltip') ||
                 el.classList.contains('chart-tooltip')
               ) {
                 return false;
               }
               if (el.classList.contains('no-capture')) return false;
             } else if (typeof cls === 'string' && cls.includes('tooltip')) {
               return false;
             }
             return true;
           },
         });
 
        if (exportFormat.value === 'pdf') {
          // convert image dataURL to Image to get natural size
          const img = new Image();
          img.src = dataUrl;
          await img.decode();
          // create PDF with same pixel size (use 'px' units)
          const pdf = new jsPDF({ unit: 'px', format: [img.width, img.height] });
          pdf.addImage(dataUrl, 'JPEG', 0, 0, img.width, img.height);
          pdf.save(`Pre_Registration_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
        } else {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `Pre_Registration_${dayjs().format('YYYYMMDD_HHmmss')}.jpg`;
          a.click();
        }
       } catch (e) {
         console.error(e);
         alert('บันทึก JPG ไม่สำเร็จ ลองใหม่อีกครั้ง');
       } finally {
         isCapturing.value = false;
       }
     }



    async function fetchPrebookings() {
      try {
        theme.startLoading()
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Use static mock data
        const normalized = toBase(mockData.preRegistration)
        raw.value = normalized
      } catch (e) {
        console.group('%c[API] Fetch ERROR', 'color:#d32f2f;font-weight:700')
        console.error('Mock Data Error:', e.message)
        console.groupEnd()
        error.value = e?.message || 'Fetch failed'
      } finally {
        theme.stopLoading()
        loading.value = false
        await nextTick()
        window.dispatchEvent(new Event('resize'))
      }
    }

    onMounted(fetchPrebookings)

    const dataMin = computed(() => {
      const valid = raw.value.map(r => dayjs(r.bookingAt)).filter(d => d.isValid())
      return valid.length ? dayjs(Math.min(...valid.map(d => d.valueOf()))) : dayjs()
    })

    const dataMax = computed(() => {
      const valid = raw.value.map(r => dayjs(r.bookingAt)).filter(d => d.isValid())
      return valid.length ? dayjs(Math.max(...valid.map(d => d.valueOf()))) : dayjs()
    })

    watch(raw, () => {
      if (!raw.value.length || userApplied.value) return
      const initialFrom = dataMin.value.startOf('day').format('YYYY-MM-DD')
      const initialTo = dataMax.value.format('YYYY-MM-DD') // ไม่หนีบเป็น today
      filters.value = { ...filters.value, from: initialFrom, to: initialTo }
      // console.log('⏱️ init range:', { from: initialFrom, to: initialTo })
    }, { immediate: true })



const options = computed(() => {
  const dealerMap = new Map()

  raw.value.forEach(t => {
    const code = t.DealerCode || ''
    if (!code) return

    if (!dealerMap.has(code)) {
      dealerMap.set(code, {
        name: t.dealer,     
        value: code,          
        zone: t.ZoneSale || '' 
      })
    }
  })

  return {
    extColors: uniq(raw.value.map(r => r.exteriorColor || '').filter(Boolean)),
    intColors: uniq(raw.value.map(r => r.InteriorOption || '').filter(Boolean)),
    dealer: uniq(raw.value.map(r => r.dealer || '').filter(Boolean)),
    dealerCode: uniq(raw.value.map(r => r.DealerCode || '').filter(Boolean)),
    model: uniq(raw.value.map(r => r.model || '').filter(Boolean)),
    ZoneSale: uniq(raw.value.map(r => r.ZoneSale || '').filter(Boolean)),
    dealerRec: [...dealerMap.values()]
  }
})


    const filtered = computed(() => {
      if (!filters.value.from || !filters.value.to) return raw.value
      const effectiveFrom = dayjs(filters.value.from).startOf('day').toISOString()
      const effectiveTo = dayjs(filters.value.to).endOf('day').toISOString()
      return raw.value.filter(r => {
        if (!withinRange(r, effectiveFrom, effectiveTo)) return false
        if (filters.value.extColor && r.exteriorColor !== filters.value.extColor) return false
        if (filters.value.intColor && r.InteriorOption !== filters.value.intColor) return false
        if (filters.value.ZoneSale && r.ZoneSale !== filters.value.ZoneSale) return false
        if (filters.value.model && r.model !== filters.value.model) return false
        if (filters.value.DealerCode && r.DealerCode !== filters.value.DealerCode) return false  // ✅ ตรงนี้
        return true
      })
    })


    function monthLabelsBetween(fromISO, toISO) {
      let cur = dayjs(fromISO).startOf('month')
      const end = dayjs(toISO).startOf('month')
      const labels = []
      while (cur.isBefore(end) || cur.isSame(end)) {
        labels.push(cur.format('MMM-YY'))
        cur = cur.add(1, 'month')
      }
      return labels
    }

    const monthSeries = computed(() => {
      let labels
      if (userApplied.value) {
        labels = monthLabelsBetween(filters.value.from, filters.value.to)
      } else {
        const toMoment = dayjs(filters.value.to || today)
        const start3 = toMoment.startOf('month').subtract(2, 'month')
        labels = monthLabelsBetween(start3.format('YYYY-MM-DD'), toMoment.format('YYYY-MM-DD'))
      }
      const byMonth = groupBy(filtered.value, r => dayjs(r.bookingAt).format('MMM-YY'))
      return labels.map(label => ({ label, value: byMonth[label]?.length ?? 0 }))
    })

    // -------- Stacked Exterior/InteriorOption --------
    // Helper function to limit colors to top 5 and group others
    function limitColorsToTop5(records, colorKey) {
      const colorCounts = {}
      records.forEach(r => {
        const color = r[colorKey] || 'Unknown'
        colorCounts[color] = (colorCounts[color] || 0) + 1
      })
      
      // Sort colors by count (descending) and take top 5
      const sortedColors = Object.entries(colorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([color]) => color)
      
      return sortedColors.sort() // Sort alphabetically for consistent display
    }

    const extColorCats = computed(() => limitColorsToTop5(filtered.value, 'exteriorColor'))
    const intColorCats = computed(() => limitColorsToTop5(filtered.value, 'InteriorOption'))

    function buildStackSeries(records, colorKey, colors) {
      const byModel = groupBy(records, r => (r.model && r.model.trim()) ? r.model : 'All Models')
      const series = Object.entries(byModel).map(([model, items]) => {
        const counts = colors.map(c => {
          return items.filter(it => {
            const itemColor = it[colorKey] || 'Unknown'
            return itemColor === c
          }).length
        })
        
 
        
        return { name: model, data: counts }
      })
      series.sort((a, b) => b.data.reduce((s, v) => s + v, 0) - a.data.reduce((s, v) => s + v, 0))
      return series
    }

    const extColorCatsWithOthers = computed(() => {
      const allColors = uniq(filtered.value.map(r => r.exteriorColor || 'Unknown'))
      const hasOthers = allColors.length > 5
      return hasOthers ? [...extColorCats.value] : extColorCats.value
    })

    const intColorCatsWithOthers = computed(() => {
      const allColors = uniq(filtered.value.map(r => r.InteriorOption || 'Unknown'))
      const hasOthers = allColors.length > 5
      return hasOthers ? [...intColorCats.value] : intColorCats.value
    })

    const extColorSeries = computed(() => buildStackSeries(filtered.value, 'exteriorColor', extColorCats.value))
    const intColorSeries = computed(() => buildStackSeries(filtered.value, 'InteriorOption', intColorCats.value))

    const byDealer = computed(() => {
      const g = groupBy(filtered.value, r => r.dealer || 'Unknown')
      const labels = Object.keys(g).sort((a, b) => g[b].length - g[a].length)
      const values = labels.map(l => g[l].length)
      return { labels, values }
    })

    const byZone = computed(() => {
      const g = groupBy(filtered.value, r => r.ZoneSale || 'Unknown')
      const labels = Object.keys(g).sort((a, b) => g[b].length - g[a].length)
      const values = labels.map(l => g[l].length)
      return { labels, values }
    })


    const pkgPie = computed(() => {
      const g = groupBy(filtered.value, r => r.package || 'None')
      return Object.entries(g)
        .filter(([name]) => name !== 'None')
        .map(([name, items]) => ({ name, value: items.length }))
    })

    const sort = ref({ key: 'bookingAt', dir: 'desc' })
    const sorted = computed(() => {
      const arr = [...filtered.value]
      const dir = sort.value.dir === 'asc' ? 1 : -1
      const cmp = (a, b) => (a > b ? 1 : a < b ? -1 : 0) * dir
      arr.sort((a, b) => {
        switch (sort.value.key) {
          case 'bookingAt': return ((new Date(a.bookingAt)).getTime() - (new Date(b.bookingAt)).getTime()) * dir
          case 'bookingNo': return cmp(a.bookingNo, b.bookingNo)
          case 'memberDisplayId': return cmp(a.memberDisplayId, b.memberDisplayId)
          case 'firstName': return cmp(a.firstName, b.firstName)
          case 'lastName': return cmp(a.lastName, b.lastName)
          case 'Newsletter': return cmp(a.Newsletter, b.Newsletter)
          case 'dealer': return cmp(a.dealer, b.dealer)
          default: return 0
        }
      })
      return arr
    })

    const newsletterOnCount = computed(() => filtered.value.filter(r => r.Newsletter === 'On').length)

    const page = ref(1)
    const paged = computed(() => ({
      items: sorted.value,
      totalPages: 1,
    }))

    function formatNewsletter(v) {
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase()
        if (s === 'on') return 'Yes'
        if (s === 'off') return 'No'
      } else if (typeof v === 'boolean') {
        return v ? 'Yes' : 'No'
      }
      if (v == null || v === '') return '-'
      return String(v)
    }

    function exportExcel() {
      console.log('data:', sorted.value);
      const data = sorted.value.map(r => ({
        'วันเวลาที่จอง': formatDateTime(r.bookingAt),
        'หมายเลขการจอง': r.bookingNo,
        ' ID': r.memberDisplayId,
        'ชื่อ': r.firstName,
        'นามสกุล': r.lastName,
        'อีเมล': r.email,
        'เบอร์โทร': r.phone,
        'รุ่นรถ(Model)': r.model,
        'รุ่นย่อย(Sub-Model)': r.Grade,
        'สีภายนอก': r.exteriorColor,
        'วัสดุภายใน': r.InteriorOption,
        'Zone': r.ZoneSale,
        'ผู้จำหน่าย': r.dealer,
        'ยินยอมรับข่าวสาร': formatNewsletter(r.Newsletter),
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, 'Pre Registration')
      XLSX.writeFile(wb, 'Pre Registration.xlsx')
    }

    const showDetail = ref(false)
    const selected = ref(null)
    function onView(r) { selected.value = r; showDetail.value = true }
    function loadMore() { }

    return {
      // fetch state
      loading, error,
 
      // filters
      filters, options,
 
      // export format
      exportFormat,
 
       // computed data
       filtered, monthSeries,
       extColorCats, extColorSeries, extColorCatsWithOthers,
       intColorCats, intColorSeries, intColorCatsWithOthers,
       byDealer, byZone, pkgPie,
 
       // table
       sort, sorted, page, paged, newsletterOnCount,
 
       // actions
       exportExcel, showDetail, selected, onView, loadMore
       ,
       wrapperRef, isCapturing, exportJpg
     }
   }
 }
</script>


<style scoped>
/* --- กรอบนอก --- */
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding-inline: 12px;
}

.container.grid {
  display: inline-grid;
  background-color: #ffffff;
  /* padding: 16px; */
  border-radius: 12px;
  inline-size: min(100%, 1200px);
  max-inline-size: 100%;
  margin-inline: auto;
  overflow: hidden;
  box-sizing: border-box;
}

/* --- กฎกันล้นระดับระบบภายในคอนเทนเนอร์ --- */
.container.grid * {
  box-sizing: border-box;
  max-inline-size: 100%;
}

.grid {
  display: grid;
  gap: 16px;
  inline-size: 100%;
  min-width: 0;
}

.grid:not(.two-cols):not(.three-cols) {
  grid-template-columns: 1fr;

}

.grid.two-cols {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid.three-cols {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid>* {
  min-width: 0;
  overflow: hidden;
}

.grid>*:has(table),
:deep(.apexcharts-canvas),
:deep(.chart) {
  overflow: auto;
}


/* โหมดปกติคงเดิมของคุณ */

.capture-mode .container.grid>* {
  /* คลาย overflow ที่ชอบตัดตัวหนังสือ */
  overflow: visible !important;
}

.capture-mode .header-row,
.capture-mode .header-row h4,
.capture-mode .header-row h5 {
  overflow: visible !important;
  line-height: 1.4;
  /* ยก baseline ให้ปลอดภัย */
  padding-block: 2px;
}

/* ช่วยให้เรนเดอร์ฟอนต์เรียบขึ้น */
.capture-mode {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #ffffff;
  /* ใส่สีพื้นหลังที่ต้องการ */
}


.header-row {
  display: flex;
  align-items: center;
  /* จัดให้อยู่กึ่งกลางแนวตั้ง */
  justify-content: space-between;
  /* หัวข้อซ้าย ปุ่มขวา */
  gap: 12px;
}

.header-title {
  margin: 0;
  font-weight: 700;
  /* กันโดนตัดเวลาแคปเจอร์ */
  overflow: visible;
  line-height: 1.4;
}

.btn-capture {
  margin-left: auto;
  /* เผื่อกรณีมีองค์ประกอบเพิ่มเติม */
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f7f7f7 !important;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
  /* ไม่ตัดบรรทัดปุ่ม */
}

.btn-capture:hover {
  background: #efefef;
}




.container.grid :where(p, span, h1, h2, h3, h4, h5, h6, div) {
  word-wrap: break-word;
  overflow-wrap: anywhere;
  white-space: normal;
}

.container.grid :where(img, canvas, svg, video) {
  display: block;
  max-inline-size: 100%;
  height: auto;
}

.card-table {
  max-height: 500px;
  overflow-y: auto;
  border: none;
  padding: 0;
  background-color: transparent;
}

/* Chrome, Edge, Safari */
.card-table::-webkit-scrollbar {
  width: 8px;
  /* ความกว้าง scrollbar */
  background: transparent;
  /* ทำให้ scrollbar พื้นหลังโปร่งใส */
}

.card-table::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  /* สี thumb โปร่ง ๆ */
  border-radius: 4px;
  /* ทำให้ขอบโค้ง */
}

/* Firefox */
.card-table {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.DetailModalStyle {
  z-index: 10000000 !important;
}


:deep(.data-table) {
  max-inline-size: 100%;
  overflow: auto;
}

:deep(.data-table table) {
  width: 100%;
  table-layout: fixed;
}

:deep(.data-table th),
:deep(.data-table td) {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

:deep(.apexcharts-canvas),
:deep(.chart-root),
:deep(.chart-container) {
  inline-size: 100% !important;
  max-inline-size: 100% !important;
  min-width: 0 !important;
  contain: content;
}

h4,
h5 {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.capture-mode :deep(.apexcharts-tooltip),
.capture-mode :deep(.echarts-tooltip),
.capture-mode [class*="tooltip"] {
  opacity: 0 !important;
  visibility: hidden !important;
}

.capture-mode .header-title {
  white-space: nowrap;
  /* ป้องกันการตัดคำ */
  overflow: hidden;
  /* ป้องกันการล้นของข้อความ */
  text-overflow: ellipsis;
  /* ถ้าพื้นที่ไม่พอ ให้แสดง "..."
  flex: 1 1 auto;  /* ให้พื้นที่ของข้อความขยายออกให้เต็ม */
}

.capture-mode .header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
