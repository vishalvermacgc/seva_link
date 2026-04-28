// app.js - SevaLink AI Central Logic

// INSERT GEMINI API HERE
// const GEMINI_API_KEY = "YOUR_API_KEY";

// INSERT FIREBASE CONFIG HERE
// const firebaseConfig = { ... };

// Initialize Global State
const STORAGE_KEY = 'sevaLink_tasks';
const USER_KEY = 'sevaLink_user';

// Mock initial data if empty
if (!localStorage.getItem(STORAGE_KEY)) {
  const initialTasks = [
    {
      id: 'task_1',
      title: 'Medical Camp Volunteer Needed',
      category: 'Healthcare',
      location: 'Dharavi, Mumbai',
      urgency: 'High',
      skills: ['Medical', 'First Aid'],
      timestamp: Date.now() - 3600000,
      ngoName: 'HealthFirst India'
    },
    {
      id: 'task_2',
      title: 'Food Distribution Drive',
      category: 'Food Relief',
      location: 'Andheri East',
      urgency: 'Medium',
      skills: ['Logistics', 'Crowd Control'],
      timestamp: Date.now() - 7200000,
      ngoName: 'Annam Foundation'
    }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTasks));
}

if (!localStorage.getItem(USER_KEY)) {
  localStorage.setItem(USER_KEY, JSON.stringify({
    role: 'guest',
    impactPoints: 0,
    skills: ['Medical', 'Coding', 'Teaching']
  }));
}

// Global Functions
const getTasks = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
const saveTasks = (tasks) => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
const getUser = () => JSON.parse(localStorage.getItem(USER_KEY));
const saveUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

// Utility to generate IDs
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// Add a new task (Used by NGO Dashboard)
function addTask(taskData) {
  const tasks = getTasks();
  const user = getUser();
  const ngoName = user.ngoProfile ? user.ngoProfile.name : 'Unverified NGO';

  const newTask = {
    id: generateId(),
    ...taskData,
    ngoName: ngoName,
    timestamp: Date.now()
  };
  tasks.unshift(newTask); // Add to beginning
  saveTasks(tasks);
  return newTask;
}

// Registration Functions
function registerNGO(ngoData) {
  const user = getUser();
  user.role = 'ngo';
  user.ngoProfile = ngoData;
  saveUser(user);
}

function registerVolunteer(volData) {
  const user = getUser();
  user.role = 'volunteer';
  user.volunteerProfile = volData;
  user.skills = volData.skills;
  saveUser(user);
}

// Delete/Complete a task (Used by NGO & Volunteer Dashboard)
function deleteTask(taskId) {
  let tasks = getTasks();
  tasks = tasks.filter(t => t.id !== taskId);
  saveTasks(tasks);
}

// Accept a mission (Volunteer Gamification)
function acceptMission(taskId) {
  deleteTask(taskId); // Remove from pool
  const user = getUser();
  user.impactPoints += 50; // Award points
  saveUser(user);
  showToast('Mission Accepted! +50 Impact Points 🌟');
  
  // Re-render volunteer dashboard if we are on it
  if (typeof renderVolunteerCards === 'function') {
    renderVolunteerCards();
    updateImpactPointsUI();
  }
}

// UI Helper: Show Toast Notification
function showToast(message) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    toast.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> <span id="toast-msg"></span>`;
    document.body.appendChild(toast);
  }
  document.getElementById('toast-msg').textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// UI Helper: Get Badge Class for Urgency
function getUrgencyBadgeClass(urgency) {
  const u = urgency.toLowerCase();
  if (u === 'high' || u === 'critical') return 'badge-red';
  if (u === 'medium') return 'badge-yellow';
  return 'badge-green';
}

// Generate HTML for a Task Card
function generateCardHTML(task, isVolunteer = false, isNGO = false) {
  const timeAgo = Math.round((Date.now() - task.timestamp) / 60000); // mins
  
  let actionButton = '';
  if (isVolunteer) {
    actionButton = `<button class="btn btn-primary mt-2" style="width: 100%" onclick="acceptMission('${task.id}')">Accept Mission</button>`;
  } else if (isNGO) {
    actionButton = `<button class="btn btn-danger mt-2" style="width: 100%" onclick="removeNGOTask('${task.id}')">Mark Completed / Remove</button>`;
  }

  return `
    <div class="card animate-slide-up">
      <div class="flex justify-between items-center mb-2">
        <span class="badge ${getUrgencyBadgeClass(task.urgency)}">${task.urgency} Urgency</span>
        <span class="text-secondary" style="font-size: 0.85rem">${timeAgo} mins ago</span>
      </div>
      <h3 style="margin-bottom: 0.5rem">${task.title}</h3>
      <p class="text-secondary mb-2" style="font-size: 0.9rem">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -3px; margin-right: 4px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        ${task.location}
      </p>
      <div class="flex gap-1 mb-2 flex-wrap">
        ${task.skills.map(skill => `<span class="badge badge-blue" style="font-size: 0.75rem">${skill}</span>`).join('')}
      </div>
      <div style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 1rem;">
        <strong>NGO:</strong> ${task.ngoName}
      </div>
      <div style="margin-top: auto;">
        ${actionButton}
      </div>
    </div>
  `;
}