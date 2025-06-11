// INITIALISIERUNG
document.addEventListener('DOMContentLoaded', () => {
    // Nur Passwort-Modal anzeigen wenn kein Passwort existiert
    if (!localStorage.getItem('vaultPassword')) {
        document.getElementById('password-modal').style.display = 'flex';
    }
});

// PASSWORT HANDLING
document.getElementById('set-password').addEventListener('click', () => {
    const password = document.getElementById('new-password').value;
    if (password) {
        localStorage.setItem('vaultPassword', password);
        document.getElementById('password-modal').style.display = 'none';
    }
});

// TASCHENRECHNER LOGIK
let currentInput = '0';
let firstOperand = null;
let operator = null;
let shouldResetInput = false;

const display = document.getElementById('display');

document.querySelectorAll('.buttons button').forEach(button => {
    button.addEventListener('click', () => {
        const value = button.getAttribute('data-value');

        if (value === 'C') {
            clearCalculator();
        } else if (value === '=') {
            if (checkPassword(currentInput)) {
                document.getElementById('calculator-view').classList.add('hidden');
                document.getElementById('vault-view').classList.remove('hidden');
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

/* ... [restliche Taschenrechner-Funktionen identisch wie vorher] ... */

// WICHTIGE KORREKTUR:
function checkPassword(input) {
    const password = localStorage.getItem('vaultPassword');
    return input === password;
}

// VAULT LOGIK
document.getElementById('back-to-calculator').addEventListener('click', () => {
    document.getElementById('vault-view').classList.add('hidden');
    document.getElementById('calculator-view').classList.remove('hidden');
    clearCalculator();
});

/* ... [restlicher Code unverändert] ... */
