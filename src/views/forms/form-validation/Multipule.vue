<template>
  <form @submit.prevent="onSubmit" class="lg:grid-cols-2 grid gap-5 grid-cols-1">
    <Textinput label="Name" type="text" name="multi_userName" v-model="name_thai" disabled />
    <Textinput label="dealer_code" type="text" name="multi_dealer_code" v-model="dealer_code" disabled />
    <Textinput label="New Password" type="password" placeholder="8+ characters, 1 capitat letter " name="multi_password"
      v-model="password" :error="passwordError" hasicon />
    <Textinput label="Confirm Password" type="password" placeholder="Password" name="multi_password"
      v-model="confirmpass" :error="confirmpassError" hasicon />

    <div>
      <Button @click="handleResetPassword" text="Submit" btnClass="btn-dark"></Button>
    </div>
  </form>
</template>
<script>
import axios from "axios";
import Button from "@/components/Button";
import Textinput from "@/components/Textinput";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import { useToast } from "vue-toastification";
import { jwtDecode } from 'jwt-decode';

export default {
  components: {
    Textinput,
    Button,
  },
  data() {
    return {
      localEmail: '',
      name_thai: '-',
      dealer_code: '-',
      password: '',
      confirmpass: '',

    };
  },
  methods: {
    loadEmail() {
      // Retrieve and parse the JSON data from local storage
      const userData = localStorage.getItem('activeUser');
      if (userData) {
        const activeUser = JSON.parse(userData);
        this.localEmail = activeUser.email || ""; // Set email if it exists
        console.log("Get email local :", this.localEmail);
      }
    },
    async syncData() {
      try {
        const config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: `${import.meta.env.VITE_APP_API_URL}/auth/find-by-email`,
          headers: {
            'Authorization': 'Bearer ' + import.meta.env.VITE_BEARER_TOKEN,
            'Content-Type': 'application/json'
          },
          data: JSON.stringify({ email: this.localEmail })
        };

        const response = await axios.request(config);
        const { nameThai, dealerCode } = response.data;

        this.name_thai = nameThai || "-";
        this.dealer_code = dealerCode || "-";
      } catch (error) {
        console.error('Error fetching dealer information:', error);
      }
    },
    async syncDataResetPassword() {
      try {
        const token = this.$route.query.token;
        console.log('token', token);

        const decodedPayload = jwtDecode(token);
        console.log('decodedPayload', decodedPayload);

        const email = decodedPayload.email;

        const config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: `${import.meta.env.VITE_APP_API_URL}/auth/find-by-email`,
          headers: {
            'Authorization': 'Bearer ' + import.meta.env.VITE_BEARER_TOKEN,
            'Content-Type': 'application/json'
          },
          data: JSON.stringify({ email })
        };

        const response = await axios.request(config);
        const { nameThai, dealerCode } = response.data;

        this.name_thai = nameThai || "-";
        this.dealer_code = dealerCode || "-";
      } catch (error) {
        console.error('Error fetching dealer information:', error);
      }
    },
    async handleResetPassword() {
      console.log("INNN");
      const toast = useToast();
      if (localStorage.getItem('activeUser')) {
        const userData = localStorage.getItem('activeUser');
        const activeUser = JSON.parse(userData);
        this.localEmail = activeUser.email
      } else {
        const token = this.$route.query.token;
        const decodedPayload = jwtDecode(token);
        this.localEmail = decodedPayload.email;
      }

      if (this.localEmail != "" && this.password != "" && this.confirmpass != "" && this.password == this.confirmpass) {
        try {
          if (localStorage.getItem('activeUser')) {
            await this.ResetPassword(this.localEmail, this.password, this.confirmpass);
          } else {
            await this.ResetPassword(this.localEmail, this.password, this.confirmpass);
          }
        } catch (error) {
          toast.error("There was an error reset password.", {
            timeout: 3000,
          });
          console.error("Error syncing password:", error);
        }
      }
    },

    async ResetPassword(email, password, confirmpass) {
      const toast = useToast();
      console.log("Email:", email, "Password:", password, "Confirm Password:", confirmpass);
      let requestBody
      if (localStorage.getItem('activeUser')) {
        requestBody = {
          email,
          newPassword: password,
        }
      } else {
        requestBody = {
          email,
          newPassword: password,
          token: this.$route.query.token
        }
      }

      try {
        const config = {
          method: 'put',
          maxBodyLength: Infinity,
          url: `${import.meta.env.VITE_APP_API_URL}/auth/reset-password`,
          headers: {
            'Authorization': 'Bearer ' + import.meta.env.VITE_BEARER_TOKEN,
            'Content-Type': 'application/json'
          },
          data: JSON.stringify(requestBody)
        };

        const response = await axios.request(config);
        console.log("Reset password result =", response.data);

        toast.success("Password updated successfully", { timeout: 3000 });
        this.$router.push('/');
      } catch (error) {
        console.error('Error resetting password:', error);
        toast.error("There was an error resetting the password.", { timeout: 3000 });
      }
    }
  },
  created() {
    this.loadEmail();
    if (localStorage.getItem('activeUser')) {
      this.syncData(); // Call syncData as soon as the component is created
    } else {
      this.syncDataResetPassword();
    }
  },

  setup() {
    // Define a validation schema
    const schema = yup.object({
      email: yup.string().required().email(),
      username: yup.string().required(),
      password: yup.string().required().min(8),
      confirmpass: yup
        .string()
        .required()
        .oneOf([yup.ref("password")]),
    });

    const { handleSubmit } = useForm({
      validationSchema: schema,
    });
    // No need to define rules for fields


    const { value: email, errorMessage: emailError } = useField("email");
    const { value: username, errorMessage: usernameError } =
      useField("username");
    const { value: password, errorMessage: passwordError } =
      useField("password");
    const { value: confirmpass, errorMessage: confirmpassError } =
      useField("confirmpass");

    const onSubmit = handleSubmit((values) => {
      // console.warn(values.email);
      console.log('values', values)
    });


    return {
      email,
      password,
      passwordError,
      emailError,
      username,
      usernameError,
      confirmpass,
      confirmpassError,
      onSubmit,
      // name_thai: "",
      // dealer_code: "",
      // address_thai:"99 หมู่ที่3 ถ.เอเชีย บ้านกรด บางปะอิน",
    };
  },
};
</script>
<style lang="scss"></style>
