I will create the `FileMaster` workspace and the `organize_desktop.py` script with the following strict constraints:

### 🛠️ Script Architecture (`FileMaster/organize_desktop.py`)

1.  **Safety & Security (Dry Run First)**
    - Default mode is **Dry Run**.
    - The script will scan and print a mapping table: `[File Name] -> [Proposed Folder]`.
    - **User Confirmation**: The script will pause and ask `Proceed with physical move? (y/n)` before executing any `shutil.move` operations.

2.  **Content Processing & Constraints**
    - **Physical Truncation**: All file reads (Text/PDF/Docx) are strictly capped at **2000 characters**.
    - **Scanned PDF Fallback**: If `pypdf` returns empty text (scanned PDF), the logic automatically degrades to **"Filename-based Classification"**.

3.  **AI Classification Logic (DeepSeek R1)**
    - **Preset Categories**: Enforce selection from: `['Code', 'Documents', 'Finance', 'Media', 'Work', 'Personal', 'Misc']`.
    - **Prompt Engineering**: "Analyze the file info. Prioritize the preset categories. Return ONLY the category name."

4.  **Dependencies**
    - Create `FileMaster/requirements.txt` containing: `requests`, `pypdf`, `python-docx`.

### 📂 Execution Flow
1.  Create `FileMaster` directory.
2.  Install dependencies.
3.  Run script -> View Preview -> Confirm -> Organized!