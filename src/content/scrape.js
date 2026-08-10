// These functions are injected via chrome.scripting.executeScript({func}).
// They MUST stay self-contained — no imports, no outer-scope references —
// because only the function source is serialized into the target page.

export function clickTimeRecordingManually(timeoutMs) {
    return new Promise((resolve) => {
        const deadline = Date.now() + (timeoutMs || 2000);
        const findButton = () => {
            const iframe = document.getElementById("applicationIframe");
            if (!iframe) return null;
            let doc;
            try { doc = iframe.contentDocument || iframe.contentWindow.document; } catch (_e) { return null; }
            if (!doc) return null;
            return Array.from(doc.querySelectorAll(".action-item"))
                .find(e => e.innerHTML.includes("glyphicon glyphicon-time")) || null;
        };
        const tick = () => {
            const btn = findButton();
            if (btn) {
                btn.click();
                clearInterval(t);
                resolve({ ok: true });
            } else if (Date.now() > deadline) {
                clearInterval(t);
                resolve({ ok: false, reason: "button-not-found" });
            }
        };
        const t = setInterval(tick, 200);
        tick();
    });
}

export function waitForModalReady(timeoutMs) {
    return new Promise((resolve) => {
        const deadline = Date.now() + (timeoutMs || 2000);
        const collectDocs = () => {
            const out = [document];
            const walk = (doc) => {
                const iframes = doc.getElementsByTagName("iframe");
                for (let i = 0; i < iframes.length; i++) {
                    try {
                        const inner = iframes[i].contentDocument || iframes[i].contentWindow.document;
                        if (inner && !out.includes(inner)) { out.push(inner); walk(inner); }
                    } catch (_e) { /* cross-origin */ }
                }
            };
            walk(document);
            return out;
        };
        const check = () => collectDocs().some(d => d.getElementsByClassName("time-interval-wrapper").length > 0);

        if (check()) return resolve({ ok: true });

        let observer, intervalId;
        const done = (ok, reason) => {
            if (observer) observer.disconnect();
            if (intervalId) clearInterval(intervalId);
            resolve(ok ? { ok: true } : { ok: false, reason });
        };
        observer = new MutationObserver(() => {
            if (check()) done(true);
            else if (Date.now() > deadline) done(false, "timeout");
        });
        observer.observe(document.body, { childList: true, subtree: true });
        intervalId = setInterval(() => {
            if (check()) done(true);
            else if (Date.now() > deadline) done(false, "timeout");
        }, 200);
    });
}

export function scrapeAll() {
    const docs = [document];
    const walk = (d) => {
        const iframes = d.getElementsByTagName("iframe");
        for (let i = 0; i < iframes.length; i++) {
            try {
                const inner = iframes[i].contentDocument || iframes[i].contentWindow.document;
                if (inner && !docs.includes(inner)) { docs.push(inner); walk(inner); }
            } catch (_e) { /* cross-origin */ }
        }
    };
    walk(document);

    let flexRaw = null;
    for (const d of docs) {
        const cell = Array.from(d.querySelectorAll(".data-list-body-cell-wrapper"))
            .find(e => e.innerHTML.includes("Flex"));
        const val = cell?.querySelectorAll(".caption")[1]?.textContent;
        if (val != null) { flexRaw = val; break; }
    }
    if (flexRaw == null) return { ok: false, reason: "no-flextime" };
    const flextime = flexRaw.replace(/​/g, "");

    let rows = null;
    for (const d of docs) {
        const found = d.getElementsByClassName("time-interval-wrapper");
        if (found.length > 0) { rows = found; break; }
    }
    if (!rows || rows.length === 0) return { ok: false, reason: "no-records" };

    const records = Array.from(rows).map(v => {
        const start = v.getAttribute("data_fromtime");
        const toAttr = v.getAttribute("data_totime");
        let end = toAttr ? parseInt(toAttr) : null;
        if (end === 29952) end = null;
        const type = v.getElementsByClassName("input-search-wrapper")[0]
            ?.getElementsByClassName("searcher")[0]?.value;
        return { start: start ? parseInt(start) : null, end, type };
    });

    return { ok: true, flextime, records };
}
