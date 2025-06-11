// app.js - Vollständig korrigierte Version

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

// Initialisierung
function initApp() {
    // Passwort prüfen
    if (!localStorage.getItem('vaultPassword')) {
        passwordModal.style.display = 'flex';
    } else {
        passwordModal.style.display = 'none';
    }
    
    // Taschenrechner-Buttons initialisieren
    initCalculator();
}

// Taschenrechner initialisieren
function initCalculator() {
    document.querySelectorAll('.buttons button').forEach(button => {
        button.addEventListener('click', handleButtonClick);
    });
}

// Button-Klick-Handler
function handleButtonClick(e) {
    const value = e.target.getAttribute('data-value');

    if (value === 'C') {
        clearCalculator();
    } else if (value === '=') {
        if (checkPassword(currentInput)) {
            unlockVault();
        } else {
            calculate();
        }
    } else if (['+', '-', '×', '÷'].includes(value)) {
        handleOperator(value);
    } else {
        handleNumberInput(value);
    }

    updateDisplay();
}

// Zahlen-Eingabe
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
        currentInput = currentInput === '0' ? value : currentInput + value;
    }
}

// Operator-Handler
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

// Berechnung
function calculate() {
    if (operator === null || firstOperand === null) return;

    const inputValue = parseFloat(currentInput);
    const result = calculateResult(firstOperand, inputValue, operator);
    currentInput = String(result);
    firstOperand = null;
    operator = null;
    shouldResetInput = true;
}

// Ergebnis berechnen
function calculateResult(first, second, op) {
    switch (op) {
        case '+': return first + second;
        case '-': return first - second;
        case '×': return first * second;
        case '÷': return first / second;
        default: return second;
    }
}

// Taschenrechner zurücksetzen
function clearCalculator() {
    currentInput = '0';
    firstOperand = null;
    operator = null;
    shouldResetInput = false;
}

// Display aktualisieren
function updateDisplay() {
    display.textContent = currentInput;
}

// Passwort prüfen
function checkPassword(input) {
    const password = localStorage.getItem('vaultPassword');
    return input === password;
}

// Tresor freischalten
function unlockVault() {
    calculatorView.classList.add('hidden');
    vaultView.classList.remove('hidden');
    clearCalculator();
}

// Passwort setzen
setPasswordButton.addEventListener('click', () => {
    const password = newPasswordInput.value;
    if (password) {
        localStorage.setItem('vaultPassword', password);
        passwordModal.style.display = 'none';
    }
});

// App starten
document.addEventListener('DOMContentLoaded', initApp);
