<!-- FiltersMember.vue -->
<template>
  <div class="card">
    <div class="filters-grid">
      <!-- From / To -->
      <label class="field">
        <span>From Date</span>
        <input type="date" v-model="model.start" />
      </label>

      <label class="field">
        <span>To Date</span>
        <input type="date" v-model="model.end" />
      </label>

    </div>
  </div>
</template>

<script setup>
import { reactive, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  options: {
    type: Object,
    required: true,
    default: () => ({
      start: [],
      end: [],
    })
  },
  modelValue: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'apply'])

const model = reactive({ ...props.modelValue })

watch(() => props.modelValue, (v) => {
  Object.assign(model, v || {})
}, { deep: true, immediate: true })

watch(model, () => emit('update:modelValue', model), { deep: true })

</script>

<style scoped>
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
  gap: 12px;
  align-items: end;
  width: 100%;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.field > span {
  font-size: 12px;
  color: #6b7280;
}

.field > input[type="date"],
.field > select {
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
