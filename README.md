# Treasure Valley Pickleball - Event Hub

An application for players at a pickleball event to view their match schedule, court assignments, and report scores. It also features AI-powered features for generating schedules and summarizing results.

This is a modern, frontend-only web application built with React and TypeScript, running directly in the browser without a backend server or complex build steps.

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
    *   Open the project folder in VS Code.
    *   Right-click on the `index.html` file in the file explorer.
    *   Select "Open with Live Server".
    *   A new browser tab will open with the application running.

---

## Deployment on GitHub Pages

This app is designed to be easily deployed on a static hosting service like GitHub Pages.

1.  **Create a GitHub Repository:** Create a new public repository on GitHub.
2.  **Upload Files:** Upload all the project files (`index.html`, `App.tsx`, `components/`, etc.) to the repository.
3.  **Activate GitHub Pages:**
    *   In your repository, go to **Settings > Pages**.
    *   Under "Build and deployment", set the source to **"Deploy from a branch"**.
    *   Select the `main` branch (or whichever branch you are using) and the `/ (root)` folder.
    *   Click **Save**.
5.  **View Your Site:** Wait a minute or two, and your live site will be available at the URL shown on the Pages settings screen. You can now test it on multiple devices.