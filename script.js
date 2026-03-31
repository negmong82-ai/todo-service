import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBVh6JxIefxiT8oHeFA4Dfx3dfNKsCii3Y",
    authDomain: "negmong-todo-database.firebaseapp.com",
    projectId: "negmong-todo-database",
    storageBucket: "negmong-todo-database.firebasestorage.app",
    messagingSenderId: "932776857649",
    appId: "1:932776857649:web:8c4368c39657a1368ec510",
    databaseURL: "https://negmong-todo-database-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const todosRef = ref(db, 'todos');

// Initialize Lucide icons
lucide.createIcons();

let todos = [];
let currentSort = 'input';
let selectedAddColor = 'white';
let isAddImportant = false;
let hideCompleted = false;

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoDate = document.getElementById('todo-date');
const todoList = document.getElementById('todo-list');
const sortSelect = document.getElementById('sort-select');
const toggleCompletedBtn = document.getElementById('toggle-completed-btn');

// Listen to sort change
if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderTodos();
    });
}

// Toggle completed visibility
if (toggleCompletedBtn) {
    toggleCompletedBtn.addEventListener('click', () => {
        hideCompleted = !hideCompleted;
        const span = toggleCompletedBtn.querySelector('span');
        const icon = toggleCompletedBtn.querySelector('i');
        
        if (hideCompleted) {
            span.textContent = '진행 중';
            toggleCompletedBtn.classList.add('active');
            toggleCompletedBtn.title = '모든 일정 보기';
        } else {
            span.textContent = '완료 보임';
            toggleCompletedBtn.classList.remove('active');
            toggleCompletedBtn.title = '완료된 일정 숨기기';
        }
        renderTodos();
    });
}

// Add important toggle logic for new note
const addImportantBtn = document.getElementById('add-important-btn');
const addImportantIcon = document.getElementById('add-important-icon');
if (addImportantBtn) {
    addImportantBtn.addEventListener('click', () => {
        isAddImportant = !isAddImportant;
        if (isAddImportant) {
            addImportantBtn.classList.add('active');
            addImportantIcon.classList.add('filled-flag');
        } else {
            addImportantBtn.classList.remove('active');
            addImportantIcon.classList.remove('filled-flag');
        }
    });
}

// Add color picker logic
const addColorBtn = document.getElementById('add-color-btn');
const addColorDropdown = document.getElementById('add-color-dropdown');
const addColorOptions = document.querySelectorAll('#add-color-dropdown .color-option');

if (addColorBtn && addColorDropdown) {
    addColorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addColorDropdown.classList.toggle('active');
    });

    addColorOptions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const color = btn.dataset.color;
            selectedAddColor = color;
            
            // Update active state
            addColorOptions.forEach(opt => opt.classList.remove('active'));
            btn.classList.add('active');
            
            // Preview background
            todoForm.className = `todo-form color-${color}`;
            
            addColorDropdown.classList.remove('active');
        });
    });
    
    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!addColorDropdown.contains(e.target) && e.target !== addColorBtn) {
            addColorDropdown.classList.remove('active');
        }
    });
}

// Listen for real-time updates
onValue(todosRef, (snapshot) => {
    const data = snapshot.val();
    todos = [];
    if (data) {
        for (const key in data) {
            todos.push({ id: key, ...data[key] });
        }
        // Sort by ID to keep order stable
        todos.sort((a, b) => a.id.localeCompare(b.id));
    }
    renderTodos();
});

// Click the calendar icon to open date picker instantly
const dateWrapper = document.getElementById('date-wrapper');
if (dateWrapper) {
    dateWrapper.addEventListener('click', () => {
        try {
            todoDate.showPicker();
        } catch (e) {
            // Fallback for older browsers
            todoDate.focus();
            todoDate.click();
        }
    });
}

// Update calendar icon and text state visually
todoDate.addEventListener('change', () => {
    const dateWrapper = document.getElementById('date-wrapper');
    const dateDisplay = document.getElementById('selected-date-display');
    
    if (todoDate.value) {
        dateWrapper.classList.add('has-value');
        dateDisplay.textContent = todoDate.value;
        dateDisplay.classList.add('active');
    } else {
        dateWrapper.classList.remove('has-value');
        dateDisplay.textContent = '';
        dateDisplay.classList.remove('active');
    }
});

