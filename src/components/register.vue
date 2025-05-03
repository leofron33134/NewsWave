<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'

const companies = ref([
  { id: 1, name: 'Газпром', description: '', updates: [] },
  { id: 2, name: 'Роснефть', description: '', updates: [] },
  { id: 3, name: 'Сбербанк', description: '', updates: [] },
  { id: 4, name: 'Лукойл', description: '', updates: [] },
  { id: 5, name: 'РЖД', description: '', updates: [] },
  { id: 6, name: 'Ростех', description: '', updates: [] },
  { id: 7, name: 'Росатом', description: '', updates: [] },
  { id: 8, name: 'Магнит', description: '', updates: [] },
  { id: 9, name: 'Норникель', description: '', updates: [] },
  { id: 10, name: 'Татнефть', description: '', updates: [] }
]);

const router = useRouter()

function goToHome() {
  localStorage.setItem('userRole', 'anonymous')
  router.push('/home')
}

function goToRegisterAdmin() {
  router.push('/loginAdmin')
}

</script>

<template>
  <div class="container">
    <h1 class="welcome-text">Welcome to NewsWave</h1>
    <p>Добро пожаловать в приложение NewsWave. На данном сайте вы как пользователь можете прочитать новости о следующих компаниях:</p>
    <div class="companies-list">
      <h2 v-for="company in companies" :key="company.id">{{ company.name }}</h2>
    </div>
    <div class="buttons-container">
      <button class="anon-button" @click="goToHome">Войти как аноним</button>
      <button class="admin-button" @click="goToRegisterAdmin">Войти как админ</button>
    </div>
  </div>
</template>

<style scoped>
.companies-list h2 {
  margin: 10px 0;
  color: #444;
}

.companies-list {
  width: auto;
  height: 300px;
  overflow: auto;
}

.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
}

.welcome-text {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #333;
}

.buttons-container {
  display: flex;
  gap: 20px;
}

.anon-button {
  padding: 12px 24px;
  font-size: 1.2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.anon-button:hover {
  background-color: #369f6e;
}

.admin-button {
  padding: 12px 24px;
  font-size: 1.2rem;
  background-color: #647eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.admin-button:hover {
  background-color: #4d6bf2;
}

.test-button {
  margin-top: 10px;
  padding: 12px 24px;
  font-size: 1.2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.test-button:hover {
  background-color: #369f6e;
}
</style>  