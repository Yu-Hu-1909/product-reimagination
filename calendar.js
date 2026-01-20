// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, query, onSnapshot, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { loadUserCategories, getAllCategories, toggleCategoryVisibility } from './categories.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAzA7i-R2zPq9xALS0IUiBmHmczBnYvYOg",
    authDomain: "product-reimagination.firebaseapp.com",
    projectId: "product-reimagination",
    storageBucket: "product-reimagination.firebasestorage.app",
    messagingSenderId: "666130106007",
    appId: "1:666130106007:web:2f196559a9b2048c8ecbd2",
    measurementId: "G-HKCGTGCFET"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Check authentication
const currentUser = localStorage.getItem('calendarUser');
if (!currentUser) {
    window.location.href = 'login.html';
} else {
    // Verify user exists in database - create user document if it doesn't exist
    const userRef = doc(db, 'users', currentUser);
    getDoc(userRef).then(docSnap => {
        if (!docSnap.exists()) {
            // User document doesn't exist, redirect to login
            console.warn('User document not found, redirecting to login');
            localStorage.removeItem('calendarUser');
            window.location.href = 'login.html';
        }
    }).catch(error => {
        console.error('Error checking user:', error);
    });
}

// Calendar state
export const calendarState = {
    currentDate: new Date(),
    currentView: 'month', // month, week, or day
    selectedDate: new Date(),
    events: [],
    categories: [] // Add categories to state
};

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load categories first
    calendarState.categories = await loadUserCategories();
    renderCategoriesSidebar();
    
    initCalendar();
    setupEventListeners();
    loadEvents();
    
    // Check if user needs onboarding
    const { checkOnboarding } = await import('./onboarding.js');
    await checkOnboarding();
});

function initCalendar() {
    // Display username
    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay) {
        usernameDisplay.textContent = currentUser;
    }

    // Render calendar
    renderCalendar();
    renderMiniCalendar();
    updateMonthDisplay();
}

function setupEventListeners() {
    // Navigation buttons
    document.getElementById('todayBtn').addEventListener('click', () => {
        calendarState.currentDate = new Date();
        calendarState.selectedDate = new Date();
        renderCalendar();
        renderMiniCalendar();
        updateMonthDisplay();
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
        navigateMonth(-1);
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        navigateMonth(1);
    });

    // Mini calendar navigation
    document.getElementById('miniPrevBtn').addEventListener('click', () => {
        navigateMonth(-1);
    });

    document.getElementById('miniNextBtn').addEventListener('click', () => {
        navigateMonth(1);
    });

    // View selector
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            calendarState.currentView = e.target.dataset.view;
            renderCalendar();
        });
    });

    // User menu
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('calendarUser');
        window.location.href = 'login.html';
    });
}

function navigateMonth(direction) {
    calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() + direction);
    renderCalendar();
    renderMiniCalendar();
    updateMonthDisplay();
}

function updateMonthDisplay() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const month = monthNames[calendarState.currentDate.getMonth()];
    const shortMonth = shortMonthNames[calendarState.currentDate.getMonth()];
    const year = calendarState.currentDate.getFullYear();
    
    document.getElementById('currentMonth').textContent = `${month} ${year}`;
    document.getElementById('miniMonth').textContent = `${shortMonth} ${year}`;
}

function renderCalendar() {
    const calendarHeader = document.getElementById('calendarHeader');
    const calendarGrid = document.getElementById('calendarGrid');

    // Render day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    calendarHeader.innerHTML = dayNames.map(day => 
        `<div class="day-header">${day}</div>`
    ).join('');

    // Get first day of month
    const year = calendarState.currentDate.getFullYear();
    const month = calendarState.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = prevLastDay.getDate();

    let cells = [];

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        cells.push(createCalendarCell(day, month - 1, year, true));
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(createCalendarCell(day, month, year, false));
    }

    // Next month days to fill the grid
    const remainingCells = 42 - cells.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingCells; day++) {
        cells.push(createCalendarCell(day, month + 1, year, true));
    }

    calendarGrid.innerHTML = cells.join('');

    // Add click listeners to cells
    document.querySelectorAll('.calendar-cell').forEach(cell => {
        cell.addEventListener('click', (e) => {
            if (!e.target.classList.contains('event-badge')) {
                const dateStr = cell.dataset.date;
                openEventModal(dateStr);
            }
        });
    });
}

