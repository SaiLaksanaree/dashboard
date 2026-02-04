<!-- src/components/GlobalLoading.vue -->
<template>
  <Teleport to="body">
    <div v-if="on" class="global-loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <img :src="gif" :style="imgStyle" alt="Loading…" />
    </div>
  </Teleport>
</template>

<script>
import loadingGif from '@/assets/images/imgForDashbord/amalie-steiness.gif'

export default {
  name: 'GlobalLoading',
  props: {
    on: { type: Boolean, default: false },

    /* ขนาดหลักของ GIF (รับได้ทั้ง number = px หรือ string เช่น '320px', '40vmin', 'min(260px,60vw)') */
    size: { type: [Number, String], default: 'min(260px, 60vw)' },

    /* จำกัดความกว้างสูงสุด (ถ้าอยาก override) */
    maxWidth: { type: String, default: '' },

    /* สูงอัตโนมัติเป็นค่าเริ่มต้น; แต่อนุญาตให้ตั้งเองได้ */
    height: { type: [Number, String], default: 'auto' },
  },
  data() {
    return { gif: loadingGif }
  },
  computed: {
    imgStyle() {
      // แปลง number -> 'Npx'
      const toCss = (v) => (typeof v === 'number' ? `${v}px` : v)

      const width = toCss(this.size)
      const height = toCss(this.height)
      const maxWidth = this.maxWidth || '' // ถ้าไม่ได้ส่งมาก็ไม่ตั้ง

      return {
        width,          // คุมความกว้างหลักของ GIF
        height,         // ปล่อย auto หรือกำหนดเอง
        ...(maxWidth ? { maxWidth } : {}),
      }
    },
  },
}
</script>

<style scoped>
.global-loading-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;

  /* ✅ พื้นหลังฟ้าโปร่งแสง / หรือปรับเป็นที่ต้องการ */
  background: rgb(0, 0, 0);

  z-index: 2147483647;
  pointer-events: all;
}
</style>
