// Firebase imports
import { db, currentUser, formatDate } from './calendar.js';
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAllCategories, getCategoryById } from './categories.js';

// Modal elements
const eventModal = document.getElementById('eventModal');
const eventForm = document.getElementById('eventForm');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const createEventBtn = document.getElementById('createEventBtn');
const deleteEventBtn = document.getElementById('deleteEventBtn');

// Form fields
const eventTitleInput = document.getElementById('eventTitle');
const eventDateInput = document.getElementById('eventDate');
const eventStartTimeInput = document.getElementById('eventStartTime');
const eventEndTimeInput = document.getElementById('eventEndTime');
const eventDescriptionInput = document.getElementById('eventDescription');
const eventCategorySelect = document.getElementById('eventCategory');

let currentEventId = null;

// Event listeners
createEventBtn.addEventListener('click', () => {
    openModal();
});

closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

eventModal.addEventListener('click', (e) => {
    if (e.target === eventModal) {
        closeModal();
    }
});

// Form submission
eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveEvent();
});

// Delete event
deleteEventBtn.addEventListener('click', async () => {
    if (currentEventId && confirm('Are you sure you want to delete this event?')) {
        await deleteEvent();
    }
});

// Listen for custom event from calendar.js
window.addEventListener('openEventModal', (e) => {
    const { dateStr, eventId } = e.detail;
    if (eventId) {
        openModal(null, eventId);
    } else if (dateStr) {
        openModal(dateStr);
    }
});

function loadCategoriesIntoDropdown() {
    const categories = getAllCategories();
    
    eventCategorySelect.innerHTML = categories.map(category => `
        <option value="${category.id}" style="color: ${category.color}">
            ${category.name}
        </option>
    `).join('');
}

function openModal(dateStr = null, eventId = null) {
    currentEventId = eventId;
    
    // Load categories into dropdown
    loadCategoriesIntoDropdown();
    
    if (eventId) {
        // Edit mode - load event data
        loadEventData(eventId);
        modalTitle.textContent = 'Edit Event';
        deleteEventBtn.style.display = 'block';
    } else {
        // Create mode
        eventForm.reset();
        modalTitle.textContent = 'Create Event';
        deleteEventBtn.style.display = 'none';
        
        // Set default category (first one, usually Personal)
        const categories = getAllCategories();
        if (categories.length > 0) {
            eventCategorySelect.value = categories[1]?.id || categories[0].id; // Default to Personal or first
        }
        
        // Set date if provided
        if (dateStr) {
            eventDateInput.value = dateStr;
        } else {
            eventDateInput.value = formatDate(new Date());
        }
        
        // Set default times
        const now = new Date();
        const startTime = new Date(now.getTime() + (60 - now.getMinutes()) * 60000); // Next hour
        const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later
        
        eventStartTimeInput.value = `${String(startTime.getHours()).padStart(2, '0')}:00`;
        eventEndTimeInput.value = `${String(endTime.getHours()).padStart(2, '0')}:00`;
    }
    
    eventModal.classList.add('active');
}

function closeModal() {
    eventModal.classList.remove('active');
    currentEventId = null;
    eventForm.reset();
}

async function loadEventData(eventId) {
    try {
        const eventRef = doc(db, 'users', currentUser, 'events', eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
            const data = eventDoc.data();
            
            eventTitleInput.value = data.title || '';
            eventDescriptionInput.value = data.description || '';
            
            // Convert Firestore timestamp to date string
            if (data.startDate) {
                const startDate = new Date(data.startDate.seconds * 1000);
                eventDateInput.value = formatDate(startDate);
            }
            
            eventStartTimeInput.value = data.startTime || '09:00';
            eventEndTimeInput.value = data.endTime || '10:00';
            
            // Set category if exists, otherwise default to first category
            if (data.categoryId) {
                eventCategorySelect.value = data.categoryId;
            } else {
                // Backward compatibility: event doesn't have category
                const categories = getAllCategories();
                eventCategorySelect.value = categories[0]?.id || '';
            }
        }
    } catch (error) {
        console.error('Error loading event:', error);
        alert('Error loading event data');
    }
}

async function saveEvent() {
    const title = eventTitleInput.value.trim();
    const date = eventDateInput.value;
    const startTime = eventStartTimeInput.value;
    const endTime = eventEndTimeInput.value;
    const description = eventDescriptionInput.value.trim();
    const categoryId = eventCategorySelect.value;
    
    if (!title || !date || !startTime || !endTime || !categoryId) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Validate times
    if (startTime >= endTime) {
        alert('End time must be after start time');
        return;
    }
    
    // Get category to get color
    const category = getCategoryById(categoryId);
    if (!category) {
        alert('Selected category not found');
        return;
    }
    
    // Create event object with category info
    const eventData = {
        title,
        description,
        startDate: Timestamp.fromDate(new Date(date)),
        endDate: Timestamp.fromDate(new Date(date)),
        startTime,
        endTime,
        categoryId: category.id,
        categoryName: category.name, // Denormalized for easy display
        color: category.color, // Denormalized for easy display
        updatedAt: serverTimestamp()
    };
    
    try {
        if (currentEventId) {
            // Update existing event
            const eventRef = doc(db, 'users', currentUser, 'events', currentEventId);
            await updateDoc(eventRef, eventData);
        } else {
            // Create new event
            eventData.createdAt = serverTimestamp();
            
            // Ensure the events collection exists by adding the document
            // Firebase will automatically create the collection and parent documents if they don't exist
            const eventsRef = collection(db, 'users', currentUser, 'events');
            await addDoc(eventsRef, eventData);
        }
        
        closeModal();
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Error saving event. Please try again.');
        
        // If the error is related to missing parent documents, try to create them
        if (error.code === 'not-found' || error.message.includes('not found')) {
            try {
                // The user document should exist (created during signup)
                // But if it doesn't, we'll create it here
                const userRef = doc(db, 'users', currentUser);
                const userDoc = await getDoc(userRef);
                
                if (!userDoc.exists()) {
                    // This shouldn't happen, but handle it anyway
                    console.warn('User document not found, creating it');
                    await setDoc(userRef, {
                        username: currentUser,
                        createdAt: serverTimestamp()
                    });
                }
                
                // Try saving the event again
                eventData.createdAt = serverTimestamp();
                const eventsRef = collection(db, 'users', currentUser, 'events');
                await addDoc(eventsRef, eventData);
                closeModal();
            } catch (retryError) {
                console.error('Error on retry:', retryError);
                alert('Failed to save event. Please refresh and try again.');
            }
        }
    }
}

async function deleteEvent() {
    if (!currentEventId) return;
    
    try {
        const eventRef = doc(db, 'users', currentUser, 'events', currentEventId);
        await deleteDoc(eventRef);
        closeModal();
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event. Please try again.');
    }
}

export { openModal };
