const outputField = document.getElementById('output-field');
const copyBtn = document.getElementById('copy-btn');
const lengthSlider = document.getElementById('length-slider');
const lengthVal = document.getElementById('length-val');
const generateBtn = document.getElementById('generate-btn');
const strengthBar = document.getElementById('strength-bar');
const entropyText = document.getElementById('entropy-text');
const crackTime = document.getElementById('crack-time');

const labelInput = document.getElementById('label-input');
const saveBtn = document.getElementById('save-btn');
const vaultList = document.getElementById('vault-list');
const exportBtn = document.getElementById('export-btn');

const checks = {
    upper: document.getElementById('inc-upper'),
    lower: document.getElementById('inc-lower'),
    numbers: document.getElementById('inc-numbers'),
    symbols: document.getElementById('inc-symbols')
};

const CHARSETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

let savedPasswords = JSON.parse(localStorage.getItem('phantom_vault')) || [];

function getSecureRandomInt(max) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
}

function generate() {
    let pool = '';
    if (checks.upper.checked) pool += CHARSETS.upper;
    if (checks.lower.checked) pool += CHARSETS.lower;
    if (checks.numbers.checked) pool += CHARSETS.numbers;
    if (checks.symbols.checked) pool += CHARSETS.symbols;

    if (!pool) {
        checks.lower.checked = true;
        pool = CHARSETS.lower;
    }

    const length = parseInt(lengthSlider.value);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += pool[getSecureRandomInt(pool.length)];
    }

    outputField.value = result;
    calculateMetrics(length, pool.length);
}

function calculateMetrics(length, poolSize) {
    const entropy = Math.round(length * Math.log2(poolSize));
    entropyText.textContent = `Энтропия: ${entropy} бит`;

    let percentage = Math.min((entropy / 128) * 100, 100);
    strengthBar.style.width = `${percentage}%`;

    if (entropy < 50) {
        strengthBar.style.backgroundColor = '#ef4444';
        crackTime.textContent = 'Взлом: секунды';
    } else if (entropy < 80) {
        strengthBar.style.backgroundColor = '#f59e0b';
        crackTime.textContent = 'Взлом: пара дней';
    } else if (entropy < 110) {
        strengthBar.style.backgroundColor = '#10b981';
        crackTime.textContent = 'Взлом: сотни лет';
    } else {
        strengthBar.style.backgroundColor = '#a855f7';
        crackTime.textContent = 'Взлом: вечность';
    }
}

function renderVault() {
    vaultList.innerHTML = '';
    savedPasswords.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'vault-item';

        const info = document.createElement('div');
        info.className = 'vault-info';

        const labelEl = document.createElement('span');
        labelEl.className = 'vault-label';
        labelEl.textContent = item.label;

        const passEl = document.createElement('span');
        passEl.className = 'vault-pass';
        passEl.textContent = '••••••••••••';
        let revealed = false;

        info.appendChild(labelEl);
        info.appendChild(passEl);

        const actions = document.createElement('div');
        actions.className = 'vault-actions';

        const eyeBtn = document.createElement('button');
        eyeBtn.className = 'vault-btn';
        eyeBtn.textContent = '👁';
        eyeBtn.title = 'Показать/скрыть';
        eyeBtn.onclick = () => {
            revealed = !revealed;
            passEl.textContent = revealed ? item.password : '••••••••••••';
        };

        const cpBtn = document.createElement('button');
        cpBtn.className = 'vault-btn';
        cpBtn.textContent = 'CP';
        cpBtn.title = 'Копировать';
        cpBtn.onclick = () => {
            navigator.clipboard.writeText(item.password);
            cpBtn.textContent = 'OK';
            setTimeout(() => cpBtn.textContent = 'CP', 1000);
        };

        const delBtn = document.createElement('button');
        delBtn.className = 'vault-btn del';
        delBtn.textContent = '✕';
        delBtn.title = 'Удалить';
        delBtn.onclick = () => {
            savedPasswords.splice(index, 1);
            localStorage.setItem('phantom_vault', JSON.stringify(savedPasswords));
            renderVault();
        };

        actions.appendChild(eyeBtn);
        actions.appendChild(cpBtn);
        actions.appendChild(delBtn);

        row.appendChild(info);
        row.appendChild(actions);
        vaultList.appendChild(row);
    });
}

function saveEntry() {
    const label = labelInput.value.trim();
    const password = outputField.value;
    if (!label || !password) return;

    savedPasswords.unshift({ label, password });
    localStorage.setItem('phantom_vault', JSON.stringify(savedPasswords));
    labelInput.value = '';
    renderVault();
}

saveBtn.addEventListener('click', saveEntry);
labelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEntry();
});

exportBtn.addEventListener('click', () => {
    if (!savedPasswords.length) return;
    const text = savedPasswords.map(i => `${i.label}: ${i.password}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'passwords_backup.txt';
    a.click();
    URL.revokeObjectURL(url);
});

lengthSlider.addEventListener('input', () => {
    lengthVal.textContent = lengthSlider.value;
    generate();
});

Object.values(checks).forEach(checkbox => {
    checkbox.addEventListener('change', generate);
});

generateBtn.addEventListener('click', generate);

copyBtn.addEventListener('click', () => {
    if (!outputField.value) return;
    navigator.clipboard.writeText(outputField.value);
    copyBtn.textContent = 'OK';
    copyBtn.classList.add('copied');
    setTimeout(() => {
        copyBtn.textContent = 'COPY';
        copyBtn.classList.remove('copied');
    }, 1500);
});

generate();
renderVault();
