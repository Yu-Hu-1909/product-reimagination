// Firebase and Calendar imports
import { db, currentUser, formatDate } from './calendar.js';
import { doc, getDoc, collection, addDoc, serverTimestamp, Timestamp, query, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAllCategories } from './categories.js';

// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyBWe1GWNmvoeFc0_-GntBQiMNMypMhQQ3A';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';


// Task storage
let tasks = [];
let currentEditTaskId = null;

// Modal elements
const aiPlannerModal = document.getElementById('aiPlannerModal');
const addTaskModal = document.getElementById('addTaskModal');
const aiPlanBtn = document.getElementById('aiPlanBtn');
const closeAiPlannerBtn = document.getElementById('closeAiPlannerBtn');
const closeAddTaskBtn = document.getElementById('closeAddTaskBtn');
const addTaskBtn = document.getElementById('addTaskBtn');
const generateScheduleBtn = document.getElementById('generateScheduleBtn');
const cancelAiPlanBtn = document.getElementById('cancelAiPlanBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const addTaskForm = document.getElementById('addTaskForm');

// Form elements
const planStartDate = document.getElementById('planStartDate');
const planEndDate = document.getElementById('planEndDate');
const taskNameInput = document.getElementById('taskName');
const taskDurationInput = document.getElementById('taskDuration');
const taskDeadlineInput = document.getElementById('taskDeadline');
const taskCategorySelect = document.getElementById('taskCategory');
const preferredTimeGroup = document.getElementById('preferredTimeGroup');
const preferredTimeInput = document.getElementById('preferredTime');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setDefaultDates();
});

function setupEventListeners() {
    // Open AI Planner
    if (aiPlanBtn) {
        aiPlanBtn.addEventListener('click', openAiPlanner);
    }
    
    // Close modals
    if (closeAiPlannerBtn) {
        closeAiPlannerBtn.addEventListener('click', closeAiPlanner);
    }
    
    if (closeAddTaskBtn) {
        closeAddTaskBtn.addEventListener('click', closeAddTask);
    }
    
    if (cancelAiPlanBtn) {
        cancelAiPlanBtn.addEventListener('click', closeAiPlanner);
    }
    
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', closeAddTask);
    }
    
    // Add task
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', openAddTask);
    }
    
    // Generate schedule
    if (generateScheduleBtn) {
        generateScheduleBtn.addEventListener('click', generateSchedule);
    }
    
    // Form submission
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', handleAddTask);
    }
    
    // Flexibility radio buttons - show/hide preferred time
    const flexibilityRadios = document.querySelectorAll('input[name="flexibility"]');
    flexibilityRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'fixed') {
                preferredTimeGroup.style.display = 'block';
            } else {
                preferredTimeGroup.style.display = 'none';
            }
        });
    });
    
    // Task type radio buttons - update deadline label
    const taskTypeRadios = document.querySelectorAll('input[name="taskType"]');
    taskTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const deadlineLabel = document.querySelector('label[for="taskDeadline"]');
            const taskDeadlineInput = document.getElementById('taskDeadline');
            
            if (e.target.value === 'deadline') {
                deadlineLabel.textContent = 'Deadline *';
                taskDeadlineInput.required = true;
            } else if (e.target.value === 'oneday') {
                deadlineLabel.textContent = 'Date *';
                taskDeadlineInput.required = true;
            } else { // daily
                deadlineLabel.textContent = 'Last Date (optional)';
                taskDeadlineInput.required = false;
            }
        });
    });
    
    // Modal backdrop clicks
    if (aiPlannerModal) {
        aiPlannerModal.addEventListener('click', (e) => {
            if (e.target === aiPlannerModal) {
                closeAiPlanner();
            }
        });
    }
    
    if (addTaskModal) {
        addTaskModal.addEventListener('click', (e) => {
            if (e.target === addTaskModal) {
                closeAddTask();
            }
        });
    }
}

function setDefaultDates() {
    const today = new Date();
    const weekLater = new Date();
    weekLater.setDate(today.getDate() + 7);
    
    if (planStartDate) {
        planStartDate.value = formatDate(today);
    }
    if (planEndDate) {
        planEndDate.value = formatDate(weekLater);
    }
}

function openAiPlanner() {
    tasks = []; // Reset tasks
    renderTasksList();
    if (aiPlannerModal) {
        aiPlannerModal.classList.add('active');
    }
}

function closeAiPlanner() {
    if (aiPlannerModal) {
        aiPlannerModal.classList.remove('active');
    }
    tasks = [];
}

function openAddTask() {
    loadCategoriesIntoTaskForm();
    if (addTaskModal) {
        addTaskModal.classList.add('active');
    }
}

function closeAddTask() {
    if (addTaskModal) {
        addTaskModal.classList.remove('active');
    }
    if (addTaskForm) {
        addTaskForm.reset();
    }
    preferredTimeGroup.style.display = 'none';
    currentEditTaskId = null;
}

