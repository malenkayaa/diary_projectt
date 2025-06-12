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
      function addTask(title, description, day, priority) {
        const tasks = loadFromStorage();

        const newTask = {
          id: Date.now().toString(),
          title,
          description,
          day,
          priority,
          completed: false,
          createdAt: new Date().toISOString(),
        };

        tasks.push(newTask);
        saveToStorage(tasks);

        return newTask;
      }

      function deleteTask(taskId) {
        const tasks = loadFromStorage();
        const updatedTasks = tasks.filter((task) => task.id !== taskId);
        saveToStorage(updatedTasks);

        const taskCard = document.querySelector(
          `.task-card[data-id="${taskId}"]`
        );
        if (taskCard) {
          taskCard.style.transform = 'translateX(100px)';
          taskCard.style.opacity = '0';
          setTimeout(() => {
            taskCard.remove();
            checkEmptyTasks();
          }, 300);
        }
      }

      function toggleTaskComplete(taskId) {
        const tasks = loadFromStorage();

        const updatedTasks = tasks.map((task) => {
          if (task.id === taskId) {
            return { ...task, completed: !task.completed };
          }
          return task;
        });

        saveToStorage(updatedTasks);

        const taskCard = document.querySelector(
          `.task-card[data-id="${taskId}"]`
        );
        if (taskCard) {
          taskCard.classList.toggle('completed');
          const completeBtn = taskCard.querySelector('.complete-btn');
          completeBtn.innerHTML = `<span class="material-icons">${
            taskCard.classList.contains('completed') ? 'undo' : 'check_circle'
          }</span>`;
        }
      }

      function displayTasksForDay(day) {
        const tasksContainer = document.getElementById('tasks-container');
        const tasks = loadFromStorage().filter((task) => task.day === day);

        document.getElementById('selected-day').textContent =
          dayTranslations[day];

        if (tasks.length === 0) {
          tasksContainer.innerHTML = `
          <div class="no-tasks">
            <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">task</span>
            <p>Немає завдань на ${dayTranslations[day].toLowerCase()}</p>
            <p>Натисніть "Додати завдання" щоб створити нове</p>
          </div>
        `;
          return;
        }

        tasks.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        tasksContainer.innerHTML = tasks
          .map(
            (task, index) => `
        <div class="task-card priority-${task.priority} ${
              task.completed ? 'completed' : ''
            }" 
             data-id="${task.id}" 
             style="animation-delay: ${index * 0.1}s">
          <div class="task-header">
            <h3 class="task-title">${task.title}</h3>
            <div class="task-actions">
              <button class="task-btn complete-btn" title="${
                task.completed ? 'Відмінити виконання' : 'Позначити як виконане'
              }">
                <span class="material-icons">${
                  task.completed ? 'undo' : 'check_circle'
                }</span>
              </button>
              <button class="task-btn delete-btn" title="Видалити завдання">
                <span class="material-icons">delete</span>
              </button>
            </div>
          </div>
          ${
            task.description
              ? `<p class="task-description">${task.description}</p>`
              : ''
          }
          <span class="task-priority priority-${task.priority}">
            <span class="material-icons">${priorityIcons[task.priority]}</span>
            ${priorityTranslations[task.priority]} пріоритет
          </span>
        </div>
      `
          )
          .join('');

        // Додаємо обробники подій для кнопок
        tasksContainer.querySelectorAll('.task-card').forEach((card) => {
          const taskId = card.dataset.id;

          card.querySelector('.complete-btn').addEventListener('click', () => {
            toggleTaskComplete(taskId);
          });

          card.querySelector('.delete-btn').addEventListener('click', () => {
            deleteTask(taskId);
          });
        });

        initDragAndDrop();
      }

      function checkEmptyTasks() {
        const tasksContainer = document.getElementById('tasks-container');
        const activeDay = document.querySelector('.day-btn.active');

        if (tasksContainer.children.length === 0 && activeDay) {
          displayTasksForDay(activeDay.dataset.day);
        }
      }

      function initDragAndDrop() {
        const taskCards = document.querySelectorAll('.task-card');
        const tasksContainer = document.getElementById('tasks-container');

        taskCards.forEach((card) => {
          card.setAttribute('draggable', true);

          card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.dataset.id);
            card.classList.add('dragging');
          });

          card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
          });
        });

        tasksContainer.addEventListener('dragover', (e) => {
          e.preventDefault();
        });

        tasksContainer.addEventListener('drop', (e) => {
          e.preventDefault();
          const taskId = e.dataTransfer.getData('text/plain');
          const activeDay = document.querySelector('.day-btn.active');
          if (activeDay) {
            moveTask(taskId, activeDay.dataset.day);
          }
        });
      }

      function initDayDropZones() {
        const dayButtons = document.querySelectorAll('.day-btn');

        dayButtons.forEach((dayBtn) => {
          dayBtn.addEventListener('dragover', (e) => {
            e.preventDefault();
            dayBtn.classList.add('dragover');
          });

          dayBtn.addEventListener('dragleave', () => {
            dayBtn.classList.remove('dragover');
          });

          dayBtn.addEventListener('drop', (e) => {
            e.preventDefault();
            dayBtn.classList.remove('dragover');
            const taskId = e.dataTransfer.getData('text/plain');
            const newDay = dayBtn.dataset.day;
            moveTask(taskId, newDay);

            // Оновлюємо активний день
            dayButtons.forEach((btn) => btn.classList.remove('active'));
            dayBtn.classList.add('active');
            displayTasksForDay(newDay);
          });
        });
      }

      function moveTask(taskId, newDay) {
        const tasks = loadFromStorage();
        const taskIndex = tasks.findIndex((task) => task.id === taskId);

        if (taskIndex !== -1) {
          tasks[taskIndex].day = newDay;
          saveToStorage(tasks);
          displayTasksForDay(newDay);
        }
      }

      // Ініціалізація
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

          addTask(title, description, day, priority);

          taskForm.reset();
          modal.classList.remove('show');

          const activeDay = document.querySelector('.day-btn.active');
          if (activeDay && activeDay.dataset.day === day) {
            displayTasksForDay(day);
          }
        });

        // Початкова ініціалізація з понеділком
        document.querySelector('[data-day="monday"]').click();

        initDayDropZones();
      });