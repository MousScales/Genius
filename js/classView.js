// Import Firebase services dynamically to avoid timing issues
let documentService, folderService, studyGuideService, eventService;

async function getFirebaseServices() {
    if (!documentService) {
        // Wait for firebase-service.js to load with longer timeout and better error handling
        await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds timeout (50 * 100ms)
            
            const checkServices = () => {
                attempts++;
                
                console.log(`🔍 Checking Firebase services (attempt ${attempts}/${maxAttempts})...`);
                console.log('Available services:', {
                    documentService: !!window.documentService,
                    folderService: !!window.folderService,
                    studyGuideService: !!window.studyGuideService,
                    eventService: !!window.eventService
                });
                
                if (window.documentService && window.folderService && window.studyGuideService && window.eventService) {
                    documentService = window.documentService;
                    folderService = window.folderService;
                    studyGuideService = window.studyGuideService;
                    eventService = window.eventService;
                    console.log('✅ Firebase services loaded successfully');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('⚠️ Timeout waiting for Firebase services, using fallback');
                    // Create fallback services that use direct Firebase calls
                    documentService = createFallbackDocumentService();
                    folderService = createFallbackFolderService();
                    studyGuideService = createFallbackStudyGuideService();
                    eventService = createFallbackEventService();
                    console.log('✅ Using fallback Firebase services');
                    resolve();
                } else {
                    setTimeout(checkServices, 100);
                }
            };
            checkServices();
        });
    }
    return { documentService, folderService, studyGuideService, eventService };
}

// Class view module
function showClassView(classData) {
    console.log('Opening class view:', classData);
    
    // Start loading documents immediately, before UI changes
    console.log('🚀 Opening class view for:', classData.name);
    
    // Hide dashboard content
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
        dashboardContent.style.display = 'none';
    }
    
    // Hide add class button
    const addClassBtn = document.getElementById('addClassBtn');
    if (addClassBtn) {
        addClassBtn.style.display = 'none';
    }
    
    // Hide profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.style.display = 'none';
    }
    
    // Hide menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.style.display = 'none';
    }
    
    // Hide sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.display = 'none';
    }
    
    // Create class view
    const classView = createClassView(classData);
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
        mainWrapper.appendChild(classView);
    }
}

function createClassView(classData) {
    const viewContainer = document.createElement('div');
    viewContainer.className = 'class-view-container';
    viewContainer.id = 'classViewContainer';
    
    // Format days for display
    const daysText = classData.days && classData.days.length > 0
        ? classData.days.map(d => `${d.day} ${d.startTime}-${d.endTime}`).join(', ')
        : 'No schedule set';
    
    viewContainer.innerHTML = `
        <div class="class-view-header">
            <div class="class-header-banner" style="background: ${getClassColor(classData.name)};">
                <div class="class-header-content">
                    <button class="class-back-btn" id="classBackBtn" title="Back to Dashboard">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <div class="class-title-section">
                        <h1 class="class-view-title">${classData.name || 'Untitled Class'}</h1>
                        <p class="class-view-subtitle">${classData.term || ''} ${classData.year || ''}</p>
                    </div>
                </div>
            </div>
            <div class="class-header-tabs">
                <button class="class-tab active" data-tab="stream">Documents</button>
                <button class="class-tab" data-tab="classwork">Study Guides</button>
                <button class="class-tab" data-tab="calendar">Calendar</button>
            </div>
        </div>
        
        <div class="class-view-content">
            <aside class="class-sidebar">
                <div class="class-info-card">
                    <h3>Class Details</h3>
                    ${classData.instructor ? `
                        <div class="info-item">
                            <span class="info-label">Instructor</span>
                            <span class="info-value">${classData.instructor}</span>
                        </div>
                    ` : ''}
                    ${classData.level ? `
                        <div class="info-item">
                            <span class="info-label">Level</span>
                            <span class="info-value">${classData.level}</span>
                        </div>
                    ` : ''}
                    ${classData.room ? `
                        <div class="info-item">
                            <span class="info-label">Room</span>
                            <span class="info-value">${classData.room}</span>
                        </div>
                    ` : ''}
                    <div class="info-item">
                        <span class="info-label">Schedule</span>
                        <span class="info-value">${daysText}</span>
                    </div>
                </div>
                
                ${classData.materials ? `
                    <div class="class-info-card">
                        <h3>Materials & Links</h3>
                        <div class="materials-content">
                            ${formatMaterials(classData.materials)}
                        </div>
                    </div>
                ` : ''}
                
                <div class="class-info-card">
                    <h3>Upcoming Events</h3>
                    <div class="upcoming-events" id="upcomingEvents">
                        <div class="no-upcoming-events">No upcoming events</div>
                    </div>
                </div>
            </aside>
            
            <main class="class-main-content">
                <div class="stream-container" id="streamContent">
                    <div class="documents-actions">
                        <div class="doc-actions-left">
                            <button class="doc-action-btn" id="newDocBtn">
                                <span class="doc-icon">📝</span>
                                <span class="doc-text">New Document</span>
                            </button>
                            <button class="doc-action-btn" id="uploadDocBtn">
                                <span class="doc-icon">📤</span>
                                <span class="doc-text">Upload File</span>
                            </button>
                            <button class="doc-action-btn" id="createFolderBtn">
                                <span class="doc-icon">📁</span>
                                <span class="doc-text">Create Folder</span>
                            </button>
                        </div>
                        <div class="view-toggle">
                            <button class="view-toggle-btn active" id="listViewBtn" title="List View">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <rect x="3" y="4" width="14" height="2"/>
                                    <rect x="3" y="9" width="14" height="2"/>
                                    <rect x="3" y="14" width="14" height="2"/>
                                </svg>
                            </button>
                            <button class="view-toggle-btn" id="gridViewBtn" title="Grid View">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <rect x="3" y="3" width="6" height="6"/>
                                    <rect x="11" y="3" width="6" height="6"/>
                                    <rect x="3" y="11" width="6" height="6"/>
                                    <rect x="11" y="11" width="6" height="6"/>
                                </svg>
                            </button>
                        </div>
                        <input type="file" id="fileUploadInput" accept=".pdf,.doc,.docx,.txt,.jpg,.png" style="display: none;" multiple>
                    </div>
                    
                    <div class="documents-list" id="documentsList">
                        <!-- Documents will appear here -->
                    </div>
                    
                    <div class="empty-documents" id="emptyDocuments">
                        <div class="empty-stream-icon">📄</div>
                        <h3>No documents yet</h3>
                        <p>Create a new document or upload files to get started</p>
                    </div>
                </div>
                
                <div class="classwork-container hidden" id="classworkContent">
                    <div class="study-guides-actions">
                        <div class="study-guides-actions-left">
                            <button class="study-guide-action-btn" id="addStudyGuideBtn">
                                <span class="study-guide-text">Add New Study Content</span>
                            </button>
                        </div>
                        <div class="view-toggle">
                            <button class="view-toggle-btn active" id="studyGuideListViewBtn" title="List View">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <rect x="3" y="4" width="14" height="2"/>
                                    <rect x="3" y="9" width="14" height="2"/>
                                    <rect x="3" y="14" width="14" height="2"/>
                                </svg>
                            </button>
                            <button class="view-toggle-btn" id="studyGuideGridViewBtn" title="Grid View">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <rect x="3" y="3" width="6" height="6"/>
                                    <rect x="11" y="3" width="6" height="6"/>
                                    <rect x="3" y="11" width="6" height="6"/>
                                    <rect x="11" y="11" width="6" height="6"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="study-guides-list" id="studyGuidesList">
                        <!-- Study guides will appear here -->
                    </div>
                    
                    <div class="empty-study-guides" id="emptyStudyGuides">
                        <div class="empty-icon">📖</div>
                        <h3>No study guides yet</h3>
                        <p>Create study guides from your documents to help with studying</p>
                    </div>
                </div>
                
                <div class="calendar-container hidden" id="calendarContent">
                    <div class="calendar-header">
                        <div class="calendar-nav">
                            <button class="calendar-nav-btn" id="prevBtn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m15 18-6-6 6-6"/>
                                </svg>
                            </button>
                            <h2 class="calendar-month-year" id="calendarMonthYear">January 2024</h2>
                            <button class="calendar-nav-btn" id="nextBtn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m9 18 6-6-6-6"/>
                                </svg>
                            </button>
                        </div>
                        <div class="calendar-actions">
                            <button class="calendar-action-btn" id="addEventBtn">
                                <span>+</span> Add Event
                            </button>
                            <button class="calendar-action-btn" id="todayBtn">Today</button>
                        </div>
                    </div>
                    
                    <div class="calendar-main">
                        <div class="calendar-grid" id="calendarGrid">
                            <div class="calendar-weekdays">
                                <div class="calendar-weekday">Sun</div>
                                <div class="calendar-weekday">Mon</div>
                                <div class="calendar-weekday">Tue</div>
                                <div class="calendar-weekday">Wed</div>
                                <div class="calendar-weekday">Thu</div>
                                <div class="calendar-weekday">Fri</div>
                                <div class="calendar-weekday">Sat</div>
                            </div>
                            <div class="calendar-days" id="calendarDays">
                                <!-- Calendar days will be generated here -->
                            </div>
                        </div>
                        
                        <div class="calendar-events" id="calendarEvents">
                            <h3>Events for <span id="selectedDateText">Select a date</span></h3>
                            <div class="events-list" id="eventsList">
                                <div class="no-events">No events for this date</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;
    
        // Setup tab switching
        setTimeout(() => {
            const tabs = viewContainer.querySelectorAll('.class-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.dataset.tab;
                    switchTab(tabName);
                    
                    // Update active tab
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                });
            });
            
            // Setup back button
            const backBtn = document.getElementById('classBackBtn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    closeClassView();
                });
            }
        
        // Setup document actions
        setupDocumentActions(classData);
        
        // Setup study guide actions
        setupStudyGuideActions(classData);
        
        // Setup calendar actions
        setupCalendarActions(classData);
        
        // Load documents and study guides
        loadDocuments(classData);
        loadStudyGuides(classData);
    }, 300);
    
    return viewContainer;
}

function setupDocumentActions(classData) {
    const newDocBtn = document.getElementById('newDocBtn');
    const uploadDocBtn = document.getElementById('uploadDocBtn');
    const createFolderBtn = document.getElementById('createFolderBtn');
    const fileUploadInput = document.getElementById('fileUploadInput');
    const listViewBtn = document.getElementById('listViewBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');
    
    // Restore saved view mode from localStorage
    const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
    let currentViewMode = localStorage.getItem(viewModeKey) || 'list';
    
    // Set initial active button state
    if (currentViewMode === 'grid') {
        gridViewBtn?.classList.add('active');
        listViewBtn?.classList.remove('active');
    } else {
        listViewBtn?.classList.add('active');
        gridViewBtn?.classList.remove('active');
    }
    
    if (newDocBtn) {
        newDocBtn.addEventListener('click', async () => {
            console.log('New Document button clicked!');
            console.log('Class data:', classData);
            
            // Use global function
            if (typeof window.openDocumentEditor === 'function') {
                console.log('Using global openDocumentEditor function');
                window.openDocumentEditor(classData);
            } else {
                console.error('openDocumentEditor function not available');
                alert('Document editor could not be loaded. Please try again.');
            }
        });
    }
    
    if (uploadDocBtn && fileUploadInput) {
        uploadDocBtn.addEventListener('click', () => {
            fileUploadInput.click();
        });
        
        fileUploadInput.addEventListener('change', (e) => {
            handleFileUpload(e, classData);
        });
    }
    
    // View toggle buttons
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            currentViewMode = 'list';
            localStorage.setItem(viewModeKey, 'list');
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            loadDocuments(classData, 'list');
        });
    }
    
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            currentViewMode = 'grid';
            localStorage.setItem(viewModeKey, 'grid');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            loadDocuments(classData, 'grid');
        });
    }
    
    // Create folder button
    if (createFolderBtn) {
        createFolderBtn.addEventListener('click', () => {
            createNewFolder(classData);
        });
    }
}


// Initialize the assistants service
let assistantsClassView = null;

async function initializeAssistants() {
    if (!assistantsClassView) {
        try {
            // Get OpenAI API key from current user (same approach as other parts of the app)
            const currentUserData = localStorage.getItem('currentUser');
            if (!currentUserData) {
                throw new Error('User not logged in');
            }
            
            const currentUser = JSON.parse(currentUserData);
            console.log('Current user data:', currentUser);
            
            // Use global API key for all users
            const OPENAI_API_KEY = window.getOpenAIApiKey() || window.APP_CONFIG.OPENAI_API_KEY;
            console.log('Using global API key:', OPENAI_API_KEY ? 'Found' : 'Not found');
            
            if (!OPENAI_API_KEY) {
                throw new Error('OpenAI API key not found. Please contact support.');
            }

            // Try to import and create assistants service, but make it optional
            try {
                const { AssistantsClassView } = await import('./assistants-class-view.js');
                if (AssistantsClassView && typeof AssistantsClassView === 'function') {
                    assistantsClassView = new AssistantsClassView();
                    await assistantsClassView.initialize();
                    console.log('✅ Assistants service initialized');
                } else {
                    throw new Error('AssistantsClassView is not a valid constructor');
                }
            } catch (importError) {
                console.warn('⚠️ Assistants service not available, using fallback:', importError.message);
                // Create a fallback service that uses regular OpenAI API
                assistantsClassView = createFallbackAssistantsService(OPENAI_API_KEY);
                console.log('✅ Fallback assistants service initialized');
            }
        } catch (error) {
            console.error('❌ Failed to initialize assistants service:', error);
            throw error;
        }
    }
    return assistantsClassView;
}

// Fallback assistants service using regular OpenAI API
function createFallbackAssistantsService(apiKey) {
    return {
        async createThread() {
            // Return a mock thread ID for fallback
            return { id: 'fallback-thread-' + Date.now() };
        },
        async uploadFile(file) {
            // For fallback, we'll handle file content directly in the message
            return { id: 'fallback-file-' + Date.now() };
        },
        async createMessage(threadId, content, fileIds = []) {
            // Return a mock message ID for fallback
            return { id: 'fallback-message-' + Date.now() };
        },
        async runAssistant(content, attachments = []) {
            // This is the main method that actually uses the OpenAI API
            console.log('🔄 Using fallback OpenAI API for flashcard chat...');
            
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are Genius AI, a helpful assistant for students. Answer questions about flashcards and study materials. Be concise, helpful, and educational.'
                            },
                            {
                                role: 'user',
                                content: content
                            }
                        ],
                        max_tokens: 1000,
                        temperature: 0.7
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`OpenAI API error: ${response.status}`);
                }
                
                const data = await response.json();
                return data.choices[0].message.content;
                
            } catch (error) {
                console.error('❌ Fallback OpenAI API error:', error);
                throw error;
            }
        },
        async getMessages(threadId) {
            // No-op for fallback
            return { data: [] };
        }
    };
}

async function handleFileUpload(event, classData) {
    const files = event.target.files;
    if (!files.length) return;
    
    try {
        // Show loading indicator
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-indicator';
        loadingElement.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>Uploading files...</p>
            </div>
        `;
        document.body.appendChild(loadingElement);
        
        // Upload each file to Firebase
        const uploadedFiles = [];
        for (const file of files) {
            try {
                console.log('Uploading file:', file.name);
                
                // Create document object
                const documentData = {
                    title: file.name,
                    fileName: file.name,
                    type: file.type,
                    size: file.size,
                    uploadDate: new Date().toISOString(),
                    userId: classData.userId,
                    classId: classData.id,
                    folderId: 'default' // Upload to default folder
                };
                
                // Read file content
                const fileContent = await readFileAsDataURL(file);
                documentData.content = fileContent;
                
                // Save to Firebase
                const docId = await documentService.saveDocument(classData.userId, classData.id, documentData);
                console.log('Document saved with ID:', docId);
                
                uploadedFiles.push({
                    id: docId,
                    name: file.name,
                    type: file.type
                });
                
            } catch (fileError) {
                console.error('Error uploading file:', file.name, fileError);
                // Continue with other files
            }
        }
        
        // Remove loading indicator
        document.body.removeChild(loadingElement);
        
        if (uploadedFiles.length > 0) {
                        // Reload documents view
                        const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
                        const currentViewMode = localStorage.getItem(viewModeKey) || 'list';
                        await loadDocuments(classData, currentViewMode);
        }

    } catch (error) {
        console.error('Error uploading files:', error);
        alert('Error uploading files: ' + error.message);
        
        // Remove loading indicator if it exists
        const loadingElement = document.querySelector('.loading-indicator');
        if (loadingElement) {
            document.body.removeChild(loadingElement);
        }
    }
    
    // Clear the input
    event.target.value = '';
}

// Helper function to read file as data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}





async function loadDocuments(classData) {
    console.log('📄 Loading documents for:', classData.name);
    
    const documentsList = document.getElementById('documentsList');
    const emptyDocuments = document.getElementById('emptyDocuments');
    
    if (!documentsList) {
        console.error('❌ documentsList not found');
        return;
    }
    
    // Show loading
    documentsList.innerHTML = '<div class="loading-documents">Loading documents...</div>';
    if (emptyDocuments) emptyDocuments.style.display = 'none';
    
    try {
        console.log('📄 Starting document loading for class:', classData.name);
        console.log('📄 Class data:', { userId: classData.userId, classId: classData.id });
        
        // Load documents from Firebase with timeout protection
        const db = window.firebase.firestore();
        const documentsRef = db.collection('users').doc(classData.userId).collection('classes').doc(classData.id).collection('documents');
        
        console.log('📄 Firebase query starting...');
        
        // Try with orderBy first, fallback to simple query if it fails
        let querySnapshot;
        try {
            const queryPromise = documentsRef.orderBy('createdAt', 'desc').get();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Document query timeout after 10 seconds')), 10000)
            );
            
            querySnapshot = await Promise.race([queryPromise, timeoutPromise]);
            console.log('📄 Firebase query with orderBy completed');
        } catch (orderByError) {
            console.warn('⚠️ OrderBy query failed, trying simple query:', orderByError.message);
            // Fallback to simple query without orderBy
            const simpleQueryPromise = documentsRef.get();
            const simpleTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Simple query timeout after 10 seconds')), 10000)
            );
            
            querySnapshot = await Promise.race([simpleQueryPromise, simpleTimeoutPromise]);
            console.log('📄 Firebase simple query completed');
        }
        
        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('📄 Loaded documents from Firebase:', documents.length);
        
        // Load folders with timeout protection (optional - don't block if it fails)
        console.log('📄 Loading folders...');
        let folders = [];
        try {
            const foldersPromise = getFolders(classData);
            const foldersTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Folders query timeout after 5 seconds')), 5000)
            );
            
            folders = await Promise.race([foldersPromise, foldersTimeoutPromise]);
            console.log('📄 Loaded folders:', folders.length);
        } catch (foldersError) {
            console.warn('⚠️ Folders loading failed, continuing without folders:', foldersError.message);
            folders = []; // Use empty folders array
        }
        
        // Get view mode
        const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
        const viewMode = localStorage.getItem(viewModeKey) || 'list';
        
        console.log('📄 Rendering documents...');
        // Render documents
        renderDocuments(documents, folders, viewMode, classData);
        
        // Setup event listener for updates
        setupDocumentUpdateListener(classData);
        
        console.log('✅ Document loading completed successfully');
        
    } catch (error) {
        console.error('❌ Error loading documents:', error);
        console.error('❌ Error details:', error.message);
        documentsList.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Documents</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

function renderDocuments(documents, folders, viewMode, classData) {
    const documentsList = document.getElementById('documentsList');
    const emptyDocuments = document.getElementById('emptyDocuments');
    
    // Set view mode
    documentsList.className = viewMode === 'grid' ? 'documents-grid' : 'documents-list';
    
    if (documents.length === 0 && folders.length === 0) {
        documentsList.innerHTML = '';
        if (emptyDocuments) emptyDocuments.style.display = 'block';
        return;
    }
    
    // Hide empty state
    if (emptyDocuments) emptyDocuments.style.display = 'none';
    
    // Generate HTML
    let html = '';
    
    // All documents section
    if (documents.length > 0) {
        html += renderDocumentGroup(documents, viewMode, classData, 'All Documents');
    }
    
    // Folders
    folders.forEach(folder => {
        const folderDocs = documents.filter(doc => doc.folderId === folder.id);
        html += renderFolder(folder, folderDocs, viewMode, classData);
    });
    
    // Update DOM
    documentsList.innerHTML = html;
    
    // Setup interactions
    setupDocumentInteractions(documents, classData);
    setupDragAndDrop(classData);
    setupFolderFunctionality(classData);
}

function setupDocumentInteractions(documents, classData) {
    // Menu buttons
    document.querySelectorAll('.doc-menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const docId = btn.dataset.docId;
            const folderId = btn.dataset.folderId || 'root';
            const menu = document.getElementById(`menu-${docId}-${folderId}`) || document.getElementById(`grid-menu-${docId}-${folderId}`);
            
            closeAllMenus();
            
            if (menu) {
                const isGridMenu = menu.id.startsWith('grid-menu-');
                if (isGridMenu) {
                    menu.classList.add('grid-popup');
                } else {
                    // Smart positioning for list view dropdowns
                    positionDropdownSmart(btn, menu);
                    menu.classList.toggle('show');
                }
            }
        });
    });
    
    // Close menus on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.doc-card-actions') && !e.target.closest('.doc-info-right')) {
            closeAllMenus();
        }
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-doc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllMenus();
            const docId = btn.dataset.docId;
            const doc = documents.find(d => d.id === docId);
            if (doc && typeof window.openDocumentEditor === 'function') {
                window.openDocumentEditor(classData, doc);
            }
        });
    });
    
    // Download buttons
    document.querySelectorAll('.download-doc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllMenus();
            const docId = btn.dataset.docId;
            const doc = documents.find(d => d.id === docId);
            if (doc) downloadDocument(doc);
        });
    });
    
    // Rename buttons
    document.querySelectorAll('.rename-doc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllMenus();
            const docId = btn.dataset.docId;
            const doc = documents.find(d => d.id === docId);
            if (doc) {
                const newTitle = prompt('Enter new title:', doc.title);
                if (newTitle && newTitle.trim() && newTitle !== doc.title) {
                    renameDocument(classData, docId, newTitle.trim());
                }
            }
        });
    });
    
    // Move to folder buttons
    document.querySelectorAll('.move-to-folder-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllMenus();
            const docId = btn.dataset.docId;
            showMoveToFolderDialog(classData, documents.find(d => d.id === docId));
        });
    });
    
    // Share buttons
    document.querySelectorAll('.share-doc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllMenus();
            const docId = btn.dataset.docId;
            const doc = documents.find(d => d.id === docId);
            if (doc) shareDocument(doc);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-doc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllMenus();
            const docId = btn.dataset.docId;
            if (confirm('Are you sure you want to delete this document?')) {
                deleteDocument(classData, docId);
            }
        });
    });
    
    // Document card clicks
    document.querySelectorAll('.document-card, .document-grid-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.doc-card-actions, .doc-info-right, .doc-menu-btn')) {
                return;
            }
            
            const docId = card.dataset.docId;
            const doc = documents.find(d => d.id === docId);
            if (doc) {
                if (doc.type === 'text' && typeof window.openDocumentEditor === 'function') {
                    window.openDocumentEditor(classData, doc);
                } else {
                    openDocumentViewer(doc);
                }
            }
        });
    });
}

