export function formatJSON(output) {
    try {
        return JSON.stringify(JSON.parse(output), null, 2);
    } catch {
        return null;
    }
}

export function formatXML(output) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(output, "application/xml");

        if (xmlDoc.getElementsByTagName("parsererror").length) {
            return null;
        }

        const serializer = new XMLSerializer();
        return serializer
            .serializeToString(xmlDoc)
            .replace(/(>)(<)(\/*)/g, "$1\n$2");
    } catch {
        return null;
    }
}
