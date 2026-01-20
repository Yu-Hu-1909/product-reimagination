// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, query, onSnapshot, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
    events: []
};

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
    setupEventListeners();
    loadEvents();
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

    // Filter events for this date
    const dayEvents = calendarState.events.filter(event => {
        const eventDate = new Date(event.startDate.seconds * 1000);
        return eventDate.toDateString() === date.toDateString();
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
    return date.toISOString().split('T')[0];
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

export { currentUser, formatDate };
