<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <Textinput
      label="Email"
      type="email"
      placeholder="Type your email"
      name="emil"
      v-model="email"
      :error="emailError"
      classInput="h-[48px]"
    />

    <button type="submit" class="btn btn-dark block w-full text-center">
      Send recovery email
    </button>
  </form>
</template>
<script>

import axios from "axios";
import Textinput from "@/components/Textinput";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

export default {
  components: {
    Textinput,
  },
  data() {
    return {
      urlEnv: import.meta.env.VITE_APP_API_URL,
      checkbox: false,
    };
  },
  methods: {
  
  },
  setup() {      

    const toast = useToast();

    // Define a validation schema
    const schema = yup.object({
      email: yup.string().required().email(),
    });

    const router = useRouter();
    const { handleSubmit } = useForm({
      validationSchema: schema,
    });

    const { value: email, errorMessage: emailError } = useField("email");
    const onSubmit = handleSubmit(async(values) => {
      toast.info("Sending... recovery to your email.", {
        timeout: 3000,
      });

      try {
        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${import.meta.env.VITE_APP_API_URL}/auth/forgot-password`,
            headers: {
                'Authorization': 'Bearer '+import.meta.env.VITE_BEARER_TOKEN,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ email: values.email })
        };

        axios.request(config)
            .then(response => {
                console.log("Response:", response.data);
                toast.success("Recovery email sent successfully.", { timeout: 2000 });
            })
            .catch(error => {
                console.error('Error sending email:', error);
                toast.error("There was an error sending the email.", { timeout: 2000 });
            });
      } catch (error) {
          console.error('Unexpected error:', error);
          toast.error("Unexpected error occurred.", { timeout: 2000 });
      }
    });
    return {
      email,
      emailError,
      onSubmit,
    };
  },
  
};
</script>
<style lang="scss"></style>