function setupDocumentUpdateListener(classData) {
    // Remove existing listener to avoid duplicates
    window.removeEventListener('documentsUpdated', handleDocumentsUpdated);
    
    // Add new listener
    window.addEventListener('documentsUpdated', handleDocumentsUpdated);
    
    function handleDocumentsUpdated() {
        console.log('🔄 Documents updated, reloading...');
        // Reload documents
        loadDocuments(classData);
    }
}

function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': '📕',
        'doc': '📘',
        'docx': '📘',
        'txt': '📄',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️'
    };
    return iconMap[ext] || '📎';
}

function downloadDocument(doc) {
    const link = document.createElement('a');
    link.href = doc.content;
    link.download = doc.fileName || doc.title;
    link.click();
}

function shareDocument(doc) {
    // Generate PDF and share it
    generateAndSharePDF(doc);
}

function generateAndSharePDF(doc) {
    try {
        // Create a temporary container for PDF generation
        const printContainer = document.createElement('div');
        printContainer.style.cssText = `
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: 8.5in;
            background: white;
            color: black;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        // Add title
        const titleEl = document.createElement('h1');
        titleEl.textContent = doc.title;
        titleEl.style.cssText = 'color: black; margin-bottom: 20px; font-size: 24px; text-align: center;';
        printContainer.appendChild(titleEl);
        
        // Add content
        const contentEl = document.createElement('div');
        contentEl.innerHTML = doc.content;
        contentEl.style.cssText = `
            color: black;
            background: white;
            padding: 1in;
            min-height: 9.5in;
            page-break-after: auto;
            line-height: 1.6;
        `;
        printContainer.appendChild(contentEl);
        
        document.body.appendChild(printContainer);
        
        // Use browser's print dialog with the container
        const originalContents = document.body.innerHTML;
        const originalTitle = document.title;
        document.body.innerHTML = printContainer.innerHTML;
        document.title = doc.title; // Set the filename
        
        // Try to use the Web Share API with PDF
        if (navigator.share) {
            // For now, we'll use the print dialog and then try to share
            window.print();
            
            // After printing, try to share
            setTimeout(() => {
                navigator.share({
                    title: doc.title,
                    text: `Check out my document: ${doc.title}`,
                    files: [] // Note: Web Share API doesn't support PDF files directly in all browsers
                }).catch(err => {
                    console.log('Share cancelled or not supported');
                    // Fallback to clipboard
                    copyToClipboard(`Check out my document: ${doc.title}`);
                });
            }, 1000);
        } else {
            // Fallback: show print dialog and copy text to clipboard
            window.print();
            setTimeout(() => {
                copyToClipboard(`Check out my document: ${doc.title}`);
            }, 1000);
        }
        
        // Restore original content
        setTimeout(() => {
            document.body.innerHTML = originalContents;
            document.title = originalTitle;
            document.body.removeChild(printContainer);
        }, 2000);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    alert('Document PDF is ready to print! Share text copied to clipboard.');
}

async function deleteDocument(classData, docId) {
    try {
        await documentService.deleteDocument(classData.userId, classData.id, docId);
    
    // Reload with current view mode
    const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
    const currentViewMode = localStorage.getItem(viewModeKey) || 'list';
        await loadDocuments(classData, currentViewMode);
    } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting document. Please try again.');
    }
}

function switchTab(tabName) {
    // Hide all content containers
    document.querySelectorAll('.stream-container, .classwork-container, .calendar-container').forEach(container => {
        container.classList.add('hidden');
    });
    
    // Show selected content
    const contentMap = {
        'stream': 'streamContent',
        'classwork': 'classworkContent',
        'calendar': 'calendarContent'
    };
    
    const contentId = contentMap[tabName];
    const content = document.getElementById(contentId);
    if (content) {
        content.classList.remove('hidden');
    }
}

function getClassColor(className) {
    // Generate a color based on class name
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    ];
    
    let hash = 0;
    for (let i = 0; i < className.length; i++) {
        hash = className.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function formatMaterials(materials) {
    if (!materials) return '<p>No materials yet</p>';
    
    // Split by newlines and format as links if they look like URLs
    const lines = materials.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '<p>No materials yet</p>';
    
    return lines.map(line => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        if (urlRegex.test(line)) {
            return `<a href="${line.trim()}" target="_blank" class="material-link">🔗 ${line.trim()}</a>`;
        } else {
            return `<p class="material-text">${line}</p>`;
        }
    }).join('');
}

function closeClassView() {
    // Save suggestions before closing class view
    if (window.saveCurrentSuggestions) {
        window.saveCurrentSuggestions();
    }
    
    const classView = document.getElementById('classViewContainer');
    if (classView) {
        classView.remove();
    }
    
    // Show dashboard content
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
        dashboardContent.style.display = 'block';
    }
    
    // Show add class button if there are classes
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    const addClassBtn = document.getElementById('addClassBtn');
    if (addClassBtn && classes.length > 0) {
        addClassBtn.style.display = 'flex';
    }
    
    // Show profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.style.display = 'flex';
    }
    
    // Show menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.style.display = 'flex';
    }
    
    // Show sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.display = 'flex';
    }
}

function openDocumentViewer(doc) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'document-viewer-modal';
    modal.innerHTML = `
        <div class="document-viewer-content">
            <div class="document-viewer-header">
                <h3>${doc.title || doc.fileName}</h3>
                <div class="document-viewer-actions">
                    <button class="doc-viewer-btn" id="downloadViewerDoc" title="Download">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                    <button class="doc-viewer-btn" id="closeViewerModal" title="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="document-viewer-body">
                ${getDocumentViewerContent(doc)}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('closeViewerModal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('downloadViewerDoc').addEventListener('click', () => {
        downloadDocument(doc);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function getDocumentViewerContent(doc) {
    const type = doc.type || '';
    
    // PDF files
    if (type.includes('pdf') || doc.fileName?.endsWith('.pdf')) {
        return `<iframe src="${doc.content}" class="document-viewer-iframe" type="application/pdf"></iframe>`;
    }
    
    // Images
    if (type.startsWith('image/')) {
        return `<img src="${doc.content}" alt="${doc.fileName}" class="document-viewer-image">`;
    }
    
    // Videos
    if (type.startsWith('video/')) {
        return `<video src="${doc.content}" controls class="document-viewer-video"></video>`;
    }
    
    // Audio
    if (type.startsWith('audio/')) {
        return `
            <div class="document-viewer-audio-container">
                <div class="audio-icon">🎵</div>
                <audio src="${doc.content}" controls class="document-viewer-audio"></audio>
            </div>
        `;
    }
    
    // Other files - show preview with download option
    return `
        <div class="document-viewer-fallback">
            <div class="fallback-icon">${getFileIcon(doc.fileName)}</div>
            <h3>${doc.fileName}</h3>
            <p>File size: ${(doc.fileSize / 1024).toFixed(2)} KB</p>
            <p>This file type cannot be previewed in the browser.</p>
            <button class="btn" onclick="document.getElementById('downloadViewerDoc').click()">Download File</button>
        </div>
    `;
}

// Document Rendering Helper Functions
function renderDocumentGroup(documents, viewMode, classData, groupTitle = null) {
    console.log('🎨 renderDocumentGroup called with:', {
        documentsCount: documents.length,
        viewMode,
        groupTitle,
        classDataName: classData.name
    });
    
    if (documents.length === 0) {
        console.log('⚠️ No documents to render in group');
        return '';
    }
    
    let html = '';
    
    if (groupTitle) {
        // Get root documents expansion state from localStorage
        const rootExpandedKey = `root_documents_expanded_${classData.userId}_${classData.name}`;
        const isRootExpanded = localStorage.getItem(rootExpandedKey) !== 'false'; // Default to expanded
        
        console.log('Rendering group with expanded state:', isRootExpanded);
        
        html += `<div class="document-group-section" data-group="root">
            <div class="document-group-header" onclick="toggleRootDocumentsExpansion(${JSON.stringify(classData).replace(/"/g, '&quot;')})">
                <div class="group-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                    </svg>
                </div>
                <div class="group-info">
                    <h3 class="group-title">${groupTitle}</h3>
                    <span class="group-count">${documents.length} document${documents.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="group-expand">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="expand-icon ${isRootExpanded ? 'expanded' : ''}">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                </div>
            </div>
            <div class="group-documents ${isRootExpanded ? 'expanded' : 'collapsed'}">
        `;
    }
    
    if (viewMode === 'grid') {
        // Add a container for grid documents to maintain proper spacing
        html += '<div class="documents-grid-container">';
        documents.forEach(doc => {
            html += renderDocumentCard(doc, viewMode, classData, 'root');
        });
        html += '</div>';
    } else {
        documents.forEach(doc => {
            html += renderDocumentItem(doc, viewMode, classData, 'root');
        });
    }
    
    if (groupTitle) {
        html += `
            </div>
        </div>`;
    }
    
    console.log('🎨 renderDocumentGroup returning HTML length:', html.length);
    console.log('🎨 renderDocumentGroup HTML preview:', html.substring(0, 200) + '...');
    
    return html;
}

function renderFolder(folder, documents, viewMode, classData) {
    const isExpanded = folder.isExpanded;
    const documentCount = documents.length;
    
    let html = `
        <div class="folder-section" data-folder-id="${folder.id}">
            <div class="folder-header">
                <div class="folder-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                    </svg>
                </div>
                <div class="folder-info">
                    <h3 class="folder-name">${folder.name}</h3>
                    <span class="folder-count">${documentCount} document${documentCount !== 1 ? 's' : ''}</span>
                </div>
                <div class="folder-actions">
                    <button class="folder-action-btn" title="Rename">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="folder-action-btn" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
                <div class="folder-expand">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="expand-icon ${isExpanded ? 'expanded' : ''}">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                </div>
            </div>
            <div class="folder-drop-zone" data-folder-id="${folder.id}" style="opacity: 0;">
                <span class="drop-zone-text">Drop documents here</span>
            </div>
            <div class="folder-documents ${isExpanded ? 'expanded' : 'collapsed'}">
    `;
    
    if (documents.length > 0) {
        if (viewMode === 'grid') {
            html += '<div class="documents-grid-container">';
            documents.forEach(doc => {
                html += renderDocumentCard(doc, viewMode, classData, folder.id);
            });
            html += '</div>';
        } else {
            documents.forEach(doc => {
                html += renderDocumentItem(doc, viewMode, classData, folder.id);
            });
        }
    } else {
        html += '<div class="empty-folder">No documents in this folder</div>';
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'No date' : date.toLocaleDateString();
}

function renderDocumentCard(doc, viewMode, classData, folderId = null) {
    const date = formatDate(doc.updatedAt);
    
    // Generate preview based on document type
    let previewHtml = '';
    
    if (doc.type === 'text') {
        // Text documents - render first page content
        const pages = doc.content.split('<div class="page-break"></div>');
        const firstPage = pages[0] || doc.content;
        previewHtml = `
            <div class="doc-preview-container">
                <div class="doc-preview-page-scaled">${firstPage || '<span class="empty-doc-text">Empty document</span>'}</div>
            </div>
        `;
    } else if (doc.type && doc.type.includes('pdf')) {
        // PDF files - show iframe preview
        previewHtml = `<iframe src="${doc.content}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH" class="doc-preview-pdf" frameborder="0"></iframe>`;
    } else if (doc.type && doc.type.startsWith('image/')) {
        // Image files - show image preview
        previewHtml = `<img src="${doc.content}" alt="${doc.fileName}" class="doc-preview-image-file">`;
    } else {
        // Other files - show icon
        previewHtml = `<div class="doc-preview-icon">${getFileIcon(doc.fileName)}</div>`;
    }
    
    return `
        <div class="document-grid-card" data-doc-id="${doc.id}" draggable="true">
            <div class="doc-grid-preview-wrapper">
                <div class="doc-grid-preview">
                    ${previewHtml}
                </div>
            </div>
            <div class="doc-grid-info">
                <div class="doc-info-left">
                    <h4 class="doc-grid-title">${doc.title}</h4>
                    <p class="doc-grid-date">Date added: ${date}</p>
                </div>
                <div class="doc-info-right">
                    <button class="doc-menu-btn doc-menu-btn-grid" data-doc-id="${doc.id}" data-folder-id="${folderId || 'root'}">
                        <span class="doc-menu-icon">⋮</span>
                    </button>
                    <div class="doc-menu-dropdown" id="grid-menu-${doc.id}-${folderId || 'root'}">
                        ${doc.type === 'text' ? 
                            `<button class="menu-item edit-doc-btn" data-doc-id="${doc.id}">
                                <span>✏️</span> Edit
                            </button>` : 
                            ''
                        }
                        <button class="menu-item rename-doc-btn" data-doc-id="${doc.id}">
                            <span>📝</span> Rename
                        </button>
                        <button class="menu-item download-doc-btn" data-doc-id="${doc.id}">
                            <span>📥</span> Download
                        </button>
                        <button class="menu-item move-to-folder-btn" data-doc-id="${doc.id}">
                            <span>📁</span> Add to Folder
                        </button>
                        <button class="menu-item share-doc-btn" data-doc-id="${doc.id}">
                            <span>🔗</span> Share
                        </button>
                        <button class="menu-item delete-doc-btn" data-doc-id="${doc.id}">
                            <span>✕</span> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderDocumentItem(doc, viewMode, classData, folderId = null) {
    const date = formatDate(doc.updatedAt);
    
    return `
        <div class="document-card" data-doc-id="${doc.id}" draggable="true">
            <div class="doc-info">
                <h4 class="doc-title">${doc.title}</h4>
                <p class="doc-date">Date added: ${date}</p>
            </div>
            <div class="doc-card-actions">
                <button class="doc-menu-btn" data-doc-id="${doc.id}" data-folder-id="${folderId || 'root'}">
                    <span class="doc-menu-icon">⋮</span>
                </button>
                <div class="doc-menu-dropdown" id="menu-${doc.id}-${folderId || 'root'}">
                    ${doc.type === 'text' ? 
                        `<button class="menu-item edit-doc-btn" data-doc-id="${doc.id}">
                            <span>✏️</span> Edit
                        </button>` : 
                        ''
                    }
                    <button class="menu-item rename-doc-btn" data-doc-id="${doc.id}">
                        <span>📝</span> Rename
                    </button>
                    <button class="menu-item download-doc-btn" data-doc-id="${doc.id}">
                        <span>📥</span> Download
                    </button>
                    <button class="menu-item move-to-folder-btn" data-doc-id="${doc.id}">
                        <span>📁</span> Add to Folder
                    </button>
                    <button class="menu-item share-doc-btn" data-doc-id="${doc.id}">
                        <span>🔗</span> Share
                    </button>
                    <button class="menu-item delete-doc-btn" data-doc-id="${doc.id}">
                        <span>✕</span> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

function setupDragAndDrop(classData) {
    const documentsList = document.getElementById('documentsList');
    if (!documentsList) return;
    
    let draggedElement = null;
    let draggedDocumentId = null;
    
    // Handle drag start
    documentsList.addEventListener('dragstart', (e) => {
        if (e.target.closest('.document-card, .document-grid-card')) {
            draggedElement = e.target.closest('.document-card, .document-grid-card');
            draggedDocumentId = draggedElement.dataset.docId;
            draggedElement.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedDocumentId);
            
            // Show all drop zones when dragging starts
            const allDropZones = document.querySelectorAll('.folder-drop-zone');
            console.log('Found drop zones:', allDropZones.length);
            allDropZones.forEach((zone, index) => {
                console.log(`Drop zone ${index}:`, zone, 'dataset:', zone.dataset);
                zone.style.opacity = '0.3';
            });
        }
    });
    
    // Handle drag end
    documentsList.addEventListener('dragend', (e) => {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            draggedElement = null;
            draggedDocumentId = null;
        }
        
        // Hide all drop zones when dragging ends
        document.querySelectorAll('.folder-drop-zone').forEach(zone => {
            zone.style.opacity = '0';
            zone.classList.remove('drop-zone-active');
        });
    });
    
    // Handle drag over
    documentsList.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const dropZone = e.target.closest('.folder-drop-zone');
        
        if (dropZone) {
            // Make the hovered drop zone more visible
            dropZone.style.opacity = '1';
            dropZone.classList.add('drop-zone-active');
        } else {
            // Reset all drop zones to normal visibility
            document.querySelectorAll('.folder-drop-zone').forEach(zone => {
                if (!zone.classList.contains('drop-zone-active')) {
                    zone.style.opacity = '0.3';
                }
            });
        }
    });
    
    // Handle drag leave
    documentsList.addEventListener('dragleave', (e) => {
        const dropZone = e.target.closest('.folder-drop-zone');
        if (dropZone && !dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drop-zone-active');
        }
    });
    
    // Handle drop
    documentsList.addEventListener('drop', (e) => {
        e.preventDefault();
        console.log('Drop event triggered');
        console.log('Drop target:', e.target);
        console.log('Drop currentTarget:', e.currentTarget);
        
        const dropZone = e.target.closest('.folder-drop-zone');
        console.log('Drop zone found:', dropZone);
        console.log('Drop zone dataset:', dropZone ? dropZone.dataset : 'none');
        console.log('Dragged document ID:', draggedDocumentId);
        
        // Also try finding drop zone by checking if target is a drop zone itself
        if (!dropZone && e.target.classList.contains('folder-drop-zone')) {
            console.log('Target is drop zone itself:', e.target);
            const directDropZone = e.target;
            console.log('Direct drop zone dataset:', directDropZone.dataset);
            
            if (directDropZone && draggedDocumentId) {
                const folderId = directDropZone.dataset.folderId;
                const targetFolderId = folderId === 'root' ? null : folderId;
                console.log('Moving document to folder (direct):', targetFolderId);
                
                // Move document to folder
                if (moveDocumentToFolder(draggedDocumentId, targetFolderId, classData)) {
                    console.log('Document moved successfully (direct)');
                    // Reload documents to show the change
                    const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
                    const currentViewMode = localStorage.getItem(viewModeKey) || 'list';
                    loadDocuments(classData, currentViewMode);
                } else {
                    console.log('Failed to move document (direct)');
                }
            }
        } else if (dropZone && draggedDocumentId) {
            const folderId = dropZone.dataset.folderId;
            const targetFolderId = folderId === 'root' ? null : folderId;
            console.log('Moving document to folder:', targetFolderId);
            
            // Move document to folder
            if (moveDocumentToFolder(draggedDocumentId, targetFolderId, classData)) {
                console.log('Document moved successfully');
                // Reload documents to show the change
                const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
                const currentViewMode = localStorage.getItem(viewModeKey) || 'list';
                loadDocuments(classData, currentViewMode);
            } else {
                console.log('Failed to move document');
            }
        } else {
            console.log('No valid drop zone or document ID found');
        }
        
        // Remove all drop zone highlights
        document.querySelectorAll('.folder-drop-zone.drop-zone-active').forEach(zone => {
            zone.classList.remove('drop-zone-active');
        });
    });
}

// Setup folder functionality
function setupFolderFunctionality(classData) {
    console.log('Setting up folder functionality');
    
    // Remove existing event listeners to prevent duplicates
    document.querySelectorAll('.folder-header').forEach(header => {
        header.replaceWith(header.cloneNode(true));
    });
    
    document.querySelectorAll('.folder-action-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
    
    // Folder expand/collapse
    document.querySelectorAll('.folder-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const folderId = header.closest('[data-folder-id]')?.dataset.folderId;
            console.log('Folder header clicked, folderId:', folderId);
            if (folderId) {
                toggleFolderExpansion(folderId, classData);
            }
        });
    });
    
    // Folder action buttons
    document.querySelectorAll('.folder-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.title;
            const folderId = btn.closest('[data-folder-id]')?.dataset.folderId;
            console.log('Folder action clicked:', action, 'folderId:', folderId);
            
            if (action === 'Rename' && folderId) {
                renameFolder(folderId, classData);
            } else if (action === 'Delete' && folderId) {
                deleteFolder(folderId, classData);
            }
        });
    });
    
    console.log('Folder functionality setup complete');
}

