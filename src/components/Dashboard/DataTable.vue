<!-- DataTable.vue -->
<template>
  <div class="card">
    <div class="label" style="display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;">
      <span style="color: #fff;">รายการจอง</span>
      <button class="btn" @click="onExport">Export table</button>
    </div>

    <!-- Add scroll event listener here -->
    <div class="table-wrap" @scroll="onScroll">
      <table class="tbl">
        <thead>
          <tr>
            <!-- แยกเป็น วันที่ และ เวลา -->
            <th :class="thClass('bookingDate')" @click="onSort('bookingDate')">
              วันที่จอง <span v-if="sort.key === 'bookingDate'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th :class="thClass('bookingTime')" @click="onSort('bookingTime')">
              เวลาที่จอง <span v-if="sort.key === 'bookingTime'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>

            <th :class="thClass('bookingNo')" @click="onSort('bookingNo')">
              หมายเลขการจอง <span v-if="sort.key === 'bookingNo'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th :class="thClass('memberDisplayId')" @click="onSort('memberDisplayId')">
               ID <span v-if="sort.key === 'memberDisplayId'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th :class="thClass('firstName')" @click="onSort('firstName')">
              ชื่อ <span v-if="sort.key === 'firstName'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th :class="thClass('lastName')" @click="onSort('lastName')">
              นามสกุล <span v-if="sort.key === 'lastName'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th :class="thClass('Newsletter')" @click="onSort('Newsletter')">
              ยินยอมรับข่าวสาร <span v-if="sort.key === 'Newsletter'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th style="width:120px">รายละเอียด</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in items" :key="r.bookingNo">
            <!-- ใช้ฟังก์ชัน formatDate / formatTime -->
            <td>{{ formatDate(r.bookingAt) }}</td>
            <td>{{ formatTime(r.bookingAt) }}</td>

            <td>{{ r.bookingNo }}</td>
            <td>{{ r.memberDisplayId }}</td>
            <td>{{ r.firstName }}</td>
            <td>{{ maskName(r.lastName) }}</td>
            <td>{{ formatNewsletter(r.Newsletter) }}</td>
            <td><a href="#" @click.prevent="$emit('view', r)">ดูรายละเอียด</a></td>
          </tr>
          <tr v-if="!items.length">
            <!-- ปรับ colspan ให้ตรงกับจำนวนคอลัมน์ใหม่ (8) -->
            <td colspan="8" style="text-align:center;color:#6b7280;padding:16px;">ไม่มีข้อมูล</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { formatDateTime } from '@/utils'
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  sort: {
    type: Object,
    default: () => ({ key: 'bookingAt', dir: 'desc' }) // dir: 'asc' | 'desc'
  }
})

const emit = defineEmits(['change-page', 'export-excel', 'view', 'sort-change', 'load-more'])

function onSort(key) {
  const dir =
    props.sort.key === key
      ? (props.sort.dir === 'asc' ? 'desc' : 'asc')
      : (key === 'bookingDate' ? 'desc' : 'asc')
  emit('sort-change', { key, dir })
}

function thClass(key) {
  return {
    'th-sort': true,
    active: props.sort.key === key
  }
}

function formatNewsletter(v) {
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (s === 'on') return 'Yes'
    if (s === 'off') return 'No'
  } else if (typeof v === 'boolean') {
    return v ? 'Yes' : 'No'
  }
  if (v == null || v === '') return '-' // กรณีไม่มีค่า
  return String(v)
}

function maskName(name) {
  if (!name) return ''
  const chars = Array.from(String(name).trim())
  if (chars.length <= 3) return chars.join('')
  return chars.slice(0, 3).join('') + '*'.repeat(chars.length - 2)
}

/* ฟังก์ชันแยกวันที่และเวลา */
function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d)) return String(value)
  return d.toLocaleDateString('th-TH') // หรือ ปรับ locale ตามต้องการ
}
function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d)) return String(value)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) // HH:MM
}

// สร้าง payload สำหรับการ export โดยแยกวันที่และเวลาเป็นคอลัมน์แยกกัน
function onExport() {
  const headers = [
    { key: 'bookingDate', label: 'วันที่จอง' },
    { key: 'bookingTime', label: 'เวลาที่จอง' },
    { key: 'bookingNo', label: 'หมายเลขการจอง' },
    { key: 'memberDisplayId', label: 'ID' },
    { key: 'firstName', label: 'ชื่อ' },
    { key: 'lastName', label: 'นามสกุล' },
    { key: 'email', label: 'อีเมล' },
    { key: 'phone', label: 'เบอร์โทร' },
    { key: 'model', label: 'รุ่น' },
    { key: 'zone', label: 'Zone' },
    { key: 'dealer', label: 'ผู้จำหน่าย' },
    { key: 'Newsletter', label: 'ยินยอมรับข่าวสาร' },
  ]

  const rows = (props.items || []).map(r => ({
    bookingDate: formatDate(r.bookingAt),
    bookingTime: formatTime(r.bookingAt),
    bookingNo: r.bookingNo ?? '',
    memberDisplayId: r.memberDisplayId ?? '',
    firstName: r.firstName ?? '',
    lastName: r.lastName ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    model: r.model ?? r.carModel ?? '',
    zone: r.zone ?? '',
    dealer: r.dealer ?? r.dealerName ?? '',
    Newsletter: formatNewsletter(r.Newsletter),
  }))

  const escapeCSV = v => {
    if (v == null) return ''
    const s = String(v)
    // ถ้ามี " หรือ , หรือ newline ให้ครอบด้วย " และ escape " เป็น ""
    if (/[",\n\r]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const headerLine = headers.map(h => escapeCSV(h.label)).join(',')
  const body = rows.map(row => headers.map(h => escapeCSV(row[h.key])).join(',')).join('\n')
  const csv = '\uFEFF' + headerLine + '\n' + body // BOM ให้ Excel อ่าน UTF-8 ถูกต้อง

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pre-registration-export_${new Date().toISOString().slice(0,10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function onScroll(event) {
  const tableWrap = event.target
  if (!tableWrap) return
  if (tableWrap.scrollHeight - tableWrap.scrollTop === tableWrap.clientHeight) {
    if (props.page < props.totalPages) {
      emit('load-more')
    }
  }
}
</script>

<style scoped>
.table-wrap {
  overflow-y: auto;
  max-height: 500px;
  /* ปรับตามต้องการ */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.table-wrap::-webkit-scrollbar {
  width: 8px;
  background: transparent;
}

.table-wrap::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid #eef2f7;
  text-align: left;
}

th {
  background: #666666;
  color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 1;
}

th.th-sort {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.tbl tbody tr:nth-child(odd) td {
  background-color: #ffffff;
}

.tbl tbody tr:nth-child(even) td {
  background-color: #e7eaed;
}

.pager {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 6px;
}

.btn {
  background: #cbcbcb;
  color: #000000;
  border: 0.5px solid #7f7f7f;
  padding: 6px 32px;
  border-radius: 24px;
  cursor: pointer;
}

.btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}

th {
  background: #666666;
  color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: center;
}

td {
  text-align: center;
  padding: 12px 10px;
  border-bottom: 1px solid #eef2f7;
}

.tbl a {
  color: #000000;
  text-decoration: underline;
  cursor: pointer;
}

.tbl a:hover {
  text-decoration: none;
}
</style>
