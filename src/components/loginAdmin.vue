<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const password = ref('')
const errorMessage = ref('')
const ADMIN_PASSWORD = '' // Только для разработки!

function checkPassword() {
  if (password.value === ADMIN_PASSWORD) {
    localStorage.setItem('userRole', 'admin')
    router.push('/home') // Согласовано с роутером
  } else {
    errorMessage.value = 'Ошибка: неверный пароль'
  }
}
</script>

<template>
  <div class="password-container">
    <p>Введите пароль администратора:</p>
    <input 
      type="password" 
      v-model="password" 
      placeholder="Введите пароль"
      @keyup.enter="checkPassword"
    >
    <button @click="checkPassword">Войти</button>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.password-container {
  max-width: 300px;
  margin: 50px auto;
  padding: 20px;
  text-align: center;
}

input {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
}

button {
  background-color: #42b983;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-message {
  color: red;
  margin-top: 10px;
}
</style>