// Menu Management Functions
function closeAllMenus() {
    document.querySelectorAll('.doc-menu-dropdown').forEach(m => {
        m.classList.remove('show', 'grid-popup');
    });
}

function positionDropdownSmart(button, dropdown) {
    // Reset any previous positioning
    dropdown.style.top = '';
    dropdown.style.bottom = '';
    dropdown.style.transform = '';
    
    // Get button and dropdown dimensions
    const buttonRect = button.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate available space below and above the button
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    // Estimate dropdown height (approximate)
    const estimatedDropdownHeight = 300; // Approximate height for 6-7 menu items
    
    // Check if dropdown would be cut off at the bottom
    if (spaceBelow < estimatedDropdownHeight && spaceAbove > estimatedDropdownHeight) {
        // Position above the button
        dropdown.style.top = 'auto';
        dropdown.style.bottom = '100%';
        dropdown.style.marginTop = '0';
        dropdown.style.marginBottom = '4px';
        dropdown.style.transform = 'translateY(10px) scale(0.95)';
    } else {
        // Position below the button (default)
        dropdown.style.top = '100%';
        dropdown.style.bottom = 'auto';
        dropdown.style.marginTop = '4px';
        dropdown.style.marginBottom = '0';
        dropdown.style.transform = 'translateY(-10px) scale(0.95)';
    }
    
    // Check if dropdown would be cut off on the right side
    const spaceRight = viewportWidth - buttonRect.right;
    const estimatedDropdownWidth = 200;
    
    if (spaceRight < estimatedDropdownWidth) {
        // Position to the left of the button
        dropdown.style.right = 'auto';
        dropdown.style.left = '0';
    } else {
        // Position to the right of the button (default)
        dropdown.style.right = '0';
        dropdown.style.left = 'auto';
    }
}


// Document Management Functions
function renameDocument(classData, doc) {
    const newName = prompt('Enter new document name:', doc.title);
    if (!newName || !newName.trim() || newName.trim() === doc.title) return;
    
    const documentsKey = `class_${classData.userId}_${classData.name}_documents`;
    let documents = JSON.parse(localStorage.getItem(documentsKey) || '[]');
    
    const docIndex = documents.findIndex(d => d.id === doc.id);
    if (docIndex !== -1) {
        documents[docIndex].title = newName.trim();
        documents[docIndex].updatedAt = new Date().toISOString();
        localStorage.setItem(documentsKey, JSON.stringify(documents));
        
        // Reload documents to show the change
        const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
        const currentViewMode = localStorage.getItem(viewModeKey) || 'list';
        loadDocuments(classData, currentViewMode);
    }
}

function showMoveToFolderDialog(classData, doc) {
    const folders = getFolders(classData);
    
    if (folders.length === 0) {
        alert('No folders available. Create a folder first.');
        return;
    }
    
    let folderOptions = 'Select a folder:\n\n';
    folderOptions += '0. Move to Root (All Documents)\n';
    folders.forEach((folder, index) => {
        folderOptions += `${index + 1}. ${folder.name}\n`;
    });
    
    const choice = prompt(folderOptions);
    if (choice === null) return; // User cancelled
    
    const choiceNum = parseInt(choice);
    if (isNaN(choiceNum) || choiceNum < 0 || choiceNum > folders.length) {
        alert('Invalid selection');
        return;
    }
    
    let targetFolderId = null;
    if (choiceNum > 0) {
        targetFolderId = folders[choiceNum - 1].id;
    }
    
    // Move document to selected folder
    if (moveDocumentToFolder(doc.id, targetFolderId, classData)) {
        // Reload documents to show the change
        const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
        const currentViewMode = localStorage.getItem(viewModeKey) || 'list';
        loadDocuments(classData, currentViewMode);
    }
}

// Root Documents Management Functions
window.toggleRootDocumentsExpansion = function(classData) {
    console.log('toggleRootDocumentsExpansion called', classData);
    const rootExpandedKey = `root_documents_expanded_${classData.userId}_${classData.name}`;
    const currentState = localStorage.getItem(rootExpandedKey) !== 'false';
    const newState = !currentState;
    
    console.log('Current state:', currentState, 'New state:', newState);
    localStorage.setItem(rootExpandedKey, newState.toString());
    
    // Update the UI
    const groupSection = document.querySelector('[data-group="root"]');
    console.log('Group section found:', !!groupSection);
    
    if (groupSection) {
        const expandIcon = groupSection.querySelector('.expand-icon');
        const groupDocuments = groupSection.querySelector('.group-documents');
        
        console.log('Expand icon found:', !!expandIcon);
        console.log('Group documents found:', !!groupDocuments);
        
        if (expandIcon) {
            expandIcon.classList.toggle('expanded', newState);
            console.log('Expand icon classes:', expandIcon.className);
        }
        
        if (groupDocuments) {
            groupDocuments.classList.toggle('expanded', newState);
            groupDocuments.classList.toggle('collapsed', !newState);
            console.log('Group documents classes:', groupDocuments.className);
        }
    }
}

// Folder Management Functions
async function createNewFolder(classData) {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;
    
    try {
        console.log('📁 Creating new folder:', folderName.trim());
        
        const newFolder = {
            name: folderName.trim(),
            documents: [],
            isExpanded: true
        };
        
        // Try to use service first, fallback to direct Firebase if needed
        try {
            const { folderService } = await getFirebaseServices();
            
            if (!folderService) {
                throw new Error('Folder service not available');
            }
            
            console.log('📁 Using folder service...');
            await folderService.saveFolder(classData.userId, classData.id, newFolder);
        } catch (serviceError) {
            console.log('📁 Service failed, trying direct Firebase...', serviceError.message);
            
            // Check if Firebase is available
            if (!window.firebase || !window.firebase.firestore) {
                throw new Error('Firebase is not initialized. Please refresh the page and try again.');
            }
            
            // Fallback to direct Firebase call
            const db = window.firebase.firestore();
            const foldersRef = db.collection('users').doc(classData.userId).collection('classes').doc(classData.id).collection('folders');
            
            console.log('📁 Saving folder directly to Firebase...');
            await foldersRef.add({
                name: newFolder.name,
                documents: newFolder.documents,
                isExpanded: newFolder.isExpanded,
                createdAt: new Date()
            });
        }
        
        console.log('📁 Folder saved successfully');
        
        // Reload documents to show the new folder
        const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
        const currentViewMode = localStorage.getItem(viewModeKey) || 'list';
        await loadDocuments(classData, currentViewMode);
        
        console.log('📁 Documents reloaded, folder should now be visible');
    } catch (error) {
        console.error('❌ Error creating folder:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            classData: classData
        });
        alert(`Error creating folder: ${error.message}. Please try again.`);
    }
}

async function getFolders(classData) {
    try {
        console.log('📁 Getting folders for class:', classData.name);
        
        // Use direct Firebase query instead of service layer
        const db = window.firebase.firestore();
        const foldersRef = db.collection('users').doc(classData.userId).collection('classes').doc(classData.id).collection('folders');
        
        const querySnapshot = await foldersRef.get();
        const folders = [];
        
        querySnapshot.forEach((doc) => {
            folders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('📁 Loaded folders from Firebase:', folders.length);
        return folders;
        
    } catch (error) {
        console.error('❌ Error getting folders:', error);
        return []; // Return empty array on error
    }
}

async function saveFolders(classData, folders) {
    try {
        // Save to Firebase
        const { folderService } = await getFirebaseServices();
        await folderService.saveFolders(classData.userId, classData.id, folders);
        console.log('Folders saved to Firebase');
    } catch (error) {
        console.error('Error saving folders to Firebase:', error);
    }
    
    // Also save to localStorage as backup
    const storageKey = `class_${classData.userId}_${classData.name}_folders`;
    localStorage.setItem(storageKey, JSON.stringify(folders));
}

async function moveDocumentToFolder(documentId, folderId, classData) {
    console.log('moveDocumentToFolder called with:', { documentId, folderId, classData });
    
    try {
    // Update document's folder reference
        const { documentService } = await getFirebaseServices();
        await documentService.updateDocument(classData.userId, classData.id, documentId, {
            folderId: folderId || null
        });
    
    console.log('Document moved successfully');
    return true;
    } catch (error) {
        console.error('Error moving document:', error);
        return false;
    }
}

window.toggleFolderExpansion = function(folderId, classData) {
    const folders = getFolders(classData);
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
        folder.isExpanded = !folder.isExpanded;
        saveFolders(classData, folders);
        
        // Reload documents to update UI
        const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
        const currentViewMode = localStorage.getItem(viewModeKey) || 'list';
        loadDocuments(classData, currentViewMode);
    }
}

window.deleteFolder = function(folderId, classData) {
    if (!confirm('Are you sure you want to delete this folder? Documents inside will be moved to the root level.')) {
        return;
    }
    
    const folders = getFolders(classData);
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    
    // Move all documents in this folder to root level
    const documentsKey = `class_${classData.userId}_${classData.name}_documents`;
    let documents = JSON.parse(localStorage.getItem(documentsKey) || '[]');
    
    documents.forEach(doc => {
        if (doc.folderId === folderId) {
            doc.folderId = null;
        }
    });
    
    // Remove the folder
    const updatedFolders = folders.filter(f => f.id !== folderId);
    saveFolders(classData, updatedFolders);
    localStorage.setItem(documentsKey, JSON.stringify(documents));
    
    // Reload documents
    const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
    const currentViewMode = localStorage.getItem(viewModeKey) || 'list';
    loadDocuments(classData, currentViewMode);
}

window.renameFolder = function(folderId, classData) {
    const folders = getFolders(classData);
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const newName = prompt('Enter new folder name:', folder.name);
    if (!newName || !newName.trim() || newName.trim() === folder.name) return;
    
    folder.name = newName.trim();
    saveFolders(classData, folders);
    
    // Reload documents
    const viewModeKey = `class_${classData.userId}_${classData.name}_viewMode`;
    const currentViewMode = localStorage.getItem(viewModeKey) || 'list';
    loadDocuments(classData, currentViewMode);
}

// Study Guide Functions
function showFlashcardCreationOptions(classData) {
    // Create modal for flashcard creation options
    const modal = document.createElement('div');
    modal.className = 'flashcard-options-modal';
    modal.innerHTML = `
        <div class="flashcard-options-modal-content">
            <div class="flashcard-options-modal-header">
                <h3>Create Flashcards</h3>
                <button class="close-modal-btn" id="closeFlashcardOptionsModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="flashcard-options-modal-body">
                <p>How would you like to create your flashcards?</p>
                <div class="flashcard-options">
                    <div class="flashcard-option" data-option="explain">
                        <div class="option-icon">💭</div>
                        <h4>Explain What You Want</h4>
                        <p>Tell Genius AI what topic or subject you want flashcards for, and it will create them for you</p>
                    </div>
                    <div class="flashcard-option" data-option="folder">
                        <div class="option-icon">📁</div>
                        <h4>Use Documents from Folder</h4>
                        <p>Select a folder with your documents and Genius AI will create flashcards based on that content</p>
                    </div>
                    <div class="flashcard-option" data-option="manual">
                        <div class="option-icon">✏️</div>
                        <h4>Create Manually</h4>
                        <p>Create your own flashcards by typing in the questions and answers yourself</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('closeFlashcardOptionsModal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Option selection
    modal.querySelectorAll('.flashcard-option').forEach(option => {
        option.addEventListener('click', async () => {
            const optionType = option.dataset.option;
            document.body.removeChild(modal);
            
            if (optionType === 'explain') {
                showFlashcardExplanationDialog(classData);
            } else if (optionType === 'folder') {
                await showFolderSelectionDialog(classData, 'flashcards');
            } else if (optionType === 'manual') {
                showManualFlashcardCreator(classData);
            }
        });
    });
}

function showFlashcardExplanationDialog(classData) {
    // Create modal for flashcard explanation
    const modal = document.createElement('div');
    modal.className = 'flashcard-explanation-modal';
    modal.innerHTML = `
        <div class="flashcard-explanation-modal-content">
            <div class="flashcard-explanation-modal-header">
                <h3>What Flashcards Do You Want?</h3>
                <button class="close-modal-btn" id="closeFlashcardExplanationModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="flashcard-explanation-modal-body">
                <p>Describe what you want to study. Be as specific as possible for better results!</p>
                <div class="explanation-input-group">
                    <textarea id="flashcardExplanation" placeholder="e.g., 'Create flashcards about the periodic table elements, their symbols, atomic numbers, and properties' or 'Make flashcards for Spanish vocabulary words with English translations' or 'Generate flashcards about World War 2 key events, dates, and important figures'" rows="4" maxlength="500"></textarea>
                    <div class="input-hint">Maximum 500 characters. Be specific about the topic, level, and what you want to learn.</div>
                </div>
                <div class="explanation-actions">
                    <button class="explanation-btn secondary" id="cancelExplanation">Cancel</button>
                    <button class="explanation-btn primary" id="confirmExplanation">Create Flashcards</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('closeFlashcardExplanationModal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Cancel button
    document.getElementById('cancelExplanation').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Confirm button
    document.getElementById('confirmExplanation').addEventListener('click', async () => {
        const explanation = document.getElementById('flashcardExplanation').value.trim();
        if (!explanation) {
            alert('Please describe what flashcards you want to create.');
            return;
        }
        
        document.body.removeChild(modal);
        await createFlashcardsFromExplanation(classData, explanation);
    });
}

async function createFlashcardsFromExplanation(classData, explanation) {
    try {
        // Show brain icon thinking effect
        if (window.CSharpFlashcardService) {
            const flashcardService = new window.CSharpFlashcardService();
            flashcardService.showThinkingEffect('creating flashcards');
        }
        
        // Generate flashcards using OpenAI
        const flashcards = await generateFlashcardsFromExplanation(explanation);
        
        // Create flashcard set
        const flashcardSet = {
            title: `Custom Flashcards - ${new Date().toLocaleDateString()}`,
            type: 'flashcards',
            isFlashcardSet: true,
            sourceDocuments: [], // No source documents for explanation-based flashcards
            flashcards: flashcards,
            currentCardIndex: 0,
            correctAnswers: 0,
            totalCards: flashcards.length,
            createdAt: new Date().toISOString()
        };
        
        // Save to Firebase
        await studyGuideService.saveStudyGuide(classData.userId, classData.id, flashcardSet);
        
        // Reload study guides
        loadStudyGuides(classData);
        
        // Hide thinking effect
        if (window.CSharpFlashcardService) {
            const flashcardService = new window.CSharpFlashcardService();
            flashcardService.hideThinkingEffect();
        }
        
        console.log('Flashcards created from explanation successfully');
        
    } catch (error) {
        console.error('Error creating flashcards from explanation:', error);
        
        // Hide thinking effect on error
        if (window.CSharpFlashcardService) {
            const flashcardService = new window.CSharpFlashcardService();
            flashcardService.hideThinkingEffect();
        }
        
        alert('Error creating flashcards. Please check your OpenAI API key and try again.');
    }
}

function showManualFlashcardCreator(classData) {
    // Create a blank flashcard set for manual creation
    const blankFlashcardSet = {
        id: 'manual-' + Date.now(), // Temporary ID for new set
        title: `Manual Flashcards - ${new Date().toLocaleDateString()}`,
        flashcards: [], // Start with empty flashcards
        totalCards: 0,
        createdAt: new Date().toISOString()
    };
    
    // Use the existing edit flashcard modal with blank data
    showEditFlashcardModal(blankFlashcardSet, classData);
}

function showEditFlashcardModal(flashcardSet, classData) {
    // Create edit modal with dark theme study-like interface
    const modal = document.createElement('div');
    modal.className = 'flashcard-edit-modal';
    modal.innerHTML = `
        <!-- Save and Exit Button -->
        <button class="save-and-exit-flashcard-edit" onclick="saveNewFlashcardSet('${flashcardSet.id}', '${classData.userId}', '${classData.id}')">Save and Exit</button>
        
        <!-- Main Layout Container -->
        <div class="flashcard-edit-layout-container">
            <!-- Left Side - Card List -->
            <div class="flashcard-edit-left-panel">
                <div class="edit-panel-header">
                    <h3>Flashcard Set: ${flashcardSet.title}</h3>
                    <div class="edit-card-count">${flashcardSet.flashcards.length} Cards</div>
                </div>
                
                <!-- Card List -->
                <div class="flashcard-edit-list" id="flashcardEditList">
                    ${flashcardSet.flashcards.map((card, index) => `
                        <div class="flashcard-edit-item ${index === 0 ? 'selected' : ''}" data-index="${index}" onclick="selectEditCard(${index})">
                            <div class="edit-card-number">${index + 1}</div>
                            <div class="edit-card-preview">
                                <div class="edit-card-question-preview">${card.question.substring(0, 40)}${card.question.length > 40 ? '...' : ''}</div>
                                <div class="edit-card-answer-preview">${card.answer.substring(0, 40)}${card.answer.length > 40 ? '...' : ''}</div>
                            </div>
                            <button class="remove-edit-card-btn" onclick="removeEditCard(${index})" title="Remove card">✕</button>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Add Card Button -->
                <button class="add-edit-card-btn" onclick="addEditCard()">+ Add New Card</button>
            </div>
            
            <!-- Center - Study Interface -->
            <div class="flashcard-edit-center">
                <!-- Title Input -->
                <div class="flashcard-edit-title-section">
                    <input type="text" id="editFlashcardSetTitle" value="${flashcardSet.title}" placeholder="Enter flashcard set title" class="flashcard-edit-title-input">
                </div>
                
                <!-- Main Card Display -->
                <div class="flashcard-edit-card-display" id="flashcardEditCardDisplay">
                    <div class="flashcard-edit-card" id="main-edit-flashcard">
                        <div class="flashcard-edit-inner">
                            <div class="flashcard-edit-front">
                                <div class="flashcard-edit-header">
                                    <span class="edit-card-label">Question</span>
                                </div>
                                <textarea id="editCardQuestion" class="flashcard-edit-textarea" placeholder="Enter question..." rows="4"></textarea>
                            </div>
                            <div class="flashcard-edit-back">
                                <div class="flashcard-edit-header">
                                    <span class="edit-card-label">Answer</span>
                                </div>
                                <textarea id="editCardAnswer" class="flashcard-edit-textarea" placeholder="Enter answer..." rows="4"></textarea>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Card Navigation -->
                    <div class="flashcard-edit-navigation">
                        <button class="edit-nav-btn" id="prevEditCard" onclick="navigateEditCard(-1)">
                            <span>←</span>
                        </button>
                        <div class="edit-card-info">
                            <span class="edit-card-counter" id="editCardCounter">1 / ${flashcardSet.flashcards.length || 1}</span>
                        </div>
                        <button class="edit-nav-btn" id="nextEditCard" onclick="navigateEditCard(1)">
                            <span>→</span>
                        </button>
                    </div>
                    
                    <!-- Card Position Indicator -->
                    <div class="edit-card-position" id="editCardPosition">Card 1 of ${flashcardSet.flashcards.length || 1}</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize edit interface
    editCards = [...flashcardSet.flashcards];
    currentEditCardIndex = 0;
    
    // Add event listeners for the edit modal after a short delay to ensure DOM is ready
    setTimeout(() => {
        setupFlashcardEditListeners();
        updateEditCardDisplay();
    }, 100);
}

async function saveNewFlashcardSet(flashcardSetId, userId, classId) {
    try {
        const title = document.getElementById('editFlashcardSetTitle').value.trim();
        if (!title) {
            alert('Please enter a title for the flashcard set.');
            return;
        }
        
        if (editCards.length === 0) {
            alert('Please add at least one flashcard.');
            return;
        }
        
        console.log('💾 Saving new flashcard set:', title);
        
        // Create new flashcard set
        const flashcardSet = {
            title: title,
            type: 'flashcards',
            isFlashcardSet: true,
            sourceDocuments: [],
            flashcards: editCards,
            currentCardIndex: 0,
            correctAnswers: 0,
            totalCards: editCards.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save to Firebase
        const db = window.firebase.firestore();
        await db.collection('users').doc(userId).collection('classes').doc(classId).collection('studyGuides').add(flashcardSet);
        
        console.log('✅ New flashcard set created successfully');
        
        // Close modal
        const modal = document.querySelector('.flashcard-edit-modal');
        if (modal) {
            modal.remove();
        }
        
        // Reload study guides to show changes
        const classData = { userId, id: classId };
        loadStudyGuides(classData);
        
    } catch (error) {
        console.error('Error saving new flashcard set:', error);
        alert('Error saving flashcard set. Please try again.');
    }
}

function addFlashcardItem() {
    // Check if we're in edit mode or create mode
    const editContainer = document.getElementById('editFlashcardsContainer');
    const createContainer = document.getElementById('flashcardsContainer');
    const container = editContainer || createContainer;
    const index = container.children.length;
    
    const flashcardItem = document.createElement('div');
    flashcardItem.className = 'flashcard-item';
    flashcardItem.setAttribute('data-index', index);
    flashcardItem.innerHTML = `
        <div class="flashcard-inputs">
            <div class="flashcard-card front">
                <div class="flashcard-card-header front">
                    <div class="card-icon">?</div>
                    <span>Question</span>
                </div>
                <textarea class="flashcard-question-input" placeholder="Enter your question here..." rows="3"></textarea>
            </div>
            <div class="flashcard-card back">
                <div class="flashcard-card-header back">
                    <div class="card-icon">!</div>
                    <span>Answer</span>
                </div>
                <textarea class="flashcard-answer-input" placeholder="Enter your answer here..." rows="3"></textarea>
            </div>
        </div>
        <div class="flashcard-actions">
            <button class="remove-flashcard-btn" onclick="removeFlashcard(this)">Remove</button>
        </div>
    `;
    
    container.appendChild(flashcardItem);
    
    // Show remove buttons for all items if more than one
    if (container.children.length > 1) {
        container.querySelectorAll('.remove-flashcard-btn').forEach(btn => {
            btn.style.display = 'block';
        });
    }
}

function removeFlashcard(button) {
    const flashcardItem = button.closest('.flashcard-item');
    const editContainer = document.getElementById('editFlashcardsContainer');
    const createContainer = document.getElementById('flashcardsContainer');
    const container = editContainer || createContainer;
    
    flashcardItem.remove();
    
    // Hide remove buttons if only one item left
    if (container.children.length === 1) {
        container.querySelectorAll('.remove-flashcard-btn').forEach(btn => {
            btn.style.display = 'none';
        });
    }
}

async function saveManualFlashcards(classData) {
    const title = document.getElementById('flashcardSetTitle').value.trim();
    if (!title) {
        alert('Please enter a title for your flashcard set.');
        return;
    }
    
    const flashcardItems = document.querySelectorAll('#flashcardsContainer .flashcard-item');
    const flashcards = [];
    
    for (let item of flashcardItems) {
        const question = item.querySelector('.flashcard-question-input').value.trim();
        const answer = item.querySelector('.flashcard-answer-input').value.trim();
        
        if (question && answer) {
            flashcards.push({
                question: question,
                answer: answer
            });
        }
    }
    
    if (flashcards.length === 0) {
        alert('Please add at least one flashcard with both question and answer.');
        return;
    }
    
    try {
        // Create flashcard set
        const flashcardSet = {
            title: title,
            type: 'flashcards',
            isFlashcardSet: true,
            sourceDocuments: [],
            flashcards: flashcards,
            currentCardIndex: 0,
            correctAnswers: 0,
            totalCards: flashcards.length,
            createdAt: new Date().toISOString()
        };
        
        // Save to Firebase
        const { studyGuideService } = await getFirebaseServices();
        await studyGuideService.saveStudyGuide(classData.userId, classData.id, flashcardSet);
        
        // Reload study guides
        loadStudyGuides(classData);
        
        // Close modal
        document.body.removeChild(document.querySelector('.manual-flashcard-modal'));
        
        console.log('Manual flashcards created successfully');
        
    } catch (error) {
        console.error('Error creating manual flashcards:', error);
        alert('Error creating flashcards. Please try again.');
    }
}

async function showFlashcardEditor(guideId, classData) {
    try {
        console.log('📝 Opening flashcard editor for:', guideId);
        
        // Load the flashcard set using direct Firebase pattern
        const db = window.firebase.firestore();
        const guideRef = db.collection('users').doc(classData.userId).collection('classes').doc(classData.id).collection('studyGuides').doc(guideId);
        const guideDoc = await guideRef.get();
        
        if (!guideDoc.exists) {
            alert('Flashcard set not found.');
            return;
        }
        
        const guide = { id: guideDoc.id, ...guideDoc.data() };
        
        if (!guide || !guide.flashcards) {
            alert('Flashcard set not found.');
            return;
        }
        
        // Create modal for flashcard editor
        const modal = document.createElement('div');
        modal.className = 'flashcard-editor-modal';
        modal.innerHTML = `
            <div class="flashcard-editor-modal-content">
                <div class="flashcard-editor-modal-header">
                    <h3>Edit Flashcard Set: ${guide.title}</h3>
                    <button class="close-modal-btn" id="closeFlashcardEditorModal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="flashcard-editor-modal-body">
                    <div class="flashcard-set-info">
                        <div class="input-group">
                            <label for="editFlashcardSetTitle">Set Title:</label>
                            <input type="text" id="editFlashcardSetTitle" value="${guide.title}">
                        </div>
                    </div>
                    <div class="flashcards-container" id="editFlashcardsContainer">
                        ${guide.flashcards.map((card, index) => `
                            <div class="flashcard-item" data-index="${index}">
                                <div class="flashcard-inputs">
                                    <div class="flashcard-card front">
                                        <div class="flashcard-card-header front">
                                            <div class="card-icon">?</div>
                                            <span>Question</span>
                                        </div>
                                        <textarea class="flashcard-question-input" rows="3">${card.question}</textarea>
                                    </div>
                                    <div class="flashcard-card back">
                                        <div class="flashcard-card-header back">
                                            <div class="card-icon">!</div>
                                            <span>Answer</span>
                                        </div>
                                        <textarea class="flashcard-answer-input" rows="3">${card.answer}</textarea>
                                    </div>
                                </div>
                                <div class="flashcard-actions">
                                    <button class="remove-flashcard-btn" onclick="removeFlashcard(this)">Remove</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flashcard-editor-actions">
                        <button class="add-flashcard-btn" id="addEditFlashcardBtn">+ Add Another Card</button>
                        <div class="modal-actions">
                            <button class="modal-btn secondary" id="cancelEditFlashcards">Cancel</button>
                            <button class="modal-btn primary" id="saveEditFlashcards">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show remove buttons if more than one card
        if (guide.flashcards.length > 1) {
            modal.querySelectorAll('.remove-flashcard-btn').forEach(btn => {
                btn.style.display = 'block';
            });
        }
        
        // Add event listeners
        document.getElementById('closeFlashcardEditorModal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.getElementById('cancelEditFlashcards').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.getElementById('addEditFlashcardBtn').addEventListener('click', () => {
            addFlashcardItem();
        });
        
        document.getElementById('saveEditFlashcards').addEventListener('click', async () => {
            await saveEditedFlashcards(guideId, classData);
        });
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
    } catch (error) {
        console.error('Error opening flashcard editor:', error);
        alert('Error loading flashcard editor. Please try again.');
    }
}

async function saveEditedFlashcards(guideId, classData) {
    const title = document.getElementById('editFlashcardSetTitle').value.trim();
    if (!title) {
        alert('Please enter a title for your flashcard set.');
        return;
    }
    
    const flashcardItems = document.querySelectorAll('#editFlashcardsContainer .flashcard-item');
    const flashcards = [];
    
    for (let item of flashcardItems) {
        const question = item.querySelector('.flashcard-question-input').value.trim();
        const answer = item.querySelector('.flashcard-answer-input').value.trim();
        
        if (question && answer) {
            flashcards.push({
                question: question,
                answer: answer
            });
        }
    }
    
    if (flashcards.length === 0) {
        alert('Please add at least one flashcard with both question and answer.');
        return;
    }
    
    try {
        console.log('💾 Saving edited flashcards for:', guideId);
        
        // Update the flashcard set using direct Firebase pattern
        const db = window.firebase.firestore();
        await db.collection('users').doc(classData.userId).collection('classes').doc(classData.id).collection('studyGuides').doc(guideId).update({
            title: title,
            flashcards: flashcards,
            totalCards: flashcards.length,
            updatedAt: new Date()
        });
        
        console.log('✅ Flashcard set updated successfully');
        alert('Flashcard set updated successfully!');
        
        // Reload study guides
        loadStudyGuides(classData);
        
        // Close modal
        document.body.removeChild(document.querySelector('.flashcard-editor-modal'));
        
    } catch (error) {
        console.error('Error updating flashcards:', error);
        alert('Error updating flashcards. Please try again.');
    }
}

async function generateFlashcardsFromExplanation(explanation) {
    try {
        // Get OpenAI API key with fallback
        const currentUserData = localStorage.getItem('currentUser');
        if (!currentUserData) {
            throw new Error('User not logged in');
        }
        
        const currentUser = JSON.parse(currentUserData);
        const OPENAI_API_KEY = window.getOpenAIApiKey() || window.APP_CONFIG.OPENAI_API_KEY;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are Genius AI, an expert educational assistant. Create high-quality flashcards based on the user's request.

                        Instructions:
                        - Create 8-15 flashcards that are educational and well-structured
                        - Each flashcard should have a clear, specific question and a comprehensive answer
                        - Focus on the actual subject matter and learning content the user wants to study
                        - Make questions challenging but fair for studying and memorization
                        - Ensure answers are accurate, educational, and help with learning
                        - Cover the topic thoroughly and progressively
                        - Use appropriate difficulty level for the subject matter
                        - Format as JSON array with "question" and "answer" fields
                        
                        Example format:
                        [
                            {
                                "question": "What is the capital of France?",
                                "answer": "Paris is the capital and largest city of France, located in the north-central part of the country on the Seine River."
                            }
                        ]`
                    },
                    {
                        role: 'user',
                        content: `Please create flashcards based on this request: ${explanation}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse the JSON response
        const flashcards = JSON.parse(content);
        
        if (!Array.isArray(flashcards)) {
            throw new Error('Invalid response format from OpenAI');
        }
        
        return flashcards;
        
    } catch (error) {
        console.error('Error generating flashcards from explanation:', error);
        throw error;
    }
}

function setupStudyGuideActions(classData) {
    const addStudyGuideBtn = document.getElementById('addStudyGuideBtn');
    const listViewBtn = document.getElementById('studyGuideListViewBtn');
    const gridViewBtn = document.getElementById('studyGuideGridViewBtn');
    
    if (addStudyGuideBtn) {
        addStudyGuideBtn.addEventListener('click', () => {
            showStudyGuideFormatDialog(classData);
        });
    }
    
    // Setup view toggle functionality
    const viewModeKey = `class_${classData.userId}_${classData.name}_studyGuideViewMode`;
    let currentStudyGuideViewMode = localStorage.getItem(viewModeKey) || 'list';
    
    // Set initial active state
    if (currentStudyGuideViewMode === 'list') {
        listViewBtn?.classList.add('active');
        gridViewBtn?.classList.remove('active');
    } else {
        gridViewBtn?.classList.add('active');
        listViewBtn?.classList.remove('active');
    }
    
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            currentStudyGuideViewMode = 'list';
            localStorage.setItem(viewModeKey, 'list');
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            loadStudyGuides(classData, 'list');
        });
    }
    
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            currentStudyGuideViewMode = 'grid';
            localStorage.setItem(viewModeKey, 'grid');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            loadStudyGuides(classData, 'grid');
        });
    }
    
    // Setup flashcard menu functionality
    setupFlashcardMenuActions(classData);
}

