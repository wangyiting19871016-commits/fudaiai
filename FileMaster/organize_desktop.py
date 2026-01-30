import os
import shutil
import requests
import json
from pathlib import Path
from typing import Optional

# --- Configuration ---
OLLAMA_API_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "deepseek-r1:8b"
ALLOWED_CATEGORIES = ['Code', 'Documents', 'Finance', 'Media', 'Work', 'Personal', 'Misc']
IGNORED_EXTENSIONS = ['.lnk', '.exe', '.url', '.ini', '.bat', '.cmd']
MAX_CONTENT_LENGTH = 2000

# Try to detect Desktop path
DESKTOP_PATH = Path.home() / "Desktop"

# --- Content Extraction ---
def extract_text(file_path: Path) -> Optional[str]:
    """
    Extract text from file. Returns None if extraction fails or empty (scanned PDF).
    Truncates to MAX_CONTENT_LENGTH.
    """
    try:
        suffix = file_path.suffix.lower()
        content = ""

        if suffix in ['.txt', '.md', '.py', '.js', '.json', '.html', '.css', '.log', '.csv', '.yaml', '.yml']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(MAX_CONTENT_LENGTH)
        
        elif suffix == '.pdf':
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                # Read only first few pages until limit
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        content += text
                    if len(content) >= MAX_CONTENT_LENGTH:
                        break
                
                # Fallback for scanned PDF
                if not content.strip():
                    return None
            except ImportError:
                print("Warning: pypdf not installed, skipping PDF content.")
                return None
            except Exception as e:
                print(f"PDF read error {file_path.name}: {e}")
                return None

        elif suffix == '.docx':
            try:
                import docx
                doc = docx.Document(file_path)
                for para in doc.paragraphs:
                    content += para.text + "\n"
                    if len(content) >= MAX_CONTENT_LENGTH:
                        break
            except ImportError:
                print("Warning: python-docx not installed, skipping DOCX content.")
                return None
            except Exception as e:
                print(f"DOCX read error {file_path.name}: {e}")
                return None
        
        else:
            # For other files (images, binaries), return None to use filename-based classification
            return None

        return content[:MAX_CONTENT_LENGTH].strip() if content else None

    except Exception as e:
        print(f"Error reading {file_path.name}: {e}")
        return None

# --- AI Classification ---
def classify_file(file_path: Path) -> str:
    """
    Classify file using DeepSeek R1 via Ollama.
    """
    filename = file_path.name
    content = extract_text(file_path)
    
    # Construct Prompt
    content_info = f"File Content Preview: {content}" if content else "File Content: (Binary/Scanned/Empty - Rely on Filename)"
    
    prompt = f"""
You are a smart file organizer. Analyze the file info below and categorize it into EXACTLY ONE of these folders:
{ALLOWED_CATEGORIES}

Rules:
1. Return ONLY the category name. Do not add explanations or punctuation.
2. Prioritize 'Finance' for invoices, receipts, tax docs.
3. Prioritize 'Code' for scripts, config files.
4. Prioritize 'Media' for images, audio, video.
5. If unclear, use 'Misc'.

File Name: {filename}
{content_info}
"""

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            # Handle R1 thinking output if present (DeepSeek R1 might output <think>...</think>)
            # Usually 'content' field contains the answer.
            # We need to clean it.
            raw_answer = result.get('message', {}).get('content', '').strip()
            
            # Remove <think> blocks if any
            import re
            clean_answer = re.sub(r'<think>.*?</think>', '', raw_answer, flags=re.DOTALL).strip()
            
            # Match against allowed categories
            for cat in ALLOWED_CATEGORIES:
                if cat.lower() in clean_answer.lower():
                    return cat
            
            return 'Misc' # Fallback
        else:
            print(f"API Error: {response.status_code} - {response.text}")
            return 'Misc'
    except Exception as e:
        print(f"Connection Error (is Ollama running?): {e}")
        return 'Misc'

# --- Main Logic ---
def main():
    print("🚀 DeepSeek R1 Desktop Organizer")
    print(f"📂 Target: {DESKTOP_PATH}")
    print(f"🔒 Mode: DRY RUN (No files will be moved without confirmation)")
    print("-" * 50)

    if not DESKTOP_PATH.exists():
        print("Error: Desktop path not found.")
        return

    # 1. Scan and Plan
    plan = {} # file_path -> target_folder
    
    files = [f for f in DESKTOP_PATH.iterdir() if f.is_file() and not f.name.startswith('.')]
    
    if not files:
        print("Desktop is empty! Nothing to do.")
        return

    print(f"Found {len(files)} files. Analyzing...")

    for i, file_path in enumerate(files):
        # Skip this script if it's on desktop (unlikely but safe)
        if file_path.name == os.path.basename(__file__):
            continue

        # Skip software/system files
        if file_path.suffix.lower() in IGNORED_EXTENSIONS:
            print(f"[{i+1}/{len(files)}] {file_path.name} -> \033[90mSkipped (App/System)\033[0m")
            continue

        category = classify_file(file_path)
        plan[file_path] = category
        print(f"[{i+1}/{len(files)}] {file_path.name} -> \033[94m{category}\033[0m")

    # 2. Preview Table
    print("\n" + "=" * 50)
    print("PREVIEW OF OPERATIONS")
    print("=" * 50)
    print(f"{'File Name':<40} | {'Target Folder'}")
    print("-" * 50)
    for f, cat in plan.items():
        print(f"{f.name[:37]+'...' if len(f.name)>37 else f.name:<40} | {cat}")
    print("-" * 50)

    # 3. Confirmation
    confirm = input("\nProceed with physical move? (y/n): ").strip().lower()
    
    if confirm == 'y':
        print("\nMoving files...")
        count = 0
        for f, cat in plan.items():
            target_dir = DESKTOP_PATH / cat
            try:
                if not target_dir.exists():
                    target_dir.mkdir(parents=True, exist_ok=True)
                
                # Handle duplicates
                destination = target_dir / f.name
                if destination.exists():
                    timestamp = int(os.path.getmtime(f))
                    destination = target_dir / f"{f.stem}_{timestamp}{f.suffix}"
                
                shutil.move(str(f), str(destination))
                print(f"✅ Moved: {f.name}")
                count += 1
            except Exception as e:
                print(f"❌ Failed to move {f.name}: {e}")
        
        print(f"\n✨ Done! Organized {count} files.")
    else:
        print("\n🚫 Operation cancelled. No files were moved.")

if __name__ == "__main__":
    main()
