# Fractal EDU 2.0

Fractal EDU is a comprehensive educational management suite designed for modern Australian educators. It streamlines the lifecycle of student tracking, from deep academic analytics and diagnostic growth measures to official NESA compliance monitoring.
All data is stored locally to ensure the privacy of students.
## 🚀 Key Modules

### 1. Junior Monitoring & Compliance
*   **Dynamic Evidence Collection**: Track teaching programs, assessment schedules, and student work samples.
*   **Term Sign-offs**: Digital signature workflow for teachers and head teachers.
*   **Review Packages**: Export `.profiler-review` files—self-contained snapshots that bundle data and files for offline archival or head teacher review.

### 2. Student Profiler (Dossier)
*   **Contextual Snapshots**: Real-time attendance, ATSI/EALD status, and active concerns.
*   **NCCD Management**: Built-in support for NCCD levels (QDTP, Supplementary, etc.) with functional impact statements.
*   **Strategy Bank**: A searchable repository of differentiation strategies linked directly to evidence logs.

### 3. Academic Analytics
*   **Exam Builder**: Create hierarchical exam structures with syllabus outcome mapping.
*   **Dual-View Entry**: Toggle between a "Spreadsheet" mode for speed and "Single Student" mode for focus.
*   **Mastery Analytics**: Automated cohort vs. individual comparison, band distribution, and distractor analysis.

### 4. Diagnostic Growth Engine
*   **Pre/Post Testing**: Measure "Value Add" with automated growth calculation.
*   **Visual Trends**: Scatter charts for individual student progress and mastery bar charts for topic intervention.

---

## 🛠 Tech Stack
*   **Framework**: React 18 + Vite
*   **State**: Zustand (Persistent Local Storage)
*   **Styling**: Tailwind CSS (Dual Light/Dark Mode)
*   **PDF Engine**: jsPDF (Vector Graphics) & @react-pdf/renderer
*   **Bundling**: JSZip (Evidence Packaging)
*   **Persistence**: IndexedDB (Local File Storage)

---

## 💻 Installation & Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/yourusername/fractal-edu.git
    cd fractal-edu
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Build for Production**:
    ```bash
    npm run build
    ```

## 📂 Project Structure
```text
/src
 ├── /assets             # Global static assets
 ├── /context            # Theme and Application contexts
 ├── /features           # Domain-driven feature modules
 │    ├── /analytics     # Exam Analytics & Data Entry
 │    ├── /classes       # Class management & Seating Plans
 │    ├── /diagnostics   # Pre/Post Growth analysis
 │    ├── /monitoring    # Compliance & Term evidence
 │    ├── /profiler      # Student dossiers & NCCD
 │    └── /reporting     # PDF Generation services
 ├── /services           # API, Storage (IndexedDB), and Sync services
 ├── /shared             # Reusable UI components & Dialogs
 ├── /store.ts           # Central State Management (Zustand)
 ├── /types.ts           # Global TypeScript interfaces
 └── /App.tsx            # Root routing and Layout
```

## 📄 License
This project is private and intended for internal educational use.
