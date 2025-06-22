// Переклади
      const dayTranslations = {
        monday: 'Понеділок',
        tuesday: 'Вівторок',
        wednesday: 'Середа',
        thursday: 'Четвер',
        friday: "П'ятниця",
        saturday: 'Субота',
        sunday: 'Неділя',
      };

      const priorityTranslations = {
        low: 'Низький',
        medium: 'Середній',
        high: 'Високий',
      };

      const priorityIcons = {
        low: 'low_priority',
        medium: 'star', // змінено з 'priority' на 'star'
        high: 'priority_high',
      };

      // Робота з локальним сховищем
      function saveToStorage(tasks) {
        localStorage.setItem('weekly-planner-tasks', JSON.stringify(tasks));
      }

      function loadFromStorage() {
        const tasks = localStorage.getItem('weekly-planner-tasks');
        return tasks ? JSON.parse(tasks) : [];
      }

      // Управління завданнями
      // Додаємо функцію для отримання масиву тегів з рядка
function parseTags(str) {
  return str
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => t.toLowerCase());
}

// Оновлений addTask з підтримкою тегів
function addTask(title, description, day, priority, tags) {
  const tasks = loadFromStorage();
  const newTask = {
    id: Date.now().toString(),
    title,
    description,
    day,
    priority,
    completed: false,
    createdAt: new Date().toISOString(),
    tags: tags || []
  };
  tasks.push(newTask);
  saveToStorage(tasks);
  return newTask;
}

      let trashedTasks = [];

      // Замінюємо функцію deleteTask на moveToTrash:
function moveToTrash(taskId) {
  const tasks = loadFromStorage();
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    const trashedTask = tasks.splice(taskIndex, 1)[0];
    trashedTask.deletedAt = new Date().toISOString();
    trashedTasks.push(trashedTask);
    
    saveToStorage(tasks);
    localStorage.setItem('trashed-tasks', JSON.stringify(trashedTasks));
    
    const taskElement = document.querySelector(`.task-card[data-id="${taskId}"]`);
    if (taskElement) {
      taskElement.style.transform = 'translateX(100px)';
      taskElement.style.opacity = '0';
      setTimeout(() => {
        taskElement.remove();
        renderTrashItems();
        checkEmptyTasks();
      }, 300);
    }
  }
}

function restoreFromTrash(taskId) {
  const taskIndex = trashedTasks.findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    const tasks = loadFromStorage();
    const restoredTask = trashedTasks.splice(taskIndex, 1)[0];
    delete restoredTask.deletedAt;
    tasks.push(restoredTask);
    
    saveToStorage(tasks);
    localStorage.setItem('trashed-tasks', JSON.stringify(trashedTasks));
    
    const trashedElement = document.querySelector(`.trash-item[data-id="${taskId}"]`);
    if (trashedElement) {
      trashedElement.style.transform = 'translateX(-100px)';
      trashedElement.style.opacity = '0';
      setTimeout(() => {
        renderTrashItems();
        // Оновлюємо відображення завдань, якщо відновлене завдання належить до поточного дня
        const activeDay = document.querySelector('.day-btn.active');
        if (activeDay && activeDay.dataset.day === restoredTask.day) {
          displayTasksForDay(restoredTask.day);
        }
      }, 300);
    }
  }
}

function deleteForever(taskId) {
  const taskIndex = trashedTasks.findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    trashedTasks.splice(taskIndex, 1);
    localStorage.setItem('trashed-tasks', JSON.stringify(trashedTasks));
    
    const trashedElement = document.querySelector(`.trash-item[data-id="${taskId}"]`);
    if (trashedElement) {
      trashedElement.style.transform = 'scale(0.8)';
      trashedElement.style.opacity = '0';
      setTimeout(() => {
        renderTrashItems();
      }, 300);
    }
  }
}

function renderTrashItems() {
  const trashContainer = document.getElementById('trash-items');
  if (!trashContainer) return;
  
  if (trashedTasks.length === 0) {
    trashContainer.innerHTML = `
      <div class="no-tasks" style="text-align: center; padding: 2rem;">
        <span class="material-icons" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">delete_outline</span>
        <p>Кошик порожній</p>
      </div>
    `;
    return;
  }
  
  trashContainer.innerHTML = trashedTasks
    .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt))
    .map((task, index) => `
      <div class="trash-item" data-id="${task.id}" style="animation-delay: ${index * 0.1}s">
        <div class="trash-item-content">
          <div class="trash-item-title">${task.title}</div>
          <div class="task-priority priority-${task.priority}" style="display: inline-block; margin-top: 4px;">
            <span class="material-icons">${priorityIcons[task.priority]}</span>
          </div>
        </div>
        <div class="trash-actions">
          <button class="restore-btn" title="Відновити завдання">
            <span class="material-icons">restore</span>
          </button>
          <button class="delete-forever-btn" title="Видалити назавжди">
            <span class="material-icons">delete_forever</span>
          </button>
        </div>
      </div>
    `)
    .join('');
  
  // Додаємо обробники подій
  trashContainer.querySelectorAll('.trash-item').forEach(item => {
    const taskId = item.dataset.id;
    item.querySelector('.restore-btn').addEventListener('click', () => restoreFromTrash(taskId));
    item.querySelector('.delete-forever-btn').addEventListener('click', () => deleteForever(taskId));
  });
}

