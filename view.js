// en/de coder - Full-Tab Viewer Logic

document.addEventListener("DOMContentLoaded", () => {
    // UI Elements
    const treeViewport = document.getElementById("tree-viewport");
    const rawViewport = document.getElementById("raw-viewport");
    const emptyState = document.getElementById("empty-state");
    const treeRoot = document.getElementById("tree-root");
    const rawContent = document.getElementById("raw-content");
    const rawLineNumbers = document.getElementById("raw-line-numbers");
    const sourceBadge = document.getElementById("source-badge");

    // Header & Toolbar buttons
    const btnModeTree = document.getElementById("btn-mode-tree");
    const btnModeRaw = document.getElementById("btn-mode-raw");
    const btnExpandAll = document.getElementById("btn-expand-all");
    const btnCollapseAll = document.getElementById("btn-collapse-all");
    const btnWrapText = document.getElementById("btn-wrap-text");
    const btnCopy = document.getElementById("btn-copy");
    const copyLabel = document.getElementById("copy-label");
    const btnDownload = document.getElementById("btn-download");
    const searchInput = document.getElementById("search-input");
    const searchCount = document.getElementById("search-count");
    const btnClearSearch = document.getElementById("btn-clear-search");
    const formatButtons = document.querySelectorAll(".format-btn");

    // Stats Elements
    const statFormat = document.getElementById("stat-format");
    const statSize = document.getElementById("stat-size");
    const statLines = document.getElementById("stat-lines");
    const statNodes = document.getElementById("stat-nodes");

    // State
    let rawText = "";
    let detectedFormat = "text";
    let activeFormat = "auto";
    let formattedText = "";
    let currentMode = "tree";
    let expandableNodeCount = 0;

    // Initialize: Load payload
    loadPayload();

    function loadPayload() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewId = urlParams.get("id");

        try {
            let dataStr = viewId ? localStorage.getItem(viewId) : null;
            if (!dataStr) {
                dataStr = localStorage.getItem("latest_view");
            }
            if (dataStr) {
                const data = JSON.parse(dataStr);
                if (data && data.content) {
                    initContent(data.content, data.sourceTab);
                    return;
                }
            }
        } catch (e) {
            console.warn("Error reading from localStorage:", e);
        }
        showEmptyState();
    }

    function showEmptyState() {
        treeViewport.classList.remove("active");
        rawViewport.classList.remove("active");
        emptyState.style.display = "flex";
        statFormat.textContent = "None";
        statSize.textContent = "0 bytes";
        statLines.textContent = "0 lines";
        statNodes.textContent = "0 nodes";
    }

    function initContent(content, sourceTab) {
        rawText = content;
        emptyState.style.display = "none";
        
        if (sourceTab) {
            sourceBadge.textContent = `From ${sourceTab}`;
        }

        detectedFormat = detectFormat(rawText);
        render();
    }

    // Format Detection
    function detectFormat(str) {
        const trimmed = str.trim();
        if (!trimmed) return "text";

        // Try JSON
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || 
            (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            try {
                JSON.parse(trimmed);
                return "json";
            } catch {}
        }

        // Try HTML vs XML
        if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
            const lower = trimmed.toLowerCase();
            if (lower.startsWith("<!doctype html") || lower.startsWith("<html")) {
                return "html";
            }

            // Test strict XML
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(trimmed, "application/xml");
                if (!xmlDoc.getElementsByTagName("parsererror").length) {
                    return "xml";
                }
            } catch {}

            // Test HTML
            try {
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(trimmed, "text/html");
                if (htmlDoc && htmlDoc.body && htmlDoc.body.childNodes.length > 0) {
                    return "html";
                }
            } catch {}
        }

        return "text";
    }

    // Main Render Routine
    function render() {
        const format = (activeFormat === "auto") ? detectedFormat : activeFormat;
        expandableNodeCount = 0;
        treeRoot.innerHTML = "";

        // Update format button active states
        formatButtons.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.format === activeFormat);
        });

        // Compute formatted text and build tree
        let parseError = null;

        if (format === "json") {
            try {
                const parsed = JSON.parse(rawText.trim());
                formattedText = JSON.stringify(parsed, null, 2);
                const treeNode = buildJsonTree(null, parsed, true, 0);
                treeRoot.appendChild(treeNode);
            } catch (err) {
                parseError = "Invalid JSON syntax: " + err.message;
            }
        } else if (format === "xml" || format === "html") {
            const mimeType = (format === "xml") ? "application/xml" : "text/html";
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(rawText.trim(), mimeType);
                const errors = doc.getElementsByTagName("parsererror");
                if (errors.length && format === "xml") {
                    parseError = "XML parsing error: " + errors[0].textContent;
                } else {
                    formattedText = formatMarkup(doc, format);
                    const rootNodes = (format === "html") ? [doc.documentElement] : Array.from(doc.childNodes);
                    rootNodes.forEach(child => {
                        const nodeEl = buildDomTree(child, 0);
                        if (nodeEl) treeRoot.appendChild(nodeEl);
                    });
                }
            } catch (err) {
                parseError = `Invalid ${format.toUpperCase()} syntax: ` + err.message;
            }
        }

        if (format === "text" || parseError) {
            formattedText = rawText;
            if (parseError) {
                const errorBanner = document.createElement("div");
                errorBanner.className = "tree-node";
                errorBanner.innerHTML = `<div class="tree-line" style="color: #f87171; background: rgba(239, 68, 68, 0.1); padding: 8px 12px; border-radius: 6px; margin-bottom: 12px;"><strong>Parse Warning:</strong> ${escapeHtml(parseError)} (Visualizing as plain text)</div>`;
                treeRoot.appendChild(errorBanner);
            }
            const textLine = document.createElement("div");
            textLine.className = "tree-node";
            textLine.innerHTML = `<pre class="raw-text" style="font-family: inherit;">${escapeHtml(rawText)}</pre>`;
            treeRoot.appendChild(textLine);
        }

        // Render Raw View
        renderRawView(formattedText);

        // Update Stats
        updateStats(format, parseError);

        // Apply View Mode
        setViewMode(currentMode);

        // Reset search
        if (searchInput.value) {
            executeSearch(searchInput.value.trim());
        }
    }

    // Format XML/HTML for Raw View
    function formatMarkup(doc, format) {
        try {
            const serializer = new XMLSerializer();
            const xml = serializer.serializeToString(doc);
            return xml.replace(/(>)(<)(\/*)/g, "$1\n$2$3");
        } catch {
            return rawText;
        }
    }

    // JSON Tree Builder
    function buildJsonTree(key, value, isLast, depth) {
        const node = document.createElement("div");
        node.className = "tree-node";

        const isObject = value !== null && typeof value === "object" && !Array.isArray(value);
        const isArray = Array.isArray(value);

        if (isObject || isArray) {
            expandableNodeCount++;
            const keys = Object.keys(value);
            const count = keys.length;
            const openBracket = isArray ? "[" : "{";
            const closeBracket = isArray ? "]" : "}";
            const previewText = isArray ? `${count} items` : `${count} keys`;

            const line = document.createElement("div");
            line.className = "tree-line";

            const toggle = document.createElement("span");
            toggle.className = "tree-toggle";
            toggle.textContent = "▼";
            line.appendChild(toggle);

            if (key !== null) {
                const keySpan = document.createElement("span");
                keySpan.className = "syn-key";
                keySpan.textContent = `"${key}": `;
                line.appendChild(keySpan);
            }

            const openSpan = document.createElement("span");
            openSpan.className = "syn-punct";
            openSpan.textContent = openBracket;
            line.appendChild(openSpan);

            const preview = document.createElement("span");
            preview.className = "tree-collapsed-preview";
            preview.textContent = `... ${previewText} ...`;
            preview.style.display = "none";
            line.appendChild(preview);

            node.appendChild(line);

            const childrenContainer = document.createElement("div");
            childrenContainer.className = "tree-children";

            keys.forEach((k, idx) => {
                const childNode = buildJsonTree(isArray ? null : k, value[k], idx === keys.length - 1, depth + 1);
                childrenContainer.appendChild(childNode);
            });

            node.appendChild(childrenContainer);

            const closeLine = document.createElement("div");
            closeLine.className = "tree-line close-line";
            closeLine.innerHTML = `<span class="tree-spacer"></span><span class="syn-punct">${closeBracket}${isLast ? "" : ","}</span>`;
            node.appendChild(closeLine);

            // Collapse / Expand click
            const toggleCollapse = (e) => {
                e.stopPropagation();
                const isCollapsed = toggle.classList.toggle("collapsed");
                childrenContainer.classList.toggle("collapsed", isCollapsed);
                closeLine.style.display = isCollapsed ? "none" : "flex";
                preview.style.display = isCollapsed ? "inline-block" : "none";
            };

            toggle.addEventListener("click", toggleCollapse);
            preview.addEventListener("click", toggleCollapse);
            line.addEventListener("dblclick", toggleCollapse);

        } else {
            // Primitive leaf node
            const line = document.createElement("div");
            line.className = "tree-line";

            const spacer = document.createElement("span");
            spacer.className = "tree-spacer";
            line.appendChild(spacer);

            if (key !== null) {
                const keySpan = document.createElement("span");
                keySpan.className = "syn-key";
                keySpan.textContent = `"${key}": `;
                line.appendChild(keySpan);
            }

            const valSpan = document.createElement("span");
            if (typeof value === "string") {
                valSpan.className = "syn-string";
                valSpan.textContent = `"${value}"`;
            } else if (typeof value === "number") {
                valSpan.className = "syn-number";
                valSpan.textContent = String(value);
            } else if (typeof value === "boolean") {
                valSpan.className = "syn-boolean";
                valSpan.textContent = String(value);
            } else if (value === null) {
                valSpan.className = "syn-null";
                valSpan.textContent = "null";
            }
            line.appendChild(valSpan);

            if (!isLast) {
                const comma = document.createElement("span");
                comma.className = "syn-punct";
                comma.textContent = ",";
                line.appendChild(comma);
            }

            node.appendChild(line);
        }

        return node;
    }

    // DOM (HTML & XML) Tree Builder
    function buildDomTree(domNode, depth) {
        if (!domNode) return null;

        // Text Node
        if (domNode.nodeType === Node.TEXT_NODE) {
            const text = domNode.textContent.trim();
            if (!text) return null;

            const node = document.createElement("div");
            node.className = "tree-node";
            const line = document.createElement("div");
            line.className = "tree-line";
            line.innerHTML = `<span class="tree-spacer"></span><span class="syn-text">${escapeHtml(text)}</span>`;
            node.appendChild(line);
            return node;
        }

        // Comment Node
        if (domNode.nodeType === Node.COMMENT_NODE) {
            const node = document.createElement("div");
            node.className = "tree-node";
            const line = document.createElement("div");
            line.className = "tree-line";
            line.innerHTML = `<span class="tree-spacer"></span><span class="syn-comment">&lt;!-- ${escapeHtml(domNode.textContent)} --&gt;</span>`;
            node.appendChild(line);
            return node;
        }

        // CDATA Node
        if (domNode.nodeType === Node.CDATA_SECTION_NODE) {
            const node = document.createElement("div");
            node.className = "tree-node";
            const line = document.createElement("div");
            line.className = "tree-line";
            line.innerHTML = `<span class="tree-spacer"></span><span class="syn-cdata">&lt;![CDATA[${escapeHtml(domNode.textContent)}]]&gt;</span>`;
            node.appendChild(line);
            return node;
        }

        // Element Node
        if (domNode.nodeType === Node.ELEMENT_NODE) {
            const node = document.createElement("div");
            node.className = "tree-node";

            const tagName = domNode.tagName.toLowerCase();
            const attrs = Array.from(domNode.attributes || []);
            let attrsHtml = "";
            attrs.forEach(attr => {
                attrsHtml += ` <span class="syn-attr-name">${escapeHtml(attr.name)}</span>=<span class="syn-attr-value">"${escapeHtml(attr.value)}"</span>`;
            });

            // Filter significant child nodes
            const childNodes = Array.from(domNode.childNodes).filter(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    return child.textContent.trim().length > 0;
                }
                return true;
            });

            const voidElements = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];
            const isVoid = voidElements.includes(tagName) && childNodes.length === 0;

            // Self-closing or void element
            if (isVoid) {
                const line = document.createElement("div");
                line.className = "tree-line";
                line.innerHTML = `<span class="tree-spacer"></span><span class="syn-tag-open">&lt;<span class="syn-tag-name">${tagName}</span>${attrsHtml} /&gt;</span>`;
                node.appendChild(line);
                return node;
            }

            // Empty element
            if (childNodes.length === 0) {
                const line = document.createElement("div");
                line.className = "tree-line";
                line.innerHTML = `<span class="tree-spacer"></span><span class="syn-tag-open">&lt;<span class="syn-tag-name">${tagName}</span>${attrsHtml}&gt;</span><span class="syn-tag-close">&lt;/<span class="syn-tag-name">${tagName}</span>&gt;</span>`;
                node.appendChild(line);
                return node;
            }

            // Single short inline text node
            if (childNodes.length === 1 && childNodes[0].nodeType === Node.TEXT_NODE) {
                const text = childNodes[0].textContent.trim();
                if (text.length < 80 && !text.includes("\n")) {
                    const line = document.createElement("div");
                    line.className = "tree-line";
                    line.innerHTML = `<span class="tree-spacer"></span><span class="syn-tag-open">&lt;<span class="syn-tag-name">${tagName}</span>${attrsHtml}&gt;</span><span class="syn-text">${escapeHtml(text)}</span><span class="syn-tag-close">&lt;/<span class="syn-tag-name">${tagName}</span>&gt;</span>`;
                    node.appendChild(line);
                    return node;
                }
            }

            // Collapsible element with children
            expandableNodeCount++;

            const line = document.createElement("div");
            line.className = "tree-line";

            const toggle = document.createElement("span");
            toggle.className = "tree-toggle";
            toggle.textContent = "▼";
            line.appendChild(toggle);

            const openTag = document.createElement("span");
            openTag.className = "syn-tag-open";
            openTag.innerHTML = `&lt;<span class="syn-tag-name">${tagName}</span>${attrsHtml}&gt;`;
            line.appendChild(openTag);

            const preview = document.createElement("span");
            preview.className = "tree-collapsed-preview";
            preview.textContent = `... ${childNodes.length} ${childNodes.length === 1 ? "child" : "children"} ...`;
            preview.style.display = "none";
            line.appendChild(preview);

            node.appendChild(line);

            const childrenContainer = document.createElement("div");
            childrenContainer.className = "tree-children";

            childNodes.forEach(child => {
                const childEl = buildDomTree(child, depth + 1);
                if (childEl) childrenContainer.appendChild(childEl);
            });

            node.appendChild(childrenContainer);

            const closeLine = document.createElement("div");
            closeLine.className = "tree-line close-line";
            closeLine.innerHTML = `<span class="tree-spacer"></span><span class="syn-tag-close">&lt;/<span class="syn-tag-name">${tagName}</span>&gt;</span>`;
            node.appendChild(closeLine);

            const toggleCollapse = (e) => {
                e.stopPropagation();
                const isCollapsed = toggle.classList.toggle("collapsed");
                childrenContainer.classList.toggle("collapsed", isCollapsed);
                closeLine.style.display = isCollapsed ? "none" : "flex";
                preview.style.display = isCollapsed ? "inline-block" : "none";
            };

            toggle.addEventListener("click", toggleCollapse);
            preview.addEventListener("click", toggleCollapse);
            line.addEventListener("dblclick", toggleCollapse);

            return node;
        }

        return null;
    }

    // Render Raw Code View
    function renderRawView(text) {
        rawContent.textContent = text;
        const lineCount = text.split("\n").length;
        let lineNumsHtml = "";
        for (let i = 1; i <= lineCount; i++) {
            lineNumsHtml += `<span>${i}</span>`;
        }
        rawLineNumbers.innerHTML = lineNumsHtml;
    }

    // Stats Bar
    function updateStats(activeFmt, parseError) {
        statFormat.textContent = `${activeFmt.toUpperCase()}${parseError ? " (Unparsed)" : " (Valid)"}`;
        const bytes = new Blob([rawText]).size;
        statSize.textContent = bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} bytes`;
        statLines.textContent = `${formattedText.split("\n").length} lines`;
        statNodes.textContent = `${expandableNodeCount} collapsible nodes`;
    }

    // View Mode Management
    function setViewMode(mode) {
        currentMode = mode;
        if (mode === "tree") {
            treeViewport.classList.add("active");
            rawViewport.classList.remove("active");
            btnModeTree.classList.add("active");
            btnModeRaw.classList.remove("active");
        } else {
            treeViewport.classList.remove("active");
            rawViewport.classList.add("active");
            btnModeTree.classList.remove("active");
            btnModeRaw.classList.add("active");
        }
    }

    btnModeTree.addEventListener("click", () => setViewMode("tree"));
    btnModeRaw.addEventListener("click", () => setViewMode("raw"));

    // Format Switcher
    formatButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            activeFormat = btn.dataset.format;
            render();
        });
    });

    // Expand All / Collapse All
    btnExpandAll.addEventListener("click", () => {
        document.querySelectorAll(".tree-toggle").forEach(t => t.classList.remove("collapsed"));
        document.querySelectorAll(".tree-children").forEach(c => c.classList.remove("collapsed"));
        document.querySelectorAll(".close-line").forEach(cl => cl.style.display = "flex");
        document.querySelectorAll(".tree-collapsed-preview").forEach(p => p.style.display = "none");
    });

    btnCollapseAll.addEventListener("click", () => {
        document.querySelectorAll(".tree-toggle").forEach(t => t.classList.add("collapsed"));
        document.querySelectorAll(".tree-children").forEach(c => c.classList.add("collapsed"));
        document.querySelectorAll(".close-line").forEach(cl => cl.style.display = "none");
        document.querySelectorAll(".tree-collapsed-preview").forEach(p => p.style.display = "inline-block");
    });

    // Search / Filter
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();
        btnClearSearch.style.display = query ? "block" : "none";
        executeSearch(query);
    });

    btnClearSearch.addEventListener("click", () => {
        searchInput.value = "";
        btnClearSearch.style.display = "none";
        executeSearch("");
    });

    function executeSearch(query) {
        // Clear previous highlights
        document.querySelectorAll(".search-highlight").forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });
        document.querySelectorAll(".tree-node.search-matched").forEach(el => {
            el.classList.remove("search-matched");
        });

        if (!query) {
            searchCount.textContent = "";
            return;
        }

        const lowerQuery = query.toLowerCase();
        let matchCount = 0;
        const allTreeLines = treeRoot.querySelectorAll(".tree-line:not(.close-line)");

        allTreeLines.forEach(line => {
            const text = line.textContent;
            if (text.toLowerCase().includes(lowerQuery)) {
                matchCount++;
                const node = line.closest(".tree-node");
                if (node) node.classList.add("search-matched");

                // Auto-expand parents
                let parent = line.parentElement;
                while (parent && parent !== treeRoot) {
                    if (parent.classList.contains("tree-children")) {
                        parent.classList.remove("collapsed");
                        const parentNode = parent.parentElement;
                        if (parentNode) {
                            const toggle = parentNode.querySelector(":scope > .tree-line > .tree-toggle");
                            if (toggle) toggle.classList.remove("collapsed");
                            const preview = parentNode.querySelector(":scope > .tree-line > .tree-collapsed-preview");
                            if (preview) preview.style.display = "none";
                            const closeLine = parentNode.querySelector(":scope > .close-line");
                            if (closeLine) closeLine.style.display = "flex";
                        }
                    }
                    parent = parent.parentElement;
                }

                // Highlight matches in text nodes
                highlightTextInElement(line, lowerQuery);
            }
        });

        searchCount.textContent = matchCount === 1 ? "1 match" : `${matchCount} matches`;
    }

    function highlightTextInElement(element, lowerQuery) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let currentNode;
        while ((currentNode = walker.nextNode())) {
            if (currentNode.parentNode.classList.contains("tree-toggle") || 
                currentNode.parentNode.classList.contains("tree-collapsed-preview")) {
                continue;
            }
            textNodes.push(currentNode);
        }

        textNodes.forEach(textNode => {
            const str = textNode.nodeValue;
            const lowerStr = str.toLowerCase();
            const index = lowerStr.indexOf(lowerQuery);
            if (index !== -1) {
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                let matchIndex = index;
                while (matchIndex !== -1) {
                    if (matchIndex > lastIndex) {
                        fragment.appendChild(document.createTextNode(str.substring(lastIndex, matchIndex)));
                    }
                    const mark = document.createElement("span");
                    mark.className = "search-highlight";
                    mark.textContent = str.substring(matchIndex, matchIndex + lowerQuery.length);
                    fragment.appendChild(mark);

                    lastIndex = matchIndex + lowerQuery.length;
                    matchIndex = lowerStr.indexOf(lowerQuery, lastIndex);
                }
                if (lastIndex < str.length) {
                    fragment.appendChild(document.createTextNode(str.substring(lastIndex)));
                }
                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
    }

    // Wrap Lines Toggle
    btnWrapText.addEventListener("click", () => {
        const isWrap = rawContent.classList.toggle("wrap");
        btnWrapText.classList.toggle("active", isWrap);
    });

    // Copy formatted / raw
    btnCopy.addEventListener("click", async () => {
        const textToCopy = formattedText || rawText;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                const tempTextarea = document.createElement("textarea");
                tempTextarea.value = textToCopy;
                document.body.appendChild(tempTextarea);
                tempTextarea.select();
                document.execCommand("copy");
                document.body.removeChild(tempTextarea);
            }
            copyLabel.textContent = "Copied!";
            btnCopy.classList.add("active");
            setTimeout(() => {
                copyLabel.textContent = "Copy";
                btnCopy.classList.remove("active");
            }, 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
            alert("Could not copy to clipboard.");
        }
    });

    // Download formatted file
    btnDownload.addEventListener("click", () => {
        const format = (activeFormat === "auto") ? detectedFormat : activeFormat;
        let ext = "txt";
        let mime = "text/plain";
        if (format === "json") {
            ext = "json";
            mime = "application/json";
        } else if (format === "xml") {
            ext = "xml";
            mime = "application/xml";
        } else if (format === "html") {
            ext = "html";
            mime = "text/html";
        }

        const blob = new Blob([formattedText || rawText], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `endecode_output.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