function loadCategoriesIntoTaskForm() {
    const categories = getAllCategories();
    taskCategorySelect.innerHTML = categories.map(cat => `
        <option value="${cat.id}">${cat.name}</option>
    `).join('');
}

function handleAddTask(e) {
    e.preventDefault();
    
    const taskType = document.querySelector('input[name="taskType"]:checked').value;
    const flexibility = document.querySelector('input[name="flexibility"]:checked').value;
    const category = getAllCategories().find(c => c.id === taskCategorySelect.value);
    
    const task = {
        id: Date.now().toString(),
        name: taskNameInput.value.trim(),
        duration: parseFloat(taskDurationInput.value),
        deadline: taskDeadlineInput.value,
        taskType: taskType,
        flexibility: flexibility,
        preferredTime: flexibility === 'fixed' ? preferredTimeInput.value : null,
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color
    };
    
    tasks.push(task);
    renderTasksList();
    closeAddTask();
}

function renderTasksList() {
    const tasksContainer = document.getElementById('tasksListPlanner');
    
    if (tasks.length === 0) {
        tasksContainer.innerHTML = '<p class="empty-tasks">No tasks added yet. Click "Add Task" to begin.</p>';
        return;
    }
    
    tasksContainer.innerHTML = tasks.map(task => `
        <div class="task-card" data-task-id="${task.id}">
            <div class="task-info">
                <div class="task-title">${task.name}</div>
                <div class="task-meta">
                    <span>⏱️ ${task.duration}h</span>
                    <span>📅 ${new Date(task.deadline).toLocaleDateString()}</span>
                    <span>${task.taskType === 'deadline' ? '⚡ Deadline' : task.taskType === 'daily' ? '🔄 Daily' : '📌 One Day'}</span>
                    <span style="color: ${task.categoryColor}">● ${task.categoryName}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn delete" onclick="window.deleteTask('${task.id}')">
                    <svg viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Delete task (global function for onclick)
window.deleteTask = function(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    renderTasksList();
};

// Generate schedule with Gemini
async function generateSchedule() {
    if (tasks.length === 0) {
        alert('Please add at least one task to generate a schedule.');
        return;
    }
    
    const startDate = planStartDate.value;
    const endDate = planEndDate.value;
    
    if (!startDate || !endDate) {
        alert('Please select start and end dates.');
        return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
        alert('End date must be after start date.');
        return;
    }
    
    // Show loading
    generateScheduleBtn.disabled = true;
    generateScheduleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" style="animation: spin 1s linear infinite">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
        Generating...
    `;
    
    try {
        // Get user preferences
        const userPrefs = await getUserPreferences();
        
        // Get existing events
        const existingEvents = await getExistingEvents(startDate, endDate);
        
        // Build Gemini prompt
        const prompt = buildGeminiPrompt(tasks, startDate, endDate, userPrefs, existingEvents);
        
        // Call Gemini API
        const scheduledEvents = await callGeminiAPI(prompt);
        
        // Create events in calendar
        await createEventsInCalendar(scheduledEvents);
        
        alert(`Success! Generated ${scheduledEvents.length} events in your calendar.`);
        closeAiPlanner();
        
    } catch (error) {
        console.error('Error generating schedule:', error);
        alert('Error generating schedule: ' + error.message);
    } finally {
        generateScheduleBtn.disabled = false;
        generateScheduleBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
            </svg>
            Generate Schedule
        `;
    }
}

async function getUserPreferences() {
    try {
        const userRef = doc(db, 'users', currentUser);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().preferences) {
            return userDoc.data().preferences;
        }
        return null;
    } catch (error) {
        console.error('Error getting preferences:', error);
        return null;
    }
}

async function getExistingEvents(startDate, endDate) {
    try {
        const eventsRef = collection(db, 'users', currentUser, 'events');
        const eventsQuery = query(eventsRef);
        const snapshot = await getDocs(eventsQuery);
        
        const events = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const eventDateMs = data.startDate.seconds * 1000;
            const eventDate = new Date(eventDateMs);
            const eventDateStr = formatDate(eventDate);
            
            if (eventDateStr >= startDate && eventDateStr <= endDate) {
                events.push({
                    title: data.title,
                    date: eventDateStr,
                    startTime: data.startTime,
                    endTime: data.endTime
                });
            }
        });
        
        return events;
    } catch (error) {
        console.error('Error getting existing events:', error);
        return [];
    }
}

function buildGeminiPrompt(tasks, startDate, endDate, userPrefs, existingEvents) {
    const hasPreferences = userPrefs && userPrefs.productiveHours && userPrefs.productiveHours.length > 0;
    
    let prompt = `You are an intelligent calendar assistant. Schedule the following tasks optimally.\n\n`;
    
    if (hasPreferences) {
        prompt += `User Productivity Profile:\n`;
        prompt += `- Most productive: ${userPrefs.productiveHours.join(', ')}\n`;
        prompt += `- Avoid scheduling during: ${userPrefs.unproductiveHours.join(', ')}\n`;
        prompt += `- Preferred session length: ${userPrefs.sessionLength} minutes\n`;
        prompt += `- Break length: ${userPrefs.breakLength} minutes\n\n`;
    }
    
    prompt += `Planning Period: ${startDate} to ${endDate}\n\n`;
    
    if (existingEvents.length > 0) {
        prompt += `Existing Events (avoid conflicts):\n`;
        existingEvents.forEach(event => {
            prompt += `- ${event.date} ${event.startTime}-${event.endTime}: ${event.title}\n`;
        });
        prompt += `\n`;
    }
    
    prompt += `Tasks to Schedule:\n`;
    tasks.forEach((task, idx) => {
        prompt += `${idx + 1}. "${task.name}" - ${task.duration} hours, deadline: ${task.deadline}\n`;
        prompt += `   Type: ${task.taskType}, Flexibility: ${task.flexibility}`;
        if (task.preferredTime) {
            prompt += `, Preferred time: ${task.preferredTime}`;
        }
        prompt += `\n`;
    });
    
    prompt += `\n`;
    
    if (hasPreferences) {
        prompt += `RULES:\n`;
        prompt += `1. Prioritize tasks with closer deadlines\n`;
        prompt += `2. Schedule during productive hours when possible\n`;
        prompt += `3. Split long tasks (>3h) into ${userPrefs.sessionLength / 60}h sessions with ${userPrefs.breakLength}min breaks\n`;
        prompt += `4. For "daily" tasks, schedule same time each day\n`;
        prompt += `5. For "oneday" tasks, only schedule on deadline date\n`;
        prompt += `6. For "fixed" tasks, use preferred time or suggest alternative\n`;
        prompt += `7. Keep titles concise (max 30 chars)\n`;
        prompt += `8. Keep descriptions brief (max 50 chars)\n`;
        prompt += `9. If deadline is far, distribute work evenly\n`;
        prompt += `10. If deadline is near, schedule more intensively\n\n`;
    } else {
        prompt += `RULES (No preferences provided):\n`;
        prompt += `1. Prioritize tasks with closer deadlines\n`;
        prompt += `2. Split long tasks (>3h) into 2h sessions with breaks\n`;
        prompt += `3. For "daily" tasks, schedule same time each day\n`;
        prompt += `4. For "oneday" tasks, only schedule on deadline date\n`;
        prompt += `5. For "fixed" tasks, use preferred time\n`;
        prompt += `6. Keep titles concise (max 30 chars)\n`;
        prompt += `7. Keep descriptions brief (max 50 chars)\n`;
        prompt += `8. Distribute work evenly across available days\n\n`;
    }
    
    prompt += `Output ONLY a valid JSON array with this structure:\n`;
    prompt += `[\n`;
    prompt += `  {\n`;
    prompt += `    "title": "Task name - Part 1",\n`;
    prompt += `    "description": "Brief description",\n`;
    prompt += `    "date": "2026-01-21",\n`;
    prompt += `    "startTime": "09:00",\n`;
    prompt += `    "endTime": "11:00",\n`;
    prompt += `    "taskId": "task_id_from_input"\n`;
    prompt += `  }\n`;
    prompt += `]\n\n`;
    prompt += `Return ONLY the JSON array, no other text.`;
    
    return prompt;
}

async function callGeminiAPI(prompt) {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
            }
        })
    });
    
    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('Could not parse Gemini response as JSON');
    }
    
    const events = JSON.parse(jsonMatch[0]);
    
    // Add category info to events
    return events.map(event => {
        const task = tasks.find(t => t.id === event.taskId || t.name.includes(event.title.split('-')[0].trim()));
        return {
            ...event,
            categoryId: task ? task.categoryId : tasks[0].categoryId,
            categoryName: task ? task.categoryName : tasks[0].categoryName,
            color: task ? task.categoryColor : tasks[0].categoryColor
        };
    });
}

async function createEventsInCalendar(events) {
    const eventsRef = collection(db, 'users', currentUser, 'events');
    
    for (const event of events) {
        const eventData = {
            title: event.title,
            description: event.description || '',
            startDate: Timestamp.fromDate(new Date(event.date)),
            endDate: Timestamp.fromDate(new Date(event.date)),
            startTime: event.startTime,
            endTime: event.endTime,
            categoryId: event.categoryId,
            categoryName: event.categoryName,
            color: event.color,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            aiGenerated: true
        };
        
        await addDoc(eventsRef, eventData);
    }
}

// Add CSS for spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

export { openAiPlanner };