function setupFlashcardMenuActions(classData) {
    // Use event delegation for dynamically created elements
    document.addEventListener('click', (e) => {
        // Handle 3-dot menu button clicks
        if (e.target.closest('.flashcard-menu-btn')) {
            const button = e.target.closest('.flashcard-menu-btn');
            const guideId = button.dataset.guideId;
            const dropdown = document.getElementById(`menu-${guideId}`);
            
            // Close all other dropdowns
            document.querySelectorAll('.flashcard-menu-dropdown').forEach(menu => {
                if (menu.id !== `menu-${guideId}`) {
                    menu.style.display = 'none';
                }
            });
            
            // Toggle current dropdown
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        }
        
        // Handle edit flashcard button clicks
        if (e.target.closest('.edit-flashcard-btn')) {
            const button = e.target.closest('.edit-flashcard-btn');
            const guideId = button.dataset.guideId;
            showFlashcardEditor(guideId, classData);
            
            // Close dropdown
            const dropdown = document.getElementById(`menu-${guideId}`);
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
        
        // Handle delete study guide button clicks (existing functionality)
        if (e.target.closest('.delete-study-guide-btn')) {
            const button = e.target.closest('.delete-study-guide-btn');
            const guideId = button.dataset.guideId;
            deleteStudyGuide(guideId, classData);
            
            // Close dropdown
            const dropdown = document.getElementById(`menu-${guideId}`);
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
        
        // Close dropdowns when clicking outside
        if (!e.target.closest('.flashcard-menu-container')) {
            document.querySelectorAll('.flashcard-menu-dropdown').forEach(menu => {
                menu.style.display = 'none';
            });
        }
    });
}

function showStudyGuideFormatDialog(classData) {
    // Create modal for format selection
    const modal = document.createElement('div');
    modal.className = 'study-guide-modal';
    modal.innerHTML = `
        <div class="study-guide-modal-content">
            <div class="study-guide-modal-header">
                <h3>Create New Study Content</h3>
                <button class="close-modal-btn" id="closeStudyGuideModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="study-guide-modal-body">
                <p>Create flashcards for studying:</p>
                <div class="format-options">
                    <!-- Basic Study Guide option commented out - users only see flashcards -->
                    <!-- <div class="format-option" data-format="basic">
                        <h4>Basic Study Guide</h4>
                        <p>Text-based document with structured bullet points, headings, and summaries</p>
                    </div> -->
                    <div class="format-option" data-format="flashcards">
                        <h4>Flashcards</h4>
                        <p>Interactive flashcards for self-quizzing and memorization</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('closeStudyGuideModal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Format selection
    modal.querySelectorAll('.format-option').forEach(option => {
        option.addEventListener('click', async () => {
            const format = option.dataset.format;
            document.body.removeChild(modal);
            
            if (format === 'flashcards') {
                showFlashcardCreationOptions(classData);
            } else {
                await showFolderSelectionDialog(classData, format);
            }
        });
    });
}

async function showFolderSelectionDialog(classData, format) {
    const folders = await getFolders(classData) || [];
    const documents = await documentService.getDocuments(classData.userId, classData.id);
    
    // Create modal for folder selection
    const modal = document.createElement('div');
    modal.className = 'folder-selection-modal';
    modal.innerHTML = `
        <div class="folder-selection-modal-content">
            <div class="folder-selection-modal-header">
                <h3>Select Source Folder</h3>
                <button class="close-modal-btn" id="closeFolderModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="folder-selection-modal-body">
                <p>Choose a folder to create study guide from:</p>
                <div class="folder-options">
                    <div class="folder-option" data-folder-id="all">
                        <div class="folder-icon">📁</div>
                        <h4>All Documents</h4>
                        <p>${documents.length} document${documents.length !== 1 ? 's' : ''}</p>
                    </div>
                    ${folders.map(folder => {
                        const folderDocs = documents.filter(doc => doc.folderId === folder.id);
                        return `
                            <div class="folder-option" data-folder-id="${folder.id}">
                                <div class="folder-icon">📁</div>
                                <h4>${folder.name}</h4>
                                <p>${folderDocs.length} document${folderDocs.length !== 1 ? 's' : ''}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('closeFolderModal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Folder selection
    modal.querySelectorAll('.folder-option').forEach(option => {
        option.addEventListener('click', () => {
            const folderId = option.dataset.folderId;
            document.body.removeChild(modal);
            showStudyGuideNamingDialog(classData, format, folderId);
        });
    });
}

async function showStudyGuideNamingDialog(classData, format, folderId) {
    const isFlashcard = format === 'flashcards';
    
    // For flashcards, show study scale prompt first
    let flashcardCount = null;
    if (isFlashcard) {
        try {
            const { CSharpFlashcardService } = await import('./csharp-flashcard-service.js');
            const flashcardService = new CSharpFlashcardService();
            
            // Get documents to show count in prompt
            const documents = await documentService.getDocuments(classData.userId, classData.id);
            let sourceDocuments = [];
            if (folderId === 'all') {
                sourceDocuments = documents;
            } else {
                sourceDocuments = documents.filter(doc => doc.folderId === folderId);
            }
            
            flashcardCount = await flashcardService.showStudyScalePrompt(
                folderId === 'all' ? 'All Documents' : `Folder with ${sourceDocuments.length} documents`
            );
            
            if (flashcardCount === null) {
                return; // User cancelled
            }
        } catch (error) {
            console.error('Error showing study scale prompt:', error);
            alert('Error showing study options. Please try again.');
            return;
        }
    }
    
    const itemType = isFlashcard ? 'Flashcard Set' : 'Study Guide';
    const placeholder = isFlashcard ? 'e.g., Biology Chapter 5, Math Formulas, History Dates...' : 'e.g., Biology Chapter 5, Math Review, History Summary...';
    const buttonText = isFlashcard ? 'Create Flashcards' : 'Create Study Guide';
    
    // Create modal for naming
    const modal = document.createElement('div');
    modal.className = 'study-guide-naming-modal';
    modal.innerHTML = `
        <div class="study-guide-naming-modal-content">
            <div class="study-guide-naming-modal-header">
                <h3>Name Your ${itemType}</h3>
                <button class="close-modal-btn" id="closeStudyGuideNamingModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="study-guide-naming-modal-body">
                <p>Give your ${itemType.toLowerCase()} a memorable name:</p>
                <div class="naming-input-group">
                    <input type="text" id="studyGuideName" placeholder="${placeholder}" maxlength="50">
                    <div class="input-hint">Maximum 50 characters</div>
                </div>
                <div class="naming-actions">
                    <button class="naming-btn secondary" id="cancelNaming">Cancel</button>
                    <button class="naming-btn primary" id="confirmNaming">${buttonText}</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on input
    setTimeout(() => {
        const input = document.getElementById('studyGuideName');
        if (input) {
            input.focus();
        }
    }, 100);
    
    // Add event listeners
    document.getElementById('closeStudyGuideNamingModal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('cancelNaming').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Confirm naming
    document.getElementById('confirmNaming').addEventListener('click', () => {
        const nameInput = document.getElementById('studyGuideName');
        const setName = nameInput.value.trim();
        
        if (!setName) {
            alert(`Please enter a name for your ${itemType.toLowerCase()}.`);
            return;
        }
        
        document.body.removeChild(modal);
        createStudyGuide(classData, format, folderId, setName, flashcardCount);
    });
    
    // Allow Enter key to confirm
    document.getElementById('studyGuideName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('confirmNaming').click();
        }
    });
}

async function createStudyGuide(classData, format, folderId, customName = null, flashcardCount = null) {
    try {
        const { documentService } = await getFirebaseServices();
        const documents = await documentService.getDocuments(classData.userId, classData.id);
    
    // Filter documents based on folder selection
    let sourceDocuments = [];
    if (folderId === 'all') {
        sourceDocuments = documents;
    } else {
        sourceDocuments = documents.filter(doc => doc.folderId === folderId);
    }
    
    if (sourceDocuments.length === 0) {
        alert('No documents found in the selected folder.');
        return;
    }
    
    // Use default flashcard count if not provided
    if (format === 'flashcards' && !flashcardCount) {
        flashcardCount = 25; // Default to light study
    }
    
    // Show brain icon thinking effect
    let flashcardService = null;
    if (window.CSharpFlashcardService) {
        flashcardService = new window.CSharpFlashcardService();
        const action = format === 'basic' ? 'creating study guide' : 'creating flashcards';
        flashcardService.showThinkingEffect(action);
    }
    
    // Process with AI
        try {
            if (format === 'basic') {
                await createBasicStudyGuide(classData, sourceDocuments, customName);
            } else if (format === 'flashcards') {
            await createFlashcardSet(classData, sourceDocuments, customName, flashcardCount);
            }
        
        // Hide thinking effect after completion
        if (flashcardService) {
            flashcardService.hideThinkingEffect();
        }
        } catch (error) {
            console.error('Error creating study content:', error);
        
        // Hide thinking effect on error
        if (flashcardService) {
            flashcardService.hideThinkingEffect();
        }
        
            alert('Error creating study content. Please check your OpenAI API key and try again.');
        }
    } catch (error) {
        console.error('Error in createStudyGuide:', error);
        alert('Error creating study guide. Please try again.');
    }
}

async function createBasicStudyGuide(classData, sourceDocuments, customName = null) {
    try {
        // Generate AI-powered study guide content
        const studyGuideContent = await generateStudyGuideContent(sourceDocuments);
        
        // Use custom name or default name
        const setName = customName || `Study Guide - ${new Date().toLocaleDateString()}`;
        
        // Create new study guide
        const studyGuide = {
            title: setName,
            content: studyGuideContent,
            type: 'study_guide',
            isStudyGuide: true,
            sourceDocuments: sourceDocuments.map(doc => doc.id)
        };
        
        // Save to Firebase
        const { studyGuideService } = await getFirebaseServices();
        await studyGuideService.saveStudyGuide(classData.userId, classData.id, studyGuide);
        
        // Reload study guides
        await loadStudyGuides(classData);
        
        console.log('Study guide created successfully');
        
    } catch (error) {
        console.error('Error creating study guide:', error);
        alert('Error creating study guide. Please try again.');
    }
}

async function createFlashcardSet(classData, sourceDocuments, customName = null, flashcardCount = 25) {
    try {
        // Generate AI-powered flashcard content
        const flashcards = await generateFlashcardContent(sourceDocuments, flashcardCount);
        
        // Use custom name or default name
        const setName = customName || `Flashcards - ${new Date().toLocaleDateString()}`;
        
        // Create new flashcard set
        const flashcardSet = {
            title: setName,
            type: 'flashcards',
            isFlashcardSet: true,
            sourceDocuments: sourceDocuments.map(doc => doc.id),
            flashcards: flashcards,
            currentCardIndex: 0,
            correctAnswers: 0,
            totalCards: flashcards.length
        };
        
        // Save to Firebase
        const { studyGuideService } = await getFirebaseServices();
        await studyGuideService.saveStudyGuide(classData.userId, classData.id, flashcardSet);
        
        // Reload study guides
        await loadStudyGuides(classData);
        
        // Hide thinking effect after everything is complete
        if (window.CSharpFlashcardService) {
            const flashcardService = new window.CSharpFlashcardService();
            flashcardService.hideThinkingEffect();
        }
        
    } catch (error) {
        console.error('Error creating flashcard set:', error);
        
        // Hide thinking effect on error
        if (window.CSharpFlashcardService) {
            const flashcardService = new window.CSharpFlashcardService();
            flashcardService.hideThinkingEffect();
        }
        
        alert('Error creating flashcard set. Please try again.');
    }
}

async function generateStudyGuideContent(documents) {
    try {
        console.log('Starting study guide generation for', documents.length, 'documents');
        
        // Get OpenAI API key with fallback (same as flashcards)
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const apiKey = window.getOpenAIApiKey() || window.APP_CONFIG.OPENAI_API_KEY;
        
        console.log('Using global API key for study guide:', {
            found: !!apiKey
        });
        
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please configure your API key in settings.');
        }
        
        // Use the same logic as flashcards - process each document with the flashcard service
        const { CSharpFlashcardService } = await import('./csharp-flashcard-service.js');
        const flashcardService = new CSharpFlashcardService();
        
        // Set the API key for the flashcard service
        flashcardService.azureConfig = {
            apiKey: apiKey,
            endpoint: 'https://api.openai.com/v1'
        };
        
        let allContent = '';
        
        for (const doc of documents) {
            console.log('Processing document:', doc.title || doc.fileName, 'Type:', doc.type);
            
            try {
                let documentContent = '';
                
                if (doc.type === 'text' && doc.content) {
                    // For text documents, extract clean text
                    documentContent = doc.content.replace(/<[^>]*>/g, '').trim();
                } else if (doc.content && doc.content.startsWith('data:')) {
                    // For uploaded files, use the same method as flashcards to actually read content
                    const fileObject = base64ToFile(doc.content, doc.fileName || doc.title, doc.type);
                    
                    try {
                        // Use the same method that works for flashcards to extract actual content
                        // Generate more flashcards to get comprehensive coverage
                        const extractedContent = await flashcardService.generateFlashcardsWithAssistants(fileObject, 15, false);
                        
                        if (extractedContent && Array.isArray(extractedContent) && extractedContent.length > 0) {
                            // Extract the actual content from the flashcards
                            let contentText = '';
                            contentText += `COMPREHENSIVE STUDY GUIDE FOR: ${doc.fileName}\n`;
                            contentText += `==========================================\n\n`;
                            
                            extractedContent.forEach((card, index) => {
                                contentText += `\n\n📚 KEY CONCEPT ${index + 1}:\n`;
                                contentText += `Question: ${card.question}\n`;
                                contentText += `Answer: ${card.answer}\n`;
                                contentText += `\n---\n`;
                            });
                            
                            // Add additional comprehensive content
                            contentText += `\n\n📖 DETAILED ANALYSIS:\n`;
                            contentText += `This document contains ${extractedContent.length} key concepts that are essential for understanding the material. `;
                            contentText += `Each concept has been carefully analyzed to provide you with the most important information needed for success. `;
                            contentText += `Make sure to review each key concept thoroughly and understand the relationships between different topics.\n\n`;
                            
                            contentText += `🎯 STUDY RECOMMENDATIONS:\n`;
                            contentText += `1. Review each key concept multiple times\n`;
                            contentText += `2. Create your own examples for each concept\n`;
                            contentText += `3. Practice explaining each concept in your own words\n`;
                            contentText += `4. Look for connections between different concepts\n`;
                            contentText += `5. Test yourself on each concept before moving to the next\n\n`;
                            
                            documentContent = contentText.trim();
                        } else {
                            // If no flashcards generated, try to get raw content
                            documentContent = `[File: ${doc.fileName} - Content processed but no specific information extracted. The file may contain images or complex formatting that requires manual review.]`;
                        }
                        
                    } catch (error) {
                        console.warn(`Could not extract content from ${doc.fileName}:`, error);
                        // Fallback: add a note about the file
                        documentContent = `[File: ${doc.fileName} - Content extraction failed. Please try using the flashcard generation feature for this file.]`;
                    }
                }
                
                if (documentContent && documentContent.length > 0) {
                    allContent += `\n\n--- ${doc.title || doc.fileName} ---\n\n${documentContent}`;
                }
                
            } catch (error) {
                console.warn(`Could not process document ${doc.title || doc.fileName}:`, error);
                // Continue with other documents
            }
        }
        
        if (!allContent.trim()) {
            throw new Error('No readable content found in the selected documents. Please ensure your documents contain text that can be processed.');
        }
        
        // Truncate content if too long - but allow much more content for comprehensive study guides
        const maxLength = 25000; // Much larger limit for comprehensive study guides
        if (allContent.length > maxLength) {
            allContent = allContent.substring(0, maxLength) + '...';
        }
        
        // Generate study guide using OpenAI with HTML formatting
        console.log('Sending request to OpenAI with content length:', allContent.length);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert study guide creator and academic tutor. Create an EXTREMELY comprehensive, detailed, and thorough study guide from the provided content. This study guide must be extensive enough to help students pass their exams.

REQUIREMENTS:
- Make it as LONG and DETAILED as possible (aim for 5-10+ pages of content)
- Cover EVERY important concept, detail, and nuance from the source material
- Include multiple examples, explanations, and applications for each concept
- Add practice questions, study strategies, and exam preparation tips
- Make it comprehensive enough that students can study from this alone

IMPORTANT: Format your response as HTML with proper styling. Use these HTML tags:
- <h1> for main title
- <h2> for major sections (aim for 8-12 major sections)
- <h3> for subsections (aim for 3-5 subsections per major section)
- <p> for detailed paragraphs (make them substantial)
- <ul> and <li> for comprehensive bullet points
- <strong> for important terms and key concepts
- <em> for emphasis and critical points
- <div class="highlight"> for key concepts and definitions
- <div class="summary"> for comprehensive summaries
- <div class="tips"> for detailed study tips and strategies

STRUCTURE THE STUDY GUIDE WITH:
1. Introduction and Overview
2. Detailed Concept Explanations (multiple sections)
3. Examples and Applications
4. Practice Questions and Problems
5. Study Strategies and Tips
6. Exam Preparation Guidelines
7. Key Terms and Definitions
8. Summary and Review

Make it EXTREMELY comprehensive, detailed, and thorough. Students should be able to pass their exams using only this study guide.`
                    },
                    {
                        role: 'user',
                        content: `Create a comprehensive, well-formatted study guide from the following content:\n\n${allContent}`
                    }
                ],
                max_tokens: 4000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            console.error('OpenAI API error:', response.status, response.statusText);
            throw new Error(`OpenAI API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('OpenAI response received, generating study guide...');
        
        let studyGuideContent = data.choices[0].message.content;
        
        // If the study guide is too short, generate additional comprehensive content
        if (studyGuideContent.length < 2000) {
            console.log('Study guide is short, generating additional comprehensive content...');
            
            const additionalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert academic tutor. The previous study guide was too brief. Create ADDITIONAL comprehensive content to make it more thorough and detailed. Focus on:
                            
- Detailed explanations of complex concepts
- Multiple examples and real-world applications
- Practice problems with step-by-step solutions
- Common exam questions and answers
- Study strategies and memorization techniques
- Key formulas, equations, and important facts
- Connections between different topics
- Common mistakes and how to avoid them

Make this content EXTREMELY detailed and comprehensive. Format as HTML with proper styling.`
                        },
                        {
                            role: 'user',
                            content: `The current study guide is:\n\n${studyGuideContent}\n\n\nPlease add MUCH MORE comprehensive and detailed content to make this study guide thorough enough for exam success. Use the same source material:\n\n${allContent}`
                        }
                    ],
                    max_tokens: 3000,
                    temperature: 0.7
                })
            });
            
            if (additionalResponse.ok) {
                const additionalData = await additionalResponse.json();
                const additionalContent = additionalData.choices[0].message.content;
                studyGuideContent += '\n\n' + additionalContent;
                console.log('Additional comprehensive content added to study guide');
            }
        }
        
        // Add CSS styling to make it look better
        const styledContent = `
            <style>
                .study-guide-content {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #ffffff;
                    background-color: #1a1a1a;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    border-radius: 8px;
                }
                .study-guide-content h1 {
                    color: #ffffff;
                    border-bottom: 3px solid #ffffff;
                    padding-bottom: 10px;
                    margin-bottom: 30px;
                }
                .study-guide-content h2 {
                    color: #ffffff;
                    margin-top: 30px;
                    margin-bottom: 15px;
                    border-left: 4px solid #ffffff;
                    padding-left: 15px;
                }
                .study-guide-content h3 {
                    color: #ffffff;
                    margin-top: 25px;
                    margin-bottom: 10px;
                }
                .study-guide-content p {
                    margin-bottom: 15px;
                    text-align: justify;
                    color: #ffffff;
                }
                .study-guide-content ul {
                    margin-bottom: 20px;
                    padding-left: 25px;
                }
                .study-guide-content li {
                    margin-bottom: 8px;
                    color: #ffffff;
                }
                .study-guide-content .highlight {
                    background-color: #333333;
                    border: 1px solid #555555;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 15px 0;
                    border-left: 4px solid #ffffff;
                    color: #ffffff;
                }
                .study-guide-content .summary {
                    background-color: #2a2a2a;
                    border: 1px solid #444444;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 15px 0;
                    border-left: 4px solid #ffffff;
                    color: #ffffff;
                }
                .study-guide-content .tips {
                    background-color: #2a2a2a;
                    border: 1px solid #444444;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 15px 0;
                    border-left: 4px solid #ffffff;
                    color: #ffffff;
                }
                .study-guide-content strong {
                    color: #ffffff;
                    font-weight: 600;
                }
                .study-guide-content em {
                    color: #cccccc;
                    font-style: italic;
                }
            </style>
            <div class="study-guide-content">
                ${studyGuideContent}
            </div>
        `;
        
        return styledContent;
        
    } catch (error) {
        console.error('Error generating study guide with AI:', error);
        throw new Error('Failed to generate study guide. Please check your OpenAI API key and try again.');
    }
}


async function uploadFileToOpenAI(base64Data, fileName, mimeType, apiKey) {
    try {
        // Convert base64 to binary
        const base64Content = base64Data.split(',')[1];
        const binaryData = atob(base64Content);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
        }
        
        // Create FormData for file upload
        const formData = new FormData();
        const file = new File([bytes], fileName, { type: mimeType });
        formData.append('file', file);
        formData.append('purpose', 'assistants');
        
        // Upload file to OpenAI
        const uploadResponse = await fetch('https://api.openai.com/v1/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`File upload failed: ${uploadResponse.status}`);
        }
        
        const uploadResult = await uploadResponse.json();
        console.log('✅ File uploaded successfully:', uploadResult.id);
        return uploadResult.id;
        
    } catch (error) {
        console.error('❌ Error uploading file:', error);
        return null;
    }
}


// Helper function to convert base64 to file
function base64ToFile(base64Data, filename, mimeType) {
    const base64Content = base64Data.split(',')[1];
    const binaryData = atob(base64Content);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mimeType });
}

async function generateFlashcardContent(documents, flashcardCount = 25) {
    try {
        // Import the C# flashcard service directly
        const { CSharpFlashcardService } = await import('./csharp-flashcard-service.js');
        const flashcardService = new CSharpFlashcardService();

        // Get user data and set up API configuration
        const currentUserData = localStorage.getItem('currentUser');
        if (!currentUserData) {
            throw new Error('User not logged in');
        }
        
        const currentUser = JSON.parse(currentUserData);
        
        // Use fallback API key if no Azure config (same as geniusChat.js)
        // Use global API key for all users
        const apiKey = window.getOpenAIApiKey() || window.APP_CONFIG.OPENAI_API_KEY;
        console.log('🔑 [FLASHCARDS] Using global API key');
        
        // Use regular OpenAI API instead of Azure (same as geniusChat.js)
        const apiConfig = {
            endpoint: 'https://api.openai.com/v1',
            apiKey: apiKey,
            model: 'gpt-4o'
        };

        flashcardService.setAzureConfig(apiConfig);

        // Process each document with the same flashcard count
        const allFlashcards = [];
        
        if (!documents || documents.length === 0) {
            throw new Error('No documents provided for flashcard generation');
        }
        
        console.log(`Processing ${documents.length} documents for flashcard generation`);
        
        for (const doc of documents) {
            try {
                // Convert document to file object
                let fileObject;
                console.log('Processing document:', {
                    id: doc.id,
                    title: doc.title,
                    type: doc.type,
                    hasContent: !!doc.content,
                    contentLength: doc.content ? doc.content.length : 0
                });
                
                if (doc.content && doc.content.startsWith('data:')) {
                    console.log(`Converting base64 data to file for ${doc.title}, type: ${doc.type}`);
                    fileObject = base64ToFile(doc.content, doc.fileName || doc.title, doc.type);
                    console.log(`Created file object: ${fileObject.name}, type: ${fileObject.type}, size: ${fileObject.size} bytes`);
                } else if (doc.type === 'text' && doc.content) {
                    // Extract text content from HTML (documents from document editor)
                    let textContent;
                    
                    if (doc.content.includes('<') && doc.content.includes('>')) {
                        // This is HTML content from document editor
                        console.log(`Extracting text from HTML content for ${doc.title}`);
                        const parser = new DOMParser();
                        const docElement = parser.parseFromString(doc.content, 'text/html');
                        textContent = docElement.body.textContent || docElement.body.innerText || '';
                        
                        // Clean up extra whitespace
                        textContent = textContent.replace(/\s+/g, ' ').trim();
                    } else {
                        // This is plain text content
                        textContent = doc.content.trim();
                    }
                    
                    if (!textContent || textContent.length === 0) {
                        console.warn(`Document ${doc.title} has no text content after HTML extraction, skipping...`);
                        continue;
                    }
                    
                    fileObject = new File([textContent], doc.fileName || doc.title || 'document.txt', { type: 'text/plain' });
                    console.log(`Created file object for ${doc.title}: ${textContent.length} characters`);
                    console.log(`Text preview: ${textContent.substring(0, 100)}...`);
                } else {
                    // Fallback: create flashcards from document metadata if no content
                    console.warn(`Document ${doc.title} has no content, creating basic flashcards from title...`);
                    const basicContent = `Document: ${doc.title}\nType: ${doc.type}\nCreated: ${doc.createdAt || 'Unknown'}`;
                    fileObject = new File([basicContent], doc.title || 'document.txt', { type: 'text/plain' });
                }
                
                // Generate flashcards with the specified count
                const flashcards = await flashcardService.generateFlashcardsFromFile(fileObject, flashcardCount);
                allFlashcards.push(...flashcards);
        
    } catch (error) {
                console.error(`Error generating flashcards for ${doc.fileName || doc.title}:`, error);
                // Continue with other documents
            }
        }

        return allFlashcards;
    } catch (error) {
        console.error('Error generating flashcard content:', error);
        
        // Show user-friendly error message for rate limits
        if (error.message.includes('429') || error.message.includes('Rate limit')) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again. The system will automatically retry in the background.');
        }
        
        throw new Error('Failed to generate flashcards. Please check your OpenAI API key and try again.');
    }
}


async function loadStudyGuides(classData, viewMode = 'list') {
    console.log('📚 Loading study guides for:', classData.name);
    
    const studyGuidesList = document.getElementById('studyGuidesList');
    const emptyStudyGuides = document.getElementById('emptyStudyGuides');
    
    if (!studyGuidesList) {
        console.error('❌ studyGuidesList not found');
        return;
    }
    
    // Show loading
    studyGuidesList.innerHTML = '<div class="loading-study-guides">Loading study guides...</div>';
    if (emptyStudyGuides) emptyStudyGuides.style.display = 'none';
    
    try {
        console.log('📚 Starting study guide loading for class:', classData.name);
        console.log('📚 Class data:', { userId: classData.userId, classId: classData.id });
        
        // Load study guides from Firebase (same pattern as documents)
        const db = window.firebase.firestore();
        const studyGuidesRef = db.collection('users').doc(classData.userId).collection('classes').doc(classData.id).collection('studyGuides');
        
        console.log('📚 Firebase query starting...');
        
        // Try with orderBy first, fallback to simple query if it fails
        let querySnapshot;
        try {
            const queryPromise = studyGuidesRef.orderBy('createdAt', 'desc').get();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Study guides query timeout after 10 seconds')), 10000)
            );
            
            querySnapshot = await Promise.race([queryPromise, timeoutPromise]);
            console.log('📚 Firebase query with orderBy completed');
        } catch (orderByError) {
            console.warn('⚠️ Study guides orderBy query failed, trying simple query:', orderByError.message);
            // Fallback to simple query without orderBy
            const simpleQueryPromise = studyGuidesRef.get();
            const simpleTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Simple study guides query timeout after 10 seconds')), 10000)
            );
            
            querySnapshot = await Promise.race([simpleQueryPromise, simpleTimeoutPromise]);
            console.log('📚 Firebase simple query completed');
        }
        
        const studyGuides = [];
        querySnapshot.forEach((doc) => {
            studyGuides.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('📚 Loaded study guides from Firebase:', studyGuides.length);
        
        // Update CSS class based on view mode
        if (viewMode === 'grid') {
            studyGuidesList.classList.add('grid-view');
        } else {
            studyGuidesList.classList.remove('grid-view');
        }
        
        if (studyGuides.length === 0) {
            studyGuidesList.innerHTML = '';
            if (emptyStudyGuides) emptyStudyGuides.style.display = 'block';
        } else {
            if (emptyStudyGuides) emptyStudyGuides.style.display = 'none';
            
            let html = '';
            studyGuides.forEach(guide => {
                if (guide.isStudyGuide) {
                    html += renderStudyGuideCard(guide, classData, viewMode);
                } else if (guide.isFlashcardSet) {
                    html += renderFlashcardSetCard(guide, classData, viewMode);
                }
            });
            
            studyGuidesList.innerHTML = html;
            
            // Add event listeners
            setTimeout(() => {
                setupStudyGuideEventListeners(classData);
            }, 100);
        }
        
        console.log('✅ Study guide loading completed successfully');
        
    } catch (error) {
        console.error('❌ Error loading study guides:', error);
        console.error('❌ Error details:', error.message);
        studyGuidesList.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Study Guides</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

function renderStudyGuideCard(guide, classData, viewMode = 'list') {
    const date = formatDate(guide.createdAt);
    
    if (viewMode === 'grid') {
        return `
            <div class="study-guide-grid-card" data-guide-id="${guide.id}">
                <div class="study-guide-grid-preview-wrapper">
                    <div class="study-guide-grid-preview">
                        <div class="study-guide-document-icon">📄</div>
                        <div class="study-guide-document-lines">
                            <div class="document-line"></div>
                            <div class="document-line"></div>
                            <div class="document-line short"></div>
                        </div>
                    </div>
                </div>
                <div class="study-guide-grid-info">
                    <div class="study-guide-info-left">
                        <h4 class="study-guide-grid-title">${guide.title}</h4>
                        <p class="study-guide-grid-date">${date}</p>
                    </div>
                    <div class="study-guide-info-right">
                        <div class="study-guide-grid-actions">
                            <button class="study-guide-grid-action-btn view-study-guide-btn" data-guide-id="${guide.id}" title="View">
                                <span>👁️</span>
                            </button>
                            <button class="study-guide-grid-action-btn delete-study-guide-btn" data-guide-id="${guide.id}" title="Delete">
                                <span>✕</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="study-guide-card" data-guide-id="${guide.id}">
                <div class="study-guide-info">
                    <h4 class="study-guide-title">${guide.title}</h4>
                    <p class="study-guide-date">Created: ${date}</p>
                </div>
                <div class="study-guide-actions">
                    <button class="study-guide-action-btn view-study-guide-btn" data-guide-id="${guide.id}">
                        <span>👁️</span> View
                    </button>
                    <div class="flashcard-menu-container">
                        <button class="flashcard-menu-btn" data-guide-id="${guide.id}" title="More options">
                            <span>⋯</span>
                        </button>
                        <div class="flashcard-menu-dropdown" id="menu-${guide.id}">
                            <button class="flashcard-menu-item edit-flashcard-btn" data-guide-id="${guide.id}">
                                <span>✏️</span> Edit
                            </button>
                            <button class="flashcard-menu-item delete-study-guide-btn" data-guide-id="${guide.id}">
                                <span>🗑️</span> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

function renderFlashcardSetCard(guide, classData, viewMode = 'list') {
    const date = formatDate(guide.createdAt);
    
    if (viewMode === 'grid') {
        return `
            <div class="flashcard-set-grid-card clickable-flashcard-card" data-guide-id="${guide.id}">
                <div class="flashcard-stack-wrapper">
                    <div class="flashcard-stack">
                        <div class="flashcard-card card-1">
                            <div class="card-content">
                                <div class="card-question"></div>
                            </div>
                        </div>
                        <div class="flashcard-card card-2">
                            <div class="card-content">
                                <div class="card-question"></div>
                            </div>
                        </div>
                        <div class="flashcard-card card-3">
                            <div class="card-content">
                                <div class="card-question"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flashcard-set-grid-info">
                    <div class="flashcard-info-left">
                        <h4 class="flashcard-set-grid-title">${guide.title}</h4>
                        <p class="flashcard-set-grid-date">${date}</p>
                        <p class="flashcard-set-grid-count">${guide.totalCards} Cards</p>
                    </div>
                    <div class="flashcard-info-right">
                        <div class="flashcard-set-grid-actions">
                            <div class="flashcard-menu-container">
                                <button class="flashcard-menu-btn" data-guide-id="${guide.id}" title="More options">
                                    <span>⋯</span>
                                </button>
                                <div class="flashcard-menu-dropdown" id="menu-${guide.id}">
                                    <button class="flashcard-menu-item edit-flashcard-btn" data-guide-id="${guide.id}">
                                        <span>✏️</span> Edit
                                    </button>
                                    <button class="flashcard-menu-item delete-study-guide-btn" data-guide-id="${guide.id}">
                                        <span>🗑️</span> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="flashcard-set-card clickable-flashcard-card" data-guide-id="${guide.id}">
                <div class="flashcard-set-info">
                    <h4 class="flashcard-set-title">${guide.title}</h4>
                    <p class="flashcard-set-date">Created: ${date}</p>
                    <p class="flashcard-set-type">${guide.totalCards} Cards</p>
                </div>
                <div class="flashcard-set-actions">
                    <div class="flashcard-menu-container">
                        <button class="flashcard-menu-btn" data-guide-id="${guide.id}" title="More options">
                            <span>⋯</span>
                        </button>
                        <div class="flashcard-menu-dropdown" id="menu-${guide.id}">
                            <button class="flashcard-menu-item edit-flashcard-btn" data-guide-id="${guide.id}">
                                <span>✏️</span> Edit
                            </button>
                            <button class="flashcard-menu-item delete-study-guide-btn" data-guide-id="${guide.id}">
                                <span>🗑️</span> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

function setupStudyGuideEventListeners(classData) {
    // View study guide buttons
    document.querySelectorAll('.view-study-guide-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const guideId = btn.dataset.guideId;
            await openStudyGuideViewer(guideId, classData);
        });
    });
    
    // Clickable flashcard cards
    document.querySelectorAll('.clickable-flashcard-card').forEach(card => {
        card.addEventListener('click', async (e) => {
            // Don't trigger if clicking on delete button
            if (e.target.closest('.delete-study-guide-btn')) {
                return;
            }
            const guideId = card.dataset.guideId;
            await openFlashcardQuiz(guideId, classData);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-study-guide-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const guideId = btn.dataset.guideId;
            if (confirm('Are you sure you want to delete this study guide?')) {
                deleteStudyGuide(guideId, classData);
            }
        });
    });
    
    // 3 dots menu buttons
    document.querySelectorAll('.flashcard-menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const guideId = btn.dataset.guideId;
            const menu = document.getElementById(`menu-${guideId}`);
            
            // Close other menus
            document.querySelectorAll('.flashcard-menu-dropdown').forEach(m => {
                if (m.id !== `menu-${guideId}`) {
                    m.style.display = 'none';
                }
            });
            
            // Toggle current menu
            if (menu) {
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }
        });
    });
    
    // Edit flashcard buttons
    document.querySelectorAll('.edit-flashcard-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const guideId = btn.dataset.guideId;
            editFlashcardSet(guideId, classData);
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.flashcard-menu-container')) {
            document.querySelectorAll('.flashcard-menu-dropdown').forEach(menu => {
                menu.style.display = 'none';
            });
        }
    });
}

async function editFlashcardSet(guideId, classData) {
    try {
        console.log('📝 Editing flashcard set:', guideId);
        
        // Load the flashcard set data
        const db = window.firebase.firestore();
        const guideRef = db.collection('users').doc(classData.userId).collection('classes').doc(classData.id).collection('studyGuides').doc(guideId);
        const guideDoc = await guideRef.get();
        
        if (!guideDoc.exists) {
            alert('Flashcard set not found.');
            return;
        }
        
        const guide = { id: guideDoc.id, ...guideDoc.data() };
        
        // Create edit modal with dark theme study-like interface
        const modal = document.createElement('div');
        modal.className = 'flashcard-edit-modal';
        modal.innerHTML = `
            <!-- Save and Exit Button -->
            <button class="save-and-exit-flashcard-edit" onclick="saveFlashcardEdit('${guideId}', '${classData.userId}', '${classData.id}')">Save and Exit</button>
            
            <!-- Main Layout Container -->
            <div class="flashcard-edit-layout-container">
                <!-- Left Side - Card List -->
                <div class="flashcard-edit-left-panel">
                    <div class="edit-panel-header">
                        <h3>Flashcard Set: ${guide.title}</h3>
                        <div class="edit-card-count">${guide.flashcards.length} Cards</div>
                    </div>
                    
                    <!-- Card List -->
                    <div class="flashcard-edit-list" id="flashcardEditList">
                        ${guide.flashcards.map((card, index) => `
                            <div class="flashcard-edit-item ${index === 0 ? 'selected' : ''}" data-index="${index}" onclick="selectEditCard(${index})">
                                <div class="edit-card-number">${index + 1}</div>
                                <div class="edit-card-preview">
                                    <div class="edit-card-question-preview">${card.question.substring(0, 40)}${card.question.length > 40 ? '...' : ''}</div>
                                    <div class="edit-card-answer-preview">${card.answer.substring(0, 40)}${card.answer.length > 40 ? '...' : ''}</div>
                                </div>
                                <button class="remove-edit-card-btn" onclick="removeEditCard(${index})" title="Remove card">✕</button>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Add Card Button -->
                    <button class="add-edit-card-btn" onclick="addEditCard()">+ Add New Card</button>
                </div>
                
                <!-- Center - Study Interface -->
                <div class="flashcard-edit-center">
                    <!-- Title Input -->
                    <div class="flashcard-edit-title-section">
                        <input type="text" id="editFlashcardSetTitle" value="${guide.title}" placeholder="Enter flashcard set title" class="flashcard-edit-title-input">
                    </div>
                    
                    <!-- Main Card Display -->
                    <div class="flashcard-edit-card-display" id="flashcardEditCardDisplay">
                        <div class="flashcard-edit-card" id="main-edit-flashcard">
                            <div class="flashcard-edit-inner">
                                <div class="flashcard-edit-front">
                                    <div class="flashcard-edit-question" id="edit-card-question">Click a card to edit</div>
                                </div>
                                <div class="flashcard-edit-back">
                                    <div class="flashcard-edit-answer" id="edit-card-answer">Click a card to edit</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Navigation Controls -->
                        <div class="flashcard-edit-navigation">
                            <button class="edit-nav-btn" id="prevEditCard" onclick="previousEditCard()">← Previous</button>
                            <span class="edit-card-counter" id="editCardCounter">1 / ${guide.flashcards.length}</span>
                            <button class="edit-nav-btn" id="nextEditCard" onclick="nextEditCard()">Next →</button>
                        </div>
                        
                        <!-- Flip Button -->
                        <div class="edit-flip-button-container">
                            <button class="edit-flip-button" onclick="flipEditCard()">
                                <span class="edit-flip-icon">🔄</span>
                                <span class="flip-text">Flip Card</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Right Side - Edit Fields -->
                <div class="flashcard-edit-right-panel">
                    <div class="edit-fields-header">
                        <h3>Edit Card</h3>
                        <div class="edit-card-position" id="editCardPosition">Card 1 of ${guide.flashcards.length}</div>
                    </div>
                    
                    <!-- Question Field -->
                    <div class="edit-field-section">
                        <label class="edit-field-label">
                            <span class="field-icon">❓</span>
                            Question (Front)
                        </label>
                        <textarea 
                            id="editQuestionField" 
                            class="edit-field-textarea" 
                            rows="8" 
                            placeholder="Enter the question..."
                            oninput="updateEditCardQuestion(this.value)"
                        >${guide.flashcards[0]?.question || ''}</textarea>
                    </div>
                    
                    <!-- Answer Field -->
                    <div class="edit-field-section">
                        <label class="edit-field-label">
                            <span class="field-icon">💡</span>
                            Answer (Back)
                        </label>
                        <textarea 
                            id="editAnswerField" 
                            class="edit-field-textarea" 
                            rows="8" 
                            placeholder="Enter the answer..."
                            oninput="updateEditCardAnswer(this.value)"
                        >${guide.flashcards[0]?.answer || ''}</textarea>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="edit-quick-actions">
                        <button class="quick-action-btn" onclick="duplicateEditCard()" title="Duplicate this card">
                            📋 Duplicate
                        </button>
                        <button class="quick-action-btn" onclick="clearEditCard()" title="Clear this card">
                            🗑️ Clear
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Footer Actions -->
            <div class="flashcard-edit-footer">
                <button class="save-flashcard-edit" onclick="saveFlashcardEdit('${guideId}', '${classData.userId}', '${classData.id}')">Save Changes</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners for the edit modal after a short delay to ensure DOM is ready
        setTimeout(() => {
            setupFlashcardEditListeners();
        }, 100);
        
        // Initialize edit interface
        initializeFlashcardEdit(guide);
        
    } catch (error) {
        console.error('Error editing flashcard set:', error);
        alert('Error loading flashcard set for editing. Please try again.');
    }
}

// Global variables for edit interface
let editCards = [];
let currentEditCardIndex = 0;
let isEditCardFlipped = false;

function initializeFlashcardEdit(guide) {
    editCards = [...guide.flashcards];
    currentEditCardIndex = 0;
    isEditCardFlipped = false;
    
    // Update the main card display
    updateEditCardDisplay();
    
    // Update navigation buttons
    updateEditNavigation();
    
    // Update text fields
    updateEditFields();
}

function updateEditCardDisplay() {
    if (editCards.length === 0) {
        document.getElementById('edit-card-question').textContent = 'No cards available';
        document.getElementById('edit-card-answer').textContent = 'Add a card to get started';
        return;
    }
    
    const currentCard = editCards[currentEditCardIndex];
    if (!currentCard) {
        console.error('No card found at index:', currentEditCardIndex);
        return;
    }
    
    console.log('Updating card display with:', currentCard);
    
    // Update the main card display
    const questionElement = document.getElementById('edit-card-question');
    const answerElement = document.getElementById('edit-card-answer');
    
    if (questionElement) {
        questionElement.textContent = currentCard.question || 'No question';
    } else {
        console.error('Question element not found');
    }
    
    if (answerElement) {
        answerElement.textContent = currentCard.answer || 'No answer';
    } else {
        console.error('Answer element not found');
    }
    
    // Update counter
    const counterElement = document.getElementById('editCardCounter');
    if (counterElement) {
        counterElement.textContent = `${currentEditCardIndex + 1} / ${editCards.length}`;
    }
    
    // Update card list selection
    document.querySelectorAll('.flashcard-edit-item').forEach((item, index) => {
        item.classList.toggle('selected', index === currentEditCardIndex);
    });
}

function selectEditCard(index) {
    console.log('Selecting edit card at index:', index);
    console.log('Available cards:', editCards.length);
    
    if (index < 0 || index >= editCards.length) {
        console.error('Invalid card index:', index);
        return;
    }
    
    currentEditCardIndex = index;
    isEditCardFlipped = false;
    updateEditCardDisplay();
    updateEditFields();
    
    // Reset flip state
    const card = document.getElementById('main-edit-flashcard');
    if (card) {
        card.classList.remove('flipped');
    }
}

function previousEditCard() {
    if (currentEditCardIndex > 0) {
        currentEditCardIndex--;
        isEditCardFlipped = false;
        updateEditCardDisplay();
        updateEditFields();
        
        // Reset flip state
        const card = document.getElementById('main-edit-flashcard');
        card.classList.remove('flipped');
    }
}

function nextEditCard() {
    if (currentEditCardIndex < editCards.length - 1) {
        currentEditCardIndex++;
        isEditCardFlipped = false;
        updateEditCardDisplay();
        updateEditFields();
        
        // Reset flip state
        const card = document.getElementById('main-edit-flashcard');
        card.classList.remove('flipped');
    }
}

function flipEditCard() {
    const card = document.getElementById('main-edit-flashcard');
    isEditCardFlipped = !isEditCardFlipped;
    card.classList.toggle('flipped', isEditCardFlipped);
}

function addEditCard() {
    const newCard = {
        question: 'New question',
        answer: 'New answer',
        id: `card_${Date.now()}`
    };
    
    editCards.push(newCard);
    currentEditCardIndex = editCards.length - 1;
    
    // Update the card list
    updateEditCardList();
    updateEditCardDisplay();
    updateEditNavigation();
    updateEditFields();
}

function removeEditCard(index) {
    if (editCards.length <= 1) {
        alert('You must have at least one card in the set.');
        return;
    }
    
    editCards.splice(index, 1);
    
    // Adjust current index if needed
    if (currentEditCardIndex >= editCards.length) {
        currentEditCardIndex = editCards.length - 1;
    }
    
    // Update the interface
    updateEditCardList();
    updateEditCardDisplay();
    updateEditNavigation();
    updateEditFields();
}

function updateEditCardList() {
    const list = document.getElementById('flashcardEditList');
    list.innerHTML = editCards.map((card, index) => `
        <div class="flashcard-edit-item ${index === currentEditCardIndex ? 'selected' : ''}" data-index="${index}" onclick="selectEditCard(${index})">
            <div class="edit-card-preview">
                <div class="edit-card-question-preview">${card.question.substring(0, 50)}${card.question.length > 50 ? '...' : ''}</div>
                <div class="edit-card-answer-preview">${card.answer.substring(0, 50)}${card.answer.length > 50 ? '...' : ''}</div>
            </div>
            <button class="remove-edit-card-btn" onclick="removeEditCard(${index})" title="Remove card">✕</button>
        </div>
    `).join('');
}

function updateEditNavigation() {
    const prevBtn = document.getElementById('prevEditCard');
    const nextBtn = document.getElementById('nextEditCard');
    
    prevBtn.disabled = currentEditCardIndex === 0;
    nextBtn.disabled = currentEditCardIndex === editCards.length - 1;
}

// Update functions for text field changes
function updateEditCardQuestion(value) {
    if (editCards[currentEditCardIndex]) {
        editCards[currentEditCardIndex].question = value;
        updateEditCardDisplay();
        updateEditCardList();
    }
}

function updateEditCardAnswer(value) {
    if (editCards[currentEditCardIndex]) {
        editCards[currentEditCardIndex].answer = value;
        updateEditCardDisplay();
        updateEditCardList();
    }
}

function duplicateEditCard() {
    if (editCards.length === 0) return;
    
    const currentCard = editCards[currentEditCardIndex];
    const newCard = {
        question: currentCard.question + ' (Copy)',
        answer: currentCard.answer,
        id: `card_${Date.now()}`
    };
    
    editCards.splice(currentEditCardIndex + 1, 0, newCard);
    currentEditCardIndex++;
    
    updateEditCardList();
    updateEditCardDisplay();
    updateEditNavigation();
    updateEditFields();
}

function clearEditCard() {
    if (editCards.length === 0) return;
    
    editCards[currentEditCardIndex].question = '';
    editCards[currentEditCardIndex].answer = '';
    
    updateEditCardDisplay();
    updateEditCardList();
    updateEditFields();
}

function updateEditFields() {
    if (editCards.length === 0) {
        document.getElementById('editQuestionField').value = '';
        document.getElementById('editAnswerField').value = '';
        return;
    }
    
    const currentCard = editCards[currentEditCardIndex];
    document.getElementById('editQuestionField').value = currentCard.question;
    document.getElementById('editAnswerField').value = currentCard.answer;
    document.getElementById('editCardPosition').textContent = `Card ${currentEditCardIndex + 1} of ${editCards.length}`;
}

// Make functions globally available
window.selectEditCard = selectEditCard;
window.previousEditCard = previousEditCard;
window.nextEditCard = nextEditCard;
window.flipEditCard = flipEditCard;
window.addEditCard = addEditCard;
window.removeEditCard = removeEditCard;
window.updateEditCardQuestion = updateEditCardQuestion;
window.updateEditCardAnswer = updateEditCardAnswer;
window.duplicateEditCard = duplicateEditCard;
window.clearEditCard = clearEditCard;

function setupFlashcardEditListeners() {
    // Add flashcard button
    document.getElementById('addEditFlashcardBtn').addEventListener('click', () => {
        addFlashcardToEdit();
    });
}

function addFlashcardToEdit() {
    const container = document.getElementById('editFlashcardsContainer');
    const flashcardCount = container.children.length;
    
    const flashcardItem = document.createElement('div');
    flashcardItem.className = 'flashcard-item';
    flashcardItem.innerHTML = `
        <div class="flashcard-card front">
            <div class="flashcard-card-header front">
                <span>Question ${flashcardCount + 1}</span>
            </div>
            <textarea class="flashcard-question-input" rows="3" placeholder="Enter question"></textarea>
        </div>
        <div class="flashcard-card back">
            <div class="flashcard-card-header back">
                <span>Answer ${flashcardCount + 1}</span>
            </div>
            <textarea class="flashcard-answer-input" rows="3" placeholder="Enter answer"></textarea>
        </div>
        <button class="remove-flashcard-btn" onclick="removeFlashcard(this)">Remove</button>
    `;
    
    container.appendChild(flashcardItem);
}

async function saveFlashcardEdit(guideId, userId, classId) {
    try {
        const title = document.getElementById('editFlashcardSetTitle').value.trim();
        if (!title) {
            alert('Please enter a title for the flashcard set.');
            return;
        }
        
        if (editCards.length === 0) {
            alert('Please add at least one flashcard.');
            return;
        }
        
        console.log('💾 Saving edited flashcards for:', guideId);
        
        // Save to Firebase
        const db = window.firebase.firestore();
        await db.collection('users').doc(userId).collection('classes').doc(classId).collection('studyGuides').doc(guideId).update({
            title: title,
            flashcards: editCards,
            totalCards: editCards.length,
            updatedAt: new Date()
        });
        
        console.log('✅ Flashcard set updated successfully');
        closeFlashcardEdit();
        
        // Reload study guides to show changes
        const classData = { userId, id: classId };
        loadStudyGuides(classData);
        
    } catch (error) {
        console.error('Error saving flashcard edit:', error);
        alert('Error saving changes. Please try again.');
    }
}

function closeFlashcardEdit() {
    const modal = document.querySelector('.flashcard-edit-modal');
    if (modal) {
        modal.remove();
    }
}

async function openStudyGuideViewer(guideId, classData) {
    try {
        console.log('📖 Opening study guide viewer for:', guideId);
        
        // Load study guide using direct Firebase pattern
        const db = window.firebase.firestore();
        const guideRef = db.collection('users').doc(classData.userId).collection('classes').doc(classData.id).collection('studyGuides').doc(guideId);
        const guideDoc = await guideRef.get();
        
        if (!guideDoc.exists) {
            console.error('Study guide not found:', guideId);
            return;
        }
        
        const guide = { id: guideDoc.id, ...guideDoc.data() };
    
    // Create modal for study guide viewer
    const modal = document.createElement('div');
    modal.className = 'study-guide-viewer-modal';
    modal.innerHTML = `
        <div class="study-guide-viewer-content">
            <div class="study-guide-viewer-header">
                <h3>${guide.title}</h3>
                <div class="study-guide-viewer-actions">
                    <button class="study-guide-viewer-btn" id="downloadStudyGuide" title="Download">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                    <button class="study-guide-viewer-btn" id="closeStudyGuideViewer" title="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="study-guide-viewer-body">
                ${guide.content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('closeStudyGuideViewer').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('downloadStudyGuide').addEventListener('click', () => {
        downloadStudyGuide(guide);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    } catch (error) {
        console.error('Error opening study guide viewer:', error);
        alert('Error loading study guide. Please try again.');
    }
}

async function openFlashcardQuiz(guideId, classData) {
    try {
        console.log('🎯 Opening flashcard quiz for:', guideId);
        
        // Load study guide from Firebase using direct pattern
        const db = window.firebase.firestore();
        const guideRef = db.collection('users').doc(classData.userId).collection('classes').doc(classData.id).collection('studyGuides').doc(guideId);
        const guideDoc = await guideRef.get();
        
        if (!guideDoc.exists) {
            alert('Flashcard set not found.');
            return;
        }
        
        const guide = { id: guideDoc.id, ...guideDoc.data() };
        
        if (!guide || !guide.flashcards || guide.flashcards.length === 0) {
            alert('No flashcards available in this set. Please create a new flashcard set.');
            return;
        }
    
    // Create floating flashcard interface
    const modal = document.createElement('div');
    modal.className = 'flashcard-quiz-modal';
    modal.innerHTML = `
        <!-- Close Button -->
        <button class="close-flashcard-quiz" onclick="closeFlashcardQuiz()">✕</button>
        
        <!-- Main Layout Container -->
        <div class="flashcard-layout-container">
            <!-- Left Side - Progress Tracker -->
            <div class="flashcard-progress-panel">
                <div class="progress-title">Progress</div>
                <div class="progress-stats">
                    <div class="stat-item stat-correct clickable-stat" onclick="markCorrectFromPanel()">
                        <span class="stat-label">Correct</span>
                        <span class="stat-number" id="correct-count">0</span>
                    </div>
                    <div class="stat-item stat-incorrect clickable-stat" onclick="markIncorrectFromPanel()">
                        <span class="stat-label">Incorrect</span>
                        <span class="stat-number" id="incorrect-count">0</span>
                    </div>
                    <div class="stat-item stat-dont-know clickable-stat" onclick="markDontKnowFromPanel()">
                        <span class="stat-label">Don't Know</span>
                        <span class="stat-number" id="dont-know-count">0</span>
                    </div>
                </div>
                <div class="deck-controls">
                    <button class="deck-btn" onclick="shuffleDeck()">🔀 Shuffle Deck</button>
                    <button class="deck-btn" onclick="resetProgress()">🔄 Reset Progress</button>
                </div>
            </div>
            
            <!-- Center Card Area -->
            <div class="flashcard-center">
                <!-- Main Card -->
                <div class="flashcard" id="main-flashcard">
                    <div class="flashcard-inner">
                        <div class="flashcard-front">
                            <div class="flashcard-question" id="card-question">Loading...</div>
                        </div>
                        <div class="flashcard-back">
                            <div class="flashcard-answer" id="card-answer">Loading...</div>
                        </div>
                    </div>
                </div>
                
                <!-- Swipe Indicators -->
                <div class="swipe-indicators">
                    <div class="swipe-left" id="swipe-left">❌ Incorrect</div>
                    <div class="swipe-right" id="swipe-right">✅ Correct</div>
                    <div class="swipe-up" id="swipe-up">❓ Don't Know</div>
                </div>
                
                <!-- Flip Button -->
                <div class="flip-button-container">
                    <button class="flip-button" onclick="flipCard()">
                        <span class="flip-icon">🔄</span>
                        <span class="flip-text">Flip Card</span>
                    </button>
                </div>
            </div>
            
            <!-- Right Side - Genius Chat -->
            <div class="genius-chat">
                <div class="chat-header">
                    <img src="assets/darkgenius.png" alt="Genius AI" class="genius-icon">
                </div>
                <div class="chat-body">
                    <div class="messages" id="chat-messages"></div>
                    <div class="attachments-display" id="attachments-display" style="display: none;">
                        <div class="attachments-header">📎 Attached Files:</div>
                        <div class="attachments-list" id="attachments-list"></div>
                    </div>
                    <div class="input-container">
                        <input type="text" class="message-input" id="chat-input" placeholder="Ask about the current flashcard...">
                </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add CSS for flip animation if not already present
    const style = document.createElement('style');
    style.textContent = `
        .flashcard {
            perspective: 1000px;
        }
        .flashcard-inner {
            position: relative;
            width: 100%;
            height: 100%;
            text-align: center;
            transition: transform 0.6s;
            transform-style: preserve-3d;
        }
        .flashcard.flipped .flashcard-inner {
            transform: rotateY(180deg);
        }
        .flashcard-front, .flashcard-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 8px;
            padding: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .flashcard-back {
            transform: rotateY(180deg);
        }
        .typing-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #ffffff;
        }
        .typing-text {
            color: #ffffff;
            font-size: 14px;
        }
        
        /* Genius chat - exact same dimensions as progress panel */
        .genius-chat {
            position: relative;
            width: 100%;
            height: min(500px, 60vh);
            background: rgba(26, 26, 26, 0.95);
            border-radius: 15px;
            padding: 0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            align-self: center;
            overflow: hidden;
        }
        
        .chat-header {
            position: sticky;
            top: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 15px 20px;
            background: rgba(26, 26, 26, 0.95);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 10;
        }
        
        .genius-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
        }
        
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            min-height: 300px;
        }
        
        .message {
            margin-bottom: 12px;
            display: flex;
        }
        
        .message.user {
            justify-content: flex-end;
        }
        
        .message.genius {
            justify-content: flex-start;
        }
        
        .message-bubble {
            max-width: 95%;
            padding: 8px 12px;
            border-radius: 12px;
            font-size: 13px;
            line-height: 1.3;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        /* PDF display improvements */
        .message-bubble .pdf-preview {
            max-width: 100%;
            height: 200px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            margin: 8px 0;
            background: rgba(255, 255, 255, 0.05);
        }
        
        .message-bubble .pdf-preview iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
        }
        
        .message-bubble .document-reference {
            background: rgba(0, 123, 255, 0.1);
            border: 1px solid rgba(0, 123, 255, 0.3);
            border-radius: 6px;
            padding: 6px 8px;
            margin: 4px 0;
            font-size: 12px;
            color: #4a9eff;
        }
        
        .message.user .message-bubble {
            background: #007bff;
            color: #ffffff;
        }
        
        .message.genius .message-bubble {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
        }
        
        .typing-indicator {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            padding: 8px 12px;
            border-radius: 12px;
            display: inline-block;
        }
        
        .input-container {
            position: sticky;
            bottom: 0;
            padding: 5px 15px 15px 15px;
            background: rgba(26, 26, 26, 0.95);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 10;
        }
        
        .message-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            font-size: 14px;
            outline: none;
            height: 40px;
        }
        
        .message-input:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 1px #007bff;
        }
        
        .message-input::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }
        
        /* Attachments display */
        .attachments-display {
            padding: 8px 15px;
            background: rgba(0, 123, 255, 0.1);
            border-top: 1px solid rgba(0, 123, 255, 0.3);
            border-bottom: 1px solid rgba(0, 123, 255, 0.3);
        }
        
        .attachments-header {
            font-size: 12px;
            color: #4a9eff;
            margin-bottom: 6px;
            font-weight: 500;
        }
        
        .attachments-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .attachment-item {
            background: rgba(0, 123, 255, 0.2);
            border: 1px solid rgba(0, 123, 255, 0.4);
            border-radius: 12px;
            padding: 4px 8px;
            font-size: 11px;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .attachment-item .file-icon {
            font-size: 10px;
        }
        
        /* Typing animation */
        .typing-dots {
            display: inline-flex;
            gap: 4px;
        }
        
        .typing-dots span {
            width: 6px;
            height: 6px;
            background: #ffffff;
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        .typing-dots span:nth-child(3) { animation-delay: 0s; }
        
        @keyframes typing {
            0%, 80%, 100% { 
                transform: scale(0); 
                opacity: 0.5; 
            }
            40% { 
                transform: scale(1); 
                opacity: 1; 
            }
        }
        
        /* Flip card button styling */
        .flip-button {
            background: rgba(0, 123, 255, 0.2);
            color: #007bff;
            border: 1px solid rgba(0, 123, 255, 0.3);
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .flip-button:hover {
            background: rgba(0, 123, 255, 0.3);
            border-color: rgba(0, 123, 255, 0.5);
            transform: translateY(-1px);
        }
        
        .flip-button:active {
            transform: translateY(0);
        }
        
        /* Progress stats colors */
        .progress-stats .stat-correct .stat-number {
            color: #28a745;
        }
        
        .progress-stats .stat-incorrect .stat-number {
            color: #dc3545;
        }
        
        .progress-stats .stat-dont-know .stat-number {
            color: #ffc107;
        }
        
        .progress-stats .stat-label {
            color: #ffffff;
        }
        .typing-dots {
            display: inline-flex;
            gap: 4px;
        }
        .typing-dots span {
            width: 6px;
            height: 6px;
            background: #ffffff;
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
        }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        .typing-dots span:nth-child(3) { animation-delay: 0s; }
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Flashcard state
    let currentCardIndex = 0;
    let stats = { correct: 0, incorrect: 0, dontKnow: 0 };
    let isShuffled = false;
    let shuffledCards = [...guide.flashcards];
    
    // Initialize after DOM is ready
    setTimeout(() => {
        console.log('Initializing flashcard quiz...');
        const question = document.getElementById('card-question');
        const answer = document.getElementById('card-answer');
        console.log('Elements found:', { question, answer });
        
        if (question && answer) {
    updateCard();
            updateStats();
    setupSwipeGestures();
    setupChatInterface();
            console.log('✅ Flashcard quiz initialized successfully');
        } else {
            console.error('❌ Failed to find required elements, retrying...');
            setTimeout(() => {
                updateCard();
                updateStats();
                setupSwipeGestures();
                setupChatInterface();
            }, 200);
        }
    }, 100);
    
    // Update card display
    function updateCard() {
        const question = document.getElementById('card-question');
        const answer = document.getElementById('card-answer');
        
        console.log('updateCard called, question element:', question, 'answer element:', answer);
        
        if (question && answer) {
        if (currentCardIndex < shuffledCards.length) {
            const cardData = shuffledCards[currentCardIndex];
                console.log('Setting card data:', cardData);
            question.textContent = cardData.question;
            answer.textContent = cardData.answer;
        } else {
            // Quiz complete
            const completeText = '🎉 Quiz Complete!';
            const statsText = `You got ${stats.correct} correct, ${stats.incorrect} incorrect, and ${stats.dontKnow} don't know.`;
            question.textContent = completeText;
            answer.textContent = statsText;
            }
        } else {
            console.error('Card elements not found:', { question, answer });
        }
    }
    
    // Setup chat interface - COMPLETELY REDONE
    function setupChatInterface() {
        const chatInput = document.getElementById('chat-input');
        if (!chatInput) return;
        
        // Clear any existing event listeners
        chatInput.removeEventListener('keypress', handleChatKeyPress);
        
        // Add new event listener
        chatInput.addEventListener('keypress', handleChatKeyPress);
        
        // Update attachments display
        updateAttachmentsDisplay();
        
        console.log('✅ Chat interface setup complete');
    }
    
    // Update attachments display
    function updateAttachmentsDisplay() {
        const attachmentsDisplay = document.getElementById('attachments-display');
        const attachmentsList = document.getElementById('attachments-list');
        
        if (!attachmentsDisplay || !attachmentsList) return;
        
        // Get current class documents
        const classData = JSON.parse(localStorage.getItem('currentClass'));
        const documents = classData?.documents || [];
        
        if (documents.length === 0) {
            attachmentsDisplay.style.display = 'none';
            return;
        }
        
        // Show attachments display
        attachmentsDisplay.style.display = 'block';
        
        // Clear existing attachments
        attachmentsList.innerHTML = '';
        
        // Add each document as an attachment
        documents.forEach((doc, index) => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'attachment-item';
            
            const fileIcon = getFileIcon(doc.fileName || doc.title || 'document');
            const fileName = doc.fileName || doc.title || `Document ${index + 1}`;
            const fileType = doc.type || 'text';
            
            attachmentItem.innerHTML = `
                <span class="file-icon">${fileIcon}</span>
                <span class="file-name">${fileName}</span>
                <span class="file-type">(${fileType})</span>
            `;
            
            attachmentsList.appendChild(attachmentItem);
        });
    }
    
    
    // Handle chat key press - NEW FUNCTION
    function handleChatKeyPress(event) {
        if (event.key === 'Enter') {
            const chatInput = document.getElementById('chat-input');
            const message = chatInput.value.trim();
            
            if (message) {
                console.log('🚀 User message:', message);
                
                // Add user message
                addChatMessage('user', message);
                chatInput.value = '';
                
                // Get AI response
                getAIResponse(message);
            }
        }
    }
    
    // Get AI response - Using OpenAI Assistants API for better file reading
    async function getAIResponse(message) {
        console.log('🤖 Getting AI response for:', message);
        
        try {
            // Get current user and API key
            const currentUserData = localStorage.getItem('currentUser');
            if (!currentUserData) {
                addChatMessage('genius', 'Please log in to use AI chat.');
                return;
            }
            
            const currentUser = JSON.parse(currentUserData);
            
            // Use global API key for all users
            const apiKey = window.getOpenAIApiKey() || window.APP_CONFIG.OPENAI_API_KEY;
            
            if (!apiKey) {
                addChatMessage('genius', 'OpenAI API key not found. Please contact support.');
                return;
            }
            
            // Show typing indicator
            addChatMessage('genius', '', true);
            
            // Get uploaded documents for context
            const classData = JSON.parse(localStorage.getItem('currentClass'));
            const documents = classData?.documents || [];
            
            // Prepare context from flashcards (questions only, no answers)
            const currentCard = shuffledCards[currentCardIndex];
            const currentCardInfo = currentCard ? 
                `CURRENT CARD (${currentCardIndex + 1}/${shuffledCards.length}): Q: ${currentCard.question}` : 
                'No current card';
            
            const allCardsContext = shuffledCards.map((card, index) => 
                `${index + 1}. Q: ${card.question}`
            ).join('\n');
            
            // Prepare document context
            const documentContext = documents.length > 0 ? 
                `\n\nUPLOADED DOCUMENTS:\n${documents.map((doc, index) => 
                    `${index + 1}. ${doc.fileName || doc.title} (${doc.type || 'text'})`
                ).join('\n')}` : 
                '\n\nNo documents uploaded yet.';
            
            const flashcardContext = `${currentCardInfo}\n\nALL CARDS:\n${allCardsContext}${documentContext}`;
            
            console.log('📚 Current card:', currentCardInfo);
            console.log('📚 All cards context:', allCardsContext);
            console.log('📄 Documents context:', documentContext);
            
            // Use OpenAI Assistants API for better file reading (like the C# approach)
            const assistants = await initializeAssistants();
            if (assistants) {
                try {
                    // Create a thread for this conversation
                    await assistants.createThread();
                    
                    // Upload ALL documents to OpenAI (multiple files support)
                    const fileIds = [];
                    const uploadedFiles = [];
                    
                    for (const doc of documents) {
                        try {
                            let fileToUpload;
                            
                            if (doc.content && doc.content.startsWith('data:')) {
                                // Base64 content - convert to file
                                fileToUpload = assistants.base64ToFile ? assistants.base64ToFile(doc.content, doc.fileName || doc.title, doc.type) : null;
                            } else if (doc.type === 'text' && doc.content) {
                                // Text content - create text file
                                const textContent = doc.content.replace(/<[^>]*>/g, '').trim();
                                if (textContent.length > 0) {
                                    fileToUpload = new File([textContent], doc.fileName || doc.title || 'document.txt', { type: 'text/plain' });
                                }
                            }
                            
                            if (fileToUpload) {
                                const uploadResult = await assistants.uploadFile(fileToUpload);
                                fileIds.push(uploadResult.id);
                                uploadedFiles.push({
                                    id: uploadResult.id,
                                    name: doc.fileName || doc.title || 'document',
                                    type: doc.type || 'text'
                                });
                                console.log(`📎 Uploaded file: ${uploadResult.id} (${doc.fileName || doc.title})`);
                            }
                        } catch (uploadError) {
                            console.warn(`⚠️ Failed to upload ${doc.fileName || doc.title}:`, uploadError);
                        }
                    }
                    
                    console.log(`📎 Successfully uploaded ${fileIds.length} files to OpenAI`);
                    
                    // Create message with ALL file attachments (multiple files support)
                    const messageOptions = {
                        role: 'user',
                        content: `Context: ${flashcardContext}\n\nUser Question: ${message}`
                    };
                    
                    if (fileIds.length > 0) {
                        // Attach ALL files to the message
                        messageOptions.attachments = fileIds.map(fileId => ({
                            file_id: fileId,
                            tools: [{ type: 'file_search' }]
                        }));
                        console.log(`📎 Attaching ${fileIds.length} files to message`);
                    }
                    
                    // Get response using Assistants API
                    const response = await assistants.runAssistant(
                        messageOptions.content,
                        messageOptions.attachments || []
                    );
                    
                    // Remove typing indicator
                    const chatMessages = document.getElementById('chat-messages');
                    if (chatMessages) {
                        const lastMessage = chatMessages.lastElementChild;
                        if (lastMessage && lastMessage.querySelector('.typing-indicator')) {
                            lastMessage.remove();
                        }
                    }
                    
                    // Add AI response
                    addChatMessage('genius', response);
                    return;
                    
                } catch (assistantError) {
                    console.log('⚠️ Assistants API failed, falling back to regular API:', assistantError);
                }
            }
            
            // Fallback to regular OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are Genius AI, a helpful study assistant. The student is studying with these flashcards from their uploaded documents:
                            
${flashcardContext}

IMPORTANT RULES:
- NEVER give explicit answers to flashcard questions
- NEVER say "The answer is..." or "The correct answer is..."
- NEVER provide the exact answer from the flashcards
- Instead, help them understand concepts, provide hints, or explain related topics
- Guide them to think through the problem themselves
- You can discuss the topics and concepts, but don't reveal the specific answers

The student is currently on the card marked "CURRENT CARD" above. When they ask questions, you can reference the current card specifically, or any other cards in the set. Be direct, helpful, and educational. Don't use template phrases like "That's a great question" - just give useful answers that help them learn without giving away the answers.`
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });
            
            console.log('📡 API response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API error:', errorText);
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 API data:', data);
            
            const aiResponse = data.choices[0].message.content;
            console.log('💬 AI response:', aiResponse);
            
            // Remove typing indicator
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                const lastMessage = chatMessages.lastElementChild;
                if (lastMessage && lastMessage.querySelector('.typing-indicator')) {
                    lastMessage.remove();
                }
            }
            
            // Add AI response
            addChatMessage('genius', aiResponse);
            
        } catch (error) {
            console.error('❌ Error:', error);
            
            // Remove typing indicator
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                const lastMessage = chatMessages.lastElementChild;
                if (lastMessage && lastMessage.querySelector('.typing-indicator')) {
                    lastMessage.remove();
                }
            }
            
            addChatMessage('genius', `Error: ${error.message}`);
        }
    }
    
    // Add chat message with enhanced PDF and document support
    function addChatMessage(sender, message, isTyping = false) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        if (isTyping) {
            messageDiv.innerHTML = `
                <div class="message-bubble typing-indicator">
                    <span class="typing-dots">
                        <span></span><span></span><span></span>
                    </span>
                </div>
            `;
        } else {
            // Enhanced message processing for PDFs and documents
            let processedMessage = message;
            
            // Clean message processing without test references
            processedMessage = message;
            
            // Check for PDF content in the message and add preview if possible
            const classData = JSON.parse(localStorage.getItem('currentClass'));
            const documents = classData?.documents || [];
            const pdfDocs = documents.filter(doc => 
                doc.type?.includes('pdf') || doc.fileName?.endsWith('.pdf')
            );
            
            let messageContent = `<div class="message-bubble">${processedMessage}</div>`;
            
            // Add PDF previews if the message mentions PDFs
            if (pdfDocs.length > 0 && (message.includes('PDF') || message.includes('pdf'))) {
                pdfDocs.forEach(pdfDoc => {
                    if (pdfDoc.content && pdfDoc.content.startsWith('data:')) {
                        messageContent = `
                            <div class="message-bubble">
                                ${processedMessage}
                                <div class="pdf-preview">
                                    <iframe src="${pdfDoc.content}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH" 
                                            title="${pdfDoc.fileName || 'PDF Document'}"
                                            frameborder="0">
                                    </iframe>
                                </div>
                                <div class="document-reference">
                                    📄 Referenced: ${pdfDoc.fileName || 'PDF Document'}
                                </div>
                            </div>
                        `;
                    }
                });
            }
            
            messageDiv.innerHTML = messageContent;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Setup smooth drag system with visual feedback
    function setupSwipeGestures() {
        const card = document.getElementById('main-flashcard');
        if (!card) return;
        
        let isDragging = false;
        let dragZone = null;
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let dragThreshold = 10;
        
        // Create drag zone overlay
        function createDragZone() {
            if (dragZone) return;
            dragZone = document.createElement('div');
            dragZone.className = 'drag-zone';
            document.body.appendChild(dragZone);
        }
        
        function removeDragZone() {
            if (dragZone) {
                dragZone.remove();
                dragZone = null;
            }
        }
        
        function updateDragZone(direction) {
            if (!dragZone) return;
            dragZone.className = 'drag-zone';
            if (direction) {
                dragZone.classList.add(direction);
            }
        }
        
        
        // Mouse events for smooth dragging
        card.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left mouse button
            e.preventDefault();
            
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            currentX = startX;
            currentY = startY;
            
            // No preview - just start dragging
            
            // Add mouse move and up listeners
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        // Touch events for mobile
        card.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            
            isDragging = false;
            startX = touch.clientX;
            startY = touch.clientY;
            currentX = startX;
            currentY = startY;
            
            // No preview - just start dragging
            
            // Add touch move and end listeners
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
        });
        
        function handleMouseMove(e) {
            e.preventDefault();
            currentX = e.clientX;
            currentY = e.clientY;
            
            const diffX = currentX - startX;
            const diffY = currentY - startY;
            const distance = Math.sqrt(diffX * diffX + diffY * diffY);
            
            if (distance > dragThreshold && !isDragging) {
                // Start dragging
                isDragging = true;
                card.classList.add('dragging');
                createDragZone();
            }
            
            if (isDragging) {
                // Move the card with the mouse smoothly
                card.style.transform = `translate(${diffX}px, ${diffY}px) scale(1.02)`;
                updateDragDirection(diffX, diffY);
            }
        }
        
        function handleTouchMove(e) {
            e.preventDefault();
            const touch = e.touches[0];
            currentX = touch.clientX;
            currentY = touch.clientY;
            
            const diffX = currentX - startX;
            const diffY = currentY - startY;
            const distance = Math.sqrt(diffX * diffX + diffY * diffY);
            
            if (distance > dragThreshold && !isDragging) {
                // Start dragging
                isDragging = true;
                card.classList.add('dragging');
                createDragZone();
            }
            
            if (isDragging) {
                // Move the card with the touch smoothly
                card.style.transform = `translate(${diffX}px, ${diffY}px) scale(1.02)`;
                updateDragDirection(diffX, diffY);
            }
        }
        
        function updateDragDirection(diffX, diffY) {
            // Reset all direction classes
            card.classList.remove('dragging-left', 'dragging-right', 'dragging-up');
            
            // Determine direction and update transform accordingly
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 50) {
                    // Right side - Correct
                    card.classList.add('dragging-right');
                    card.style.transform = `translate(${diffX}px, ${diffY}px) scale(1.02)`;
                    updateDragZone('right');
                } else if (diffX < -50) {
                    // Left side - Incorrect
                    card.classList.add('dragging-left');
                    card.style.transform = `translate(${diffX}px, ${diffY}px) scale(1.02)`;
                    updateDragZone('left');
                } else {
                    // Just dragging, no direction yet
                    card.style.transform = `translate(${diffX}px, ${diffY}px) scale(1.02)`;
                }
            } else if (diffY < -50) {
                // Top side - Don't Know
                card.classList.add('dragging-up');
                card.style.transform = `translate(${diffX}px, ${diffY}px) scale(1.02)`;
                updateDragZone('up');
            } else {
                // Just dragging, no direction yet
                card.style.transform = `translate(${diffX}px, ${diffY}px) scale(1.02)`;
            }
        }
        
        function handleMouseUp(e) {
            e.preventDefault();
            finishDrag();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        
        function handleTouchEnd(e) {
            e.preventDefault();
            finishDrag();
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        }
        
        function finishDrag() {
            if (isDragging) {
                const diffX = currentX - startX;
                const diffY = currentY - startY;
                
                // Determine action based on final position
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 50) {
                        // Right side - Correct
                        markCorrect();
                    } else if (diffX < -50) {
                        // Left side - Incorrect
                        markIncorrect();
                    }
                } else if (diffY < -50) {
                    // Top side - Don't Know
                    markDontKnow();
                }
            }
            
            // Clean up
            isDragging = false;
            card.classList.remove('dragging', 'dragging-left', 'dragging-right', 'dragging-up');
            card.style.transform = ''; // Reset card position
            removeDragZone();
        }
    }
    
    
    // Animate next card
    function animateNextCard() {
        const card = document.getElementById('main-flashcard');
        
        // Add slide up animation
        card.style.transform = 'translateY(100vh) scale(0.8)';
        card.style.opacity = '0';
        card.style.transition = 'all 0.5s ease';
        
        // After animation, update content and slide back up
        setTimeout(() => {
            currentCardIndex++;
            updateCard();
            card.style.transform = 'translateY(0) scale(1)';
            card.style.opacity = '1';
            
            // Reset transition after animation
            setTimeout(() => {
                card.style.transition = 'transform 0.2s ease';
            }, 500);
        }, 300);
    }
    
    // Answer tracking functions
    function markCorrect() {
        stats.correct++;
        updateStats();
        animateNextCard();
    }
    
    function markIncorrect() {
        stats.incorrect++;
        updateStats();
        animateNextCard();
    }
    
    function markDontKnow() {
        stats.dontKnow++;
        updateStats();
        animateNextCard();
    }
    
    // Panel answer functions
    window.markCorrectFromPanel = function() {
        markCorrect();
    };
    
    window.markIncorrectFromPanel = function() {
        markIncorrect();
    };
    
    window.markDontKnowFromPanel = function() {
        markDontKnow();
    };
    
    function nextCard() {
        currentCardIndex++;
            updateCard();
        
        // Sync background card with next card if available
        if (currentCardIndex < shuffledCards.length) {
            const nextCardData = shuffledCards[currentCardIndex];
            const backgroundQuestion = document.getElementById('background-card-question');
            const backgroundAnswer = document.getElementById('background-card-answer');
            backgroundQuestion.textContent = nextCardData.question;
            backgroundAnswer.textContent = nextCardData.answer;
        }
    }
    
    
    // Deck control functions
    window.shuffleDeck = function() {
        shuffledCards = [...guide.flashcards].sort(() => Math.random() - 0.5);
        currentCardIndex = 0;
        isShuffled = true;
        updateCard();
    };
    
    window.resetProgress = function() {
        stats = { correct: 0, incorrect: 0, dontKnow: 0 };
        currentCardIndex = 0;
        updateStats();
        updateCard();
    };
    
    
    
    
    // Update stats display
    function updateStats() {
        const correctCount = document.getElementById('correct-count');
        const incorrectCount = document.getElementById('incorrect-count');
        const dontKnowCount = document.getElementById('dont-know-count');
        
        if (correctCount) correctCount.textContent = stats.correct;
        if (incorrectCount) incorrectCount.textContent = stats.incorrect;
        if (dontKnowCount) dontKnowCount.textContent = stats.dontKnow;
    }
    
    
    // Close function
    window.closeFlashcardQuiz = function() {
        modal.remove();
    };
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFlashcardQuiz();
        }
    });
    
    } catch (error) {
        console.error('Error opening flashcard quiz:', error);
        alert('Error loading flashcard set. Please try again.');
    }
}

