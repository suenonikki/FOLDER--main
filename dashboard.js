// ============================================
// Athlete Hydration Dashboard - JavaScript
// ============================================

// Configuration
const DAILY_GOAL = 1000; // Athlete daily goal: 1000ml

// State variables
let waterIntake = 0;
let sensorConnected = false; // Design placeholder - will be true when sensor is connected
let isLoggedIn = false;
let userData = null;

// Emoji cycling for Stay Hydrated
const hydrationEmojis = ['💧', '🥤', '💦', '🚰', '🧊', '🌊'];
let currentEmojiIndex = 0;
let emojiAnimating = false;

// Activity log state - tracks real events
let activityLog = [];
let activityIdCounter = 0;

// Connected devices state
let connectedDevices = [];
let waitingDots = '';

// Flow sensor simulation data for chart (design only - will be replaced by real sensor data)
const flowData = [
  { time: 0, flow: 0 },
  { time: 2, flow: 15 },
  { time: 4, flow: 45 },
  { time: 6, flow: 30 },
  { time: 8, flow: 60 },
  { time: 10, flow: 40 },
  { time: 12, flow: 75 },
  { time: 14, flow: 50 },
  { time: 16, flow: 35 },
  { time: 18, flow: 20 },
  { time: 20, flow: 55 },
  { time: 22, flow: 25 },
  { time: 24, flow: 10 },
];

// Calculate flow-based intake (design only - will be replaced by real sensor data)
function calculateFlowBasedIntake() {
  return flowData.reduce((total, data) => total + data.flow * 2, 0);
}

const flowBasedIntake = calculateFlowBasedIntake();
const flowPercentage = Math.min(100, Math.round((flowBasedIntake / DAILY_GOAL) * 100));
const flowRemaining = Math.max(0, DAILY_GOAL - flowBasedIntake);

// ============================================
// Greeting and Emoji Functions
// ============================================

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 18) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
}

function updateGreeting() {
  const greetingElement = document.getElementById('greeting-text');
  if (greetingElement) {
    const greeting = getTimeBasedGreeting();
    if (isLoggedIn && userData && userData.firstName) {
      greetingElement.textContent = greeting + ', ' + userData.firstName;
    } else {
      greetingElement.textContent = greeting + ', User';
    }
  }
}

function cycleEmoji() {
  const emojiElement = document.getElementById('hydration-emoji');
  if (emojiElement) {
    // Start animation
    emojiElement.classList.add('animating');
    
    // Change emoji at midpoint of animation
    setTimeout(() => {
      currentEmojiIndex = (currentEmojiIndex + 1) % hydrationEmojis.length;
      emojiElement.textContent = hydrationEmojis[currentEmojiIndex];
    }, 250);
    
    // Remove animation class after it completes
    setTimeout(() => {
      emojiElement.classList.remove('animating');
    }, 500);
  }
}

function startEmojiCycle() {
  setInterval(cycleEmoji, 2500);
}

function startGreetingUpdate() {
  // Update greeting every minute to catch time changes
  setInterval(updateGreeting, 60000);
}

// ============================================
// Activity Log Functions
// ============================================

function addActivity(title, details) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = 'Today, ' + timeStr;
  
  activityLog.unshift({
    id: activityIdCounter++,
    time: dateStr,
    title: title,
    details: details
  });
  
  // Keep last 10 activities
  if (activityLog.length > 10) {
    activityLog = activityLog.slice(0, 10);
  }
  
  updateActivityDisplay();
}

function updateActivityDisplay() {
  const activityGrid = document.getElementById('activity-grid');
  if (!activityGrid) return;
  
  if (activityLog.length === 0) {
    activityGrid.innerHTML = `
      <div class="activity-card" style="text-align: center; padding: 32px 16px;">
        <div class="activity-title" style="color: var(--muted-foreground);">No activities yet</div>
        <div class="activity-details">Start tracking your water intake on the Home page</div>
      </div>
    `;
  } else {
    activityGrid.innerHTML = activityLog.map(activity => `
      <div class="activity-card">
        <div class="activity-time">${activity.time}</div>
        <div class="activity-title">${activity.title}</div>
        <div class="activity-details">${activity.details}</div>
      </div>
    `).join('');
  }
}

// ============================================
// Connected Devices Functions
// ============================================

function updateWaitingDots() {
  waitingDots = waitingDots.length >= 3 ? '' : waitingDots + '.';
  const dotsElement = document.getElementById('waiting-dots');
  if (dotsElement) {
    dotsElement.textContent = waitingDots;
  }
}

