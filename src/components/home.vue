<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// Исходные данные
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

// Состояние приложения

const router = useRouter();
const showAdminContent = ref(false);
const abortController = new AbortController();
const currentlyUpdatingCompany = ref(null);
const autoUpdatesStopped = ref(false);
const searchQuery = ref('');
const isLoading = ref(false);
const updateInterval = ref(null);
const currentUpdatingIndex = ref(0);
const showAddModal = ref(false);
const selectedCompany = ref('');
const customNews = ref('');
const searchCompany = ref('');

// очистить данные все
function clearAllData() {
  localStorage.removeItem('companiesData')
  // Сброс данных в текущей сессии
  companies.value = companies.value.map(c => ({
    ...c,
    description: '',
    updates: []
  }))
}

function selectUpdate(company, index) {
  // Логика для показа полной версии обновления
  console.log('Selected update:', company.updates[index]);
};

// Проверяем при загрузке, является ли пользователь админом
onMounted(() => {
  showAdminContent.value = localStorage.getItem('userRole') === 'admin'
});

onMounted(async () => {
  try {
    //Загружает сохраненные данные компаний из localStorage
    loadFromLocalStorage()
    //Параллельно запрашивает описания для всех компаний, у которых их нет
    await Promise.all(companies.value.map(async company => {
      if (!company.description) {
        company.description = await fetchCompanyDescription(company.name)
      }
    }))
    //Сохраняет обновленные данные в localStorage
    saveToLocalStorage()
    //Запускает циклическое обновление данных
    startAutoUpdate()
  } catch (e) {
    console.error('Ошибка инициализации:', e)
  }
});

onUnmounted(() => {
  abortController.abort()
  stopAutoUpdate()
});

//модальное окно 
function openAddModal() {
  showAddModal.value = true;
}

//закрыть окно
function closeAddModal() {
  showAddModal.value = false;
  selectedCompany.value = '';
  customNews.value = '';
  searchCompany.value = '';
}

// выбор компании
function selectCompany(company) {
  selectedCompany.value = company.name;
  searchCompany.value = company.name;
}

// Добавить пользовательское обновление
function addCustomUpdate() {
  if (!selectedCompany.value || !customNews.value.trim()) {
    alert('Заполните все поля!');
    return;
  }
  const company = companies.value.find(c => c.name === selectedCompany.value);
  if (company) {
    company.updates.unshift({
      description: customNews.value,
      date: new Date().toISOString()
    });
    saveToLocalStorage();
  }
  
  closeAddModal();
};

// Отфильтрованные компании
const filteredCompanies = computed(() => {
  return companies.value
    .filter(company => 
      company.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
});
// фильтация компаний для создания новостей
const filteredModalCompanies = computed(() => {
  return companies.value.filter(company => 
    company.name.toLowerCase().includes(searchCompany.value.toLowerCase())
  );
});

function goToHome() {
  router.push('/');
}

// Остановка автоматического обновления
function stopAutoUpdate() {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
    updateInterval.value = null;
  }
}

// Загрузка данных из localStorage
function loadFromLocalStorage() {
  const savedData = localStorage.getItem('companiesData');
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      companies.value = companies.value.map(company => {
        const savedCompany = parsedData.find(c => c.id === company.id);
        return {
          ...company,
          ...savedCompany,
          // Гарантируем наличие массива updates
          updates: savedCompany?.updates || []
        };
      });
    } catch (e) {
      console.error('Ошибка при загрузке из localStorage:', e);
    }
  }
}

// Сохранение данных в localStorage
function saveToLocalStorage() {
  localStorage.setItem('companiesData', JSON.stringify(companies.value));
}

//метод для переключения состояния
function toggleAutoUpdates() {
  autoUpdatesStopped.value = !autoUpdatesStopped.value;
  if (autoUpdatesStopped.value) {
    stopAutoUpdate();
  } else {
    startAutoUpdate();
  }
}

// функция авто сохранения
function startAutoUpdate() {
  if (autoUpdatesStopped.value) return;
  
  stopAutoUpdate();
  
  // Убран лишний блок кода
  updateNextCompany();
  updateInterval.value = setInterval(updateNextCompany, 15000);
}

//auto apdate
{
  stopAutoUpdate(); // Очищаем предыдущий интервал

  // Сначала обновляем первую компанию сразу
  updateNextCompany();
  
  // Затем устанавливаем интервал для поочередного обновления
  updateInterval.value = setInterval(updateNextCompany, 15000); // 10 секунд
}


