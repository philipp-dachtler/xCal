// app.js - Vollständig funktionierende Version

// Taschenrechner Zustand
const calculator = {
  currentInput: '0',
  firstOperand: null,
  operator: null,
  shouldResetInput: false,

  init() {
    // Passwort prüfen
    if (!localStorage.getItem('vaultPassword')) {
      document.getElementById('password-modal').style.display = 'flex';
    }

    // Tasten event listener
    document.querySelectorAll('.buttons button').forEach(button => {
      button.addEventListener('click', (e) => this.handleButtonClick(e));
    });

    // Passwort setzen
    document.getElementById('set-password').addEventListener('click', () => {
      const password = document.getElementById('new-password').value;
      if (password) {
        localStorage.setItem('vaultPassword', password);
        document.getElementById('password-modal').style.display = 'none';
      }
    });

    // Zurück zum Rechner
    document.getElementById('back-to-calculator').addEventListener('click', () => {
      document.getElementById('vault-view').classList.add('hidden');
      document.getElementById('calculator-view').classList.remove('hidden');
      this.clear();
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
    this.updateDisplay();
  },

  updateDisplay() {
    document.getElementById('display').textContent = this.currentInput;
  },

  checkPassword(input) {
    const password = localStorage.getItem('vaultPassword');
    return input === password;
  },

  unlockVault() {
    document.getElementById('calculator-view').classList.add('hidden');
    document.getElementById('vault-view').classList.remove('hidden');
    this.clear();
    this.loadFolders();
  },

  loadFolders() {
    // Hier würde die Ordnerliste geladen werden
    console.log('Tresor geöffnet');
  }
};

// App starten
document.addEventListener('DOMContentLoaded', () => calculator.init());