function startWaitingDotsAnimation() {
  setInterval(updateWaitingDots, 500);
}

function updateDevicesDisplay() {
  const devicesContainer = document.getElementById('devices-container');
  if (!devicesContainer) return;
  
  if (connectedDevices.length === 0) {
    devicesContainer.innerHTML = `
      <div class="device-card" style="justify-content: center; padding: 32px 16px;">
        <div class="device-info" style="text-align: center;">
          <p class="device-name" style="color: var(--muted-foreground);">
            Waiting for a device<span class="waiting-dots" id="waiting-dots">${waitingDots}</span>
          </p>
          <p class="device-status" style="margin-top: 8px;">No devices connected yet</p>
        </div>
      </div>
    `;
  } else {
    devicesContainer.innerHTML = connectedDevices.map(device => `
      <div class="device-card">
        <div class="device-icon">${device.icon}</div>
        <div class="device-info">
          <p class="device-name">${device.name}</p>
          <p class="device-status">${device.status}</p>
        </div>
        <div class="device-meta">
          <span class="battery">🔋 ${device.battery}%</span>
          <div class="connected-badge">
            <div class="connected-dot"></div>
            Connected
          </div>
        </div>
      </div>
    `).join('');
  }
}

// Add a device (for future integration)
function addDevice(id, name, icon, status, battery) {
  connectedDevices.push({ id, name, icon, status, battery });
  updateDevicesDisplay();
  addActivity('Device Connected', `${name} has been connected`);
}

// Remove a device
function removeDevice(id) {
  const device = connectedDevices.find(d => d.id === id);
  if (device) {
    connectedDevices = connectedDevices.filter(d => d.id !== id);
    updateDevicesDisplay();
    addActivity('Device Disconnected', `${device.name} has been disconnected`);
  }
}

// ============================================
// Water Intake Functions
// ============================================

function addWater(amount) {
  const oldValue = waterIntake;
  const newValue = waterIntake + amount;
  // Cap at 1000ml max and 0ml min
  waterIntake = Math.max(0, Math.min(DAILY_GOAL, newValue));
  
  // Log activity for water intake changes
  if (amount > 0 && waterIntake > oldValue) {
    const actualAmount = waterIntake - oldValue;
    addActivity('Water Added', `Added ${actualAmount}ml to daily intake`);
  } else if (amount < 0 && waterIntake < oldValue) {
    const actualAmount = oldValue - waterIntake;
    addActivity('Water Removed', `Removed ${actualAmount}ml from daily intake`);
  }
  
  // Check if goal reached
  if (waterIntake >= DAILY_GOAL && oldValue < DAILY_GOAL) {
    setTimeout(() => {
      addActivity('Goal Reached!', `Congratulations! You reached your ${DAILY_GOAL}ml daily goal`);
    }, 100);
  }
  
  updateWaterDisplay();
}

function updateWaterDisplay() {
  const percentage = Math.round((waterIntake / DAILY_GOAL) * 100);
  
  // Update intake value
  document.getElementById('intake-value').textContent = waterIntake;
  
  // Update glass fill height
  document.getElementById('glass-fill').style.height = percentage + '%';
  
  // Update percentage text
  document.getElementById('glass-percentage').textContent = percentage + '%';
}

// ============================================
// Alert Functions
// ============================================

function closeAlert() {
  document.getElementById('alert').classList.add('hidden');
}

function updateAlert() {
  const alertIcon = document.getElementById('alert-icon');
  const alertTitle = document.getElementById('alert-title');
  const alertMessage = document.getElementById('alert-message');

  if (!sensorConnected) {
    alertIcon.textContent = '📡';
    alertTitle.textContent = 'Flow Sensor Status';
    alertMessage.textContent = 'Awaiting flow sensor connection...';
  } else if (flowRemaining > 0) {
    alertIcon.textContent = '💧';
    alertTitle.textContent = 'Keep Drinking!';
    alertMessage.textContent = `Flow detected: ${flowBasedIntake}ml consumed. ${flowRemaining}ml remaining.`;
  } else {
    alertIcon.textContent = '💧';
    alertTitle.textContent = 'Goal Reached!';
    alertMessage.textContent = `Excellent! Flow sensor tracked ${flowBasedIntake}ml today!`;
  }
}

// ============================================
// Summary Functions
// ============================================

