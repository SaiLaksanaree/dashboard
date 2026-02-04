<template>
  <div class="loginwrapper">
    <div class="lg-inner-column">
      <div class="left-column relative z-[1] bg-cover bg-center">
      </div>
      <div class="right-column relative">
        <div class="inner-content h-full flex flex-col bg-white dark:bg-slate-800">
          <div class="auth-box h-full flex flex-col justify-center">
            <div class="mobile-logo text-center mb-6 lg:hidden block">
              <router-link to="/">
                <img
                  style="max-width: 68%;"
                  :src="logoMobile"
                  alt=""
                  class="mx-auto"
                  v-if="!this.$store.themeSettingsStore.isDark"
                />
                <img
                  :src="logoWhite"
                  alt=""
                  class="mx-auto"
                  v-else
                />
              </router-link>
            </div>
            <div class="text-center 2xl:mb-10 mb-4">
              <h4 class="font-medium">Sign in</h4>
            </div>
            <Signin />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Signin from "../common/Signin";
import Social from "../common/Social";
// Image Import
import logoWhite from "@/assets/images/logo/logo-white.svg"
import logo from "@/assets/images/logo/logo.svg"
import logoMsBg from "@/assets/images/logo/bg-blur.jpg"
import logoMobile from "@/assets/images/logo/dashboard-icon.jpg"
import sideImg from "@/assets/images/auth/ils1.svg"

export default {
  data () {
    return {
      logoWhite,
      logo,
      sideImg,
      logoMsBg,
      logoMobile
    }
  },
  components: {
    Social,
    Signin,
  },
};
</script>

<style lang="scss">
.left-column {
  background-image: url('@/assets/images/logo/bg-blur.jpg');
  background-size: cover;
  background-position: center;
  height: 100%;
}
</style>
