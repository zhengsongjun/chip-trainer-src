<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { loginWithEmail, registerWithEmail, logout, loginWithGoogle } from '@/services/auth'
  import { sendEmailVerification } from 'firebase/auth'
  import { useRouter } from 'vue-router'
  import { useUserBootstrap } from '@/composables/useUserBootstrap'

  /* ================= 基础 ================= */

  const router = useRouter()

  const isRegister = ref(false)
  const loading = ref(false)
  const formRef = ref<FormInstance>()

  const form = reactive({
    email: '',
    password: '',
    confirmPassword: '',
  })

  /* ================= 表单校验 ================= */

  const rules: FormRules = {
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码至少 6 位', trigger: 'blur' },
    ],
    confirmPassword: [
      { required: true, message: '请再次输入密码', trigger: 'blur' },
      {
        validator: (_, value, callback) => {
          if (value !== form.password) {
            callback(new Error('两次输入的密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur',
      },
    ],
  }

  /* ================= Google 登录 ================= */

  const handleGoogleLogin = async () => {
    loading.value = true
    try {
      const user = await loginWithGoogle()

      if (!user.emailVerified) {
        await sendEmailVerification(user)
        ElMessage.warning('邮箱尚未验证，已为你重新发送一封验证邮件')
        await logout()
        return
      }

      // ⭐ 同样：拉数据 + 存本地
      await useUserBootstrap(user)

      router.push('/chip-trainer')
    } catch (err: any) {
      ElMessage.error(err.message || 'Google 登录失败')
    } finally {
      loading.value = false
    }
  }

  /* ================= 邮箱登录 / 注册 ================= */

  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (!valid) return

      loading.value = true

      try {
        if (isRegister.value) {
          await registerWithEmail(form.email, form.password)
          await logout()

          ElMessage.success('注册成功！验证邮件已发送，请前往邮箱完成验证后再登录')
          switchMode(false)
        } else {
          const user = await loginWithEmail(form.email, form.password)

          if (!user.emailVerified) {
            await sendEmailVerification(user)
            ElMessage.warning(
              '邮箱尚未验证，已为你重新发送一封验证邮件，请点击【最新一封】完成验证'
            )
            await logout()
            return
          }

          // ⭐ 登录成功后：一次性拉数据 + 存本地
          await useUserBootstrap(user)

          // ⭐ 再跳转
          router.push('/chip-trainer')
        }
      } catch (err: any) {
        ElMessage.error(err.message || '操作失败，请重试')
      } finally {
        loading.value = false
      }
    })
  }

  /* ================= 工具方法 ================= */

  const switchMode = (register: boolean) => {
    isRegister.value = register
    resetForm()
  }

  const resetForm = () => {
    form.email = ''
    form.password = ''
    form.confirmPassword = ''
    formRef.value?.clearValidate()
  }
</script>

<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="title">
        {{ isRegister ? '注册账号' : '登录' }}
      </h2>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item v-if="isRegister" label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          :loading="loading"
          style="width: 100%; margin-top: 12px"
          @click="handleSubmit"
        >
          {{ isRegister ? '注册' : '登录' }}
        </el-button>

        <el-divider>或</el-divider>

        <el-button style="width: 100%" :loading="loading" @click="handleGoogleLogin">
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="google"
            style="width: 16px; margin-right: 8px"
          />
          使用 Google 登录
        </el-button>
      </el-form>

      <div class="switch">
        <span @click="switchMode(!isRegister)">
          {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
        </span>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
  .login-container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
  }

  .login-card {
    width: 380px;
    padding: 10px;
  }

  .title {
    text-align: center;
    margin-bottom: 20px;
  }

  .switch {
    margin-top: 16px;
    text-align: center;
    color: #409eff;
    cursor: pointer;
  }
</style>
