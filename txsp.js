
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

var videoReqInfo = {
  videoUrl: '',
  videoBody: null
}

var videoInfo = {
  name: '',
  size: 0,
  width: 0,
  height: 0,
  m3u8url: ''
}

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
      videoReqInfo.videoUrl = xhr.url
      videoReqInfo.videoBody = xhr.body
      parseVideoReqInfo(xhr.responseText)
    }
  }
})

function parseVideoReqInfo(res) {
  // 解析获取到的视频总体信息
  var data = typeof res == "string" ? JSON.parse(res) : res
  var vinfo = JSON.parse(data.vinfo)

  console.log('vinfo\n', vinfo)

  // 只需要进行最高画质的下载
  var { name: defn, cname: defDesc } = vinfo.fl.fi[vinfo.fl.fi.length - 1]
  var task = new Promise(resolve => {
    var body = videoReqInfo.videoBody.replace(/defn=[^&]*/, 'defn=' + defn)
    // 获取最高画质视频的基本信息
    fetch(videoReqInfo.videoUrl, {
        body: body,
        method: 'POST',
      })
      .then(res => res.json())
      .then(data => ({ data }))
      .then(resolve)
  })

  task.then(last => {
    // 解析得到视频基本信息
    var { url, width, height, size } = parseVideoInfo(last.data)
    videoInfo.name = document.title.split('_')[0]
    videoInfo.size = size
    videoInfo.width = width
    videoInfo.height = height
    videoInfo.m3u8url = url

    console.log(`
      ${videoInfo.name}\n
      ${videoInfo.width}x${videoInfo.height}\n
      ${videoInfo.size}M\n
      ${videoInfo.m3u8url}
    `)

    showDownloadBtn()

  })
  
}

// 解析获取到的视频基本信息
function parseVideoInfo(data) {
  var vinfo = JSON.parse(data.vinfo)
  var vi = vinfo.vl.vi[0]
  var ui = vi.ul.ui[0]
  var url = ui.url
  if (url.indexOf('.m3u8') == -1) {
    url += ui.hls.pt
  }
  var { vw: width, vh: height, fs: size } = vi
  size = Math.floor(size / 1024 / 1024)
  return { url, width, height, size }
}

// 显示下载按钮
function showDownloadBtn () {
  var txsp = document.createElement('div')
  txsp.classList.add('txsp')
  txsp.innerHTML = `${videoInfo.width} x ${videoInfo.height}  ${videoInfo.size} M`
  txsp.addEventListener('click', () => {
    downloadVideo()
  })
  document.body.appendChild(txsp)
}

// 根据 m3u8 文件下载视频
function downloadVideo() {
  fetch(videoInfo.m3u8url)
    .then(res => res.text())
    .then(data => {
      downloadFile(`${videoInfo.name}.m3u8`, data)
    })
}

function downloadFile(filename, json) {
  let el = document.createElement('a')
  el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json))
  el.setAttribute('download', filename)
  el.style.display = 'none'
  document.body.appendChild(el)
  el.click()
  document.body.removeChild(el)
}
