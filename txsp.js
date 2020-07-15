
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