function downloadStudyGuide(guide) {
    // Create a downloadable text file
    const textContent = guide.content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${guide.title}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
}

async function deleteStudyGuide(guideId, classData) {
    try {
        // Delete from Firebase
        const { studyGuideService } = await getFirebaseServices();
        await studyGuideService.deleteStudyGuide(classData.userId, classData.id, guideId);
        console.log('Study guide deleted from Firebase');
    } catch (error) {
        console.error('Error deleting study guide from Firebase:', error);
    }
    
    // Also delete from localStorage as backup
    const storageKey = `class_${classData.userId}_${classData.name}_study_guides`;
    let studyGuides = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    studyGuides = studyGuides.filter(g => g.id !== guideId);
    localStorage.setItem(storageKey, JSON.stringify(studyGuides));
    
    // Reload study guides
    loadStudyGuides(classData);
}

// Flip card function for flashcard quiz
window.flipCard = function() {
    const card = document.getElementById('main-flashcard');
    console.log('Flip card called, card element:', card);
    
    if (card) {
        // Toggle flip state
        card.classList.toggle('flipped');
        console.log('Card classes after toggle:', card.className);
    } else {
        console.error('Card element not found for flipping');
    }
};

// Calendar functionality
let currentCalendarDate = new Date();
let selectedCalendarDate = null;
let classEvents = [];