function updateSummary() {
  const summaryHydration = document.getElementById('summary-hydration');
  const summaryFlow = document.getElementById('summary-flow');
  const summaryRemaining = document.getElementById('summary-remaining');
  const activityFlowEvents = document.getElementById('activity-flow-events');
  const activityTotalVolume = document.getElementById('activity-total-volume');
  
  if (sensorConnected) {
    if (summaryHydration) summaryHydration.textContent = flowPercentage + '%';
    if (summaryFlow) summaryFlow.textContent = flowBasedIntake + 'ml';
    if (summaryRemaining) summaryRemaining.textContent = flowRemaining + 'ml';
    
    // Activity page
    const flowEvents = flowData.filter(d => d.flow > 0).length;
    if (activityFlowEvents) activityFlowEvents.textContent = flowEvents;
    if (activityTotalVolume) activityTotalVolume.textContent = flowBasedIntake + 'ml';
  } else {
    if (summaryHydration) summaryHydration.textContent = '--';
    if (summaryFlow) summaryFlow.textContent = '--';
    if (summaryRemaining) summaryRemaining.textContent = '--';
    
    // Activity page
    if (activityFlowEvents) activityFlowEvents.textContent = '--';
    if (activityTotalVolume) activityTotalVolume.textContent = '--';
  }
}

// ============================================
// Navigation Functions
// ============================================

function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page-container').forEach(page => {
    page.classList.remove('active');
  });
  
  // Remove active from all nav buttons
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected page
  document.getElementById('page-' + pageName).classList.add('active');
  
  // Activate nav button
  document.getElementById('nav-' + pageName).classList.add('active');
}

// ============================================
// Authentication Functions
// ============================================

function switchAuthTab(tab) {
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginError = document.getElementById('login-error');
  const signupError = document.getElementById('signup-error');
  
  // Clear errors
  loginError.classList.add('hidden');
  signupError.classList.add('hidden');
  
  if (tab === 'login') {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  } else {
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
  }
}

function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  
  // Validation
  if (!email || !password) {
    errorDiv.textContent = 'Please enter email and password';
    errorDiv.classList.remove('hidden');
    return;
  }
  
  // For demo purposes, create user data if none exists
  if (!userData) {
    userData = {
      firstName: 'Athlete',
      lastName: 'User',
      email: email,
      age: '25',
      weight: '70',
      activityLevel: 'moderate'
    };
  }
  
  isLoggedIn = true;
  updateProfileView();
  
  // Clear form
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  errorDiv.classList.add('hidden');
}

function handleSignUp() {
  const firstName = document.getElementById('signup-firstname').value;
  const lastName = document.getElementById('signup-lastname').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm').value;
  const age = document.getElementById('signup-age').value;
  const weight = document.getElementById('signup-weight').value;
  const activityLevel = document.getElementById('signup-activity').value;
  const errorDiv = document.getElementById('signup-error');
  
  // Validation
  if (!firstName || !lastName || !email || !password) {
    errorDiv.textContent = 'Please fill in all required fields';
    errorDiv.classList.remove('hidden');
    return;
  }
  
  if (password !== confirmPassword) {
    errorDiv.textContent = 'Passwords do not match';
    errorDiv.classList.remove('hidden');
    return;
  }
  
  if (password.length < 6) {
    errorDiv.textContent = 'Password must be at least 6 characters';
    errorDiv.classList.remove('hidden');
    return;
  }
  
  // Save user data
  userData = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    age: age || '25',
    weight: weight || '70',
    activityLevel: activityLevel
  };
  
  isLoggedIn = true;
  updateProfileView();
  
  // Clear form
  document.getElementById('signup-firstname').value = '';
  document.getElementById('signup-lastname').value = '';
  document.getElementById('signup-email').value = '';
  document.getElementById('signup-password').value = '';
  document.getElementById('signup-confirm').value = '';
  document.getElementById('signup-age').value = '';
  document.getElementById('signup-weight').value = '';
  document.getElementById('signup-activity').value = 'moderate';
  errorDiv.classList.add('hidden');
}

function handleLogout() {
  isLoggedIn = false;
  updateProfileView();
}

