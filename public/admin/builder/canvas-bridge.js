/**
 * canvas-bridge.js
 * ────────────────
 * Admin-side half of the WYSIWYG canvas. Owns the <iframe> that runs
 * /builder/__canvas?canvas=1 (the real page renderer in canvas mode)
 * and translates between editor state and iframe messages.
 *
 * Usage:
 *   const bridge = createCanvasBridge(iframeEl, {
 *       onSelect(id) {}, onReorder(ids) {}, onInsert(type, index) {},
 *       onAction(action, id) {},
 *   });
 *   bridge.render(sections);      // (re)render the page
 *   bridge.highlight(id);         // sync selection from the editor side
 *   bridge.destroy();
 */

export function createCanvasBridge(iframe, handlers) {
    const ORIGIN = window.location.origin;
    let ready = false;
    let pendingSections = null;
    let pendingHighlight = null;
    let lastHighlight = null;

    function send(msg) {
        if (!iframe.contentWindow) return;
        iframe.contentWindow.postMessage(msg, ORIGIN);
    }

    function onMessage(e) {
        if (e.origin !== ORIGIN || e.source !== iframe.contentWindow) return;
        const d = e.data;
        if (!d || typeof d !== 'object') return;
        switch (d.type) {
            case 'bld:ready':
                ready = true;
                if (pendingSections) { send({ type: 'bld:render', sections: pendingSections }); pendingSections = null; }
                // Selection made before the canvas was ready (e.g. the auto-select
                // on page load) would otherwise be dropped — replay it here.
                if (pendingHighlight) { send({ type: 'bld:highlight', id: pendingHighlight }); pendingHighlight = null; }
                break;
            case 'bld:select':  handlers.onSelect && handlers.onSelect(d.id); break;
            case 'bld:reorder': handlers.onReorder && handlers.onReorder(d.ids || []); break;
            case 'bld:insert':  handlers.onInsert && handlers.onInsert(d.componentType, d.index); break;
            case 'bld:action':  handlers.onAction && handlers.onAction(d.action, d.id); break;
        }
    }

    window.addEventListener('message', onMessage);

    return {
        render(sections) {
            const snapshot = JSON.parse(JSON.stringify(sections || []));
            if (!ready) { pendingSections = snapshot; return; }
            send({ type: 'bld:render', sections: snapshot });
            // A re-render rebuilds the section elements, wiping the selection
            // outline — restore it on the next tick.
            if (lastHighlight) setTimeout(() => send({ type: 'bld:highlight', id: lastHighlight }), 60);
        },
        highlight(id) {
            lastHighlight = id;
            if (ready) send({ type: 'bld:highlight', id });
            else pendingHighlight = id;
        },
        destroy() { window.removeEventListener('message', onMessage); },
    };
}
