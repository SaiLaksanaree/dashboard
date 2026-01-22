<template>
  <GlobalLoading :on="theme.globalLoading" size="180px" height="180px" />
  <router-view />
</template>

<script>
import { useThemeSettingsStore } from "@/store/themeSettings";
import GlobalLoading from "@/components/GlobalLoading.vue";

export default {
  components: { GlobalLoading },
  data() {
    return { theme: null }
  },
  created() {
    // ใช้ Pinia store โดยตรง
    this.theme = useThemeSettingsStore()
  }
}
</script>

<style>
@font-face {
  font-family: 'MazdaTypeTH';
  src: url('@/assets/fonts/MazdaTypeTH-Regular.woff2') format('woff2'),
    url('@/assets/fonts/MazdaTypeTH-Regular.woff');
  font-weight: normal;
  font-style: normal;
}

* {
  font-family: 'MazdaTypeTH', sans-serif;
}
</style>
