document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('btn-tab-base-64').addEventListener('click', () => openTab('base-64', 'btn-tab-base-64'));
    document.getElementById('btn-tab-hex').addEventListener('click', () => openTab('hex', 'btn-tab-hex'));
    document.getElementById('btn-tab-uri-escape').addEventListener('click', () => openTab('uri-escape', 'btn-tab-uri-escape'));

    document.getElementById('btn-encode-base-64').addEventListener('click', encodeBase64);
    document.getElementById('btn-decode-base-64').addEventListener('click', decodeBase64);
    document.getElementById('btn-encode-hex').addEventListener('click', encodeHex);
    document.getElementById('btn-decode-hex').addEventListener('click', decodeHex);
    document.getElementById('btn-escape').addEventListener('click', escapeUri);
    document.getElementById('btn-unescape').addEventListener('click', unescapeUri);

    document.getElementById('btn-copy-base-64').addEventListener('click', () => copyToClipboard('output-base-64'));
    document.getElementById('btn-copy-hex').addEventListener('click', () => copyToClipboard('output-hex'));
    document.getElementById('btn-copy-uri-escape').addEventListener('click', () => copyToClipboard('output-uri-escape'));


    // Set default tab
    document.getElementById('btn-tab-base-64').click();
});

function openTab(tabId, buttonId) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    const tabButtons = document.querySelectorAll('.tab-option');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(buttonId).classList.add('active');
}

function encodeBase64() {
    const input = document.getElementById('input-base-64').value;
    const encoded = btoa(input);
    document.getElementById('output-base-64').value = encoded;
}

function decodeBase64() {
    const input = document.getElementById('input-base-64').value;
    try {
        const decoded = atob(input);
        document.getElementById('output-base-64').value = decoded;
    } catch (e) {
        alert("Invalid Base64 string");
    }
}

function encodeHex() {
    const input = document.getElementById('input-hex').value;
    let hex = '';
    for (let i = 0; i < input.length; i++) {
        hex += input.charCodeAt(i).toString(16);
    }
    document.getElementById('output-hex').value = hex;
}

function decodeHex() {
    const input = document.getElementById('input-hex').value;
    let str = '';
    for (let i = 0; i < input.length; i += 2) {
        str += String.fromCharCode(parseInt(input.substr(i, 2), 16));
    }
    document.getElementById('output-hex').value = str;
}

function escapeUri() {
    const input = document.getElementById('input-uri-escape').value;
    const escaped = encodeURIComponent(input);
    document.getElementById('output-uri-escape').value = escaped;
}

function unescapeUri() {
    const input = document.getElementById('input-uri-escape').value;
    const unescaped = decodeURIComponent(input);
    document.getElementById('output-uri-escape').value = unescaped;
}

function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    document.execCommand("copy");
}