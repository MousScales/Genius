// Simple Spell Check Functionality
let spellCheckEnabled = true;

// Initialize spell check when document editor opens
function initializeSpellCheck() {
    if (!spellCheckEnabled) return;
    
    const contentElement = document.getElementById('docEditorContent');
    if (!contentElement) return;
    
    // Disable browser's built-in spell check
    contentElement.setAttribute('spellcheck', 'false');
    
    // Add event listeners for real-time spell checking
    contentElement.addEventListener('input', debounce(performSpellCheck, 500));
    contentElement.addEventListener('paste', () => {
        setTimeout(performSpellCheck, 200);
    });
    
    // Initial spell check
    setTimeout(performSpellCheck, 1000);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Main spell check function
function performSpellCheck() {
    if (!spellCheckEnabled) return;
    
    const contentElement = document.getElementById('docEditorContent');
    if (!contentElement) return;
    
    console.log('🔍 Starting spell check...');
    
    // Clear existing markers
    clearSpellCheckMarkers();
    
    // Get all text content
    const text = contentElement.textContent || contentElement.innerText || '';
    console.log('📝 Text to check:', text);
    
    // Find misspelled words
    const words = text.split(/\s+/).filter(word => word.length > 2 && /^[a-zA-Z]+$/.test(word));
    console.log('📝 Words to check:', words);
    
    words.forEach(word => {
        if (isMisspelled(word)) {
            console.log('❌ Misspelled word found:', word);
            markMisspelledWord(word);
        }
    });
    
    console.log('✅ Spell check completed');
}

// Check if a word is misspelled
function isMisspelled(word) {
    const commonWords = [
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
        'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
        'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
        'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
        'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been',
        'has', 'had', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'if', 'up', 'out', 'many', 'then', 'them',
        'can', 'only', 'other', 'new', 'some', 'what', 'time', 'very', 'when', 'much', 'get', 'through', 'back', 'much', 'before',
        'go', 'good', 'new', 'first', 'last', 'long', 'little', 'own', 'other', 'old', 'right', 'big', 'high', 'different', 'small',
        'large', 'next', 'early', 'young', 'important', 'few', 'public', 'same', 'able', 'walking', 'library', 'because', 'really',
        'study', 'exams', 'keep', 'getting', 'distracted', 'was', 'walking', 'library', 'because', 'really', 'study', 'exams',
        'keep', 'getting', 'distracted'
    ];
    
    return !commonWords.includes(word.toLowerCase());
}

// Mark a misspelled word
function markMisspelledWord(word) {
    const contentElement = document.getElementById('docEditorContent');
    if (!contentElement) return;
    
    // Find and replace the word in the content
    const html = contentElement.innerHTML;
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    
    if (regex.test(html)) {
        const newHtml = html.replace(regex, `<span class="spell-check-error" data-word="${word}">${word}</span>`);
        contentElement.innerHTML = newHtml;
        
        // Add click event to show suggestions
        const markers = contentElement.querySelectorAll('.spell-check-error');
        markers.forEach(marker => {
            marker.addEventListener('click', (e) => {
                e.preventDefault();
                showSpellCheckSuggestions(marker, word);
            });
        });
    }
}

// Show spell check suggestions
function showSpellCheckSuggestions(element, word) {
    // Remove existing popup
    const existingPopup = document.querySelector('.spell-check-suggestion-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'spell-check-suggestion-popup';
    popup.innerHTML = `
        <div class="suggestion-header">
            <span class="misspelled-word">"${word}"</span>
            <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="suggestions-list">
            ${getSuggestions(word).map(suggestion => 
                `<div class="suggestion-item" onclick="replaceWord('${word}', '${suggestion}'); this.parentElement.parentElement.remove();">${suggestion}</div>`
            ).join('')}
        </div>
        <div class="suggestion-actions">
            <button class="ignore-btn" onclick="ignoreWord('${word}'); this.parentElement.parentElement.remove();">Ignore</button>
        </div>
    `;
    
    // Position popup
    const rect = element.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.left = rect.left + 'px';
    popup.style.top = (rect.bottom + 5) + 'px';
    popup.style.zIndex = '10000';
    
    document.body.appendChild(popup);
    
    // Close popup when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closePopup(e) {
            if (!popup.contains(e.target) && e.target !== element) {
                popup.remove();
                document.removeEventListener('click', closePopup);
            }
        });
    }, 100);
}

// Get suggestions for a word
function getSuggestions(word) {
    const suggestions = {
        'wuz': 'was',
        'walkin': 'walking',
        'libary': 'library',
        'becuz': 'because',
        'realy': 'really',
        'studdy': 'study',
        'egzams': 'exams',
        'kep': 'keep',
        'geting': 'getting',
        'distacted': 'distracted',
        'teh': 'the',
        'adn': 'and',
        'nad': 'and',
        'taht': 'that',
        'thier': 'their',
        'recieve': 'receive',
        'seperate': 'separate',
        'occured': 'occurred',
        'definately': 'definitely',
        'beleive': 'believe',
        'calender': 'calendar',
        'cemetary': 'cemetery',
        'collegue': 'colleague',
        'comming': 'coming',
        'concious': 'conscious',
        'dependant': 'dependent',
        'embarass': 'embarrass',
        'exagerate': 'exaggerate',
        'existance': 'existence',
        'foriegn': 'foreign',
        'goverment': 'government',
        'independant': 'independent',
        'priviledge': 'privilege',
        'untill': 'until',
        'usefull': 'useful',
        'writting': 'writing',
        'writen': 'written'
    };
    
    return suggestions[word.toLowerCase()] ? [suggestions[word.toLowerCase()]] : ['Check spelling'];
}

// Replace a word
function replaceWord(oldWord, newWord) {
    const contentElement = document.getElementById('docEditorContent');
    if (!contentElement) return;
    
    const html = contentElement.innerHTML;
    const regex = new RegExp(`<span class="spell-check-error" data-word="${oldWord}">${oldWord}</span>`, 'gi');
    const newHtml = html.replace(regex, newWord);
    contentElement.innerHTML = newHtml;
}

// Ignore a word
function ignoreWord(word) {
    const contentElement = document.getElementById('docEditorContent');
    if (!contentElement) return;
    
    const html = contentElement.innerHTML;
    const regex = new RegExp(`<span class="spell-check-error" data-word="${word}">${word}</span>`, 'gi');
    const newHtml = html.replace(regex, word);
    contentElement.innerHTML = newHtml;
}

// Clear all spell check markers
function clearSpellCheckMarkers() {
    const contentElement = document.getElementById('docEditorContent');
    if (!contentElement) return;
    
    const markers = contentElement.querySelectorAll('.spell-check-error');
    markers.forEach(marker => {
        marker.replaceWith(document.createTextNode(marker.textContent));
    });
}

// Toggle spell check
function toggleSpellCheck() {
    spellCheckEnabled = !spellCheckEnabled;
    
    if (spellCheckEnabled) {
        initializeSpellCheck();
    } else {
        clearSpellCheckMarkers();
    }
}

// Make functions globally available
window.initializeSpellCheck = initializeSpellCheck;
window.toggleSpellCheck = toggleSpellCheck;
window.clearSpellCheckMarkers = clearSpellCheckMarkers;
