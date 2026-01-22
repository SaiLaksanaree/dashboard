// themeSettings.js
import { defineStore } from 'pinia';

export const useThemeSettingsStore = defineStore('themeSettings', {
  state: () => ({
    // ----- ของเดิมทั้งหมด -----
    sidebarCollaspe: false,
    sidebarHidden: false,
    mobielSidebar: false,
    semidark: false,
    monochrome: false,
    semiDarkTheme: "semi-light",
    isDark: false,
    skin: "default",
    theme: "light",
    isOpenSettings: false,
    cWidth: "full",
    menuLayout: "vertical",
    navbarType: "sticky",
    isMouseHovered: false,
    footerType: "static",
    direction: false,
    chartColors: {
      title: "red",
    },

    // ----- (เพิ่ม) รองรับชื่อที่ action เดิมอ้างถึง (กันพังจากสะกดต่างกัน) -----
    sidebarCollasp: false,

    // ===== Global Loading (เพิ่มใหม่) =====
    globalLoading: false,  // ใช้โชว์/ซ่อน overlay ทั้งหน้า
    pending: 0,            // นับจำนวน request/งานที่กำลังรออยู่
    _shownAt: 0,           // เวลาเริ่มโชว์ overlay (ไว้คุม minimum show)
    minShowMs: 400,        // เวลาโชว์ขั้นต่ำ (กันกะพริบ) ปรับได้ตามชอบ
  }),

  actions: {
    // ----- ของเดิมทั้งหมด -----
    setSidebarCollasp() {
      // รองรับทั้งสองคีย์ (กันพัง)
      const val = !(this.sidebarCollasp || this.sidebarCollaspe);
      this.sidebarCollasp = val;
      this.sidebarCollaspe = val;
    },

    toogleDark() {
      this.isDark = !this.isDark;
      document.body.classList.remove(this.theme);
      this.theme = this.theme === "dark" ? "light" : "dark";
      document.body.classList.add(this.theme);
      localStorage.setItem("theme", this.theme);
    },

    toggleMonochrome() {
      const isMonochrome = (localStorage.getItem('monochrome') !== null);
      if (isMonochrome) {
        localStorage.removeItem("monochrome");
        document.getElementsByTagName('html')[0].classList.remove('grayscale');
        return;
      }
      localStorage.setItem("monochrome", true);
      document.getElementsByTagName('html')[0].classList.add('grayscale');
      return;
    },

    toggleSettings() {
      this.isOpenSettings = !this.isOpenSettings;
    },

    toggleMsidebar() {
      this.mobielSidebar = !this.mobielSidebar;
    },

    toggleSemiDark() {
      this.semidark = !this.semidark;
      this.semiDarkTheme = this.semidark ? "semi-dark" : "semi-light";
      document.body.classList.toggle(this.semiDarkTheme);
      localStorage.setItem("semiDark", this.semidark);
    },

    // ===== Global Loading (ใหม่) =====
    startLoading() {
      // เพิ่มตัวนับ และเปิด overlay เมื่อเดิมเป็น 0
      this.pending++;
      if (!this.globalLoading) {
        this.globalLoading = true;
        this._shownAt = Date.now();
        document.body.style.overflow = 'hidden'; // กัน scroll ใต้ overlay
      }
    },

    stopLoading() {
      // ลดตัวนับ แต่อย่าต่ำกว่าศูนย์
      this.pending = Math.max(0, this.pending - 1);

      if (this.pending === 0) {
        // คุมเวลาโชว์ขั้นต่ำกันกะพริบ
        const elapsed = Date.now() - this._shownAt;
        const wait = Math.max(0, this.minShowMs - elapsed);
        setTimeout(() => {
          if (this.pending === 0) {
            this.globalLoading = false;
            document.body.style.overflow = '';
          }
        }, wait);
      }
    },

    // (ออปชัน) ไว้รองรับโค้ดเก่าที่อาจตั้งค่า globalLoading ตรง ๆ
    setGlobalLoading(v) {
      if (v) {
        // ถ้ามีการเปิดตรง ๆ ให้แน่ใจว่าตัวนับไม่นับติดลบ
        if (this.pending === 0) this._shownAt = Date.now();
        this.globalLoading = true;
        document.body.style.overflow = 'hidden';
      } else {
        // ปิดแบบไม่ทำลายตัวนับ (ถ้าอยากเข้มงวด ให้ใช้ stopLoading() แทน)
        this.globalLoading = false;
        document.body.style.overflow = '';
      }
    },
  },
});