// --- Відображення завдань для обраного дня ---
function displayTasksForDay(day, search = '') {
  const tasksContainer = document.getElementById('tasks-container');
  const selectedDay = document.getElementById('selected-day');
  const allTasks = loadFromStorage();
  let tasks;
  let isGlobalTagSearch = false;
  if (day === 'all' && search) {
    // Глобальний пошук по назві та тегах
    const filter = search.trim().toLowerCase();
    tasks = allTasks.filter(task =>
      (task.title && task.title.toLowerCase().includes(filter)) ||
      (task.tags && task.tags.some(tag => tag.includes(filter)))
    );
    isGlobalTagSearch = true;
  } else {
    tasks = allTasks.filter(task => task.day === day);
    if (search) {
      const filter = search.trim().toLowerCase();
      tasks = tasks.filter(task =>
        (task.title && task.title.toLowerCase().includes(filter)) ||
        (task.tags && task.tags.some(tag => tag.includes(filter)))
      );
    }
  }
  if (selectedDay) {
    if (isGlobalTagSearch) {
      // Якщо пошук виглядає як тег (починається з # або складається лише з букв/цифр), додаємо #, інакше просто текст
      if (search.startsWith('#')) {
        selectedDay.textContent = `Усі дні: ${search}`;
      } else {
        selectedDay.textContent = `Усі дні: ${search}`;
      }
    } else {
      selectedDay.textContent = dayTranslations[day] || 'Оберіть день';
    }
  }
  if (tasks.length === 0) {
    tasksContainer.innerHTML = `<div class="no-tasks" style="text-align:center; opacity:0.7; padding:2rem;">
      <span class="material-icons" style="font-size:48px; margin-bottom:16px;">event_busy</span>
      <p>Завдань немає</p>
    </div>`;
    return;
  }
  tasksContainer.innerHTML = tasks
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((task, idx) => `
      <div class="task-card" data-id="${task.id}" style="--animation-order:${idx}">
        <div class="task-header">
          <div>
            <strong>${task.title}</strong>
          </div>
          <div class="task-actions">
            <button class="task-btn delete-btn" title="Видалити">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
        <div style="margin-top:2px; color:#b3a6bf;">${task.description || ''}</div>
        <div class="task-bottom-row" style="display:flex; align-items:center; gap:16px; margin-top:10px; color:#bf5f82; font-size:0.97em;">
          <div class="task-priority priority-${task.priority}" style="margin:0;">
            <span class="material-icons">${priorityIcons[task.priority]}</span>
            <span>${priorityTranslations[task.priority]}</span>
          </div>
          ${task.tags && task.tags.length ? `<div class="task-tags-row">${task.tags.map(tag => `#${tag}`).join(' ')}</div>` : ''}
        </div>
      </div>
    `)
    .join('');
  // Додаємо обробники для видалення
  tasksContainer.querySelectorAll('.delete-btn').forEach(btn => {
    const card = btn.closest('.task-card');
    if (card) {
      btn.addEventListener('click', () => moveToTrash(card.dataset.id));
    }
  });
}

// --- Перевірка наявності завдань (для порожнього списку) ---
function checkEmptyTasks() {
  const tasksContainer = document.getElementById('tasks-container');
  if (tasksContainer && !tasksContainer.querySelector('.task-card')) {
    tasksContainer.innerHTML = `<div class="no-tasks" style="text-align:center; opacity:0.7; padding:2rem;">
      <span class="material-icons" style="font-size:48px; margin-bottom:16px;">event_busy</span>
      <p>Завдань немає</p>
    </div>`;
  }
}