// Add new todo
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    const dueDate = todoDate.value;
    
    if (text) {
        const id = Date.now().toString();
        set(ref(db, 'todos/' + id), {
            text,
            dueDate: dueDate || null,
            completed: false,
            important: isAddImportant,
            color: selectedAddColor
        });
        todoInput.value = '';
        todoDate.value = '';
        
        // Reset Importance
        isAddImportant = false;
        if (addImportantBtn) {
            addImportantBtn.classList.remove('active');
            addImportantIcon.classList.remove('filled-flag');
        }
        
        // Reset Color Picker
        selectedAddColor = 'white';
        todoForm.className = 'todo-form color-white';
        const addColorOptions = document.querySelectorAll('#add-color-dropdown .color-option');
        if (addColorOptions.length) {
            addColorOptions.forEach(opt => opt.classList.remove('active'));
            document.querySelector('#add-color-dropdown .color-option[data-color="white"]').classList.add('active');
        }
        
        const dateWrapper = document.getElementById('date-wrapper');
        const dateDisplay = document.getElementById('selected-date-display');
        
        if (dateWrapper) dateWrapper.classList.remove('has-value');
        if (dateDisplay) {
            dateDisplay.textContent = '';
            dateDisplay.classList.remove('active');
        }
    }
});

// Delete todo
window.deleteTodo = (id) => {
    remove(ref(db, 'todos/' + id));
};

// Toggle completion
window.toggleTodo = (id) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        update(ref(db, 'todos/' + id), {
            completed: !todo.completed
        });
    }
};

// Toggle important
window.toggleImportant = (id) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        update(ref(db, 'todos/' + id), {
            important: !todo.important
        });
    }
};

// Start editing
window.startEdit = (id) => {
    const todoElement = document.getElementById(`todo-${id}`);
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    todoElement.classList.add('editing');

    todoElement.innerHTML = `
        <div class="edit-wrapper">
            <input type="text" class="edit-input" id="edit-input-${id}" value="${todo.text}">
            <button type="button" class="clear-input-btn" id="clear-input-${id}" title="지우기">
                <i data-lucide="x" width="16" height="16"></i>
            </button>
            <span id="edit-date-display-${id}" class="selected-date-display ${todo.dueDate ? 'active' : ''}">${todo.dueDate || ''}</span>
            <div class="date-btn-wrapper ${todo.dueDate ? 'has-value' : ''}" id="edit-date-wrapper-${id}">
                <input type="date" id="edit-date-${id}" value="${todo.dueDate || ''}">
                <i data-lucide="calendar" class="calendar-icon"></i>
            </div>
            <div class="color-picker-wrapper" id="edit-color-wrapper-${id}">
                <button type="button" class="action-btn color-palette-btn" title="색상 선택" id="edit-color-btn-${id}" style="border-radius: 10px; padding: 0.4rem; color: #bbb;">
                    <i data-lucide="palette" width="18" height="18"></i>
                </button>
                <div class="color-dropdown" id="edit-color-dropdown-${id}">
                    <button type="button" class="color-option white ${(!todo.color || todo.color === 'white') ? 'active' : ''}" data-color="white"></button>
                    <button type="button" class="color-option pink ${(todo.color === 'pink') ? 'active' : ''}" data-color="pink"></button>
                    <button type="button" class="color-option green ${(todo.color === 'green') ? 'active' : ''}" data-color="green"></button>
                    <button type="button" class="color-option blue ${(todo.color === 'blue') ? 'active' : ''}" data-color="blue"></button>
                </div>
            </div>
            <button class="edit-complete-btn" id="edit-complete-${id}">완료</button>
        </div>
    `;
    
    lucide.createIcons();

    const editInput = document.getElementById(`edit-input-${id}`);
    const clearBtn = document.getElementById(`clear-input-${id}`);
    const editDateNative = document.getElementById(`edit-date-${id}`);
    const editDateWrapper = document.getElementById(`edit-date-wrapper-${id}`);
    const editDateDisplay = document.getElementById(`edit-date-display-${id}`);
    const editCompleteBtn = document.getElementById(`edit-complete-${id}`);
    
    // Sync native date picker UI
    editDateNative.addEventListener('change', (e) => {
        const selected = e.target.value;
        if (selected) {
            editDateWrapper.classList.add('has-value');
            editDateDisplay.textContent = selected;
            editDateDisplay.classList.add('active');
        } else {
            editDateWrapper.classList.remove('has-value');
            editDateDisplay.textContent = '';
            editDateDisplay.classList.remove('active');
        }
        editInput.focus();
    });

    editDateWrapper.addEventListener('click', () => {
        try {
            editDateNative.showPicker();
        } catch (e) {
            editDateNative.focus();
            editDateNative.click();
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            editInput.value = '';
            editInput.focus();
        });
    }

    let currentEditColor = todo.color || 'white';
    const editColorBtn = document.getElementById(`edit-color-btn-${id}`);
    const editColorDropdown = document.getElementById(`edit-color-dropdown-${id}`);
    const editColorOptions = document.querySelectorAll(`#edit-color-dropdown-${id} .color-option`);

    if (editColorBtn) {
        editColorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editColorDropdown.classList.toggle('active');
        });

        editColorOptions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentEditColor = btn.dataset.color;
                
                editColorOptions.forEach(opt => opt.classList.remove('active'));
                btn.classList.add('active');
                
                todoElement.className = `todo-item editing color-${currentEditColor}`;
                editColorDropdown.classList.remove('active');
            });
        });

        const closeEditDropdown = (e) => {
            if (document.getElementById(`edit-color-dropdown-${id}`) && !editColorDropdown.contains(e.target) && e.target !== editColorBtn) {
                editColorDropdown.classList.remove('active');
            }
        };
        document.addEventListener('click', closeEditDropdown);
    }
    
    editInput.focus();
    editInput.setSelectionRange(todo.text.length, todo.text.length);

    let isFinished = false;
    const finishEdit = () => {
        if (isFinished) return;
        isFinished = true;

        const newText = editInput.value.trim();
        const newDate = editDateNative.value || '';
        const oldDate = todo.dueDate || '';

        if (!newText) {
            renderTodos();
            return;
        }

        const updates = {};
        if (newText !== todo.text) updates.text = newText;
        if (newDate !== oldDate) updates.dueDate = newDate || null;
        if (currentEditColor !== (todo.color || 'white')) updates.color = currentEditColor;

        if (Object.keys(updates).length > 0) {
            update(ref(db, 'todos/' + id), updates);
        } else {
             renderTodos();
        }
    };

    editCompleteBtn.addEventListener('click', finishEdit);

    const wrapper = todoElement.querySelector('.edit-wrapper');
    wrapper.addEventListener('focusout', (e) => {
        // Only finish edit if focus moves outside the wrapper completely
        // And if relatedTarget is not null (avoids saving if native datepicker triggers blur)
        if (e.relatedTarget && !wrapper.contains(e.relatedTarget)) {
            finishEdit();
        }
    });

    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') finishEdit();
    });
};

