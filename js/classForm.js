// Class form module
// Get current user from localStorage
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

// Store uploaded image URL
let uploadedImageUrl = null;

// Class creation functions
function addClass() {
    console.log('Add Class clicked - function called!');
    
    // Reset uploaded image
    uploadedImageUrl = null;
    
    // Hide the dashboard content
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
        dashboardContent.style.display = 'none';
    }
    
    // Hide the add class button
    const addClassBtn = document.getElementById('addClassBtn');
    if (addClassBtn) {
        addClassBtn.style.display = 'none';
    }
    
    // Hide the sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.display = 'none';
    }
    
    // Hide the header bar
    const headerBar = document.querySelector('.header-bar');
    if (headerBar) {
        headerBar.style.display = 'none';
    }

    // Create the class form
    const classForm = createClassForm();
    document.body.appendChild(classForm);

    // Setup live preview
    setTimeout(setupLivePreview, 100);
}

// Create class form HTML
function createClassForm() {
    const formContainer = document.createElement('div');
    formContainer.className = 'class-form-container';
    formContainer.innerHTML = `
        <div class="form-column">
            <div class="form-header-custom">
                <button type="button" class="back-btn-custom" id="backBtnCustom">
                    <span class="back-icon">←</span> <span class="back-text">Back</span>
                </button>
            </div>
            <div class="form-section">
                <h2>Class Information</h2>
                
                <div class="form-group">
                    <label for="classImage">Class Image</label>
                    <div class="image-upload-area" onclick="document.getElementById('classImage').click()">
                        <input type="file" id="classImage" accept="image/*" style="display: none;">
                        <div class="image-preview">
                            <span>📷</span>
                            <p>Click to upload image</p>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="className">Class Name *</label>
                    <input type="text" id="className" placeholder="Enter class name" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="classInstructor">Instructor</label>
                        <input type="text" id="classInstructor" placeholder="Instructor name">
                    </div>
                    <div class="form-group">
                        <label for="classLevel">Level *</label>
                        <select id="classLevel" required>
                            <option value="">Select level</option>
                            <option value="Regular">Regular</option>
                            <option value="College Prep">College Prep</option>
                            <option value="Honors">Honors</option>
                            <option value="AP">AP</option>
                            <option value="IB">IB</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Graduate">Graduate</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="classTerm">Term *</label>
                        <select id="classTerm" required>
                            <option value="">Select term</option>
                            <option value="Fall">Fall</option>
                            <option value="Spring">Spring</option>
                            <option value="Winter">Winter</option>
                            <option value="Summer">Summer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="classYear">Year *</label>
                        <input type="number" id="classYear" placeholder="2025" min="2024" max="2030" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="classRoom">Room/Location</label>
                    <input type="text" id="classRoom" placeholder="e.g., Room 101, Online">
                </div>
            </div>
            
            <div class="form-section">
                <h2>Schedule</h2>
                <p>Select the days and times for this class</p>
                
                <div class="days-container">
                    <div class="day-item" data-day="Monday">
                        <input type="checkbox" id="monday" class="day-checkbox" value="Monday">
                        <label for="monday" class="day-label">Monday</label>
                        <div class="day-times">
                            <input type="text" class="day-start-time" placeholder="9:00 AM">
                            <input type="text" class="day-end-time" placeholder="10:30 AM">
                        </div>
                    </div>
                    
                    <div class="day-item" data-day="Tuesday">
                        <input type="checkbox" id="tuesday" class="day-checkbox" value="Tuesday">
                        <label for="tuesday" class="day-label">Tuesday</label>
                        <div class="day-times">
                            <input type="text" class="day-start-time" placeholder="9:00 AM">
                            <input type="text" class="day-end-time" placeholder="10:30 AM">
                        </div>
                    </div>
                    
                    <div class="day-item" data-day="Wednesday">
                        <input type="checkbox" id="wednesday" class="day-checkbox" value="Wednesday">
                        <label for="wednesday" class="day-label">Wednesday</label>
                        <div class="day-times">
                            <input type="text" class="day-start-time" placeholder="9:00 AM">
                            <input type="text" class="day-end-time" placeholder="10:30 AM">
                        </div>
                    </div>
                    
                    <div class="day-item" data-day="Thursday">
                        <input type="checkbox" id="thursday" class="day-checkbox" value="Thursday">
                        <label for="thursday" class="day-label">Thursday</label>
                        <div class="day-times">
                            <input type="text" class="day-start-time" placeholder="9:00 AM">
                            <input type="text" class="day-end-time" placeholder="10:30 AM">
                        </div>
                    </div>
                    
                    <div class="day-item" data-day="Friday">
                        <input type="checkbox" id="friday" class="day-checkbox" value="Friday">
                        <label for="friday" class="day-label">Friday</label>
                        <div class="day-times">
                            <input type="text" class="day-start-time" placeholder="9:00 AM">
                            <input type="text" class="day-end-time" placeholder="10:30 AM">
                        </div>
                    </div>
                    
                    <div class="day-item" data-day="Saturday">
                        <input type="checkbox" id="saturday" class="day-checkbox" value="Saturday">
                        <label for="saturday" class="day-label">Saturday</label>
                        <div class="day-times">
                            <input type="text" class="day-start-time" placeholder="9:00 AM">
                            <input type="text" class="day-end-time" placeholder="10:30 AM">
                        </div>
                    </div>
                    
                    <div class="day-item" data-day="Sunday">
                        <input type="checkbox" id="sunday" class="day-checkbox" value="Sunday">
                        <label for="sunday" class="day-label">Sunday</label>
                        <div class="day-times">
                            <input type="text" class="day-start-time" placeholder="9:00 AM">
                            <input type="text" class="day-end-time" placeholder="10:30 AM">
                        </div>
                    </div>
                    
                    <div class="day-item async-item" data-day="Asynchronous">
                        <input type="checkbox" id="asynchronous" class="day-checkbox" value="Asynchronous">
                        <label for="asynchronous" class="day-label">Asynchronous</label>
                        <div class="day-times">
                            <input type="text" class="day-start-time" placeholder="Flexible">
                            <input type="text" class="day-end-time" placeholder="Flexible">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h2>Additional Information</h2>
                
                <div class="form-group">
                    <label for="classMaterials">Important Materials & Links</label>
                    <textarea id="classMaterials" placeholder="Paste important links, resources, or materials here..."></textarea>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                <button type="button" class="btn btn-primary" id="createBtn">Create Class</button>
            </div>
        </div>
        
        <div class="preview-section">
            <div class="class-preview">
                <div class="preview-image"></div>
                <div class="preview-content">
                    <h3 class="preview-title">Untitled</h3>
                    <p class="preview-instructor" id="previewInstructor" style="display: none;"></p>
                    <div class="preview-meta">
                        <span id="previewTerm" style="display: none;"></span>
                        <span id="previewLevel" style="display: none;"></span>
                        <span id="previewDays" style="display: none;"></span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return formContainer;
}

// Format time input as user types
function formatTimeInput(input) {
    let value = input.value.replace(/[^0-9:aApPmM\s]/g, ''); // Keep numbers, colon, AM/PM, spaces
    
    // Check if user is typing AM or PM
    const hasAM = /am/i.test(value);
    const hasPM = /pm/i.test(value);
    let userPeriod = null;
    if (hasAM) userPeriod = 'AM';
    if (hasPM) userPeriod = 'PM';
    
    // Remove AM/PM and spaces for parsing
    value = value.replace(/[aApPmM\s]/g, '');
    
    // Remove if more than one colon
    const colonCount = (value.match(/:/g) || []).length;
    if (colonCount > 1) {
        value = value.replace(/:.*:/, ':');
    }
    
    // Parse the input
    let hours = 0;
    let minutes = 0;
    let isTyping = false;
    
    if (value.includes(':')) {
        const parts = value.split(':');
        hours = parseInt(parts[0]) || 0;
        minutes = parseInt(parts[1]) || 0;
        
        // If still typing minutes (less than 2 digits after colon)
        if (parts[1] && parts[1].length < 2) {
            isTyping = true;
        }
    } else if (value.length > 0) {
        // Auto-insert colon after typing 2 digits
        if (value.length >= 3) {
            // Treat as HHMM or HMM
            if (value.length === 3) {
                hours = parseInt(value.substring(0, 1)) || 0;
                minutes = parseInt(value.substring(1)) || 0;
            } else {
                hours = parseInt(value.substring(0, value.length - 2)) || 0;
                minutes = parseInt(value.substring(value.length - 2)) || 0;
            }
        } else if (value.length === 2) {
            // Two digits could be just hours, auto-add colon
            hours = parseInt(value) || 0;
            minutes = 0;
        } else {
            // Single digit - just hours, don't format yet
            hours = parseInt(value) || 0;
            minutes = 0;
            isTyping = true;
        }
    }
    
    // Only format if we have valid input
    if (hours > 0 || minutes > 0) {
        // Handle 24-hour format
        let period = userPeriod;
        if (!period) {
            if (hours >= 13 && hours <= 23) {
                hours = hours - 12;
                period = 'PM';
            } else if (hours === 0) {
                hours = 12;
                period = 'AM';
            } else if (hours === 12) {
                period = 'PM';
            } else {
                // Default to AM for morning times, PM for afternoon
                period = (hours >= 8) ? 'AM' : 'PM';
            }
        }
        
        // Clamp values
        hours = Math.min(Math.max(hours, 1), 12);
        minutes = Math.min(minutes, 59);
        
        // Format based on typing state
        let formattedTime;
        if (isTyping && value.length === 1) {
            // Just show the single digit while typing
            formattedTime = value;
        } else if (isTyping && value.includes(':')) {
            // User is typing minutes after colon
            const parts = value.split(':');
            formattedTime = `${hours}:${parts[1]}`;
        } else {
            // Full format with colon and AM/PM
            formattedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
        
        // Update the input value
        input.value = formattedTime;
    }
}

// Setup live preview functionality
function setupLivePreview() {
    console.log('Setting up live preview...');
    
    // Get all input elements
    const inputs = [
        'className', 'classInstructor', 'classLevel', 'classTerm', 
        'classYear', 'classRoom', 'classMaterials'
    ];
    
    // Add event listeners to inputs
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', updatePreview);
            input.addEventListener('change', updatePreview);
        }
    });
    
    // Setup day selection
    const dayItems = document.querySelectorAll('.day-item');
    dayItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't toggle if clicking on the time inputs
            if (e.target.classList.contains('day-start-time') || 
                e.target.classList.contains('day-end-time')) {
                return;
            }
            
            const checkbox = this.querySelector('.day-checkbox');
            const dayTimes = this.querySelector('.day-times');
            
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                this.classList.add('selected');
                dayTimes.classList.add('show');
            } else {
                this.classList.remove('selected');
                dayTimes.classList.remove('show');
            }
            
            updatePreview();
        });
    });
    
    // Setup day time inputs - prevent click propagation and format time
    const dayTimeInputs = document.querySelectorAll('.day-start-time, .day-end-time');
    dayTimeInputs.forEach(input => {
        input.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent day-item click
        });
        input.addEventListener('focus', function(e) {
            e.stopPropagation(); // Prevent day-item click
        });
        input.addEventListener('input', function(e) {
            formatTimeInput(e.target);
            updatePreview();
        });
        input.addEventListener('blur', function(e) {
            formatTimeInput(e.target);
            updatePreview();
        });
    });
    
    // Setup image upload
    const imageInput = document.getElementById('classImage');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }
    
    // Setup form buttons
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelClassCreation);
    }
    
    const createBtn = document.getElementById('createBtn');
    if (createBtn) {
        console.log('✅ Create Class button event listener added');
        createBtn.addEventListener('click', (event) => {
            console.log('🖱️ Create Class button clicked!');
            createClass(event);
        });
    } else {
        console.error('❌ Create Class button not found!');
    }
    
    const backBtnCustom = document.getElementById('backBtnCustom');
    if (backBtnCustom) {
        backBtnCustom.addEventListener('click', cancelClassCreation);
    }
    
    console.log('Live preview setup complete');
}

// Compress image to reduce file size
function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Calculate new dimensions
            let { width, height } = img;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            
            resolve(compressedDataUrl);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file size first
        if (file.size > 2 * 1024 * 1024) { // 2MB
            alert('Image is too large. Please choose an image smaller than 2MB.');
            return;
        }
        
        // Compress the image
        compressImage(file).then(compressedImageUrl => {
            // Store the compressed image URL globally
            uploadedImageUrl = compressedImageUrl;
            
            // Update the preview on the right
            const preview = document.querySelector('.preview-image');
            if (preview) {
                preview.innerHTML = `<img src="${compressedImageUrl}" alt="Class Image">`;
                // Make preview clickable to change image
                preview.style.cursor = 'pointer';
                preview.onclick = function() {
                    document.getElementById('classImage').click();
                };
            }
            
            // Update the upload area on the left
            const uploadArea = document.querySelector('.image-upload-area');
            if (uploadArea) {
                uploadArea.innerHTML = `<img src="${compressedImageUrl}" alt="Uploaded Image">`;
                uploadArea.style.cursor = 'pointer';
                // Keep it clickable to change the image
                uploadArea.onclick = function() {
                    document.getElementById('classImage').click();
                };
            }
            
            console.log('Image compressed successfully');
        }).catch(error => {
            console.error('Error compressing image:', error);
            alert('Error processing image. Please try a different image.');
        });
    }
}

// Update preview
function updatePreview() {
    console.log('Updating preview...');
    
    // Get form values
    const className = document.getElementById('className')?.value || '';
    const classInstructor = document.getElementById('classInstructor')?.value || '';
    const classLevel = document.getElementById('classLevel')?.value || '';
    const classTerm = document.getElementById('classTerm')?.value || '';
    const classYear = document.getElementById('classYear')?.value || '';
    
    // Update preview title
    const previewTitle = document.querySelector('.preview-title');
    if (previewTitle) {
        previewTitle.textContent = className || 'Untitled';
        
        // Adjust font size based on length
        previewTitle.classList.remove('long-title', 'very-long-title');
        if (className.length > 20) {
            previewTitle.classList.add('long-title');
        }
        if (className.length > 40) {
            previewTitle.classList.add('very-long-title');
        }
    }
    
    // Update preview instructor
    const previewInstructor = document.getElementById('previewInstructor');
    if (previewInstructor) {
        if (classInstructor) {
            previewInstructor.textContent = classInstructor;
            previewInstructor.style.display = 'block';
        } else {
            previewInstructor.style.display = 'none';
        }
    }
    
    // Update preview meta
    const previewTerm = document.getElementById('previewTerm');
    const previewLevel = document.getElementById('previewLevel');
    const previewDays = document.getElementById('previewDays');
    
    if (previewTerm) {
        if (classTerm || classYear) {
            previewTerm.textContent = `${classTerm} ${classYear}`.trim();
            previewTerm.style.display = 'inline-block';
        } else {
            previewTerm.style.display = 'none';
        }
    }
    
    if (previewLevel) {
        if (classLevel) {
            previewLevel.textContent = classLevel;
            previewLevel.style.display = 'inline-block';
        } else {
            previewLevel.style.display = 'none';
        }
    }
    
    // Update selected days
    if (previewDays) {
        const dayCheckboxes = document.querySelectorAll('.day-checkbox:checked');
        const dayAbbreviations = {
            'Monday': 'Mon.',
            'Tuesday': 'Tues.',
            'Wednesday': 'Wed.',
            'Thursday': 'Thurs.',
            'Friday': 'Fri.',
            'Saturday': 'Sat.',
            'Sunday': 'Sun.',
            'Asynchronous': 'Async.'
        };
        
        const selectedDays = Array.from(dayCheckboxes)
            .map(checkbox => dayAbbreviations[checkbox.value] || checkbox.value);
        
        if (selectedDays.length > 0) {
            previewDays.textContent = selectedDays.join(', ');
            previewDays.style.display = 'inline-block';
        } else {
            previewDays.style.display = 'none';
        }
    }
    
    // Update preview image with initial if no image uploaded
    const previewImage = document.querySelector('.preview-image');
    if (previewImage && !uploadedImageUrl) {
        if (className && className.trim()) {
            // Show first letter as initial
            const initial = className.trim()[0].toUpperCase();
            previewImage.innerHTML = `<span style="font-size: 120px; font-weight: 600; color: #fff;">${initial}</span>`;
        } else {
            // Show empty box
            previewImage.innerHTML = '';
        }
    }
    
    // Adjust meta span font sizes
    const metaSpans = document.querySelectorAll('.preview-meta span');
    metaSpans.forEach(span => {
        const text = span.textContent;
        if (text.length > 15) {
            span.style.fontSize = 'clamp(10px, 2vw, 14px)';
        } else {
            span.style.fontSize = 'clamp(12px, 2.5vw, 18px)';
        }
    });
    
    console.log('Preview updated');
}

// Create class
async function createClass(event) {
    console.log('🚀 Create Class function called!');
    
    if (event) {
        event.preventDefault();
    }
    
    // Add visual feedback
    const createBtn = document.getElementById('createBtn');
    if (createBtn) {
        createBtn.textContent = 'Creating...';
        createBtn.disabled = true;
    }
    
    console.log('📝 Creating class...');
    
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in to create a class');
        console.error('No user logged in');
        // Reset button
        if (createBtn) {
            createBtn.textContent = 'Create Class';
            createBtn.disabled = false;
        }
        return;
    }
    
    console.log('User verified:', user.uid);
    
    // Get selected days with their times
    const dayCheckboxes = document.querySelectorAll('.day-checkbox');
    const selectedDays = Array.from(dayCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => {
            const dayItem = checkbox.closest('.day-item');
            const startTime = dayItem.querySelector('.day-start-time').value;
            const endTime = dayItem.querySelector('.day-end-time').value;
            const dayName = checkbox.value;
            
            return {
                day: dayName,
                startTime: startTime,
                endTime: endTime
            };
        });
    
    // Use the stored image URL (set by handleImageUpload)
    let imageUrl = uploadedImageUrl;
    
    // Check if image is too large for Firestore (1MB limit)
    if (imageUrl && imageUrl.length > 1000000) { // ~1MB in base64
        console.warn('Image too large for Firestore, removing...');
        imageUrl = null;
    }
    
    // Get all form data (save everything even if empty)
    const className = document.getElementById('className')?.value || '';
    const classTerm = document.getElementById('classTerm')?.value || '';
    const classYear = document.getElementById('classYear')?.value || '';
    const classLevel = document.getElementById('classLevel')?.value || '';
    const classRoom = document.getElementById('classRoom')?.value || '';
    const classInstructor = document.getElementById('classInstructor')?.value || '';
    const classMaterials = document.getElementById('classMaterials')?.value || '';
    
    // Validate required fields
    if (!className || !className.trim()) {
        alert('Please enter a class name to continue.');
        console.log('Validation failed: No class name');
        const classNameInput = document.getElementById('className');
        if (classNameInput) {
            classNameInput.focus();
        }
        // Reset button
        if (createBtn) {
            createBtn.textContent = 'Create Class';
            createBtn.disabled = false;
        }
        return;
    }
    
    if (!classLevel || !classLevel.trim()) {
        alert('Please select a class level to continue.');
        console.log('Validation failed: No class level');
        const classLevelSelect = document.getElementById('classLevel');
        if (classLevelSelect) {
            classLevelSelect.focus();
        }
        // Reset button
        if (createBtn) {
            createBtn.textContent = 'Create Class';
            createBtn.disabled = false;
        }
        return;
    }
    
    console.log('Validation passed, creating class...');
    
    const formData = {
        name: className,
        term: classTerm,
        year: classYear,
        level: classLevel,
        days: selectedDays,
        room: classRoom,
        userId: user.uid,
        instructor: classInstructor,
        materials: classMaterials,
        imageUrl: imageUrl,
        createdAt: new Date().toISOString()
    };
    
    try {
        console.log('Creating class with data:', formData);
        
        // Save to Firebase first
        let classId = null;
        let firebaseSaved = false;
        
        try {
            console.log('📡 Importing Firebase services...');
            const { classService } = await import('./firebase-services.js');
            console.log('💾 Saving class to Firebase...');
            console.log('📋 Class data being saved:', formData);
            classId = await classService.addClass(user.uid, formData);
            console.log('✅ Class saved to Firebase with ID:', classId);
            firebaseSaved = true;
            
            // Add the Firebase ID to the formData
            formData.id = classId;
        } catch (firebaseError) {
            console.error('❌ Firebase save error:', firebaseError);
            console.error('Error code:', firebaseError.code);
            console.error('Error message:', firebaseError.message);
            
            // Show error to user
            if (firebaseError.code === 'permission-denied') {
                alert('Firebase Permission Error: Please update your Firestore security rules to allow writes to the classes subcollection.');
            }
        }
        
        // Save to localStorage as backup (user-specific)
        const classes = JSON.parse(localStorage.getItem(`classes_${user.uid}`) || '[]');
        classes.push(formData);
        localStorage.setItem(`classes_${user.uid}`, JSON.stringify(classes));
        console.log('✅ Class saved to localStorage');
        
        console.log(`Class created successfully (Firebase: ${firebaseSaved ? 'YES' : 'NO'}, LocalStorage: YES)`);
        
        // Close the form and return to main screen
        cancelClassCreation();
        
        // Trigger class reload event instead of full page reload
        if (firebaseSaved) {
            // Dispatch event to reload classes from Firebase
            window.dispatchEvent(new CustomEvent('classCreated'));
            console.log('✅ Class creation event dispatched - dashboard will reload from Firebase');
        } else {
            // Fallback to page reload if Firebase save failed
            console.warn('⚠️ Firebase save failed, using page reload as fallback');
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
        
    } catch (error) {
        console.error('Error creating class:', error);
        alert('Error creating class: ' + error.message);
        // Reset button
        if (createBtn) {
            createBtn.textContent = 'Create Class';
            createBtn.disabled = false;
        }
    }
}

// Cancel class creation
function cancelClassCreation() {
    const formContainer = document.querySelector('.class-form-container');
    if (formContainer) {
        formContainer.remove();
    }
    
    // Show the dashboard content again
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
        dashboardContent.style.display = 'block';
    }
    
    // Show the add class button again (if there are classes)
    const addClassBtn = document.getElementById('addClassBtn');
    if (addClassBtn) {
        const user = getCurrentUser();
        const classes = JSON.parse(localStorage.getItem(`classes_${user?.uid}`) || localStorage.getItem('classes') || '[]');
        if (classes.length > 0) {
            addClassBtn.style.display = 'flex';
        }
    }
    
    // Show the sidebar again
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.display = 'flex';
    }
    
    // Show the header bar again
    const headerBar = document.querySelector('.header-bar');
    if (headerBar) {
        headerBar.style.display = 'flex';
    }
}

// Make functions globally available
window.addClass = addClass;
window.createClass = createClass;
window.cancelClassCreation = cancelClassCreation;

// Functions are already available on window object