// --- Додаємо відображення унікальних тегів у sidebar ---
function renderSidebarTags() {
  const allTasks = loadFromStorage();
  const tagSet = new Set();
  allTasks.forEach(task => {
    if (Array.isArray(task.tags)) {
      task.tags.forEach(tag => tagSet.add(tag));
    }
  });
  const sidebarTags = document.getElementById('sidebar-tags');
  if (!sidebarTags) return;
  if (tagSet.size === 0) {
    sidebarTags.innerHTML = '<div style="color:#b3a6bf; font-size:0.95em; text-align:center;">Тегів ще немає</div>';
    return;
  }
  sidebarTags.innerHTML =
    '<div style="font-weight:600; color:#bf5f82; margin-bottom:8px;">Теги:</div>' +
    Array.from(tagSet).map(tag =>
      `<div class="sidebar-tag" style="margin-bottom:4px; color:#f5eeff; background:#231a2e; border-radius:8px; padding:4px 10px; display:inline-block; cursor:pointer; font-size:0.97em;">#${tag}</div>`
    ).join(' ');
  // Додаємо фільтрацію по кліку на тег
  sidebarTags.querySelectorAll('.sidebar-tag').forEach(tagEl => {
    tagEl.addEventListener('click', () => {
      const tag = tagEl.textContent.replace('#', '');
      displayTasksForDay('all', tag); // глобальний фільтр по тегу
      // Якщо після фільтрації завдань немає, все одно показати блок "Завдань немає"
      const tasksContainer = document.getElementById('tasks-container');
      if (tasksContainer && !tasksContainer.querySelector('.task-card')) {
        tasksContainer.innerHTML = `<div class="no-tasks" style="text-align:center; opacity:0.7; padding:2rem;">
          <span class="material-icons" style="font-size:48px; margin-bottom:16px;">event_busy</span>
          <p>Завдань немає</p>
        </div>`;
      }
    });
  });
}

// В document.addEventListener('DOMContentLoaded') додаємо:
document.addEventListener('DOMContentLoaded', () => {
        const dayButtons = document.querySelectorAll('.day-btn');
        const addTaskBtn = document.getElementById('add-task-btn');
        const modal = document.getElementById('task-modal');
        const closeModalBtn = document.querySelector('.close-modal');
        const taskForm = document.getElementById('task-form');

        dayButtons.forEach((button) => {
          button.addEventListener('click', () => {
            dayButtons.forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
            // Передаємо поточний пошуковий запит з поля пошуку
            displayTasksForDay(button.dataset.day, tagSearchInput.value.trim());
            renderSidebarTags();
          });
        });

        addTaskBtn.addEventListener('click', () => {
          modal.classList.add('show');
          const activeDay = document.querySelector('.day-btn.active');
          if (activeDay) {
            document.getElementById('task-day').value = activeDay.dataset.day;
          }
        });

        closeModalBtn.addEventListener('click', () => {
          modal.classList.remove('show');
        });

        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('show');
          }
        });

        taskForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const title = document.getElementById('task-title').value;
          const description = document.getElementById('task-description').value;
          const day = document.getElementById('task-day').value;
          const priority = document.getElementById('task-priority').value;
          const tagsStr = document.getElementById('task-tags').value;
          const tags = parseTags(tagsStr);
          addTask(title, description, day, priority, tags);
          taskForm.reset();
          document.getElementById('task-modal').classList.remove('show');
          const activeDay = document.querySelector('.day-btn.active');
          if (activeDay && activeDay.dataset.day === day) {
            displayTasksForDay(day);
          }
        });

        // --- Пошук за назвою або тегом для активного дня ---
        let currentSearch = '';
        const tagSearchInput = document.getElementById('tag-search-input');
        const clearTagSearch = document.getElementById('clear-tag-search');
        tagSearchInput.addEventListener('input', () => {
          currentSearch = tagSearchInput.value.trim();
          if (currentSearch) {
            displayTasksForDay('all', currentSearch); // глобальний пошук по всіх днях
          } else {
            const activeDay = document.querySelector('.day-btn.active');
            if (activeDay) {
              displayTasksForDay(activeDay.dataset.day);
            }
          }
        });
        clearTagSearch.addEventListener('click', () => {
          tagSearchInput.value = '';
          currentSearch = '';
          const activeDay = document.querySelector('.day-btn.active');
          if (activeDay) {
            displayTasksForDay(activeDay.dataset.day);
          }
        });

        // Початкова ініціалізація з понеділком
        document.querySelector('[data-day="monday"]').click();

        initDayDropZones();

        // Завантажуємо видалені завдання
  const savedTrashedTasks = localStorage.getItem('trashed-tasks');
  if (savedTrashedTasks) {
    trashedTasks = JSON.parse(savedTrashedTasks);
    renderTrashItems();
  }
  
  // Додаємо обробник для кнопки очищення кошика
  document.getElementById('clear-trash').addEventListener('click', () => {
    if (confirm('Ви впевнені, що хочете повністю очистити кошик? Це дію неможливо відмінити.')) {
      trashedTasks = [];
      localStorage.setItem('trashed-tasks', JSON.stringify(trashedTasks));
      renderTrashItems();
    }
  });

  renderSidebarTags();
      });

      // Оновлюємо теги у sidebar після додавання завдання
      const taskForm = document.getElementById('task-form');
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const day = document.getElementById('task-day').value;
        const priority = document.getElementById('task-priority').value;
        const tagsStr = document.getElementById('task-tags').value;
        const tags = parseTags(tagsStr);
        addTask(title, description, day, priority, tags);
        taskForm.reset();
        document.getElementById('task-modal').classList.remove('show');
        const activeDay = document.querySelector('.day-btn.active');
        if (activeDay && activeDay.dataset.day === day) {
          displayTasksForDay(day);
        }
        renderSidebarTags();
      });