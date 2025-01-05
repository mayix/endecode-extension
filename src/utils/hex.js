import { formatJSON, formatXML } from "./formatters.js";

export function encodeHex() {
    const input = document.getElementById("input-hex").value;
    let hex = "";
    for (let i = 0; i < input.length; i++) {
        hex += input.charCodeAt(i).toString(16);
    }
    document.getElementById("output-hex").value = hex;
}

export function decodeHex() {
    const input = document.getElementById("input-hex").value;
    let str = "";
    for (let i = 0; i < input.length; i += 2) {
        str += String.fromCharCode(parseInt(input.substr(i, 2), 16));
    }
    const formattedJSON = formatJSON(str);
    const formattedXML = formatXML(str);
    if (formattedJSON) {
        document.getElementById("output-hex").value = formattedJSON;
    } else if (formattedXML) {
        document.getElementById("output-hex").value = formattedXML;
    } else {
        document.getElementById("output-hex").value = str;
    }
}
