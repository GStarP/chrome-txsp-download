
/**
 * 因为 content_script 只能访问 DOM, 并不能直接和 window 的 js 环境交互
 * 所以通过 content_script 执行的 txsp.js 并不能直接代理 window 的 XHR
 * 因此, 我们通过 <script> 将其注入方能达到此目的
 */
function injectScript(url) {
  var b = document.getElementsByTagName('body')[0]
  var s = document.createElement('script')
  s.setAttribute('type', 'text/javascript')
  s.setAttribute('src', url)
  b.appendChild(s)
}

injectScript(chrome.extension.getURL('/txsp.js'))
