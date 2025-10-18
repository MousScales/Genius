// Genius Web App - Main JavaScript
class GeniusApp {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        this.setupServiceWorker();
        this.setupInstallPrompt();
        this.setupEventListeners();
        this.checkInstallStatus();
        this.setupNavigation();
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallPrompt();
            console.log('App was installed');
        });
    }

    setupEventListeners() {
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.setActiveNavItem(e.currentTarget);
                this.handleNavigation(e.currentTarget.textContent.trim());
            });
        });

        // File tree items
        document.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.openFile(e.currentTarget.textContent.trim());
            });
        });

        // Install prompt
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.addEventListener('click', () => {
                this.installApp();
            });
        }
    }

    setupNavigation() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            this.handleUrlChange();
        });
    }

    checkInstallStatus() {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            this.hideInstallPrompt();
        }
    }

    showInstallPrompt() {
        if (!this.isInstalled && this.deferredPrompt) {
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.classList.add('show');
            }
        }
    }

    hideInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.classList.remove('show');
        }
    }

    async installApp() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            this.deferredPrompt = null;
        }
    }

    setActiveNavItem(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }

    handleNavigation(navItem) {
        console.log(`Navigating to: ${navItem}`);
        
        switch(navItem) {
            case 'Explorer':
                this.showExplorer();
                break;
            case 'Search':
                this.showSearch();
                break;
            case 'Settings':
                this.showSettings();
                break;
            case 'Analytics':
                this.showAnalytics();
                break;
        }
    }

    showExplorer() {
        // Update workspace content for Explorer
        const workspace = document.querySelector('.workspace');
        workspace.innerHTML = `
            <div class="code-editor" contenteditable="true">
// File Explorer
// This is where you can browse and manage your files

📁 Project Root
├── 📄 index.html
├── 📄 style.css
├── 📄 script.js
├── 📁 components/
│   ├── 📄 header.js
│   └── 📄 sidebar.js
└── 📁 assets/
    ├── 🖼️ logo.png
    └── 🎨 styles.css

// Click on any file to open it
            </div>
        `;
    }

    showSearch() {
        const workspace = document.querySelector('.workspace');
        workspace.innerHTML = `
            <div style="padding: 20px;">
                <h3>🔍 Search</h3>
                <input type="text" placeholder="Search files, code, or content..." 
                       style="width: 100%; padding: 12px; margin: 20px 0; border: 1px solid #333; 
                              background: #2d2d2d; color: white; border-radius: 6px;">
                <div style="margin-top: 20px;">
                    <h4>Recent Searches:</h4>
                    <div style="margin: 10px 0; padding: 8px; background: #333; border-radius: 4px;">function hello()</div>
                    <div style="margin: 10px 0; padding: 8px; background: #333; border-radius: 4px;">console.log</div>
                    <div style="margin: 10px 0; padding: 8px; background: #333; border-radius: 4px;">import React</div>
                </div>
            </div>
        `;
    }

    showSettings() {
        const workspace = document.querySelector('.workspace');
        workspace.innerHTML = `
            <div style="padding: 20px;">
                <h3>⚙️ Settings</h3>
                <div style="margin: 20px 0;">
                    <label style="display: block; margin: 10px 0;">Theme:</label>
                    <select style="padding: 8px; background: #2d2d2d; color: white; border: 1px solid #333; border-radius: 4px;">
                        <option>Dark</option>
                        <option>Light</option>
                        <option>Auto</option>
                    </select>
                </div>
                <div style="margin: 20px 0;">
                    <label style="display: block; margin: 10px 0;">Font Size:</label>
                    <input type="range" min="12" max="24" value="14" 
                           style="width: 200px;">
                </div>
                <div style="margin: 20px 0;">
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" checked> Auto-save
                    </label>
                </div>
                <button class="btn" onclick="this.saveSettings()">Save Settings</button>
            </div>
        `;
    }

    showAnalytics() {
        const workspace = document.querySelector('.workspace');
        workspace.innerHTML = `
            <div style="padding: 20px;">
                <h3>📊 Analytics</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div style="background: #2d2d2d; padding: 20px; border-radius: 8px;">
                        <h4>Files Opened</h4>
                        <div style="font-size: 24px; color: #4CAF50;">42</div>
                    </div>
                    <div style="background: #2d2d2d; padding: 20px; border-radius: 8px;">
                        <h4>Lines of Code</h4>
                        <div style="font-size: 24px; color: #4CAF50;">1,234</div>
                    </div>
                    <div style="background: #2d2d2d; padding: 20px; border-radius: 8px;">
                        <h4>Time Active</h4>
                        <div style="font-size: 24px; color: #4CAF50;">2h 34m</div>
                    </div>
                    <div style="background: #2d2d2d; padding: 20px; border-radius: 8px;">
                        <h4>Projects</h4>
                        <div style="font-size: 24px; color: #4CAF50;">5</div>
                    </div>
                </div>
            </div>
        `;
    }

    openFile(filename) {
        console.log(`Opening file: ${filename}`);
        // In a real app, this would load the actual file content
        const workspace = document.querySelector('.workspace');
        workspace.innerHTML = `
            <div class="code-editor" contenteditable="true">
// ${filename}
// File content would be loaded here

// This is a placeholder for the file content
// In a real application, this would load the actual file

function example() {
    console.log("This is content from ${filename}");
    return "File loaded successfully!";
}

// You can edit this content
// Changes would be saved automatically
            </div>
        `;
    }

    handleUrlChange() {
        // Handle URL changes for navigation
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action) {
            switch(action) {
                case 'new':
                    this.createNewFile();
                    break;
                case 'settings':
                    this.showSettings();
                    break;
            }
        }
    }

    createNewFile() {
        const workspace = document.querySelector('.workspace');
        workspace.innerHTML = `
            <div class="code-editor" contenteditable="true">
// New File
// Start typing your code here...

// This is a new file
// You can start writing your code immediately
            </div>
        `;
    }
}

