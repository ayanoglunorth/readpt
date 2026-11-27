// Runs inside the WebView (or iframe on web) next to pdf.js. Posts {type:'start'|'page'|'done'|'error'|'ready'} messages.
// Text items keep PDF coordinates (y grows upward); DS.buildPages turns them into paragraphs.
export const PAGE_JS = `
(function () {
  var post = function (m) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(m));
    else parent.postMessage(m, '*');
  };
  window.__run = async function (src, startAt) {
    try {
      var pdf = await pdfjsLib.getDocument(src).promise;
      post({ type: 'start', total: pdf.numPages });
      for (var i = startAt || 1; i <= pdf.numPages; i++) {
        var page = await pdf.getPage(i);
        var tc = await page.getTextContent();
        var items = tc.items.filter(function (it) { return typeof it.str === 'string'; }).map(function (it) {
          return { str: it.str, x: it.transform[4], y: it.transform[5], h: it.height || Math.hypot(it.transform[2], it.transform[3]), w: it.width };
        });
        post({ type: 'page', n: i, items: items });
        page.cleanup();
      }
      post({ type: 'done' });
    } catch (e) {
      post({ type: 'error', message: String((e && e.message) || e) });
    }
  };
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'pdf') window.__run({ data: new Uint8Array(e.data.data) }, e.data.startAt);
  });
  post({ type: 'ready' });
})();
`;
