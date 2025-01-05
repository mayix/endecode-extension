import { formatJSON, formatXML } from "./formatters.js";

export function encodeBase64() {
    const input = document.getElementById('input-base-64').value;
    const encoded = btoa(input);
    document.getElementById('output-base-64').value = encoded;
}

export function decodeBase64() {
    const input = document.getElementById('input-base-64').value;
    try {
        const decoded = atob(input);
        const formattedJSON = formatJSON(decoded);
        const formattedXML = formatXML(decoded);
        if (formattedJSON){
            document.getElementById('output-base-64').value = formattedJSON;
        } else if (formattedXML){
            document.getElementById('output-base-64').value = formattedXML;
        } else {
            document.getElementById('output-base-64').value = decoded;
        }
        
    } catch (e) {
        alert("Invalid Base64 string");
    }
}