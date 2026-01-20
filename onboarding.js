// Firebase imports
import { db, currentUser } from './calendar.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Check if user has completed onboarding
async function checkOnboarding() {
    try {
        const userRef = doc(db, 'users', currentUser);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            // Check if preferences exist
            if (!data.onboardingCompleted) {
                showOnboardingModal();
            }
        }
    } catch (error) {
        console.error('Error checking onboarding:', error);
    }
}

// Show onboarding modal
function showOnboardingModal() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Close onboarding modal
function closeOnboardingModal() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Save user preferences
async function savePreferences(preferences) {
    try {
        const userRef = doc(db, 'users', currentUser);
        await setDoc(userRef, {
            preferences: preferences,
            onboardingCompleted: true,
            onboardingCompletedAt: serverTimestamp()
        }, { merge: true });
        
        console.log('Preferences saved successfully');
        closeOnboardingModal();
    } catch (error) {
        console.error('Error saving preferences:', error);
        alert('Error saving preferences. Please try again.');
    }
}

// Skip onboarding
async function skipOnboarding() {
    try {
        const userRef = doc(db, 'users', currentUser);
        await setDoc(userRef, {
            onboardingCompleted: true,
            onboardingSkipped: true,
            onboardingCompletedAt: serverTimestamp()
        }, { merge: true });
        
        console.log('Onboarding skipped');
        closeOnboardingModal();
    } catch (error) {
        console.error('Error skipping onboarding:', error);
    }
}

// Initialize onboarding
document.addEventListener('DOMContentLoaded', () => {
    // Setup event listeners
    const skipBtn = document.getElementById('skipOnboardingBtn');
    const saveBtn = document.getElementById('savePreferencesBtn');
    
    if (skipBtn) {
        skipBtn.addEventListener('click', skipOnboarding);
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSavePreferences);
    }
});

function handleSavePreferences() {
    // Get selected values
    const productiveHours = Array.from(document.querySelectorAll('input[name="productiveHours"]:checked'))
        .map(cb => cb.value);
    
    const unproductiveHours = Array.from(document.querySelectorAll('input[name="unproductiveHours"]:checked'))
        .map(cb => cb.value);
    
    const sessionLength = document.querySelector('input[name="sessionLength"]:checked')?.value || '120';
    const breakLength = document.querySelector('input[name="breakLength"]:checked')?.value || '15';
    
    const preferences = {
        productiveHours,
        unproductiveHours,
        sessionLength: parseInt(sessionLength),
        breakLength: parseInt(breakLength)
    };
    
    savePreferences(preferences);
}

// Export only at the end
export { checkOnboarding };
