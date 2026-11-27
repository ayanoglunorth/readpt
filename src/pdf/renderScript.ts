// Runs in the page-view WebView next to pdf.js (after pdfHtml's scripts). __open(url, bg) loads the PDF, then native calls
// __show(n). Each page is drawn on a fresh canvas fitted to the screen width at device pixel ratio; a stale render is dropped.
export const RENDER_JS = `
(function () {
  var post = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  var pdf = null, want = 0, token = 0;
  var meta = document.createElement('meta');
  meta.name = 'viewport'; meta.content = 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes';
  document.head.appendChild(meta);
  window.__open = async function (url, bg) {
    document.body.style.cssText = 'margin:0;background:' + bg;
    try {
      pdf = await pdfjsLib.getDocument({ url: url }).promise;
      post({ type: 'opened', total: pdf.numPages });
      if (want) window.__show(want);
    } catch (e) { post({ type: 'error', message: String((e && e.message) || e) }); }
  };
  window.addEventListener('resize', function () { if (want) window.__show(want); });
  window.__show = async function (n) {
    want = n;
    if (!pdf) return;
    var mine = ++token;
    try {
      var page = await pdf.getPage(n);
      var w = document.documentElement.clientWidth || window.innerWidth || screen.width; // 0 until the WebView has been laid out
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var vp = page.getViewport({ scale: (w / page.getViewport({ scale: 1 }).width) * dpr });
      var cv = document.createElement('canvas');
      cv.width = vp.width; cv.height = vp.height;
      cv.style.cssText = 'display:block;width:' + vp.width / dpr + 'px;height:' + vp.height / dpr + 'px';
      await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      if (mine !== token) return;
      document.body.replaceChildren(cv);
      window.scrollTo(0, 0);
    } catch (e) { if (mine === token) post({ type: 'error', message: String((e && e.message) || e) }); }
  };
})();
`;
