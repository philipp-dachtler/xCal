// app.js
// Taschenrechner Variablen
let currentInput = '0';
let firstOperand = null;
let operator = null;
let shouldResetInput = false;

// DOM Elemente
const display = document.getElementById('display');
const calculatorView = document.getElementById('calculator-view');
const vaultView = document.getElementById('vault-view');
const passwordModal = document.getElementById('password-modal');
const newPasswordInput = document.getElementById('new-password');
const setPasswordButton = document.getElementById('set-password');
const backToCalculatorButton = document.getElementById('back-to-calculator');
const addFolderButton = document.getElementById('add-folder');
const uploadFileButton = document.getElementById('upload-file');
const fileInput = document.getElementById('file-input');
const folderList = document.getElementById('folder-list');
const fileModal = document.getElementById('file-modal');
const fileTitle = document.getElementById('file-title');
const filePreview = document.getElementById('file-preview');
const closeFileButton = document.getElementById('close-file');

// IndexedDB Initialisierung
let db;
const DB_NAME = 'SecretVaultDB';
const DB_VERSION = 1;

// Passwortprüfung
if (!localStorage.getItem('vaultPassword')) {
    passwordModal.style.display = 'flex';
} else {
    passwordModal.style.display = 'none';
}

// Passwort setzen
setPasswordButton.addEventListener('click', () => {
    const password = newPasswordInput.value;
    if (password) {
        localStorage.setItem('vaultPassword', password);
        passwordModal.style.display = 'none';
    }
});

// Taschenrechner Logik
document.querySelectorAll('.buttons button').forEach(button => {
    button.addEventListener('click', () => {
        const value = button.getAttribute('data-value');

        if (value === 'C') {
            clearCalculator();
        } else if (value === '=') {
            if (checkPassword(currentInput)) {
                calculatorView.classList.add('hidden');
                vaultView.classList.remove('hidden');
                loadFolders();
                clearCalculator();
            } else {
                calculate();
            }
        } else if (['+', '-', '×', '÷'].includes(value)) {
            handleOperator(value);
        } else {
            handleNumberInput(value);
        }

        updateDisplay();
    });
});

function handleNumberInput(value) {
    if (shouldResetInput) {
        currentInput = '0';
        shouldResetInput = false;
    }

    if (value === '.') {
        if (!currentInput.includes('.')) {
            currentInput += value;
        }
    } else {
        if (currentInput === '0') {
            currentInput = value;
        } else {
            currentInput += value;
        }
    }
}

function handleOperator(op) {
    const inputValue = parseFloat(currentInput);

    if (firstOperand === null) {
        firstOperand = inputValue;
    } else if (operator) {
        const result = calculateResult(firstOperand, parseFloat(currentInput), operator);
        currentInput = String(result);
        firstOperand = result;
    }

    operator = op;
    shouldResetInput = true;
}

function calculate() {
    if (operator === null || firstOperand === null) return;

    const inputValue = parseFloat(currentInput);
    const result = calculateResult(firstOperand, inputValue, operator);
    currentInput = String(result);
    firstOperand = null;
    operator = null;
    shouldResetInput = true;
}

function calculateResult(first, second, op) {
    switch (op) {
        case '+': return first + second;
        case '-': return first - second;
        case '×': return first * second;
        case '÷': return first / second;
        default: return second;
    }
}

function clearCalculator() {
    currentInput = '0';
    firstOperand = null;
    operator = null;
    shouldResetInput = false;
}

function updateDisplay() {
    display.textContent = currentInput;
}

function checkPassword(input) {
    const password = localStorage.getItem('vaultPassword');
    return input === password;
}

// Vault Logik
backToCalculatorButton.addEventListener('click', () => {
    vaultView.classList.add('hidden');
    calculatorView.classList.remove('hidden');
    clearCalculator();
});

addFolderButton.addEventListener('click', () => {
    const folderName = prompt('Ordnername:');
    if (folderName) {
        addFolder(folderName);
    }
});

uploadFileButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleFileUpload);
closeFileButton.addEventListener('click', () => {
    fileModal.classList.add('hidden');
});

// IndexedDB Funktionen
function initDB() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        
        if (!db.objectStoreNames.contains('folders')) {
            db.createObjectStore('folders', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('files')) {
            const filesStore = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
            filesStore.createIndex('folderId', 'folderId', { unique: false });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadFolders();
    };

    request.onerror = function(event) {
        console.error('Database error:', event.target.error);
    };
}

function addFolder(name) {
    const transaction = db.transaction(['folders'], 'readwrite');
    const store = transaction.objectStore('folders');
    
    store.add({ name: name, created: new Date() }).onsuccess = function() {
        loadFolders();
    };
}

function loadFolders() {
    if (!db) return;
    
    const transaction = db.transaction(['folders'], 'readonly');
    const store = transaction.objectStore('folders');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const folders = event.target.result;
        folderList.innerHTML = '';
        
        folders.forEach(folder => {
            const folderElement = document.createElement('div');
            folderElement.className = 'folder';
            folderElement.innerHTML = `
                <div class="folder-icon">📁</div>
                <div>${folder.name}</div>
            `;
            folderElement.addEventListener('click', () => {
                openFolder(folder.id);
            });
            folderList.appendChild(folderElement);
        });
    };
}

function openFolder(folderId) {
    // Hier würde die Dateiliste für den Ordner geladen werden
    alert(`Ordner ${folderId} geöffnet`);
}

function handleFileUpload(event) {
    const files = event.target.files;
    if (!files.length) return;

    // Hier würde der Dateiupload in IndexedDB implementiert werden
    const file = files[0];
    showFilePreview(file);
    fileInput.value = '';
}

function showFilePreview(file) {
    fileTitle.textContent = file.name;
    filePreview.innerHTML = '';

    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        filePreview.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.controls = true;
        filePreview.appendChild(video);
    } else if (file.type.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.src = URL.createObjectURL(file);
        audio.controls = true;
        filePreview.appendChild(audio);
    } else {
        filePreview.textContent = `Dateityp: ${file.type}`;
    }

    fileModal.classList.remove('hidden');
}

// Service Worker Registrierung
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registriert');
            })
            .catch(error => {
                console.error('ServiceWorker Registrierung fehlgeschlagen:', error);
            });
    });
}

// App Initialisierung
initDB();
