import { openTab } from "./handlers/openTab.js";
import { encodeBase64, decodeBase64 } from "./utils/base64.js";
import { encodeHex, decodeHex } from "./utils/hex.js";
import { escapeUri, unescapeUri } from "./utils/uri.js";
import { copyToClipboard } from "./handlers/copy.js";


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
