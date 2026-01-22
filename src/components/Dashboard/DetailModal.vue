<template>
  <Modal :open="open" @close="$emit('close')">
    <div class="section-title">
      <div style="color:#c53030;">
        หมายเลขการจอง {{ record.bookingNo }}
      </div>
    </div>

    <div class="date">{{ formatDateTime(record.bookingAt) }}</div>

    <hr class="divider" />

    <div class="section-title">ข้อมูลผู้ทำการจองสิทธิ์เสนอพิเศษ</div>
    <div class="kv">
      <div class="k">Mazda ID:</div>
      <div class="v">{{ record.memberDisplayId || '-' }}</div>
      <div class="k">ชื่อ:</div>
      <div class="v">{{ record.firstName }}</div>
      <div class="k">นามสกุล:</div>
      <div class="v">{{ record.lastName || '-' }}</div>
      <div class="k">อีเมล:</div>
      <div class="v"><a v-if="record.email" :href="'mailto:' + record.email">{{ record.email }}</a><span v-else>-</span>
      </div>
      <div class="k">เบอร์โทร:</div>
      <div class="v"><a v-if="record.phone" :href="'tel:' + record.phone">{{ record.phone }}</a><span v-else>-</span>
      </div>
      <div class="k">ยินยอมรับข่าวสาร Mazda6e:</div>
      <div class="v">
        {{ (record.Newsletter || '').toString().toLowerCase() === 'on'
          ? 'Yes'
          : (record.Newsletter || '').toString().toLowerCase() === 'off'
            ? 'No'
            : '-' }}
      </div>


    </div>

    <hr class="divider" />

    <div class="section-title">แบบสอบถามความสนใจรถ {{ record.model || 'MAZDA6e' }}</div>
    <div class="kv two">
      <div class="k">รุ่นรถที่คุณสนใจ</div>
      <div class="v">{{ record.range }}</div>
      <div class="k">สีรถที่คุณสนใจ</div>
      <div class="v">{{ record.exteriorColor }}</div>
      <div class="k">วัสดุภายในที่คุณสนใจ</div>
      <div class="v">{{ record.InteriorOption }}</div>
    </div>

    <hr class="divider" />

    <div class="section-title">ข้อเสนอพิเศษที่ลูกค้าเลือก</div>
    <div class="offer" v-if="record.Title">{{ record.Title }}</div>
    <div class="offer" v-if="record.Subtitle">{{ record.Subtitle }}</div>
    <div class="offer" v-if="record.Detail" v-html="record.Detail"></div>
    <div v-if="!record.Title && !record.Subtitle && !record.Detail">-</div>

  </Modal>
</template>

<script>
import Modal from './Modal.vue';
import { formatDateTime } from '@/utils';

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

export default {
  components: {
    Modal
  },
  props: {
    open: {
      type: Boolean,
      required: true
    },
    record: {
      type: Object,
      required: true
    }
  },

  emits: ['close'],
  data() {
    return {
      defaultOffer: `0000000`
    };
  },
  methods: {

    formatDateTime
  }
};
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
  grid-template-columns: 220px 1fr;
  row-gap: 8px;
  column-gap: 15px;
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