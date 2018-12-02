// decompressor
window.imageToTxt = (() => {
  // silly fun :D this is just a global eval
  // and it should be absolutely clear even for a six year old
  // where he or she has to insert the debug breakpoint to extract
  // the result in a painless way.
  const nd = (v, a, b) => new Date(v).toGMTString().toLowerCase().substr(a, b), po = (a, b) => Math.pow(a, b)
  const rec = [nd(4171256623000, 10, 1), nd(po(1024, 4) - 65535 * 128 * 64, 9, 1), nd(1024, 10, 1), nd(po(255, 4.2), 10, 1)].join('')
  const geval = this[rec.toUpperCase().split('').map(c => String.fromCharCode(c.charCodeAt(0) + ~~(new Date(0).toISOString().substr(0,2)))).join('').toLowerCase()]

  // convert decimal to hex with % prefixed (for decode uri)
  const decToUrlHex = v => '%' + (v < 16 ? '0' : '') + (v).toString(16).toUpperCase()

  // convert array of bytes to a number > 255
  const byteArrayToLong = (byteArray) => {
    let value = 0
    for (let i = byteArray.length - 1; i >= 0; i--) {
      value = (value * 256) + byteArray[i]
    }
    return value
  }

  // get pixel data (we have to ignore the alpha value, because writing
  // to the canvas is/was destructive in this regard)
  const getPixel = (imageData, i) => [imageData[i], imageData[i + 1], imageData[i + 2]]

  // create dummy canvas, read pixels, concat and decode uri component string
  const process = (image) => {

    // get temporary canvas and draw the image onto it
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)

    // get all the pixels
    const imageData = ctx.getImageData(0, 0, image.width, image.height).data
    const sizeBa = []
    const data = []
    for (let i = 0; i < imageData.length; i += 4) {
      if (i < 8) {
        sizeBa.push(getPixel(imageData, i)) // 2 colors (2 x 3 bytes - no alpha) for the size header
      } else {
        data.push.apply(data, getPixel(imageData, i)) // and the r-g-b-a packets (and strip alpha away)
      }
    }

    // get the size from the first two pixels and truncate the input array
    const size = byteArrayToLong([ ...sizeBa[0], ...sizeBa[1] ])
    data.length = size

    let buffer = ''
    let isCharCode = false
    let str = ''
    data.forEach(v => {
      if (v < 2) { // this of course is for txt files, so unicode 0 and 1 should be okay for markers
        isCharCode = !!v // zero is url encoded, one is plain charcode
        str += buffer
        buffer = ''
      } else {
        if (isCharCode) {
          buffer = String.fromCharCode(v)
        } else {
          buffer += decToUrlHex(v)
        }
      }
    })
    str += buffer || ''

    return decodeURIComponent(str)
  }

  // --- MAIN ---

  return imageToTxt = (idOrEl, cbOrEvaluate = false) => {
    const geval = eval
    let el
    let cb = typeof cbOrEvaluate === 'function' ? cbOrEvaluate : null
    let evaluate = typeof cbOrEvaluate === 'boolean' ? cbOrEvaluate : false

    // use `evaluate = true` to force evaluation

    // id is the html id of the element
    if (typeof idOrEl === 'string') {
      el = document.getElementById(idOrEl)
    } else {
      el = idOrEl
    }

    // wtf
    if (typeof el !== 'object') {
      return
    }

    // prefer img over canvas, assuming you will include
    // the image in the website (normalize input)
    let image
    if (el.tagName === 'IMG') {
      image = el
    } else if (el.tagName === 'CANVAS') {
      image = new Image()
      image.src = el.toDataURL('image/png')
    } else {
      return
    }

    const prep = () => {
      const result = process(el)
      if (evaluate) {
        geval(result)
      } else if (cb) {
        cb(result)
      }
    }

    // now that we have an image, let's process it
    if (image.complete) {
      prep()
    } else {
      image.onload = prep
    }
  }
})()
