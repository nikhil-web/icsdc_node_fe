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
        },
        highlight(id) { if (ready) send({ type: 'bld:highlight', id }); },
        destroy() { window.removeEventListener('message', onMessage); },
    };
}
