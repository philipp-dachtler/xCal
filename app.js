// app.js - Vollständig korrigierte Version

// Taschenrechner-Komponente
const calculator = {
  currentInput: '0',
  firstOperand: null,
  operator: null,
  shouldResetInput: false,

  init() {
    this.setupEventListeners();
    this.checkPassword();
  },

  setupEventListeners() {
    // Taschenrechner-Buttons
    document.querySelectorAll('.buttons button').forEach(button => {
      button.addEventListener('click', (e) => this.handleButtonClick(e));
    });

    // Passwort-Button
    document.getElementById('set-password').addEventListener('click', () => {
      const password = document.getElementById('new-password').value;
      if (password) {
        localStorage.setItem('vaultPassword', password);
        document.getElementById('password-modal').style.display = 'none';
      }
    });
  },

  handleButtonClick(e) {
    const value = e.target.getAttribute('data-value');
    
    if (value === 'C') {
      this.clear();
    } else if (value === '=') {
      if (this.checkPassword(this.currentInput)) {
        this.unlockVault();
      } else {
        this.calculate();
      }
    } else if (['+', '-', '×', '÷'].includes(value)) {
      this.handleOperator(value);
    } else {
      this.handleNumberInput(value);
    }

    this.updateDisplay();
  },

  handleNumberInput(value) {
    if (this.shouldResetInput) {
      this.currentInput = '0';
      this.shouldResetInput = false;
    }

    if (value === '.') {
      if (!this.currentInput.includes('.')) {
        this.currentInput += value;
      }
    } else {
      this.currentInput = this.currentInput === '0' ? value : this.currentInput + value;
    }
  },

  handleOperator(op) {
    const inputValue = parseFloat(this.currentInput);

    if (this.firstOperand === null) {
      this.firstOperand = inputValue;
    } else if (this.operator) {
      const result = this.calculateResult(this.firstOperand, parseFloat(this.currentInput), this.operator);
      this.currentInput = String(result);
      this.firstOperand = result;
    }

    this.operator = op;
    this.shouldResetInput = true;
  },

  calculate() {
    if (this.operator === null || this.firstOperand === null) return;

    const inputValue = parseFloat(this.currentInput);
    const result = this.calculateResult(this.firstOperand, inputValue, this.operator);
    this.currentInput = String(result);
    this.firstOperand = null;
    this.operator = null;
    this.shouldResetInput = true;
  },

  calculateResult(first, second, op) {
    switch (op) {
      case '+': return first + second;
      case '-': return first - second;
      case '×': return first * second;
      case '÷': return first / second;
      default: return second;
    }
  },

  clear() {
    this.currentInput = '0';
    this.firstOperand = null;
    this.operator = null;
    this.shouldResetInput = false;
  },

  updateDisplay() {
    document.getElementById('display').textContent = this.currentInput;
  },

  checkPassword() {
    if (!localStorage.getItem('vaultPassword')) {
      document.getElementById('password-modal').style.display = 'flex';
      return false;
    }
    return true;
  },

  unlockVault() {
    document.getElementById('calculator-view').classList.add('hidden');
    document.getElementById('vault-view').classList.remove('hidden');
    vault.init();
    this.clear();
  }
};

// Tresor-Komponente
const vault = {
  db: null,

  init() {
    this.setupEventListeners();
    this.initDB();
  },

  setupEventListeners() {
    // Zurück-Button
    document.getElementById('back-to-calculator').addEventListener('click', () => {
      document.getElementById('vault-view').classList.add('hidden');
      document.getElementById('calculator-view').classList.remove('hidden');
      calculator.clear();
    });

    // Ordner-Button
    document.getElementById('add-folder').addEventListener('click', () => {
      this.createFolder();
    });

    // Datei-Button
    document.getElementById('upload-file').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });

    // Datei-Upload
    document.getElementById('file-input').addEventListener('change', (e) => {
      this.handleFileUpload(e);
    });

    // Datei schließen
    document.getElementById('close-file').addEventListener('click', () => {
      document.getElementById('file-modal').classList.add('hidden');
    });
  },

  initDB() {
    const request = indexedDB.open('SecretVaultDB', 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('files')) {
        const store = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
        store.createIndex('folderId', 'folderId', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      this.db = e.target.result;
      this.loadFolders();
    };

    request.onerror = (e) => {
      console.error('Database error:', e.target.error);
    };
  },

  createFolder() {
    const folderName = prompt('Ordnername:');
    if (!folderName) return;

    const transaction = this.db.transaction(['folders'], 'readwrite');
    const store = transaction.objectStore('folders');
    
    store.add({ 
      name: folderName,
      created: new Date()
    }).onsuccess = () => {
      this.loadFolders();
      this.showToast('Ordner erstellt');
    };
  },

  handleFileUpload(e) {
    const files = e.target.files;
    if (!files.length) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.saveFile({
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          date: new Date()
        });
      };
      reader.readAsDataURL(file);
    });
  },

  saveFile(file) {
    const transaction = this.db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    
    store.add(file).onsuccess = () => {
      this.showFilePreview(file);
      this.showToast('Datei gespeichert');
    };
  },

  showFilePreview(file) {
    document.getElementById('file-title').textContent = file.name;
    const preview = document.getElementById('file-preview');
    preview.innerHTML = '';

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = file.data;
      preview.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = file.data;
      video.controls = true;
      preview.appendChild(video);
    } else {
      preview.innerHTML = `
        <div class="file-icon">📄</div>
        <div class="file-info">
          <p>Typ: ${file.type || 'Unbekannt'}</p>
          <p>Größe: ${this.formatSize(file.size)}</p>
        </div>
      `;
    }

    document.getElementById('file-modal').classList.remove('hidden');
  },

  loadFolders() {
    if (!this.db) return;

    const transaction = this.db.transaction(['folders'], 'readonly');
    const store = transaction.objectStore('folders');
    const request = store.getAll();

    request.onsuccess = (e) => {
      const folders = e.target.result;
      const container = document.getElementById('folder-list');
      container.innerHTML = '';

      folders.forEach(folder => {
        const folderEl = document.createElement('div');
        folderEl.className = 'folder';
        folderEl.innerHTML = `
          <div class="folder-icon">📁</div>
          <div>${folder.name}</div>
        `;
        folderEl.addEventListener('click', () => this.openFolder(folder.id));
        container.appendChild(folderEl);
      });
    };
  },

  openFolder(id) {
    alert(`Ordner ${id} wird geöffnet`);
  },

  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  },

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
};

// App starten
document.addEventListener('DOMContentLoaded', () => {
  calculator.init();
});