function createCalendarCell(day, month, year, isOtherMonth) {
    const date = new Date(year, month, day);
    const dateStr = formatDate(date);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    // Get visible categories
    const visibleCategories = calendarState.categories.filter(c => c.isVisible);
    const visibleCategoryIds = visibleCategories.map(c => c.id);

    // Filter events for this date AND check if category is visible
    const dayEvents = calendarState.events.filter(event => {
        const eventDate = new Date(event.startDate.seconds * 1000);
        const isSameDay = eventDate.toDateString() === date.toDateString();
        
        // Check if event's category is visible (or show if no category)
        const isVisible = event.categoryId ? 
            visibleCategoryIds.includes(event.categoryId) : 
            true; // Show events without category for backward compatibility
        
        return isSameDay && isVisible;
    });

    const eventBadges = dayEvents.slice(0, 3).map(event => 
        `<div class="event-badge" style="background: ${event.color}" data-event-id="${event.id}">
            ${event.title}
        </div>`
    ).join('');

    const moreEvents = dayEvents.length > 3 ? 
        `<div class="event-badge" style="background: #70757a">+${dayEvents.length - 3} more</div>` : '';

    return `
        <div class="calendar-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" 
             data-date="${dateStr}">
            <div class="day-number">${day}</div>
            <div class="events-container">
                ${eventBadges}
                ${moreEvents}
            </div>
        </div>
    `;
}

function renderMiniCalendar() {
    const miniCalendarGrid = document.getElementById('miniCalendarGrid');
    
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    let html = dayNames.map(day => `<div class="mini-day-header">${day}</div>`).join('');

    const year = calendarState.currentDate.getFullYear();
    const month = calendarState.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = prevLastDay.getDate();

    const today = new Date();

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        html += `<div class="mini-day other-month">${day}</div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = date.toDateString() === calendarState.selectedDate.toDateString();
        
        html += `<div class="mini-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}">${day}</div>`;
    }

    // Next month days
    const totalCells = firstDayOfWeek + daysInMonth;
    const remainingCells = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
    
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="mini-day other-month">${day}</div>`;
    }

    miniCalendarGrid.innerHTML = html;
}

function loadEvents() {
    // Listen for real-time updates from Firestore
    const eventsRef = collection(db, 'users', currentUser, 'events');
    const q = query(eventsRef);

    onSnapshot(q, (snapshot) => {
        calendarState.events = [];
        snapshot.forEach((doc) => {
            calendarState.events.push({
                id: doc.id,
                ...doc.data()
            });
        });
        renderCalendar(); // Re-render calendar with new events
    }, (error) => {
        console.error('Error loading events:', error);
        // If error occurs, it might be because the events collection doesn't exist yet
        // This is fine - it will be created when the first event is added
    });
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function openEventModal(dateStr, eventId = null) {
    // This function is called from events.js
    const event = new CustomEvent('openEventModal', { detail: { dateStr, eventId } });
    window.dispatchEvent(event);
}

// Listen for event badge clicks
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('event-badge') && e.target.dataset.eventId) {
        e.stopPropagation();
        openEventModal(null, e.target.dataset.eventId);
    }
});

// Render categories in sidebar
function renderCategoriesSidebar() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;
    
    const categories = getAllCategories();
    
    categoriesList.innerHTML = categories.map(category => `
        <div class="calendar-item">
            <input type="checkbox" id="cat_${category.id}" ${category.isVisible ? 'checked' : ''} data-category-id="${category.id}">
            <label for="cat_${category.id}">
                <span class="color-dot" style="background: ${category.color};"></span>
                ${category.name}
            </label>
        </div>
    `).join('');
    
    // Add event listeners to checkboxes
    categories.forEach(category => {
        const checkbox = document.getElementById(`cat_${category.id}`);
        if (checkbox) {
            checkbox.addEventListener('change', async (e) => {
                await toggleCategoryVisibility(category.id);
                renderCalendar(); // Re-render calendar to show/hide events
            });
        }
    });
}

