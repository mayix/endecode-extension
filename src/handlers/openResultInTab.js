export function openResultInTab(outputElementId, sourceTab = "") {
    const outputEl = document.getElementById(outputElementId);
    if (!outputEl) return;

    const content = outputEl.value;
    if (!content || !content.trim()) {
        alert("Please generate or enter an output string first.");
        return;
    }

    const id = "view_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const payload = {
        id,
        content,
        sourceTab,
        createdAt: Date.now()
    };

    // Store in extension origin localStorage (permissionless)
    try {
        localStorage.setItem(id, JSON.stringify(payload));
        localStorage.setItem("latest_view", JSON.stringify(payload));
    } catch (e) {
        console.warn("Could not save to localStorage:", e);
    }

    const viewerUrl = (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL)
        ? chrome.runtime.getURL(`view.html?id=${encodeURIComponent(id)}`)
        : `view.html?id=${encodeURIComponent(id)}`;

    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: viewerUrl });
    } else {
        window.open(viewerUrl, "_blank");
    }
}