// Render todos
const renderTodos = () => {
    todoList.innerHTML = '';
    
    if (todos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox" width="48" height="48" style="opacity: 0.5; margin-bottom: 0.5rem;"></i>
                <p>아직 등록된 할 일이 없어요.</p>
                <p style="font-size: 0.85rem; margin-top: 4px;">새로운 할 일을 추가해 보세요!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    const sortedTodos = [...todos].sort((a, b) => {
        if (currentSort === 'input') {
            return Number(a.id) - Number(b.id);
        }
        if (currentSort === 'alpha') {
            return a.text.localeCompare(b.text, 'ko-KR');
        }
        if (currentSort === 'date') {
            const dateA = a.dueDate || '9999-99-99';
            const dateB = b.dueDate || '9999-99-99';
            if (dateA !== dateB) return dateA.localeCompare(dateB);
            return a.text.localeCompare(b.text, 'ko-KR');
        }
        if (currentSort === 'important') {
            const impA = a.important ? 1 : 0;
            const impB = b.important ? 1 : 0;
            if (impA !== impB) return impB - impA;
            return a.text.localeCompare(b.text, 'ko-KR');
        }
        if (currentSort === 'color') {
            const colorOrder = { 'blue': 0, 'green': 1, 'pink': 2, 'white': 3 };
            const orderA = colorOrder[a.color || 'white'];
            const orderB = colorOrder[b.color || 'white'];
            if (orderA !== orderB) return orderA - orderB;
            return a.text.localeCompare(b.text, 'ko-KR');
        }
        return 0;
    });

    const filteredTodos = hideCompleted ? sortedTodos.filter(t => !t.completed) : sortedTodos;

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item color-${todo.color || 'white'} ${todo.completed ? 'completed' : ''}`;
        li.id = `todo-${todo.id}`;
        
        const isOverdue = todo.dueDate && todo.dueDate < today && !todo.completed;
        
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo('${todo.id}')">
            <div class="todo-item-main">
                <div class="todo-title-row">
                    <button class="important-toggle-btn ${todo.important ? 'active' : ''}" onclick="toggleImportant('${todo.id}')" title="중요 표시">
                        <i data-lucide="flag" class="${todo.important ? 'filled-flag' : ''}" width="18" height="18"></i>
                    </button>
                    <span class="todo-text ${todo.important ? 'important-text' : ''}">${todo.text}</span>
                </div>
                ${todo.dueDate ? `
                    <div class="todo-date ${isOverdue ? 'overdue' : ''}">
                        <i data-lucide="calendar" width="12" height="12"></i>
                        <span>${todo.dueDate}</span>
                    </div>
                ` : ''}
            </div>
            <div class="todo-actions">
                <button class="action-btn edit-btn" onclick="startEdit('${todo.id}')" aria-label="할 일 수정">
                    <i data-lucide="pencil" width="16" height="16"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteTodo('${todo.id}')" aria-label="할 일 삭제">
                    <i data-lucide="trash-2" width="16" height="16"></i>
                </button>
            </div>
        `;
        
        todoList.appendChild(li);
    });
    
    lucide.createIcons();
};