// Settings modal handlers
const settingsBtn = document.getElementById('settingsBtn');
const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');

if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        openSettingsModal();
    });
}

if (manageCategoriesBtn) {
    manageCategoriesBtn.addEventListener('click', () => {
        openSettingsModal();
    });
}

if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
        closeSettingsModal();
    });
}

if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });
}

function openSettingsModal() {
    if (settingsModal) {
        settingsModal.classList.add('active');
        loadCategoriesInSettings();
    }
}

function closeSettingsModal() {
    if (settingsModal) {
        settingsModal.classList.remove('active');
    }
}

function loadCategoriesInSettings() {
    const categoriesListSettings = document.getElementById('categoriesListSettings');
    if (!categoriesListSettings) return;
    
    const categories = getAllCategories();
    
    categoriesListSettings.innerHTML = categories.map(category => `
        <div class="category-item-settings">
            <div class="category-info">
                <div class="category-color-preview" style="background: ${category.color};"></div>
                <span class="category-name">${category.name}</span>
                ${category.isDefault ? '<span class="category-default-badge">Default</span>' : ''}
            </div>
            <div class="category-actions">
                ${!category.isDefault ? `
                    <button class="category-action-btn delete-btn" data-category-id="${category.id}" title="Delete">
                        <svg viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    // Add delete handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const categoryId = e.currentTarget.dataset.categoryId;
            await handleDeleteCategory(categoryId);
        });
    });
}

// Add category form handlers
const addCategoryBtn = document.getElementById('addCategoryBtn');
const addCategoryForm = document.getElementById('addCategoryForm');
const cancelAddCategory = document.getElementById('cancelAddCategory');
const saveNewCategory = document.getElementById('saveNewCategory');

if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => {
        addCategoryForm.style.display = 'block';
        addCategoryBtn.style.display = 'none';
    });
}

if (cancelAddCategory) {
    cancelAddCategory.addEventListener('click', () => {
        addCategoryForm.style.display = 'none';
        addCategoryBtn.style.display = 'flex';
        document.getElementById('newCategoryName').value = '';
        document.getElementById('newCategoryColor').value = '#1a73e8';
    });
}

if (saveNewCategory) {
    saveNewCategory.addEventListener('click', async () => {
        await handleAddCategory();
    });
}

async function handleAddCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const colorInput = document.getElementById('newCategoryColor');
    
    const name = nameInput.value.trim();
    const color = colorInput.value;
    
    if (!name) {
        alert('Please enter a category name');
        return;
    }
    
    try {
        const { addCategory } = await import('./categories.js');
        await addCategory(name, color);
        
        // Refresh categories
        calendarState.categories = await loadUserCategories();
        
        // Update UI
        loadCategoriesInSettings();
        renderCategoriesSidebar();
        
        // Reset form
        nameInput.value = '';
        colorInput.value = '#1a73e8';
        addCategoryForm.style.display = 'none';
        addCategoryBtn.style.display = 'flex';
        
        alert('Category added successfully!');
    } catch (error) {
        alert(error.message || 'Error adding category');
    }
}

async function handleDeleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? Events using this category will still be visible.')) {
        return;
    }
    
    try {
        const { deleteCategory } = await import('./categories.js');
        await deleteCategory(categoryId);
        
        // Refresh categories
        calendarState.categories = await loadUserCategories();
        
        // Update UI
        loadCategoriesInSettings();
        renderCategoriesSidebar();
        
        alert('Category deleted successfully!');
    } catch (error) {
        alert(error.message || 'Error deleting category');
    }
}

// Listen for categories updated event
window.addEventListener('categoriesUpdated', () => {
    renderCategoriesSidebar();
    renderCalendar();
});

export { currentUser, formatDate, renderCategoriesSidebar };
