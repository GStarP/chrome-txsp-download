
function configEvent(event, proxy) {
  var e = {}
  for (var attr in event) e[attr] = event[attr]
  e.target = e.currentTarget = proxy
  return e
}

/**
 * @param options
 *   open: ([method, url], xhr) => {}
 *   send: ([body], xhr) => {}
 *   onreadystatechange: (xhr) => {}
 */
var xhrProxy = function (options) {

  // 始终保持原 XHR 的存在
  window.originalXHR = window.originalXHR || XMLHttpRequest

  // 覆盖全局的 XHR
  XMLHttpRequest = function () {
    var xhr = new window.originalXHR
    // 对每个属性做代理
    for (var attrName in xhr) {
      try {
        var attrType = typeof xhr[attrName]
        // 对函数进行前插桩
        if (attrType === 'function') {
          this[attrName] = proxyFunc(attrName)
        } else {
          Object.defineProperty(this, attrName, {
            get: proxyGet(attrName),
            set: proxySet(attrName)
          })
        }
      } catch (e) { }
    }

    var that = this
    xhr.getProxy = function () {
      return that
    }

    this.xhr = xhr

  }

  function proxyFunc(func) {
    return function () {
      var args = [].slice.apply(arguments)
      if (options[func]) {
        options[func].call(this, args, this.xhr)
      }
      this.xhr[func].apply(this.xhr, args)
    }
  }

  function proxyGet(attr) {
    return function () {
      return this.xhr[attr]
    }
  }

  function proxySet(attr) {
    return function (val) {
      var xhr = this.xhr
      var that = this
      // on 开头的回调函数
      if (attr.indexOf('on') === 0 && options[attr]) {
        xhr[attr] = function (e) {
          e = configEvent(e, that)
          options[attr].call(that, xhr, e)
          val.call(that, e)
        }
      }
    }
  }

  return window.originalXHR

}

/* 代理全局 XHR 完毕 */
console.log('=== proxy xhr ===')

var videoInfo = {}

xhrProxy({
  open: function ([method, url], xhr) {
    xhr.url = url
  },
  send: function ([body], xhr) {
    if (xhr.url.indexOf('proxyhttp') > 0) {
      xhr.body = body
    }
  },
  onreadystatechange: function (xhr) {
    if (xhr.readyState === 4 && xhr.body) {
      Object.assign(videoInfo, {
        videoUrl: xhr.url,
        videoBody: xhr.body
      })
      parseVideoReq(xhr.responseText)
    }
  }
})

function parseVideoReq(res) {
  var data = typeof res == "string" ? JSON.parse(res) : res
  var vinfo = JSON.parse(data.vinfo);
  console.log(vinfo)
}


window.onload = function () {
  console.log('=== TXSP Downloader Start ===')

  var txsp = document.createElement('div')
  txsp.classList.add('txsp')
  txsp.innerHTML = 'download'
  txsp.addEventListener('click', () => {
    downloadTXSPVideo()
  })

  document.body.appendChild(txsp)
}

function downloadTXSPVideo() {

}
