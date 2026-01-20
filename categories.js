// Firebase imports
import { db, currentUser } from './calendar.js';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Category state
let userCategories = [];

// Load user's categories
async function loadUserCategories() {
    try {
        const userRef = doc(db, 'users', currentUser);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            userCategories = data.eventCategories || [];
            
            // If no categories exist, create defaults
            if (userCategories.length === 0) {
                await createDefaultCategories();
            }
        } else {
            await createDefaultCategories();
        }
        
        return userCategories;
    } catch (error) {
        console.error('Error loading categories:', error);
        return [];
    }
}

// Create default categories for new users
async function createDefaultCategories() {
    const defaultCategories = [
        { 
            id: 'cat_holidays', 
            name: 'Official Holidays', 
            color: '#d50000', 
            isDefault: true, 
            isVisible: true,
            createdAt: new Date().toISOString()
        },
        { 
            id: 'cat_personal', 
            name: 'Personal', 
            color: '#1a73e8', 
            isDefault: false, 
            isVisible: true,
            createdAt: new Date().toISOString()
        },
        { 
            id: 'cat_work', 
            name: 'Work', 
            color: '#33b679', 
            isDefault: false, 
            isVisible: true,
            createdAt: new Date().toISOString()
        },
        { 
            id: 'cat_other', 
            name: 'Other', 
            color: '#616161', 
            isDefault: false, 
            isVisible: true,
            createdAt: new Date().toISOString()
        }
    ];
    
    try {
        const userRef = doc(db, 'users', currentUser);
        await setDoc(userRef, { 
            eventCategories: defaultCategories 
        }, { merge: true });
        
        userCategories = defaultCategories;
        return defaultCategories;
    } catch (error) {
        console.error('Error creating default categories:', error);
        return [];
    }
}

// Add new category
async function addCategory(name, color) {
    try {
        // Validate
        if (!name || name.trim().length === 0) {
            throw new Error('Category name is required');
        }
        
        // Check if red color (reserved for holidays)
        if (color.toLowerCase() === '#d50000' && !userCategories.some(c => c.id === 'cat_holidays')) {
            throw new Error('Red color is reserved for Official Holidays');
        }
        
        // Check for duplicate name
        if (userCategories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
            throw new Error('Category with this name already exists');
        }
        
        const newCategory = {
            id: 'cat_' + Date.now(),
            name: name.trim(),
            color: color,
            isDefault: false,
            isVisible: true,
            createdAt: new Date().toISOString()
        };
        
        const userRef = doc(db, 'users', currentUser);
        await updateDoc(userRef, {
            eventCategories: arrayUnion(newCategory)
        });
        
        userCategories.push(newCategory);
        return newCategory;
    } catch (error) {
        console.error('Error adding category:', error);
        throw error;
    }
}

// Update category
async function updateCategory(categoryId, updates) {
    try {
        const categoryIndex = userCategories.findIndex(c => c.id === categoryId);
        if (categoryIndex === -1) {
            throw new Error('Category not found');
        }
        
        const category = userCategories[categoryIndex];
        
        // Prevent changing color if it's the default holidays category
        if (category.isDefault && updates.color && updates.color !== category.color) {
            throw new Error('Cannot change color of Official Holidays category');
        }
        
        // Check red color restriction
        if (updates.color === '#d50000' && categoryId !== 'cat_holidays') {
            throw new Error('Red color is reserved for Official Holidays');
        }
        
        const updatedCategory = { ...category, ...updates };
        userCategories[categoryIndex] = updatedCategory;
        
        const userRef = doc(db, 'users', currentUser);
        await setDoc(userRef, {
            eventCategories: userCategories
        }, { merge: true });
        
        return updatedCategory;
    } catch (error) {
        console.error('Error updating category:', error);
        throw error;
    }
}

// Delete category
async function deleteCategory(categoryId) {
    try {
        const category = userCategories.find(c => c.id === categoryId);
        if (!category) {
            throw new Error('Category not found');
        }
        
        // Prevent deleting default holidays category
        if (category.isDefault) {
            throw new Error('Cannot delete Official Holidays category');
        }
        
        // Remove from array
        userCategories = userCategories.filter(c => c.id !== categoryId);
        
        const userRef = doc(db, 'users', currentUser);
        await setDoc(userRef, {
            eventCategories: userCategories
        }, { merge: true });
        
        return true;
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
}

// Toggle category visibility
async function toggleCategoryVisibility(categoryId) {
    try {
        const categoryIndex = userCategories.findIndex(c => c.id === categoryId);
        if (categoryIndex === -1) {
            throw new Error('Category not found');
        }
        
        userCategories[categoryIndex].isVisible = !userCategories[categoryIndex].isVisible;
        
        const userRef = doc(db, 'users', currentUser);
        await setDoc(userRef, {
            eventCategories: userCategories
        }, { merge: true });
        
        // Trigger calendar re-render
        window.dispatchEvent(new CustomEvent('categoriesUpdated'));
        
        return userCategories[categoryIndex];
    } catch (error) {
        console.error('Error toggling category visibility:', error);
        throw error;
    }
}

// Get category by ID
function getCategoryById(categoryId) {
    return userCategories.find(c => c.id === categoryId);
}

// Get all visible categories
function getVisibleCategories() {
    return userCategories.filter(c => c.isVisible);
}

// Get all categories
function getAllCategories() {
    return userCategories;
}

export {
    loadUserCategories,
    createDefaultCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryVisibility,
    getCategoryById,
    getVisibleCategories,
    getAllCategories,
    userCategories
};
