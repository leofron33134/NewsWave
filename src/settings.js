const { createApp, ref, computed } = Vue;

createApp({
  setup() {
    // Исходные данные - список российских компаний
    const companies = ref([
      { id: 1, name: 'Газпром' },
      { id: 2, name: 'Роснефть' },
      { id: 3, name: 'Сбербанк' },
      { id: 4, name: 'Лукойл' },
      { id: 5, name: 'РЖД' },
      { id: 6, name: 'Ростех' },
      { id: 7, name: 'Росатом' },
      { id: 8, name: 'Магнит' },
      { id: 9, name: 'Норникель' },
      { id: 10, name: 'Татнефть' }
    ]);
    
    // Состояние приложения
    const searchQuery = ref('');
    const showAddModal = ref(false);
    const editingCompany = ref(null);
    const currentCompany = ref({ name: '' });
    
    // Отфильтрованные компании
    const filteredCompanies = computed(() => {
        return companies.value
          .filter(company => 
            company.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
          .sort((a, b) => a.name.localeCompare(b.name));
      });
    
    // Методы
    const editCompany = (company) => {
      editingCompany.value = company;
      currentCompany.value = { ...company };
      showAddModal.value = true;
    };
    
    const deleteCompany = (id) => {
      if (confirm('Вы уверены, что хотите удалить эту компанию?')) {
        companies.value = companies.value.filter(c => c.id !== id);
      }
    };
    
    const saveCompany = () => {
      if (!currentCompany.value.name.trim()) {
        alert('Название компании не может быть пустым');
        return;
      }
      
      if (editingCompany.value) {
        // Обновление существующей компании
        const index = companies.value.findIndex(c => c.id === editingCompany.value.id);
        if (index !== -1) {
          companies.value[index] = { ...currentCompany.value };
        }
      } else {
        // Добавление новой компании
        const newId = Math.max(...companies.value.map(c => c.id), 0) + 1;
        companies.value.push({
          id: newId,
          name: currentCompany.value.name
        });
      }
      
      closeModal();
    };
    
    const closeModal = () => {
      showAddModal.value = false;
      editingCompany.value = null;
      currentCompany.value = { name: '' };
    };
    
    return {
      companies,
      searchQuery,
      showAddModal,
      editingCompany,
      currentCompany,
      filteredCompanies,
      editCompany,
      deleteCompany,
      saveCompany,
      closeModal
    };
  }
}).mount('#app');