# Treasure Valley Pickleball - Event Hub

An application for players at a pickleball event to view their match schedule, court assignments, and report scores. It also features AI-powered features for generating schedules and summarizing results.

This is a modern, frontend-only web application built with React and TypeScript, running directly in the browser without a backend server or complex build steps.

---

## Setting Up Your API Key (Required)

For the AI features to work, you must add your Google Gemini API key to the code.

1.  **Get an API Key:** If you don't have one, get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Add Key to Code:**
    *   Open the file `services/geminiService.ts`.
    *   Find the line: `const API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE";`
    *   Replace `"PASTE_YOUR_GEMINI_API_KEY_HERE"` with your actual key.

**WARNING:** Do not commit your API key to a public GitHub repository if you are concerned about its security. For personal testing and limited-audience events, this is acceptable, but for a large public project, you would need a more secure backend architecture.

---

## Running Locally

The instructions from the default AI Studio template (`npm install`, `npm run dev`) **do not apply** to this project.

Because this app uses modern JavaScript modules, you need a simple local web server to run it. The easiest way is with a code editor extension.

### Recommended Method: VS Code Live Server

1.  **Install Visual Studio Code:** If you don't have it, download it from [code.visualstudio.com](https://code.visualstudio.com/).
2.  **Install the Live Server Extension:**
    *   Open VS Code.
    *   Go to the Extensions view (click the square icon on the left sidebar or press `Ctrl+Shift+X`).
    *   Search for "Live Server" by Ritwick Dey.
    *   Click "Install".
3.  **Run the App:**
    *   After adding your API key, open the project folder in VS Code.
    *   Right-click on the `index.html` file in the file explorer.
    *   Select "Open with Live Server".
    *   A new browser tab will open with the application running.

---

## Deployment on GitHub Pages

This app is designed to be easily deployed on a static hosting service like GitHub Pages.

1.  **Add your API Key:** Make sure you have completed the "Setting Up Your API Key" step above.
2.  **Create a GitHub Repository:** Create a new public repository on GitHub.
3.  **Upload Files:** Upload all the project files (`index.html`, `App.tsx`, `components/`, etc.) to the repository.
4.  **Activate GitHub Pages:**
    *   In your repository, go to **Settings > Pages**.
    *   Under "Build and deployment", set the source to **"Deploy from a branch"**.
    *   Select the `main` branch (or whichever branch you are using) and the `/ (root)` folder.
    *   Click **Save**.
5.  **View Your Site:** Wait a minute or two, and your live site will be available at the URL shown on the Pages settings screen. You can now test it on multiple devices.
