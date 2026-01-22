<template>
  <div v-if="open" class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <button class="close" aria-label="Close" @click="$emit('close')">✕</button>
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: {
    type: Boolean,
    required: true
  }
})

defineEmits(['close'])
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  width: min(840px, 96vw);
  max-height: 88vh;
  overflow: auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, .18);
  padding: 22px 26px 26px 26px;
  position: relative;
}

.close {
  position: absolute;
  right: 12px;
  top: 10px;
  font-size: 16px;
  color: #222;
  background: transparent;
  border: none;
  cursor: pointer;
}
</style>
