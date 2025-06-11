// app.js - Komplett überarbeitete Version

const calculator = {
  currentInput: '0',
  firstOperand: null,
  operator: null,
  shouldResetInput: false,

  init() {
    this.setupEventListeners();
    this.checkFirstRun();
  },

  setupEventListeners() {
    document.querySelectorAll('.buttons button').forEach(button => {
      button.addEventListener('click', (e) => this.handleButtonClick(e));
    });

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

  // ... (restliche Taschenrechner-Methoden bleiben gleich) ...

  checkFirstRun() {
    if (!localStorage.getItem('vaultPassword')) {
      document.getElementById('password-modal').style.display = 'flex';
    }
  },

  unlockVault() {
    document.getElementById('calculator-view').classList.add('hidden');
    document.getElementById('vault-view').classList.remove('hidden');
    vault.init();
    this.clear();
  }
};

const vault = {
  db: null,
  currentFolder: null,

  init() {
    this.setupEventListeners();
    this.initDB();
  },

  setupEventListeners() {
    document.getElementById('back-to-calculator').addEventListener('click', () => {
      this.closeVault();
    });

    document.getElementById('add-folder').addEventListener('click', () => {
      this.showFolderModal();
    });

    document.getElementById('upload-file').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });

    document.getElementById('file-input').addEventListener('change', (e) => {
      this.showUploadModal(e.target.files);
      e.target.value = '';
    });

    document.getElementById('confirm-upload').addEventListener('click', () => {
      this.processUpload();
    });
  },

  initDB() {
    const request = indexedDB.open('SecretVaultDB', 2);

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
  },

  showFolderModal() {
    document.getElementById('folder-modal').classList.remove('hidden');
    document.getElementById('folder-name').value = '';
    document.getElementById('folder-name').focus();
  },

  createFolder() {
    const name = document.getElementById('folder-name').value.trim();
    if (!name) return;

    const transaction = this.db.transaction(['folders'], 'readwrite');
    const store = transaction.objectStore('folders');
    
    store.add({ 
      name: name,
      created: new Date()
    }).onsuccess = () => {
      this.loadFolders();
      this.showToast('Ordner erstellt');
      document.getElementById('folder-modal').classList.add('hidden');
    };
  },

  showUploadModal(files) {
    if (!files.length) return;
    
    this.uploadFiles = files;
    const select = document.getElementById('folder-select');
    select.innerHTML = '<option value="">Wähle einen Ordner</option>';
    
    const transaction = this.db.transaction(['folders'], 'readonly');
    const store = transaction.objectStore('folders');
    const request = store.getAll();
    
    request.onsuccess = (e) => {
      e.target.result.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.name;
        select.appendChild(option);
      });
      
      document.getElementById('upload-modal').classList.remove('hidden');
    };
  },

  processUpload() {
    const folderId = parseInt(document.getElementById('folder-select').value);
    if (!folderId || !this.uploadFiles) return;

    Array.from(this.uploadFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.saveFile({
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          folderId: folderId,
          uploaded: new Date()
        });
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('upload-modal').classList.add('hidden');
  },

  saveFile(file) {
    const transaction = this.db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    
    store.add(file).onsuccess = () => {
      this.showToast('Datei hochgeladen');
      if (this.currentFolder === file.folderId) {
        this.loadFiles(file.folderId);
      }
    };
  },

  loadFolders() {
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
          <div class="folder-name">${folder.name}</div>
          <div class="folder-actions">
            <button class="open-folder" data-id="${folder.id}">Öffnen</button>
            <button class="delete-folder" data-id="${folder.id}">Löschen</button>
          </div>
        `;
        container.appendChild(folderEl);
      });

      this.setupFolderEvents();
    };
  },

  setupFolderEvents() {
    document.querySelectorAll('.open-folder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.openFolder(parseInt(e.target.getAttribute('data-id')));
      });
    });

    document.querySelectorAll('.delete-folder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (confirm('Ordner und alle enthaltenen Dateien löschen?')) {
          this.deleteFolder(parseInt(e.target.getAttribute('data-id')));
        }
      });
    });
  },

  openFolder(folderId) {
    this.currentFolder = folderId;
    document.getElementById('folder-list').classList.add('hidden');
    document.getElementById('file-list').classList.remove('hidden');
    document.getElementById('current-folder').textContent = 
      document.querySelector(`.folder-name[data-id="${folderId}"]`).textContent;
    
    this.loadFiles(folderId);
  },

  loadFiles(folderId) {
    const transaction = this.db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    const index = store.index('folderId');
    const request = index.getAll(folderId);

    request.onsuccess = (e) => {
      const files = e.target.result;
      const container = document.getElementById('file-list-items');
      container.innerHTML = '';

      if (files.length === 0) {
        container.innerHTML = '<div class="empty">Keine Dateien in diesem Ordner</div>';
        return;
      }

      files.forEach(file => {
        const fileEl = document.createElement('div');
        fileEl.className = 'file';
        fileEl.innerHTML = `
          <div class="file-icon">${this.getFileIcon(file.type)}</div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-meta">${this.formatDate(file.uploaded)} • ${this.formatSize(file.size)}</div>
          </div>
          <button class="delete-file" data-id="${file.id}">Löschen</button>
        `;
        fileEl.addEventListener('click', () => this.showFile(file));
        container.appendChild(fileEl);
      });

      this.setupFileEvents();
    };
  },

  // ... (weitere Methoden für Dateianzeige, Löschen etc.) ...

  closeVault() {
    this.currentFolder = null;
    document.getElementById('vault-view').classList.add('hidden');
    document.getElementById('calculator-view').classList.remove('hidden');
    calculator.clear();
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
