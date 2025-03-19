document.addEventListener('DOMContentLoaded', () => {
    // DOM elementlerini seç
    const form = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoDate = document.getElementById('todo-date');
    const todoList = document.getElementById('todo-list');
    const todoPriority = document.getElementById('todo-priority');
    const todoCategory = document.getElementById('todo-category');
    const todoNotes = document.getElementById('todo-notes');
    
    // Puan sistemi elementleri
    const totalPointsElement = document.getElementById('total-points');
    let totalPoints = parseInt(localStorage.getItem('totalPoints')) || 0;
    
    // Puanları güncelle
    function updatePoints() {
        totalPointsElement.textContent = totalPoints;
        localStorage.setItem('totalPoints', totalPoints);
    }
    
    // Puan ekle
    function addPoints(points) {
        totalPoints += points;
        updatePoints();
        
        // Animasyon ekle
        totalPointsElement.parentElement.classList.add('point-earned');
        setTimeout(() => {
            totalPointsElement.parentElement.classList.remove('point-earned');
        }, 500);
    }
    
    // İlk puan güncellemesini yap
    updatePoints();
    
    // Filtreleme elementleri
    const priorityFilter = document.getElementById('priority-filter');
    const categoryFilter = document.getElementById('category-filter');
    const viewFilter = document.getElementById('view-filter');
    
    // Görünüm sekmeleri
    const viewTabs = document.querySelectorAll('.view-tab');
    const viewContents = document.querySelectorAll('.view-content');
    
    // Modal elementleri
    const taskModal = document.getElementById('task-modal');
    const closeModal = document.querySelector('.close');
    const modalTitle = document.getElementById('modal-title');
    const modalPriority = document.getElementById('modal-priority');
    const modalCategory = document.getElementById('modal-category');
    const modalDate = document.getElementById('modal-date');
    const modalRemaining = document.getElementById('modal-remaining');
    const modalNotes = document.getElementById('modal-notes');
    const modalToggleStatus = document.getElementById('modal-toggle-status');
    const modalEdit = document.getElementById('modal-edit');
    
    // Kanban elementleri
    const kanbanTodo = document.getElementById('kanban-todo');
    const kanbanInProgress = document.getElementById('kanban-inprogress');
    const kanbanCompleted = document.getElementById('kanban-completed');
    
    // Form gönder butonu
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Düzenleme durumu
    let isEditing = false;
    let editingTodoId = null;
    
    // Bildirim izni iste
    requestNotificationPermission();
    
    // Yerel depolamadan yapılacakları yükle
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    
    // Filtreleme durumu
    let filters = {
        priority: 'all',
        category: 'all',
        view: 'all'
    };
    
    // Seçili görev
    let selectedTodoId = null;
    
    // Her görev için son durumu izlemek için
    let todoExpiredStates = {};
    
    // Kategorileri doldur
    updateCategoryFilter();
    
    // Yapılacakları render et
    renderTodos();
    
    // Her saniye kalan süreyi güncelle
    setInterval(updateRemainingTime, 1000);
    
    // Takvim elementleri
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthYear = document.getElementById('current-month-year');
    const calendarMonthGrid = document.getElementById('calendar-month-grid');
    const calendarViewOptions = document.querySelectorAll('.calendar-view-option');
    const calendarMonthView = document.querySelector('.calendar-month-view');
    const calendarWeekView = document.querySelector('.calendar-week-view');
    const calendarDayView = document.querySelector('.calendar-day-view');
    
    // Takvim durumu
    let currentDate = new Date();
    let currentView = 'month';
    
    // Takvim navigasyon olayları
    prevMonthBtn.addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() - 1);
            updateCalendar();
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() - 7);
            updateCalendar();
        } else if (currentView === 'day') {
            currentDate.setDate(currentDate.getDate() - 1);
            updateCalendar();
        }
    });
    
    nextMonthBtn.addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + 1);
            updateCalendar();
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() + 7);
            updateCalendar();
        } else if (currentView === 'day') {
            currentDate.setDate(currentDate.getDate() + 1);
            updateCalendar();
        }
    });
    
    // Takvim görünüm seçenekleri
    calendarViewOptions.forEach(option => {
        option.addEventListener('click', () => {
            calendarViewOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            calendarMonthView.classList.remove('active');
            calendarWeekView.classList.remove('active');
            calendarDayView.classList.remove('active');
            
            currentView = option.dataset.view;
            
            switch(currentView) {
                case 'month':
                    calendarMonthView.classList.add('active');
                    break;
                case 'week':
                    calendarWeekView.classList.add('active');
                    break;
                case 'day':
                    calendarDayView.classList.add('active');
                    break;
            }
            
            updateCalendar();
        });
    });
    
    // Takvimi güncelle
    function updateCalendar() {
        // Ay ve yıl başlığını güncelle
        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        currentMonthYear.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        
        if (currentView === 'month') {
            updateMonthView();
        } else if (currentView === 'week') {
            updateWeekView();
        } else if (currentView === 'day') {
            updateDayView();
        }
    }
    
    // Aylık görünümü güncelle
    function updateMonthView() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = firstDay.getDay() || 7; // Pazar günü 0 yerine 7 olsun
        
        calendarMonthGrid.innerHTML = '';
        
        // Önceki aydan kalan günleri ekle
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i > 0; i--) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day', 'other-month');
            dayElement.innerHTML = `
                <div class="calendar-day-number">${prevMonthLastDay - i + 1}</div>
            `;
            calendarMonthGrid.appendChild(dayElement);
        }
        
        // Mevcut ayın günlerini ekle
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            
            const currentDay = new Date(year, month, day);
            const isToday = currentDay.toDateString() === new Date().toDateString();
            
            if (isToday) {
                dayElement.classList.add('today');
            }
            
            dayElement.innerHTML = `
                <div class="calendar-day-number">${day}</div>
            `;
            
            // O güne ait görevleri ekle
            const dayTodos = todos.filter(todo => {
                const todoDate = new Date(todo.dateTime);
                return todoDate.getDate() === day &&
                       todoDate.getMonth() === month &&
                       todoDate.getFullYear() === year;
            });
            
            dayTodos.forEach(todo => {
                const eventElement = document.createElement('div');
                eventElement.classList.add('calendar-event', `event-${todo.priority}`);
                eventElement.textContent = todo.text;
                eventElement.addEventListener('click', () => openTaskModal(todo.id));
                dayElement.appendChild(eventElement);
            });
            
            calendarMonthGrid.appendChild(dayElement);
        }
        
        // Sonraki aydan kalan günleri ekle
        const remainingDays = 42 - (startingDay + lastDay.getDate());
        for (let day = 1; day <= remainingDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day', 'other-month');
            dayElement.innerHTML = `
                <div class="calendar-day-number">${day}</div>
            `;
            calendarMonthGrid.appendChild(dayElement);
        }
    }
    
    // Haftalık görünümü güncelle
    function updateWeekView() {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        
        // Hafta başlıklarını güncelle
        const weekDayHeaders = document.getElementById('week-day-headers');
        weekDayHeaders.innerHTML = '';
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header');
            dayHeader.innerHTML = `
                <div class="day-name">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}</div>
                <div class="day-date">${day.getDate()}</div>
            `;
            weekDayHeaders.appendChild(dayHeader);
        }
        
        // Saat dilimlerini güncelle
        const timeSlots = document.querySelector('.time-slots');
        timeSlots.innerHTML = '';
        
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.classList.add('time-slot');
            timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeSlots.appendChild(timeSlot);
        }
        
        // Haftalık grid'i güncelle
        const weekGrid = document.getElementById('calendar-week-grid');
        weekGrid.innerHTML = '';
        
        for (let hour = 0; hour < 24; hour++) {
            for (let day = 0; day < 7; day++) {
                const cell = document.createElement('div');
                cell.classList.add('week-cell');
                weekGrid.appendChild(cell);
                
                const currentDay = new Date(weekStart);
                currentDay.setDate(weekStart.getDate() + day);
                currentDay.setHours(hour);
                
                // O saat ve güne ait görevleri ekle
                const hourTodos = todos.filter(todo => {
                    const todoDate = new Date(todo.dateTime);
                    return todoDate.getDate() === currentDay.getDate() &&
                           todoDate.getMonth() === currentDay.getMonth() &&
                           todoDate.getFullYear() === currentDay.getFullYear() &&
                           todoDate.getHours() === hour;
                });
                
                hourTodos.forEach(todo => {
                    const eventElement = document.createElement('div');
                    eventElement.classList.add('week-event', `event-${todo.priority}`);
                    eventElement.textContent = todo.text;
                    eventElement.addEventListener('click', () => openTaskModal(todo.id));
                    cell.appendChild(eventElement);
                });
            }
        }
    }
    
    // Günlük görünümü güncelle
    function updateDayView() {
        const dayTimeline = document.getElementById('day-timeline');
        dayTimeline.innerHTML = '';
        
        for (let hour = 0; hour < 24; hour++) {
            const hourElement = document.createElement('div');
            hourElement.classList.add('day-hour');
            
            hourElement.innerHTML = `
                <div class="hour-label">${hour.toString().padStart(2, '0')}:00</div>
                <div class="hour-content"></div>
            `;
            
            const hourContent = hourElement.querySelector('.hour-content');
            
            // O saate ait görevleri ekle
            const hourTodos = todos.filter(todo => {
                const todoDate = new Date(todo.dateTime);
                return todoDate.getDate() === currentDate.getDate() &&
                       todoDate.getMonth() === currentDate.getMonth() &&
                       todoDate.getFullYear() === currentDate.getFullYear() &&
                       todoDate.getHours() === hour;
            });
            
            hourTodos.forEach(todo => {
                const eventElement = document.createElement('div');
                eventElement.classList.add('day-event', `event-${todo.priority}`);
                eventElement.textContent = todo.text;
                eventElement.addEventListener('click', () => openTaskModal(todo.id));
                hourContent.appendChild(eventElement);
            });
            
            dayTimeline.appendChild(hourElement);
        }
    }
    
    // İlk takvim güncellemesini yap
    updateCalendar();
    
    // Form gönderildiğinde
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const todoText = todoInput.value.trim();
        const todoDateTime = todoDate.value;
        const priority = todoPriority.value;
        const category = todoCategory.value;
        const notes = todoNotes.value.trim();
        
        if (todoText && todoDateTime) {
            if (isEditing && editingTodoId) {
                // Mevcut görevi güncelle
                todos = todos.map(todo => {
                    if (todo.id === editingTodoId) {
                        return {
                            ...todo,
                            text: todoText,
                            dateTime: todoDateTime,
                            priority: priority,
                            category: category,
                            notes: notes
                        };
                    }
                    return todo;
                });
                
                // Düzenleme modunu kapat
                isEditing = false;
                editingTodoId = null;
                submitButton.textContent = 'Ekle';
            } else {
                // Yeni görev oluştur
                const newTodo = {
                    id: Date.now(),
                    text: todoText,
                    dateTime: todoDateTime,
                    priority: priority,
                    category: category,
                    notes: notes,
                    completed: false,
                    status: 'todo' // todo, inprogress, completed
                };
                
                todos.push(newTodo);
                todoExpiredStates[newTodo.id] = false; // Yeni görevin süre dolma durumunu başlat
            }
            
            saveTodos();
            updateCategoryFilter();
            renderTodos();
            
            // Formu sıfırla
            todoInput.value = '';
            todoDate.value = '';
            todoPriority.value = 'medium';
            todoCategory.value = '';
            todoNotes.value = '';
        }
    });
    
    // Düzenle butonuna tıklama
    modalEdit.addEventListener('click', () => {
        if (selectedTodoId) {
            const todo = todos.find(t => t.id === selectedTodoId);
            if (todo) {
                // Formu doldur
                todoInput.value = todo.text;
                todoDate.value = todo.dateTime;
                todoPriority.value = todo.priority || 'medium';
                todoCategory.value = todo.category || '';
                todoNotes.value = todo.notes || '';
                
                // Düzenleme modunu aç
                isEditing = true;
                editingTodoId = selectedTodoId;
                submitButton.textContent = 'Güncelle';
                
                // Modalı kapat ve sayfayı forma kaydır
                taskModal.style.display = 'none';
                form.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
    
    // Filtreleme işlemleri
    priorityFilter.addEventListener('change', updateFilters);
    categoryFilter.addEventListener('change', updateFilters);
    viewFilter.addEventListener('change', updateFilters);
    
    // Görünüm sekmeleri değişimi
    viewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Aktif sekmeyi değiştir
            viewTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // İlgili içeriği göster
            const targetView = tab.dataset.view;
            viewContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetView}-view`) {
                    content.classList.add('active');
                }
            });
            
            // Kanban görünümünde ise kanban'ı güncelle
            if (targetView === 'kanban') {
                renderKanban();
            }
        });
    });
    
    // Modal kapatma
    closeModal.addEventListener('click', () => {
        taskModal.style.display = 'none';
    });
    
    // Modal dışı tıklama
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.style.display = 'none';
        }
    });
    
    // Modal görev durumu değiştirme
    modalToggleStatus.addEventListener('click', () => {
        if (selectedTodoId) {
            const todo = todos.find(t => t.id === selectedTodoId);
            if (todo) {
                // Durum döngüsü: todo -> inprogress -> completed -> todo
                if (todo.status === 'todo') {
                    todo.status = 'inprogress';
                    todo.completed = false;
                } else if (todo.status === 'inprogress') {
                    todo.status = 'completed';
                    todo.completed = true;
                    addPoints(10); // Tamamlandığında puan ekle
                } else {
                    todo.status = 'todo';
                    todo.completed = false;
                }
                
                saveTodos();
                renderTodos();
                updateTaskModal(selectedTodoId);
                
                // Eğer görev tamamlandıysa, 3-4 saniye sonra sil
                if (todo.completed) {
                    setTimeout(() => {
                        todos = todos.filter(t => t.id !== selectedTodoId);
                        saveTodos();
                        renderTodos();
                        renderKanban();
                        updateCalendar();
                        taskModal.style.display = 'none';
                    }, Math.random() * 1000 + 3000);
                }
            }
        }
    });
    
    // Yapılacaklar listesine tıklandığında
    todoList.addEventListener('click', (e) => {
        // Checkbox tıklaması
        if (e.target.classList.contains('checkbox') || e.target.parentElement.classList.contains('checkbox')) {
            const todoItem = e.target.closest('.todo-item');
            const todoId = Number(todoItem.dataset.id);
            
            toggleTodoStatus(todoId);
            e.stopPropagation();
        } else {
            // Görev içeriğine tıklandığında modal göster
            const todoItem = e.target.closest('.todo-item');
            if (todoItem) {
                const todoId = Number(todoItem.dataset.id);
                openTaskModal(todoId);
            }
        }
    });
    
    // Kanban görünümünde öğeye tıklama
    document.addEventListener('click', (e) => {
        if (e.target.closest('.kanban-item')) {
            const kanbanItem = e.target.closest('.kanban-item');
            const todoId = Number(kanbanItem.dataset.id);
            openTaskModal(todoId);
        }
    });
    
    // Drag and Drop işlemleri için
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('kanban-item')) {
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
        }
    });
    
    document.addEventListener('dragover', (e) => {
        if (e.target.classList.contains('kanban-items') || e.target.closest('.kanban-items')) {
            e.preventDefault();
        }
    });
    
    document.addEventListener('drop', (e) => {
        const kanbanColumn = e.target.closest('.kanban-column');
        if (kanbanColumn) {
            e.preventDefault();
            const todoId = Number(e.dataTransfer.getData('text/plain'));
            const newStatus = kanbanColumn.dataset.status;
            
            // Görevin durumunu güncelle
            const todo = todos.find(t => t.id === todoId);
            if (todo && todo.status !== newStatus) {
                todo.status = newStatus;
                
                // Tamamlandı durumunu güncelle
                todo.completed = newStatus === 'completed';
                
                saveTodos();
                renderKanban();
                renderTodos();
            }
        }
    });
    
    // Görev modalını aç
    function openTaskModal(todoId) {
        const todo = todos.find(t => t.id === todoId);
        if (todo) {
            selectedTodoId = todoId;
            updateTaskModal(todoId);
            taskModal.style.display = 'block';
        }
    }
    
    // Modal içeriğini güncelle
    function updateTaskModal(todoId) {
        const todo = todos.find(t => t.id === todoId);
        if (todo) {
            modalTitle.textContent = todo.text;
            
            // Öncelik gösterimi
            const priorityLabels = {
                'high': 'Yüksek',
                'medium': 'Orta',
                'low': 'Düşük'
            };
            
            // Kategori gösterimi
            let categoryText = todo.category ? todo.category.charAt(0).toUpperCase() + todo.category.slice(1) : 'Belirtilmemiş';
            
            // Durum gösterimi
            const statusLabels = {
                'todo': 'Yapılacak',
                'inprogress': 'Devam Ediyor',
                'completed': 'Tamamlandı'
            };
            
            // Tarih formatla
            const dateTime = new Date(todo.dateTime);
            const formattedDate = dateTime.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Duruma göre buton metni
            if (todo.status === 'todo') {
                modalToggleStatus.textContent = 'Devam Ediyor Olarak İşaretle';
            } else if (todo.status === 'inprogress') {
                modalToggleStatus.textContent = 'Tamamlandı Olarak İşaretle';
            } else {
                modalToggleStatus.textContent = 'Yapılacak Olarak İşaretle';
            }
            
            // Modal bilgilerini güncelle
            modalPriority.textContent = priorityLabels[todo.priority] || 'Belirtilmemiş';
            modalPriority.className = ''; // Sınıfları temizle
            modalPriority.classList.add(`priority-${todo.priority}`);
            
            modalCategory.textContent = categoryText;
            modalDate.textContent = formattedDate;
            modalRemaining.textContent = !todo.completed ? getRemainingTime(todo.dateTime) : 'Tamamlandı';
            modalNotes.innerHTML = todo.notes ? todo.notes.replace(/\n/g, '<br>') : '<em>Not eklenmemiş</em>';
        }
    }
    
    // Filtreleri güncelle
    function updateFilters() {
        filters = {
            priority: priorityFilter.value,
            category: categoryFilter.value,
            view: viewFilter.value
        };
        
        renderTodos();
    }
    
    // Kategori filtresini güncelle
    function updateCategoryFilter() {
        // Mevcut seçimi hatırla
        const currentSelection = categoryFilter.value;
        
        // Tüm kategorileri topla
        const categories = new Set();
        todos.forEach(todo => {
            if (todo.category) {
                categories.add(todo.category);
            }
        });
        
        // Kategori filtresini güncelle
        categoryFilter.innerHTML = '<option value="all">Tümü</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryFilter.appendChild(option);
        });
        
        // Önceki seçimi geri yükle
        if (categories.has(currentSelection) || currentSelection === 'all') {
            categoryFilter.value = currentSelection;
        }
    }
    
    // Kanban görünümünü render et
    function renderKanban() {
        // Kanban sütunlarını temizle
        kanbanTodo.innerHTML = '';
        kanbanInProgress.innerHTML = '';
        kanbanCompleted.innerHTML = '';
        
        // Filtrelenmiş görevleri al
        const filteredTodos = todos.filter(filterTodos);
        
        // Görevleri durumlarına göre sütunlara ekle
        filteredTodos.forEach(todo => {
            const kanbanItem = document.createElement('div');
            kanbanItem.classList.add('kanban-item');
            kanbanItem.draggable = true;
            kanbanItem.dataset.id = todo.id;
            
            // Tarih formatla
            const dateTime = new Date(todo.dateTime);
            const formattedDate = dateTime.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit'
            });
            
            kanbanItem.innerHTML = `
                <div class="kanban-item-header">
                    <span class="priority-marker priority-${todo.priority}"></span>
                    <span class="kanban-item-title">${todo.text}</span>
                </div>
                <div class="kanban-item-date">${formattedDate}</div>
                ${todo.notes ? '<div class="todo-notes-indicator">📝</div>' : ''}
            `;
            
            // İlgili sütuna ekle
            if (todo.status === 'todo') {
                kanbanTodo.appendChild(kanbanItem);
            } else if (todo.status === 'inprogress') {
                kanbanInProgress.appendChild(kanbanItem);
            } else {
                kanbanCompleted.appendChild(kanbanItem);
            }
        });
    }
    
    // Bildirim izni iste
    function requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }
    
    // Bildirim göster
    function showNotification(todoText) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Süre Doldu!', {
                body: `"${todoText}" görevin için süre doldu!`,
                icon: 'https://cdn-icons-png.flaticon.com/512/4470/4470882.png'
            });
        }
    }
    
    // Yapılacak öğeyi ilgili duruma göre güncelle
    function toggleTodoStatus(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                const newCompleted = !todo.completed;
                const newStatus = newCompleted ? 'completed' : 'todo';
                
                // Eğer görev tamamlandıysa puan ekle
                if (newCompleted && !todo.completed) {
                    addPoints(10);
                }
                
                return { ...todo, completed: newCompleted, status: newStatus };
            }
            return todo;
        });
        
        saveTodos();
        renderTodos();
        renderKanban();
        
        // Eğer görev tamamlandıysa, 3-4 saniye sonra sil
        const todo = todos.find(t => t.id === id);
        if (todo && todo.completed) {
            setTimeout(() => {
                todos = todos.filter(t => t.id !== id);
                saveTodos();
                renderTodos();
                renderKanban();
                updateCalendar();
            }, Math.random() * 1000 + 3000);
        }
    }
    
    // Yapılacakları yerel depolamaya kaydet
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    // Kalan zamanı hesapla
    function getRemainingTime(dateTime) {
        const targetDate = new Date(dateTime);
        const now = new Date();
        const difference = targetDate - now;
        
        // Eğer süre dolmuşsa
        if (difference <= 0) {
            return "Süre doldu!";
        }
        
        // Kalan zamanı hesapla
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        let result = "";
        if (days > 0) result += `${days} gün `;
        if (hours > 0) result += `${hours} saat `;
        if (minutes > 0) result += `${minutes} dakika `;
        if (seconds > 0) result += `${seconds} saniye`;
        
        return result.trim();
    }
    
    // Sürenin dolup dolmadığını kontrol et
    function isTimeExpired(dateTime) {
        const targetDate = new Date(dateTime);
        const now = new Date();
        return targetDate <= now;
    }
    
    // Filtre görevleri
    function filterTodos(todo) {
        // Öncelik filtresi
        if (filters.priority !== 'all' && todo.priority !== filters.priority) {
            return false;
        }
        
        // Kategori filtresi
        if (filters.category !== 'all' && todo.category !== filters.category) {
            return false;
        }
        
        // Görünüm filtresi
        if (filters.view === 'active' && todo.completed) {
            return false;
        } else if (filters.view === 'completed' && !todo.completed) {
            return false;
        } else if (filters.view === 'expired' && !isTimeExpired(todo.dateTime)) {
            return false;
        }
        
        return true;
    }
    
    // Kalan süreleri güncelle
    function updateRemainingTime() {
        const remainingTimeElements = document.querySelectorAll('.remaining-time');
        
        remainingTimeElements.forEach(element => {
            const todoItem = element.closest('.todo-item');
            const todoId = Number(todoItem.dataset.id);
            const todo = todos.find(t => t.id === todoId);
            
            if (todo && !todo.completed) {
                // Görevin şu anki süre dolma durumu
                const currentExpiredState = isTimeExpired(todo.dateTime);
                
                // Kalan zamanı güncelle
                element.textContent = getRemainingTime(todo.dateTime);
                
                // Süre dolmuşsa stili değiştir
                if (element.textContent === "Süre doldu!") {
                    element.classList.add('expired');
                    
                    // Eğer önceden süre dolmamış ama şimdi dolduysa bildirim göster
                    if (!todoExpiredStates[todoId] && currentExpiredState) {
                        showNotification(todo.text);
                    }
                    
                } else {
                    element.classList.remove('expired');
                }
                
                // Süre dolma durumunu güncelle
                todoExpiredStates[todoId] = currentExpiredState;
            }
            
            // Modal açıksa seçili görevin kalan süresini güncelle
            if (selectedTodoId && taskModal.style.display === 'block') {
                updateTaskModal(selectedTodoId);
            }
        });
    }
    
    // Yapılacakları ekrana render et
    function renderTodos() {
        todoList.innerHTML = '';
        
        // Önce filtreleme yap
        const filteredTodos = todos.filter(filterTodos);
        
        // Yapılacakları tarihe göre sırala (yakın tarihli önce)
        const sortedTodos = [...filteredTodos].sort((a, b) => {
            return new Date(a.dateTime) - new Date(b.dateTime);
        });
        
        if (sortedTodos.length === 0) {
            todoList.innerHTML = '<li class="no-todos">Gösterilecek görev bulunamadı.</li>';
            return;
        }
        
        sortedTodos.forEach(todo => {
            const li = document.createElement('li');
            li.classList.add('todo-item');
            if (todo.completed) {
                li.classList.add('completed');
            }
            li.dataset.id = todo.id;
            
            // İlk başta süre dolma durumunu ayarla
            if (todoExpiredStates[todo.id] === undefined) {
                todoExpiredStates[todo.id] = isTimeExpired(todo.dateTime);
            }
            
            // Tarih ve zamanı formatla
            const dateTime = new Date(todo.dateTime);
            const formattedDate = dateTime.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const formattedTime = dateTime.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Kalan zamanı hesapla
            const remainingTime = getRemainingTime(todo.dateTime);
            const isExpired = remainingTime === "Süre doldu!";
            
            // Durum gösterimi
            const statusLabels = {
                'todo': 'Yapılacak',
                'inprogress': 'Devam Ediyor',
                'completed': 'Tamamlandı'
            };
            
            // Kategori etiketi
            const categoryTag = todo.category 
                ? `<span class="category-tag category-${todo.category}">${todo.category}</span>` 
                : '';
            
            li.innerHTML = `
                <div class="checkbox ${todo.completed ? 'checked' : ''}"></div>
                <div class="todo-text">
                    <p>
                        <span class="priority-marker priority-${todo.priority}"></span>
                        ${todo.text}
                        ${categoryTag}
                        ${todo.notes ? '<span class="todo-notes-indicator">📝</span>' : ''}
                    </p>
                    <div class="todo-meta">
                        <span class="todo-time">${formattedDate} ${formattedTime}</span>
                        <span class="todo-status">${statusLabels[todo.status]}</span>
                    </div>
                    <div class="remaining-time ${isExpired ? 'expired' : ''}">${!todo.completed ? remainingTime : ''}</div>
                </div>
            `;
            
            todoList.appendChild(li);
        });
        
        // Kanban görünümünü de güncelle
        if (document.getElementById('kanban-view').classList.contains('active')) {
            renderKanban();
        }
    }
}); 