function updateProfileView() {
  const authContainer = document.getElementById('auth-container');
  const profileView = document.getElementById('profile-view');
  
  if (isLoggedIn && userData) {
    authContainer.classList.add('hidden');
    profileView.classList.remove('hidden');
    
    // Update profile display
    document.getElementById('profile-name').textContent = userData.firstName + ' ' + userData.lastName;
    document.getElementById('profile-email').textContent = userData.email;
    document.getElementById('profile-age').textContent = userData.age || '--';
    document.getElementById('profile-weight').textContent = (userData.weight || '--') + 'kg';
    
    // Format activity level
    const activityLabels = {
      'sedentary': 'Sedentary',
      'light': 'Light',
      'moderate': 'Moderate',
      'active': 'Active',
      'athlete': 'Athlete'
    };
    const activityDisplay = activityLabels[userData.activityLevel] || userData.activityLevel;
    document.getElementById('profile-activity-display').textContent = activityDisplay;
    document.getElementById('profile-activity-level').textContent = activityDisplay;
    document.getElementById('profile-email-display').textContent = userData.email;
  } else {
    authContainer.classList.remove('hidden');
    profileView.classList.add('hidden');
    switchAuthTab('login');
  }
  
  // Update greeting when profile changes
  updateGreeting();
}

// ============================================
// Chart Functions
// ============================================

function generateFlowChartPoints() {
  const maxFlow = 100; // Max flow rate for visualization
  const chartWidth = 560;
  const chartHeight = 110;
  const startX = 40;
  const startY = 10;

  const linePoints = [];
  const areaPoints = [];

  flowData.forEach((data) => {
    const xPosition = startX + (data.time / 24) * chartWidth;
    const yPosition = startY + chartHeight - (data.flow / maxFlow) * chartHeight;
    linePoints.push(`${xPosition},${yPosition}`);
    areaPoints.push(`${xPosition},${yPosition}`);
  });

  // Create area polygon (add bottom points for fill)
  let areaPolygon = areaPoints.join(' ');
  if (areaPoints.length > 0) {
    const lastX = startX + (flowData[flowData.length - 1].time / 24) * chartWidth;
    const firstX = startX + (flowData[0].time / 24) * chartWidth;
    areaPolygon += ` ${lastX},${startY + chartHeight} ${firstX},${startY + chartHeight}`;
  }

  return { linePoints: linePoints.join(' '), areaPolygon };
}

function drawChart() {
  const { linePoints, areaPolygon } = generateFlowChartPoints();
  
  // Update chart area and line
  document.getElementById('chart-area').setAttribute('points', areaPolygon);
  document.getElementById('chart-line').setAttribute('points', linePoints);
  
  // Draw data points
  const pointsContainer = document.getElementById('chart-points');
  pointsContainer.innerHTML = ''; // Clear existing points
  
  const maxFlow = 100;
  const chartWidth = 560;
  const chartHeight = 110;
  const startX = 40;
  const startY = 10;
  
  flowData.forEach((data) => {
    const xPosition = startX + (data.time / 24) * chartWidth;
    const yPosition = startY + chartHeight - (data.flow / maxFlow) * chartHeight;
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', xPosition);
    circle.setAttribute('cy', yPosition);
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', '#275CCC');
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '2');
    
    pointsContainer.appendChild(circle);
  });
}

// ============================================
// Flow Sensor Functions (For Future Integration)
// ============================================

// This function will be called when you connect a real flow sensor
function connectFlowSensor() {
  sensorConnected = true;
  updateAlert();
  updateSummary();
  console.log('Flow sensor connected!');
}

// This function will be called when the sensor disconnects
function disconnectFlowSensor() {
  sensorConnected = false;
  updateAlert();
  updateSummary();
  console.log('Flow sensor disconnected.');
}

// This function will receive real flow data from the sensor
// Replace flowData array updates with real sensor readings
function updateFlowData(time, flowRate) {
  // Example: Add new flow reading
  // flowData.push({ time: time, flow: flowRate });
  // drawChart();
  // recalculate flowBasedIntake, etc.
}

// ============================================
// Initialize Dashboard
// ============================================

function init() {
  // Initialize displays
  updateWaterDisplay();
  updateAlert();
  updateSummary();
  drawChart();
  updateProfileView();
  updateGreeting();
  updateActivityDisplay();
  updateDevicesDisplay();
  
  // Start emoji cycling animation with smooth effect
  startEmojiCycle();
  
  // Start greeting update interval for time-based changes
  startGreetingUpdate();
  
  // Start waiting dots animation for devices
  startWaitingDotsAnimation();
  
  console.log('Dashboard initialized');
  console.log('Daily Goal:', DAILY_GOAL + 'ml');
  console.log('Sensor Connected:', sensorConnected);
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);