function setupCalendarActions(classData) {
    // Initialize calendar
    initializeCalendar(classData);
    
    // Setup calendar navigation
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const todayBtn = document.getElementById('todayBtn');
    const addEventBtn = document.getElementById('addEventBtn');
    
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            navigateCalendar(-1);
            renderCalendar(classData);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            navigateCalendar(1);
            renderCalendar(classData);
        });
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            currentCalendarDate = new Date();
            selectedCalendarDate = new Date();
            renderCalendar(classData);
            updateUpcomingEvents(classData);
        });
    }
    
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            showEventModal(classData);
        });
    }
    
    
}

function navigateCalendar(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
}

function initializeCalendar(classData) {
    // Load events from localStorage
    loadEvents(classData);
    
    // Render initial calendar
    renderCalendar(classData);
    
    // Update upcoming events
    updateUpcomingEvents(classData);
}

async function loadEvents(classData) {
    try {
        // Try Firebase first
        // Use the same pattern as other services
        const { eventService } = await getFirebaseServices();
        if (!eventService) {
            console.log('EventService not available, using localStorage fallback');
            throw new Error('EventService not available');
        }
        const events = await eventService.getEvents(classData.userId, classData.id);
        
        if (events.length > 0) {
            console.log('Loaded events from Firebase:', events.length);
            classEvents = events;
            return;
        }
        
        // Fallback to localStorage
        const eventsKey = `class_${classData.userId}_${classData.name}_events`;
        const savedEvents = localStorage.getItem(eventsKey);
        if (savedEvents) {
            classEvents = JSON.parse(savedEvents);
            
            // Migrate to Firebase
            if (classEvents.length > 0) {
                console.log('Migrating events from localStorage to Firebase...');
                await eventService.saveEvents(classData.userId, classData.id, classEvents);
                console.log('Events migrated to Firebase');
            }
        } else {
            classEvents = [];
        }
    } catch (error) {
        console.error('Error loading events:', error);
        // Fallback to localStorage
        const eventsKey = `class_${classData.userId}_${classData.name}_events`;
        const savedEvents = localStorage.getItem(eventsKey);
        if (savedEvents) {
            classEvents = JSON.parse(savedEvents);
        } else {
            classEvents = [];
        }
    }
}

