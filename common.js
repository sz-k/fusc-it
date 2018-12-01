window.szk = (() => {
  const ret = {}

  ret.$ = id => document.getElementById(id)

  ret.$$ = selector => Array.from(document.getElementsByClassName(selector))

  const rand = ret.rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

  ret.putPixel = (ctx, x, y, r = 0, g = 0, b = 0, a = 1) => {
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`
    ctx.fillRect(x,y,1,1)
  }

  // on six bytes
  longToByteArray = function(long) {
    var byteArray = [0, 0, 0, 0, 0, 0]
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
  // a => 0, 97
  const strToByteStream = ret.strToByteStream = (s) => {
    let ret = []
    for (let i = 0; i < s.length; i++) {
      const x = encodeURI(s.substr(i, 1))
      if (x.includes('%')) {
        ret = ret.concat(...x.split('%').reduce((acc, num) => acc.concat(parseInt(num, 16) || 0), [])) // 0 + A,B,C
      } else {
        ret = ret.concat([ 0, s.charCodeAt(i) ])
      }
    }
    return ret
  }

  // first two colors are the size of the data
  // followed by a byte stream in the [r, g, b] format
  // (the remnants in the end are trailing zeroes)
  ret.strToRgbStream = (s) => {
    let bytes = strToByteStream(s)
    const size = longToByteArray(bytes.length)
    const ret = [ size.slice(0, 3), size.slice(3, 6) ]
    let i
    for (i = 0; i < bytes.length; i += 3) {
      ret.push([bytes[i] || 0, bytes[i + 1] || 0, bytes[i + 2] || 0])
    }
    return ret
  }

  // extract these functions into the caller's namespace
  ret.extract = () => Object.keys(ret).reduce((acc, key) => acc + `var ${key}=szk['${key}'];`, '')

  return ret
})()
