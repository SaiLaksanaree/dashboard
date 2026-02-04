<!-- DetailModalForNoBooking.vue -->
<template>
  <Modal :open="open" @close="$emit('close')">
    <div class="section-title">
      <div style="color:#c53030;">
        ID {{ view.memberID || '-' }}
      </div>
    </div>

    <div class="date">วันเวลาที่สมัคร {{ view.registeredAt ? formatDateTime(view.registeredAt) : '-' }}</div>

    <hr class="divider" />

    <div class="section-title">ข้อมูลสมาชิก</div>
    <div class="kv">
      <div class="k">ID:</div>
      <div class="v">{{ view.memberID || '-' }}</div>

      <div class="k">ชื่อ:</div>
      <div class="v">{{ view.firstName || '-' }}</div>

      <div class="k">นามสกุล:</div>
      <div class="v">{{ view.lastName || '-' }}</div>

      <div class="k">อีเมล:</div>
      <div class="v">
        <a v-if="view.email" :href="'mailto:' + view.email">{{ view.email }}</a>
        <span v-else>-</span>
      </div>

      <div class="k">เบอร์โทร:</div>
      <div class="v">
        <a v-if="view.phone" :href="'tel:' + view.phone">{{ view.phone }}</a>
        <span v-else>-</span>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from './Modal.vue'
import { formatDateTime } from '@/utils'

export default {
  components: { Modal },
  props: {
    open: { type: Boolean, required: true },
    record: { type: Object, required: true }
  },
  emits: ['close'],
  computed: {
    // รองรับทั้ง schema ใหม่ (ตัวใหญ่) และเดิม (ตัวเล็ก) เพื่อความทนทาน
    view() {
      const r = this.record || {}
      return {
        memberID: r.MemberDisplayId ?? r.memberDisplayId ?? r.memberID ?? r.MemberID ?? '',
        registeredAt: r.RegisterDate ?? r.registerDate ?? r.bookingAt ?? r.createdAt ?? null,
        firstName: r.FirstName ?? r.firstName ?? '',
        lastName: r.LastName ?? r.lastName ?? '',
        email: r.Email ?? r.email ?? '',
        phone: r.Phone ?? r.phone ?? ''
      }
    }
  },
  methods: { formatDateTime }
}
</script>

<style scoped>
.section-title {
  font-weight: 700;
  margin: 6px 0 10px 0
}

.date {
  font-size: 14px;
  color: #374151;
  margin-bottom: 6px
}

.divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 12px 0
}

.kv {
  display: grid;
  grid-template-columns: 160px 1fr;
  row-gap: 8px;
  column-gap: 12px;
  font-size: 14px
}

.kv.two {
  grid-template-columns: 220px 1fr
}

.k {
  color: #111827
}

.v a {
  color: #1f6feb;
  text-decoration: underline
}

.offer {
  white-space: pre-line;
  line-height: 1.5
}
</style>