async function saveEvents(classData) {
    try {
        // Save to Firebase
        // Use the same pattern as other services
        const { eventService } = await getFirebaseServices();
        if (!eventService) {
            console.log('EventService not available, using localStorage fallback');
            throw new Error('EventService not available');
        }
        await eventService.saveEvents(classData.userId, classData.id, classEvents);
        console.log('Events saved to Firebase');
    } catch (error) {
        console.error('Error saving events to Firebase:', error);
    }
    
    // Also save to localStorage as backup
    const eventsKey = `class_${classData.userId}_${classData.name}_events`;
    localStorage.setItem(eventsKey, JSON.stringify(classEvents));
}

function renderCalendar(classData) {
    const calendarDays = document.getElementById('calendarDays');
    const monthYear = document.getElementById('calendarMonthYear');
    
    if (!calendarDays || !monthYear) return;
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    monthYear.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
    
    // Clear calendar
    calendarDays.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        dayElement.dataset.date = date.toISOString().split('T')[0];
        
        // Check if this is today
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Check if this is selected
        if (selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString()) {
            dayElement.classList.add('selected');
        }
        
        // Check if this day has events
        const dayEvents = getEventsForDate(date);
        if (dayEvents.length > 0) {
            dayElement.classList.add('has-events');
            dayElement.title = `${dayEvents.length} event(s)`;
            
            // Add event dots
            const eventDots = document.createElement('div');
            eventDots.className = 'event-dots';
            dayEvents.slice(0, 3).forEach((event, index) => {
                const dot = document.createElement('div');
                dot.className = 'event-dot';
                dot.style.backgroundColor = event.color || 'rgba(255, 255, 255, 0.7)';
                eventDots.appendChild(dot);
            });
            if (dayEvents.length > 3) {
                const moreDot = document.createElement('div');
                moreDot.className = 'event-dot more';
                moreDot.textContent = '+';
                eventDots.appendChild(moreDot);
            }
            dayElement.appendChild(eventDots);
        }
        
        // Add click event
        dayElement.addEventListener('click', () => {
            selectDate(date, classData);
        });
        
        calendarDays.appendChild(dayElement);
    }
}



