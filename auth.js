// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzA7i-R2zPq9xALS0IUiBmHmczBnYvYOg",
  authDomain: "product-reimagination.firebaseapp.com",
  projectId: "product-reimagination",
  storageBucket: "product-reimagination.firebasestorage.app",
  messagingSenderId: "666130106007",
  appId: "1:666130106007:web:2f196559a9b2048c8ecbd2",
  measurementId: "G-HKCGTGCFET",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Check if user is already logged in
const currentUser = localStorage.getItem("calendarUser");
if (currentUser && window.location.pathname.includes("login.html")) {
  window.location.href = "index.html";
}

// DOM Elements
const authForm = document.getElementById("authForm");
const usernameInput = document.getElementById("username");
const submitBtn = document.getElementById("submitBtn");
const formTitle = document.getElementById("formTitle");
const toggleLink = document.getElementById("toggleLink");
const toggleQuestion = document.getElementById("toggleQuestion");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

let isLoginMode = true;

// Toggle between login and signup
toggleLink.addEventListener("click", () => {
  isLoginMode = !isLoginMode;

  if (isLoginMode) {
    formTitle.textContent = "Sign In to Calendar";
    submitBtn.textContent = "Sign In";
    toggleQuestion.textContent = "Don't have an account?";
    toggleLink.textContent = "Sign Up";
  } else {
    formTitle.textContent = "Create Account";
    submitBtn.textContent = "Sign Up";
    toggleQuestion.textContent = "Already have an account?";
    toggleLink.textContent = "Sign In";
  }

  hideMessages();
});

// Form submission
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();

  if (!username) {
    showError("Please enter a username");
    return;
  }

  // Validate username (alphanumeric and underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showError("Username can only contain letters, numbers, and underscores");
    return;
  }

  submitBtn.classList.add("loading");
  submitBtn.textContent = "Please wait...";
  hideMessages();

  try {
    if (isLoginMode) {
      await handleLogin(username);
    } else {
      await handleSignup(username);
    }
  } catch (error) {
    console.error("Auth error:", error);
    showError(error.message || "An error occurred. Please try again.");
  } finally {
    submitBtn.classList.remove("loading");
    submitBtn.textContent = isLoginMode ? "Sign In" : "Sign Up";
  }
});

// Handle login
async function handleLogin(username) {
  const userRef = doc(db, "users", username);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    showError("Username not found. Please sign up first.");
    return;
  }

  // Login successful
  localStorage.setItem("calendarUser", username);
  showSuccess("Login successful! Redirecting...");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}

// Handle signup
async function handleSignup(username) {
  const userRef = doc(db, "users", username);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    showError(
      "Username already exists. Please choose a different one or sign in.",
    );
    return;
  }

  // Create default event categories
  const defaultCategories = [
    {
      id: "cat_holidays",
      name: "Official Holidays",
      color: "#d50000",
      isDefault: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "cat_personal",
      name: "Personal",
      color: "#1a73e8",
      isDefault: false,
      isVisible: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "cat_work",
      name: "Work",
      color: "#33b679",
      isDefault: false,
      isVisible: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "cat_other",
      name: "Other",
      color: "#616161",
      isDefault: false,
      isVisible: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Create new user document with categories
  await setDoc(userRef, {
    username: username,
    createdAt: serverTimestamp(),
    eventCategories: defaultCategories,
  });

  // Signup successful
  localStorage.setItem("calendarUser", username);
  showSuccess("Account created successfully! Redirecting...");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}

// Utility functions to show messages
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  successMessage.style.display = "none";
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = "block";
  errorMessage.style.display = "none";
}

function hideMessages() {
  errorMessage.style.display = "none";
  successMessage.style.display = "none";
}

// Export for use in other files
export { db, currentUser };
