<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <Textinput label="Email" type="email" placeholder="Type your email" name="emil" v-model="email" :error="emailError"
      classInput="h-[48px]" />
    <Textinput label="Password" type="password" placeholder="8+ characters, 1 capitat letter " name="password"
      v-model="password" :error="passwordError" hasicon classInput="h-[48px]" />

    <div class="flex justify-between">
      <label class="cursor-pointer flex items-start">
        <input type="checkbox" class="hidden" @change="() => (checkbox = !checkbox)" />
      </label>
      <router-link to="/forgot-password" class="text-sm text-slate-800 dark:text-slate-400 leading-6 font-medium">Forgot
        Password?</router-link>
    </div>

    <button type="submit" class="btn btn-dark block w-full text-center">
      Sign in
    </button>
  </form>
</template>
<script>
import Textinput from "@/components/Textinput";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

// Static mock data
const mockData = {
  auth: {
    login: {
      success: {
        data: {
          id: "user123",
          email: "admin@mazda.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          token: "mock_token",
          refreshToken: "mock_refresh_token"
        }
      },
      error: {
        message: "Invalid credentials"
      }
    }
  }
};
export default {
  components: {
    Textinput,
  },
  data() {
    return {
      // urlEnv: import.meta.env.VITE_APP_API_URL,
      checkbox: false,
    };
  },
  setup() {
    // Define a validation schema
    const schema = yup.object({
      email: yup.string().required("Email is required").email(),
      password: yup.string().required("Password is required").min(8),
    });

    const toast = useToast();
    const router = useRouter();

    const formValues = {
      email: "",
      password: "",
    };

    const { handleSubmit } = useForm({
      validationSchema: schema,
      initialValues: formValues,
    });
    // No need to define rules for fields

    const { value: email, errorMessage: emailError } = useField("email");
    const { value: password, errorMessage: passwordError } = useField("password");
    const onSubmit = handleSubmit(async (values) => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock login validation
        const validCredentials = [
          { email: "admin@mazda.com", password: "password123" },
          { email: "user@mazda.com", password: "password123" },
          { email: values.email, password: values.password } // Allow any email/password for demo
        ];

        const isValidLogin = validCredentials.some(cred => 
          cred.email === values.email && cred.password === values.password
        ) || values.password.length >= 8; // Simple validation for demo

        if (isValidLogin) {
          // Use static mock success response
          const data = mockData.auth.login.success.data;

          // Store user info in localStorage
          localStorage.setItem("activeUser", JSON.stringify(data));

          // Redirect to home page
          router.push("/app/mazda-pre-registration-dashboard");
          toast.success("Login successfully", {
            timeout: 2000,
          });
        } else {
          // Use static mock error response
          toast.error(mockData.auth.login.error.message || "Invalid credentials", {
            timeout: 2000,
          });
        }
      } catch (error) {
        toast.error("An error occurred. Please try again.", {
          timeout: 2000,
        });
      }
    });

    return {
      email,

      emailError,
      password,
      passwordError,
      onSubmit,
    };
  },
};
</script>
<style lang="scss"></style>
