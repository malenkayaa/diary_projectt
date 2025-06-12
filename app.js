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
        medium: 'priority',
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
            displayTasksForDay(button.dataset.day);
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

        // --- Пошук за тегом ---
        let currentTagFilter = '';
        const tagSearchInput = document.getElementById('tag-search-input');
        const clearTagSearch = document.getElementById('clear-tag-search');
        tagSearchInput.addEventListener('input', () => {
          currentTagFilter = tagSearchInput.value.trim();
          const activeDay = document.querySelector('.day-btn.active');
          if (activeDay) {
            displayTasksForDay(activeDay.dataset.day, currentTagFilter);
          }
        });
        clearTagSearch.addEventListener('click', () => {
          tagSearchInput.value = '';
          currentTagFilter = '';
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
      });