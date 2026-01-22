<!-- DataTableForNoBooking.vue -->
<template>
  <div class="card">
    <div class="label" style="display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;">
      <span>*สมาชิกที่ยังไม่ได้ทำการจองสิทธิ์</span>
      <button class="btn" @click="onExport">Export table</button>
    </div>

    <div class="table-wrap" @scroll="onScroll">
      <table class="tbl">
        <thead>
          <tr>
            <th :class="thClass('RegisterDate')" @click="onSort('RegisterDate')">
              วันที่สมัคร <span v-if="sort.key === 'RegisterDate'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th :class="thClass('RegisterTime')" @click="onSort('RegisterTime')">
              เวลาที่สมัคร <span v-if="sort.key === 'RegisterTime'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th :class="thClass('MemberDisplayId')" @click="onSort('MemberDisplayId')">
              Mazda ID <span v-if="sort.key === 'MemberDisplayId'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th :class="thClass('FirstName')" @click="onSort('FirstName')">
              ชื่อ <span v-if="sort.key === 'FirstName'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th :class="thClass('LastName')" @click="onSort('LastName')">
              นามสกุล <span v-if="sort.key === 'LastName'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th :class="thClass('Email')" @click="onSort('Email')">
              อีเมล <span v-if="sort.key === 'Email'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th :class="thClass('Phone')" @click="onSort('Phone')">
              เบอร์โทร <span v-if="sort.key === 'Phone'">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th style="width:120px">รายละเอียด</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in items" :key="r.bookingNo || r.MemberDisplayId">
            <td>{{ formatDate(r.RegisterDate) }}</td>
            <td>{{ formatTime(r.RegisterDate) }}</td>
            <td>{{ r.MemberDisplayId }}</td>
            <td>{{ r.FirstName }}</td>
            <td>{{ maskName(r.LastName) }}</td>
            <td>{{ maskEmail(r.Email) }}</td>
            <td>{{ maskPhone(r.Phone) }}</td>
            <td><a href="#" @click.prevent="$emit('view', r)">ดูรายละเอียด</a></td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="8" style="text-align:center;color:#6b7280;padding:16px;">ไม่มีข้อมูล</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  sort: { type: Object, default: () => ({ key: 'RegisterDate', dir: 'desc' }) }
})

const emit = defineEmits(['change-page', 'export-excel', 'view', 'sort-change', 'load-more'])

function onSort(key) {
  const dir = props.sort.key === key
    ? (props.sort.dir === 'asc' ? 'desc' : 'asc')
    : (key === 'RegisterDate' ? 'desc' : 'asc')
  emit('sort-change', { key, dir })
}

function thClass(key) {
  return {
    'th-sort': true,
    active: props.sort.key === key
  }
}

function onScroll(event) {
  const tableWrap = event.target
  if (!tableWrap) return
  if (tableWrap.scrollHeight - tableWrap.scrollTop <= tableWrap.clientHeight) {
    if (props.page < props.totalPages) {
      emit('load-more')
    }
  }
}

function maskPhone(phone) {
  if (!phone) return '-'
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return '-'
  if (digits.length <= 4) return '*'.repeat(digits.length)
  return '*'.repeat(digits.length - 4) + digits.slice(-4)
}

function maskName(lastname) {
  if (!lastname) return ''
  const chars = Array.from(String(lastname).trim())
  if (chars.length <= 3) return chars.join('')
  return chars.slice(0, 3).join('') + '*'.repeat(chars.length - 2)
}

function maskEmail(email) {
  if (!email) return ''
  const str = String(email).trim()
  const atIdx = str.indexOf('@')
  if (atIdx === -1) return '*'.repeat(Math.min(5, str.length))

  const local = str.slice(0, atIdx)
  const domain = str.slice(atIdx + 1)

  const localChars = Array.from(local)
  const localMasked =
    localChars.length <= 3 ? localChars.join('') : localChars.slice(0, 3).join('') + '****'

  const lastDot = domain.lastIndexOf('.')
  if (lastDot !== -1 && lastDot < domain.length - 1) {
    const tld = domain.slice(lastDot + 1)
    return `${localMasked}@*****.${tld}`
  }
  return `${localMasked}@*****`
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d)) return String(value)
  return d.toLocaleDateString('th-TH')
}
function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d)) return String(value)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function onExport() {
  const headers = [
    { key: 'registerDate', label: 'วันที่สมัคร' },
    { key: 'registerTime', label: 'เวลาที่สมัคร' },
    { key: 'memberDisplayId', label: 'Mazda ID' },
    { key: 'firstName', label: 'ชื่อ' },
    { key: 'lastName', label: 'นามสกุล' },
    { key: 'email', label: 'อีเมล' },
    { key: 'phone', label: 'เบอร์โทร' },
  ]

  const rows = (props.items || []).map(r => ({
    registerDate: formatDate(r.RegisterDate),
    registerTime: formatTime(r.RegisterDate),
    memberDisplayId: r.MemberDisplayId ?? '',
    firstName: r.FirstName ?? '',
    lastName: r.LastName ?? '',
    email: r.Email ?? '',
    phone: r.Phone ?? '',
  }))

  console.debug('[Export] headers:', headers)
  console.debug('[Export] rows sample:', rows.slice(0,5))
  if (!rows.length) {
    console.warn('[Export] no rows to export')
  }

  const escapeCSV = v => {
    if (v == null) return ''
    const s = String(v)
    if (/[",\n\r]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const headerLine = headers.map(h => escapeCSV(h.label)).join(',')
  const body = rows.map(row => headers.map(h => escapeCSV(row[h.key])).join(',')).join('\n')
  const csv = '\uFEFF' + headerLine + '\n' + body

  console.debug('[Export] csv preview:', csv.slice(0, 800))

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `no-booking-export_${new Date().toISOString().slice(0,10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.table-wrap {
  overflow-y: auto;
  max-height: 450px;
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
