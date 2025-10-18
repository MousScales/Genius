# Genius Web App

A comprehensive class management system with AI-powered features for students and educators.

## Features

- 🎓 **Class Management**: Create and organize classes
- 📚 **Document Management**: Upload and organize study materials
- 🤖 **AI-Powered Tools**: Generate flashcards, study guides, and get AI assistance
- 💬 **Genius Chat**: Interactive AI chat for homework help
- 📊 **Study Analytics**: Track progress and performance
- 🔐 **User Authentication**: Secure login with Firebase Auth

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd genius-web-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your actual API keys:
   ```env
   # OpenAI API Configuration
   OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here
   
   # Firebase Configuration (optional - defaults are provided)
   FIREBASE_API_KEY=your-firebase-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   FIREBASE_MEASUREMENT_ID=your-measurement-id
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing one
3. Enable Firestore Database
4. Set up Authentication (Email/Password)
5. Update Firebase configuration in `.env` file
6. Set up Firestore security rules (see below)

### 5. Firestore Security Rules

Add these rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow access to user's classes
      match /classes/{classId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Allow access to documents within classes
        match /documents/{documentId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
          
          // Allow access to document data (chats, etc.)
          match /data/{dataId} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
          }
        }
        
        // Allow access to folders within classes
        match /folders/{folderId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        
        // Allow access to study guides within classes
        match /studyGuides/{studyGuideId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        
        // Allow access to class data (events, etc.)
        match /data/{dataId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
      
      // Allow access to genius chats
      match /geniusChats/{chatId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Allow access to user data (genius chats data)
      match /data/{dataId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Allow authenticated users to read/write any document (fallback for other collections)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. Start the Application

```bash
# Start the server
npm start

# Or for development
npm run dev
```

The application will be available at:
- **Main App**: http://localhost:3001
- **Dashboard**: http://localhost:3001/dashboard
- **Login**: http://localhost:3001/login
- **Onboarding**: http://localhost:3001/onboarding

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/openai` - OpenAI API proxy
- `POST /api/zerogpt` - ZeroGPT API proxy
- `GET /api/env` - Environment configuration

## Project Structure

```
genius-web-app/
├── js/
│   ├── config.js          # Configuration management
│   ├── firebase-config.js # Firebase setup
│   ├── firebase-service.js # Firebase operations
│   ├── geniusChat.js      # AI chat functionality
│   ├── classView.js       # Class management
│   ├── documentEditor.js  # Document editing
│   └── ...
├── styles/
│   └── styles.css         # Main styles
├── assets/                # Images and assets
├── server.js              # Express server
├── package.json           # Dependencies
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `FIREBASE_API_KEY` | Firebase API key | No (has defaults) |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain | No (has defaults) |
| `FIREBASE_PROJECT_ID` | Firebase project ID | No (has defaults) |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | No (has defaults) |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | No (has defaults) |
| `FIREBASE_APP_ID` | Firebase app ID | No (has defaults) |
| `FIREBASE_MEASUREMENT_ID` | Firebase measurement ID | No (has defaults) |
| `PORT` | Server port | No (defaults to 3001) |
| `NODE_ENV` | Environment mode | No (defaults to development) |

## Security Notes

- Never commit your `.env` file to version control
- The `.env.example` file contains placeholder values
- API keys are loaded from environment variables
- Firebase security rules ensure user data isolation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