// Global functions for HTML buttons
function addClass() {
    console.log('Add Class clicked - function called!');
    alert('Add Class function called!'); // Temporary debug
    
    // Get the main content container
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) {
        console.error('Main content not found!');
        return;
    }
    
    // Create the class creation form
    mainContent.innerHTML = `
        <div class="class-form-container">
            <div class="form-header">
                <h2 style="color: white; margin-bottom: 10px;">Create New Class</h2>
                <p style="color: #888; margin-bottom: 30px;">Fill in the details for your new class</p>
            </div>
            
            <form class="class-form" onsubmit="createClass(event)">
                <div class="form-section">
                    <h3 style="color: #4CAF50; margin-bottom: 15px;">📸 Class Image (Optional)</h3>
                    <div class="image-upload-area" onclick="document.getElementById('classImage').click()">
                        <input type="file" id="classImage" accept="image/*" style="display: none;" onchange="previewImage(event)">
                        <div id="imagePreview" class="image-preview">
                            <span style="font-size: 48px;">📷</span>
                            <p>Click to upload class image</p>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3 style="color: #4CAF50; margin-bottom: 15px;">📝 Basic Information</h3>
                    
                    <div class="form-group">
                        <label for="className">Class Name *</label>
                        <input type="text" id="className" required placeholder="e.g., Mathematics 101">
                    </div>
                    
                    <div class="form-group">
                        <label for="classDescription">Description</label>
                        <textarea id="classDescription" placeholder="Describe what this class is about..."></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="classYear">Year *</label>
                            <select id="classYear" required>
                                <option value="">Select Year</option>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                                <option value="2027">2027</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="classLevel">Level *</label>
                            <select id="classLevel" required>
                                <option value="">Select Level</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Expert">Expert</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3 style="color: #4CAF50; margin-bottom: 15px;">📅 Schedule & Details</h3>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="startDate">Start Date</label>
                            <input type="date" id="startDate">
                        </div>
                        
                        <div class="form-group">
                            <label for="endDate">End Date</label>
                            <input type="date" id="endDate">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="classTime">Class Time</label>
                            <input type="time" id="classTime">
                        </div>
                        
                        <div class="form-group">
                            <label for="classDuration">Duration (minutes)</label>
                            <input type="number" id="classDuration" placeholder="90" min="15" max="300">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3 style="color: #4CAF50; margin-bottom: 15px;">👥 Additional Information</h3>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="maxStudents">Max Students</label>
                            <input type="number" id="maxStudents" placeholder="30" min="1" max="1000">
                        </div>
                        
                        <div class="form-group">
                            <label for="classRoom">Room/Location</label>
                            <input type="text" id="classRoom" placeholder="Room 101 or Online">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="classInstructor">Instructor</label>
                        <input type="text" id="classInstructor" placeholder="Instructor name">
                    </div>
                    
                    <div class="form-group">
                        <label for="classTags">Tags (comma separated)</label>
                        <input type="text" id="classTags" placeholder="math, algebra, beginner">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="showAddClass()">Cancel</button>
                    <button type="submit" class="btn">Create Class</button>
                </div>
            </form>
        </div>
    `;
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
        };
        reader.readAsDataURL(file);
    }
}

