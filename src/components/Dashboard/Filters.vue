<!-- fillter.vue -->
<template>
  <div class="card">
    <div class="filters-grid">
      <!-- From / To -->
      <label class="field">
        <span>From Date</span>
        <input type="date" v-model="model.from" />
      </label>

      <label class="field">
        <span>To Date</span>
        <input type="date" v-model="model.to" />
      </label>

      <label class="field">
        <span>Zone</span>
        <select v-model="model.ZoneSale">
          <option value="">All</option>
          <option v-for="o in sortedZoneSale" :key="o" :value="o">
            {{ o }}
          </option>
        </select>
      </label>

      <label class="field">
        <span>ผู้จำหน่าย</span>
        <select v-model="model.DealerCode">
          <option value="">All</option>
          <option v-for="o in dealerOptions" :key="o.value" :value="o.value">
            {{ o.name }}
          </option>
        </select>
      </label>


      <label class="field">
        <span>รุ่นรถ</span>
        <select v-model="model.model">
          <option value="">All</option>
          <option v-for="o in options.model" :key="o" :value="o">{{ o }}</option>
        </select>
      </label>

      <label class="field">
        <span>สีภายนอก</span>
        <select v-model="model.extColor">
          <option value="">All</option>
          <option v-for="o in options.extColors" :key="o" :value="o">{{ o }}</option>
        </select>
      </label>

      <label class="field">
        <span>วัสดุภายใน</span>
        <select v-model="model.intColor">
          <option value="">All</option>
          <option v-for="o in options.intColors" :key="o" :value="o">{{ o }}</option>
        </select>
      </label>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  options: {
    type: Object,
    required: true,
    default: () => ({
      extColors: [],
      intColors: [],
      dealer: [],
      DealerCode: [],
      model: [],
      ZoneSale: [],
      dealerRec: []
    })
  },
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      DealerCode: ''
    })
  }
})

const emit = defineEmits(['update:modelValue', 'apply'])

const model = reactive({ ...props.modelValue })

watch(() => props.modelValue, (v) => {
  Object.assign(model, v || {})
}, { deep: true, immediate: true })

watch(model, () => emit('update:modelValue', model), { deep: true })

// ✅ list ผู้จำหน่ายที่ใช้ใน dropdown
const sortedZoneSale = computed(() => {
  const all = props.options.ZoneSale || []

  const others = all.filter(v => v && !/^all$/i.test(v))

  others.sort((a, b) => {
    const aMatch = a.match(/^(\d+)([A-Za-z]*)$/)
    const bMatch = b.match(/^(\d+)([A-Za-z]*)$/)

    const aNum = aMatch ? parseInt(aMatch[1], 10) : Number.MAX_SAFE_INTEGER
    const bNum = bMatch ? parseInt(bMatch[1], 10) : Number.MAX_SAFE_INTEGER

    if (aNum !== bNum) return aNum - bNum

    const aSuffix = aMatch ? aMatch[2].toUpperCase() : ''
    const bSuffix = bMatch ? bMatch[2].toUpperCase() : ''
    return aSuffix.localeCompare(bSuffix)
  })

  // ให้ "All" อยู่บนสุด
  return [...others]
})

const dealerOptions = computed(() => {
  const all = props.options.dealerRec || []

  // ยังไม่เลือก Zone → แสดงทุก dealer
  if (!model.ZoneSale) return all

  // เลือก Zone แล้ว → กรองให้เหลือเฉพาะ dealer ใน Zone นั้น
  return all.filter(d => d.zone === model.ZoneSale)
})

// ถ้าเปลี่ยน Zone แล้ว dealer เดิมไม่อยู่ใน Zone ใหม่ → เคลียร์ค่า
watch(() => model.ZoneSale, () => {
  if (!dealerOptions.value.some(d => d.value === model.DealerCode)) {
    model.DealerCode = ''
  }
})
</script>



<style scoped>
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  /* ช่องเท่ากันทุกช่อง */
  gap: 12px;
  align-items: end;
  width: 100%;
}

/* ทุกช่องเท่ากันหมด */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.field>span {
  font-size: 12px;
  color: #6b7280;
}

.field>input[type="date"],
.field>select {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
}

/* responsive: สองคอลัมน์เมื่อหน้าจอแคบ */
@media (max-width: 900px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* หน้าจอเล็กมาก: 1 คอลัมน์ */
@media (max-width: 600px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