//функция updateNextCompany
async function updateNextCompany() {
  if (companies.value.length === 0) return;
  
  let company;
  try {
    company = companies.value[currentUpdatingIndex.value];
    currentlyUpdatingCompany.value = company.id;
    
    const newDescription = await fetchCompanyDescription(company.name);
    
    // Если получили пустую строку - пропускаем обновление
    if (!newDescription.trim()) return;
    
    if (company.description) {
      company.updates.unshift({
        description: company.description,
        date: new Date().toISOString()
      });
    }
    
    company.description = newDescription;
    saveToLocalStorage();
  } catch (error) {
    console.error(`Ошибка обновления:`, error);
  } finally {
    currentlyUpdatingCompany.value = null;
    currentUpdatingIndex.value = (currentUpdatingIndex.value + 1) % companies.value.length;
  }
};

  
  // Переходим к следующей компании
  currentUpdatingIndex.value = (currentUpdatingIndex.value + 1) % companies.value.length;


  async function fetchCompanyDescription(companyName) {
  try {
    isLoading.value = true;
    const response = await axios.post(
      '/api/v1/chat/completions',
      {
        "model": "mistral-small-latest",
        "messages": [{
          "role": "user",
          "content": `Напиши краткоие новости компании ${companyName} на русском. Ответ не длиннее 3 предложений.`
        }]
      },
      {
        signal: abortController.signal,
        headers: {
          'Authorization': `Bearer bFmL8oJNXMi6kEI3koTgLAAUmj5P7xcJ`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    // Возвращаем пустую строку вместо сообщения об ошибке
    return '';
  } finally {
    isLoading.value = false;
  }
};

// удалить 1 элемент
function deleteUpdate(companyId, updateIndex) {
  const company = companies.value.find(c => c.id === companyId);
  if (company && confirm('Удалить это обновление?')) {
    company.updates.splice(updateIndex, 1);
    saveToLocalStorage();
  }
}

</script>

<template>
  <!-- то как выгледит чтобы видили только админы -->

    <!-- <div class="home-container">
    <h1>Добро пожаловать на NewsWave!</h1>
    <p>Это общий контент для всех пользователей</p>
    <button @click="goToHome">на главную</button>
    <p></p>
    
    <div v-if="showAdminContent" class="admin-content">
      <h3>Специальный контент для администратора</h3>
      <p>Только админы видят эту информацию</p>
      <button @click="goToHome">на главную</button>
    </div>
  </div> -->

  <div v-if="isLoading" class="loading-overlay">
  </div>

  <div v-if="showAdminContent" class="hi-admin">
    <h1>приветсвуем тебя администратора</h1>
  </div>
  
  <div class="app-container">
    <!-- Поиск и кнопки -->
    <div class="controls-header">
      <!-- Админские кнопки справа -->
      <div class="admin-tools" v-if="showAdminContent">
        <div class="admin-buttons-group">
          <button @click="clearAllData" class="danger-button">
            🗑️ Очистить все
          </button>
          <button 
            @click="toggleAutoUpdates" 
            class="toggle-updates-button" 
            :class="{ stopped: autoUpdatesStopped }"
          >
            {{ autoUpdatesStopped ? '▶️ Возобновить' : '⏸️ Остановить' }}
          </button>
          <button @click="openAddModal" class="add-button">
    ✚ Добавить новость
  </button>
        </div>

      </div>
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Поиск компании..."
          class="search-input"
        >
      </div>
      
      <!-- Кнопка возврата слева -->
      <button @click="goToHome" class="home-button">🏠 Вернуться</button>
    </div>

    <!-- Список компаний в виде карточек -->
    <div class="companies-grid">
    <div 
      v-for="company in filteredCompanies" 
      :key="company.id" 
      class="company-card"
    >
    <div class="card-header">
  <h3>{{ company.name }}</h3>
  <div class="status-indicators">
    <span v-if="currentlyUpdatingCompany === company.id" class="loading-indicator">⌛</span>
    <span v-else-if="company.description" class="has-data-indicator">✓</span>
  </div>
</div>
        
        <div class="card-content">
          <div class="current-description">
    <h4>Текущее описание</h4>
    <div class="current-description-text">
      {{ company.description || 'Описание загружается...' }}
    </div>
    
    
    <h4 style="margin-top: 20px;">История обновлений ({{ company.updates.length }})</h4>
    <div class="description-scroll">
      <div 
    v-for="(update, index) in company.updates" 
    :key="index"
    class="update-item"
  >
  <div class="update-header">
      <div class="update-date">
        {{ new Date(update.date).toLocaleDateString() }}
      </div>
      <span class="fi fi-ru" style="margin-left: 10px;"></span>
    </div>
    <div class="update-preview">
      {{ update.description }}
    </div>
    <button 
    v-if="showAdminContent"
  @click.stop="deleteUpdate(company.id, index)" 
  class="delete-button"
    >
      🗑️
    </button>
  </div>
      <div v-if="!company.updates.length" class="no-updates">
        Нет исторических обновлений
      </div>
    </div>
  </div>
             </div>
          </div>
        </div>
        </div>
        <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Добавить новость</h3>
        <button @click="closeAddModal" class="close-modal">&times;</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <input
            type="text"
            v-model="searchCompany"
            placeholder="Поиск компании..."
            class="search-input"
          >
          <div class="companies-list">
            <div
              v-for="company in filteredModalCompanies"
              :key="company.id"
              @click="selectCompany(company)"
              class="company-item"
            >
              {{ company.name }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <textarea
            v-model="customNews"
            placeholder="Введите текст новости..."
            class="news-input"
          ></textarea>
        </div>

        <button @click="addCustomUpdate" class="submit-button">
          Создать
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hi-admin{
  display: flex;
  align-items: center;
  justify-content: center;
}

.hi-user{
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-button {
  background: #42b983;
  color: white;
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.submit-button:hover {
  background: #359c72;
}


.news-input {
  width: 100%;
  height: 120px;
  padding: 15px;
  border: 2px solid #42b983;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  font-size: 16px;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-modal {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
}

.close-modal:hover {
  color: #ff4444;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.add-button {
  background: #42b983;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
  margin: 20px 0;
  box-shadow: 0 4px 15px rgba(66, 185, 131, 0.3);
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 185, 131, 0.4);
}

.delete-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #ff4444;
  padding: 5px;
  margin-left: 10px;
  transition: transform 0.2s;
}

.delete-button:hover {
  transform: scale(1.2);
}

.controls-header {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 25px;
}

.admin-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.admin-tools {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 15px;
}

.admin-buttons-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.toggle-updates-button {
  order: 2; /* Кнопка будет второй в группе */
  background: #ff6b6b;
  padding: 8px 15px;
  font-size: 0.9em;
  border-radius: 30px;
}

.toggle-updates-button.stopped {
  background: #42b983;
}

.toggle-updates-button:hover {
  transform: translateY(-2px);
}

.danger-button {
  order: 1; /* Кнопка будет первой в группе */
  background: #ff4444;
  padding: 8px 15px;
  font-size: 0.9em;
  border-radius: 30px;
}

.danger-button:hover {
  background: #cc0000;
  transform: translateY(-2px);
}

.current-description {
  
  padding: 15px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.current-description-text {
  font-size: 0.95em;
  line-height: 1.6;
  margin-bottom: 15px;
  overflow: auto;
}

.description-scroll {
  max-height: 400px; /* Увеличиваем высоту блока с историей */
}

.update-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.update-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.updates-section {
  margin-top: 15px;
  width: 100%;
}

.updates-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.update-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-date {
  font-weight: 500;
  color: #42b983;
}

.update-preview {
  white-space: pre-line; /* Сохраняем переносы строк */
  font-size: 0.9em;
  line-height: 1.5;
  padding-right: 10px;
  display: block;
  width: 100%;
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}

.strelka p {
  font-size: 24px;
  color: #42b983;
  margin: 0;
}

.no-updates {
  padding: 15px;
  text-align: center;
  color: #999;
  font-style: italic;
}

.company-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 90%;
  max-width: 600px;
  border-radius: 15px;
  overflow: hidden;
  animation: modalOpen 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.history-navigation {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.history-navigation button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: #f8f8f8;
  cursor: pointer;
  transition: all 0.2s;
}

.history-navigation button.active {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.description-container {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
}

.description-content {
  white-space: pre-wrap;
  line-height: 1.6;
}

.update-meta {
  margin-top: 15px;
  font-size: 0.9em;
  color: #666;
  text-align: right;
}

.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.companies-grid {
  grid-template-columns: repeat(2, 1fr); /* Фиксируем 2 колонки */
  gap: 30px; /* Увеличиваем промежуток между карточками */
}

.company-card {
  min-height: 600px; /* Увеличиваем высоту карточек */
}


.card-content {
  padding: 15px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  gap: 15px;
}

.updates-scroll {
  flex: 1;
  overflow-y: auto;
  max-height: 250px;
  padding-right: 8px;
}

.update-text {
  font-size: 0.9em;
  line-height: 1.4;
  color: #444;
}

/* Полосы прокрутки */
.description-scroll::-webkit-scrollbar,
.updates-scroll::-webkit-scrollbar {
  width: 6px;
}

.description-scroll::-webkit-scrollbar-track,
.updates-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.description-scroll::-webkit-scrollbar-thumb,
.updates-scroll::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
  }
  
  .search-input,
  .news-input {
    font-size: 14px;
  }
}

.company-card:hover {
  transform: translateY(-5px);
}

.card-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
  min-height: 60px;
  overflow: hidden;
  gap: 15px; /* Добавляем промежуток между элементами */
  overflow: auto;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
  max-width: calc(100% - 60px); /* Учитываем место для индикаторов */
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: thin;
  scrollbar-color: #42b983 #f1f1f1;
  padding-bottom: 2px; /* Для визуального разделения скролла */
  overflow: auto;
}

/* Стили для скроллбара в WebKit */
.card-header h3::-webkit-scrollbar {
  height: 4px;
}

.card-header h3::-webkit-scrollbar-thumb {
  background: #42b983;
  border-radius: 2px;
}

.card-header h3::-webkit-scrollbar-track {
  background: #f1f1f1;
}



.status-indicators {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  min-width: 40px; /* Фиксируем минимальную ширину */
}

.card-content {
  padding: 15px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.latest-update {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}


.date {
  color: #42b983;
  font-weight: 500;
}

.update-count {
  background: #f0f0f0;
  padding: 3px 8px;
  border-radius: 12px;
}

.no-news {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-style: italic;
}

/* Адаптивность */
  .companies-grid {
    grid-template-columns: 1fr;
  }

  .search-container {
  display: flex;
  justify-content: center;
  grid-column: 2;
}
  
  .search-box {
  display: flex;
  gap: 15px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}
  
.search-input {
  width: 100%;
  padding: 12px 20px;
  border: 2px solid #42b983;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 10px;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 10px rgba(66, 185, 131, 0.3);
}

.home-button {
  background: #f0f0f0;
  color: #333;
  padding: 10px 20px;
  border-radius: 25px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 140px;
}

.home-button:hover {
  background: #e0e0e0;
}

.companies-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.company-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.company-item:hover {
  background: #f8f9fa;
}

.company-item:not(:last-child) {
  border-bottom: 1px solid #eee;
}

.company-item:last-child {
  border-bottom: none;
}

.company-item span {
  font-size: 16px;
  color: #333;
}

.company-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.has-data-indicator {
  color: #42b983;
  font-weight: bold;
}

.update-count {
  font-size: 12px;
  color: #888;
}

.company-info {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #eee;
  position: relative;
}

.company-info h3 {
  margin-top: 0;
  color: #2c3e50;
}

.history-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 15px 0;
}

.history-selector button {
  padding: 5px 10px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.history-selector button:hover {
  background-color: #e0e0e0;
}

.history-selector button.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.description {
  line-height: 1.6;
  margin-bottom: 20px;
  white-space: pre-line;
}

.loading {
  color: #666;
  font-style: italic;
}

.loading-indicator {
  color: #42b983;
  animation: spin 1s linear infinite;
}

@keyframes modalOpen {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.last-updated {
  font-size: 12px;
  color: #888;
  text-align: right;
}

.updates-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.historical-updates h3 {
  margin: 0 0 15px 0;
  font-size: 1.1em;
  color: #666;
}

.scrollable-updates {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.update-content {
  font-size: 0.95em;
  line-height: 1.5;
  color: #444;
  white-space: pre-wrap;
}

/* Полоса прокрутки */
.scrollable-updates::-webkit-scrollbar {
  width: 8px;
}

.scrollable-updates::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.scrollable-updates::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.scrollable-updates::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>