function createClass(event) {
    event.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('className').value,
        description: document.getElementById('classDescription').value,
        year: document.getElementById('classYear').value,
        level: document.getElementById('classLevel').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        time: document.getElementById('classTime').value,
        duration: document.getElementById('classDuration').value,
        maxStudents: document.getElementById('maxStudents').value,
        room: document.getElementById('classRoom').value,
        instructor: document.getElementById('classInstructor').value,
        tags: document.getElementById('classTags').value,
        image: document.getElementById('classImage').files[0]
    };
    
    // Create class card
    const classItem = document.createElement('div');
    classItem.className = 'class-item';
    
    const imagePreview = formData.image ? 
        `<img src="${URL.createObjectURL(formData.image)}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">` :
        `<div style="width: 60px; height: 60px; background: #4CAF50; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: white; font-size: 24px;">📚</div>`;
    
    classItem.innerHTML = `
        <div style="background: #2d2d2d; padding: 20px; border-radius: 12px; margin: 10px 0; 
                    border-left: 4px solid #4CAF50; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; align-items: center;">
            ${imagePreview}
            <div style="flex: 1;">
                <h3 style="color: #4CAF50; margin: 0 0 5px 0;">${formData.name}</h3>
                <p style="color: #888; margin: 0 0 5px 0; font-size: 14px;">${formData.description || 'No description'}</p>
                <div style="display: flex; gap: 15px; font-size: 12px; color: #aaa;">
                    <span>📅 ${formData.year}</span>
                    <span>📊 ${formData.level}</span>
                    ${formData.instructor ? `<span>👨‍🏫 ${formData.instructor}</span>` : ''}
                    ${formData.room ? `<span>🏫 ${formData.room}</span>` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Show classes view
    showClassesView();
    
    // Add the new class
    const classesContainer = document.querySelector('.classes-list');
    if (classesContainer) {
        classesContainer.appendChild(classItem);
    }
    
    // Show success message
    alert(`Class "${formData.name}" created successfully!`);
}

function showClassesView() {
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = `
        <div class="classes-container">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: white; margin-bottom: 10px;">Your Classes</h2>
                <button class="btn" onclick="addClass()" style="margin-right: 10px;">+ Add New Class</button>
                <button class="btn btn-secondary" onclick="showAddClass()">Back to Home</button>
            </div>
            <div class="classes-list" style="max-width: 800px; margin: 0 auto;">
                <!-- Classes will be added here -->
            </div>
        </div>
    `;
}

function showAddClass() {
    // Reset to the original add class view
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = `
        <div class="logo">Genius</div>
        <h1 class="add-class-title">Add Class</h1>
        <button class="big-plus-button" onclick="addClass()">+</button>
        <p class="subtitle">Click the plus button to create a new class and start your learning journey</p>
        
        <div class="install-prompt" id="installPrompt">
            📱 Install App
        </div>
    `;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GeniusApp();
    
    // Debug: Check if button exists
    const plusButton = document.getElementById('plusButton');
    if (plusButton) {
        console.log('Plus button found!');
    } else {
        console.error('Plus button NOT found!');
    }
    
    // Alternative click handler
    if (plusButton) {
        plusButton.addEventListener('click', function() {
            console.log('Button clicked via event listener!');
            addClass();
        });
    }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                saveWork();
                break;
            case 'n':
                e.preventDefault();
                // Create new file
                break;
        }
    }
});