function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return classEvents.filter(event => event.date === dateStr);
}

function selectDate(date, classData) {
    selectedCalendarDate = date;
    renderCalendar(classData);
    showEventsForDate(date, classData);
}

function showEventsForDate(date, classData) {
    const selectedDateText = document.getElementById('selectedDateText');
    const eventsList = document.getElementById('eventsList');
    
    if (!selectedDateText || !eventsList) return;
    
    // Update selected date text
    const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    selectedDateText.textContent = dateStr;
    
    // Get events for this date
    const dayEvents = getEventsForDate(date);
    
    if (dayEvents.length === 0) {
        eventsList.innerHTML = '<div class="no-events">No events for this date</div>';
    } else {
        eventsList.innerHTML = dayEvents.map(event => `
            <div class="event-item" data-event-id="${event.id}">
                <div class="event-color" style="background-color: ${event.color}"></div>
                <div class="event-content">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">${event.time || 'All day'}</div>
                    <div class="event-description">${event.description || ''}</div>
                </div>
                <div class="event-actions">
                    <button class="event-edit-btn" onclick="editEvent('${event.id}', '${classData.userId}', '${classData.name}')" title="Edit">
                        <span>✏️</span>
                    </button>
                    <button class="event-delete-btn" onclick="deleteEvent('${event.id}', '${classData.userId}', '${classData.name}')" title="Delete">
                        <span>✕</span>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

function updateUpcomingEvents(classData) {
    const upcomingEvents = document.getElementById('upcomingEvents');
    if (!upcomingEvents) return;
    
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcoming = classEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= nextWeek;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (upcoming.length === 0) {
        upcomingEvents.innerHTML = '<div class="no-upcoming-events">No upcoming events</div>';
    } else {
        upcomingEvents.innerHTML = upcoming.map(event => `
            <div class="upcoming-event-item" onclick="selectDate(new Date('${event.date}'), window.currentClassData)">
                <div class="upcoming-event-color" style="background-color: ${event.color}"></div>
                <div class="upcoming-event-content">
                    <div class="upcoming-event-title">${event.title}</div>
                    <div class="upcoming-event-date">${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
            </div>
        `).join('');
    }
}

function showEventModal(classData, eventId = null) {
    const event = eventId ? classEvents.find(e => e.id === eventId) : null;
    
    const modal = document.createElement('div');
    modal.className = 'event-modal-overlay';
    modal.innerHTML = `
        <div class="event-modal">
            <div class="event-modal-header">
                <h3>${event ? 'Edit Event' : 'Add New Event'}</h3>
                <button class="event-modal-close" onclick="closeEventModal()">✕</button>
            </div>
            <div class="event-modal-content">
                <form id="eventForm">
                    <div class="form-group">
                        <label for="eventTitle">Event Title</label>
                        <input type="text" id="eventTitle" value="${event ? event.title : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="eventDate">Date</label>
                        <input type="date" id="eventDate" value="${event ? event.date : (selectedCalendarDate ? selectedCalendarDate.toISOString().split('T')[0] : '')}" required>
                    </div>
                    <div class="form-group">
                        <label for="eventTime">Time (optional)</label>
                        <input type="time" id="eventTime" value="${event ? event.time : ''}">
                    </div>
                    <div class="form-group">
                        <label for="eventType">Event Type</label>
                        <select id="eventType" required>
                            <option value="assignment" ${event && event.type === 'assignment' ? 'selected' : ''}>Assignment</option>
                            <option value="exam" ${event && event.type === 'exam' ? 'selected' : ''}>Exam</option>
                            <option value="quiz" ${event && event.type === 'quiz' ? 'selected' : ''}>Quiz</option>
                            <option value="project" ${event && event.type === 'project' ? 'selected' : ''}>Project</option>
                            <option value="lecture" ${event && event.type === 'lecture' ? 'selected' : ''}>Lecture</option>
                            <option value="lab" ${event && event.type === 'lab' ? 'selected' : ''}>Lab</option>
                            <option value="other" ${event && event.type === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="eventDescription">Description (optional)</label>
                        <textarea id="eventDescription" rows="3">${event ? event.description : ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeEventModal()">Cancel</button>
                        <button type="submit" class="btn-primary">${event ? 'Update Event' : 'Add Event'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = document.getElementById('eventForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent(classData, eventId);
    });
    
    // Store current class data for global access
    window.currentClassData = classData;
}

function closeEventModal() {
    const modal = document.querySelector('.event-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function saveEvent(classData, eventId = null) {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const type = document.getElementById('eventType').value;
    const description = document.getElementById('eventDescription').value;
    
    const eventData = {
        id: eventId || Date.now().toString(),
        title,
        date,
        time: time || null,
        type,
        description,
        color: getEventColor(type),
        createdAt: eventId ? classEvents.find(e => e.id === eventId).createdAt : new Date().toISOString()
    };
    
    if (eventId) {
        const index = classEvents.findIndex(e => e.id === eventId);
        if (index !== -1) {
            classEvents[index] = eventData;
        }
    } else {
        classEvents.push(eventData);
    }
    
    saveEvents(classData);
    renderCalendar(classData);
    updateUpcomingEvents(classData);
    closeEventModal();
    
    // If we're on the calendar tab, refresh the events display
    if (selectedCalendarDate) {
        showEventsForDate(selectedCalendarDate, classData);
    }
}

function getEventColor(type) {
    const colors = {
        assignment: '#3b82f6',
        exam: '#ef4444',
        quiz: '#f59e0b',
        project: '#8b5cf6',
        lecture: '#10b981',
        lab: '#06b6d4',
        other: '#6b7280'
    };
    return colors[type] || colors.other;
}

function editEvent(eventId, userId, className) {
    const classData = { userId, name: className };
    showEventModal(classData, eventId);
}

function deleteEvent(eventId, userId, className) {
    if (confirm('Are you sure you want to delete this event?')) {
        classEvents = classEvents.filter(e => e.id !== eventId);
        const classData = { userId, name: className };
        saveEvents(classData);
        renderCalendar(classData);
        updateUpcomingEvents(classData);
        
        // If we're on the calendar tab, refresh the events display
        if (selectedCalendarDate) {
            showEventsForDate(selectedCalendarDate, classData);
        }
    }
}

// Fallback service functions for when main services fail to load
function createFallbackDocumentService() {
    return {
        getDocuments: async (userId, classId) => {
            const db = window.firebase.firestore();
            const snapshot = await db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        saveDocument: async (userId, classId, document) => {
            const db = window.firebase.firestore();
            const docRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents').doc();
            await docRef.set({ ...document, id: docRef.id });
            return docRef.id;
        },
        updateDocument: async (userId, classId, docId, updates) => {
            const db = window.firebase.firestore();
            await db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents').doc(docId).update(updates);
        },
        deleteDocument: async (userId, classId, docId) => {
            const db = window.firebase.firestore();
            await db.collection('users').doc(userId).collection('classes').doc(classId).collection('documents').doc(docId).delete();
        }
    };
}

function createFallbackFolderService() {
    return {
        getFolders: async (userId, classId) => {
            const db = window.firebase.firestore();
            const snapshot = await db.collection('users').doc(userId).collection('classes').doc(classId).collection('folders').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        saveFolder: async (userId, classId, folder) => {
            const db = window.firebase.firestore();
            const docRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('folders').doc();
            await docRef.set({ ...folder, id: docRef.id });
            return docRef.id;
        },
        saveFolders: async (userId, classId, folders) => {
            const db = window.firebase.firestore();
            const batch = db.batch();
            folders.forEach(folder => {
                const docRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('folders').doc(folder.id);
                batch.set(docRef, folder);
            });
            await batch.commit();
        }
    };
}

function createFallbackStudyGuideService() {
    return {
        getStudyGuides: async (userId, classId) => {
            const db = window.firebase.firestore();
            const snapshot = await db.collection('users').doc(userId).collection('classes').doc(classId).collection('study_guides').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        saveStudyGuide: async (userId, classId, studyGuide) => {
            const db = window.firebase.firestore();
            const docRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('study_guides').doc();
            await docRef.set({ ...studyGuide, id: docRef.id });
            return docRef.id;
        },
        deleteStudyGuide: async (userId, classId, guideId) => {
            const db = window.firebase.firestore();
            await db.collection('users').doc(userId).collection('classes').doc(classId).collection('study_guides').doc(guideId).delete();
        }
    };
}

function createFallbackEventService() {
    return {
        getEvents: async (userId, classId) => {
            const db = window.firebase.firestore();
            const snapshot = await db.collection('users').doc(userId).collection('classes').doc(classId).collection('events').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        saveEvents: async (userId, classId, events) => {
            const db = window.firebase.firestore();
            const batch = db.batch();
            events.forEach(event => {
                const docRef = db.collection('users').doc(userId).collection('classes').doc(classId).collection('events').doc(event.id);
                batch.set(docRef, event);
            });
            await batch.commit();
        }
    };
}

// Make functions globally available
window.showClassView = showClassView;
window.closeClassView = closeClassView;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.closeEventModal = closeEventModal;

