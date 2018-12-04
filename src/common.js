window.szk = (() => {
  const ret = {}

  const $ = ret.$ = id => document.getElementById(id)

  ret.$$ = selector => Array.from(document.getElementsByClassName(selector))

  const putPixel = (ctx, x, y, r = 0, g = 0, b = 0, a = 1) => {
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x, y, 1, 1)
  }

  // create a canvas and append it to an element
  const addCanvas = (targetId, size) => {
    const canvasEl = document.createElement('canvas')
    Object.assign(canvasEl, {
      width: size,
      height: size,
      id: 'canvas'
    })
    if (targetId) {
      $(targetId).innerHTML = ''
      $(targetId).appendChild(canvasEl)
    }
    return canvasEl
  }

  // store integer on six bytes
  const longToByteArray = (long) => {
    const byteArray = [0, 0, 0, 0, 0, 0]
    for (let i = 0; i < byteArray.length; i ++ ) {
      const byte = long & 0xff
      byteArray[i] = byte
      long = (long - byte) / 256
    }
    return byteArray
  }

  // byte stream structure:
  // [0, values], so
  // Ű => 0, 197, 176
  // a => 1, 97
  const strToByteStream = ret.strToByteStream = (s) => {
    let ret = []
    for (let i = 0; i < s.length; i++) {
      const x = encodeURIComponent(s.charAt(i))
      if (x.includes('%')) {
        ret.push.apply(ret, x.split('%').reduce((acc, num) => acc.concat(parseInt(num, 16) || 0), [])) // 0 + A,B,C
      } else {
        ret.push.apply(ret, [ 1, s.charCodeAt(i) ])
      }
    }
    return ret
  }

  // first two colors are the size of the data
  // followed by a byte stream in the [r, g, b] format
  // (the remnants in the end are trailing zeroes)
  const strToRgbStream = (s) => {
    let bytes = strToByteStream(s)
    const size = longToByteArray(bytes.length)
    const ret = [ size.slice(0, 3), size.slice(3, 6) ] // six bytes for the total size
    let i
    for (i = 0; i < bytes.length; i += 3) {
      ret.push([bytes[i] || 0, bytes[i + 1] || 0, bytes[i + 2] || 0])
    }
    return ret
  }

  // main encoder
  ret.createEncodedCanvas = (s, targetId) => {
    let inputText = $('inputText').value
    const pixels = strToRgbStream(inputText)
    const sqrSize = Math.ceil(Math.sqrt(pixels.length))
    const ctx = addCanvas('canvasWrapper', sqrSize).getContext('2d')

    // customized putPixel
    const pp = (x, y, rgb) => putPixel(ctx, x, y, rgb[0] || 0, rgb[1] || 0, rgb[2] || 0, 1)

    // fill the image
    let row = 0
    let col = 0
    for (let i = 0; i < sqrSize * sqrSize; i++) {
      if (col > sqrSize - 1) {
        col = 0
        row++
      }
      pp(col, row, pixels[i] || [])
      col++
    }
  }

  // load image onto canvas
  ret.loadImageToCanvas = (elId) => new Promise((success, failure) => {
    const canvas = document.createElement('canvas')
    const image = $(elId)
    const prep = () => {
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0)
      success(canvas)
    }
    if (image.complete) {
      prep()
    } else {
      image.onload = prep
    }
  })

  // get a grid of small images
  ret.getMosaics = (canvas, width = 10, height = 10) => {
    const ctx = canvas.getContext('2d')
    const rows = []
    let cells = []
    const rowCount = Math.floor(canvas.height / height)
    const colCount = Math.floor(canvas.width / width)
    const bufferCanvas = document.createElement('canvas')
    Object.assign(bufferCanvas, { width, height })
    const bufferCtx = bufferCanvas.getContext('2d')

    for (let y = 0; y < rowCount; y++) {
      for (let x = 0; x < colCount; x++) {
        const imageData = ctx.getImageData(x * width, y * height, (x + 1) * width, (y + 1) * height)
        bufferCtx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height)
        bufferCtx.putImageData(imageData, 0, 0)
        const dataURL = bufferCanvas.toDataURL()
        cells.push(dataURL)
      }
      rows.push(cells)
      cells = []
    }
    return rows
  }

  // create a mosaic element with the data uri as an inline bg
  ret.createMosaicEl = (x, y, w, h, dataURL) => {
    const el = document.createElement('div')
    Object.assign(el.style, {
      background: `url(${dataURL}) center center no-repeat`,
      backgroundSize: '100% 100%',
      width: `${w}px`,
      height: `${h}px`,
      position: 'relative'
    })
    return el
  }

  // extract these functions into the caller's namespace
  ret.extract = () => Object.keys(ret).reduce((acc, key) => acc + `var ${key}=szk['${key}'];`, '')

  return ret
})()
