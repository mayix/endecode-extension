export function escapeUri() {
    const input = document.getElementById('input-uri-escape').value;
    const escaped = encodeURIComponent(input);
    document.getElementById('output-uri-escape').value = escaped;
}

export function unescapeUri() {
    const input = document.getElementById('input-uri-escape').value;
    const unescaped = decodeURIComponent(input);
    document.getElementById('output-uri-escape').value = unescaped;
}