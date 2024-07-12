export const screenLog = ({ctx, position, font= 'operator', text, color="rgb(102,66,77)", size=24, outline_size=null}) =>{
    ctx.save()
    ctx.fillStyle = color
    ctx.font = `${size}px ${font}`
    ctx.fillText(text, position.x, position.y)
    if (outline_size){
        ctx.lineWidth = outline_size
        ctx.strokeStyle = "black"
        ctx.strokeText(text, position.x, position.y)
    }
    ctx.restore()
}

export const drawPoint = (ctx, x, y, color="white") => {
    const prevFillStyle = ctx.fillStyle
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = prevFillStyle
}

export const drawLine = (ctx, v1, v2, color="white") => {
    const prevStrokeStyle = ctx.strokeStyle
    ctx.beginPath()
    ctx.lineWidth = 3
    ctx.strokeStyle = color
    ctx.moveTo(v1.x, v1.y)
    ctx.lineTo(v2.x, v2.y)
    ctx.fill()
    ctx.stroke()
    ctx.strokeStyle = prevStrokeStyle
}

export const drawTile = (ctx, x, y, color="white") => {
    ctx.fillStyle = color
    ctx.fillRect(x*32, y*32, 32, 32)
}

export const loadImageData = async path => {
    return new Promise((resolve, reject)=>{
        const image = new Image()
        image.src = path
        image.onload = () => {
            const fakeCanvas = document.createElement("canvas")
            const fakeCtx = fakeCanvas.getContext("2d")
            fakeCanvas.width = image.width
            fakeCanvas.height = image.height
            fakeCtx.drawImage(image, 0, 0)
            const imageData = fakeCtx.getImageData(0, 0, image.width, image.height)
            resolve(imageData)
        }
        image.onerror = (err) => reject(err)
    })
}

export const loadImage = async path => {
    return new Promise((resolve, reject)=>{
        const image = new Image()
        image.src = path
        image.onload = () => resolve(image)
        image.onerror = err => reject(err)
    })
}

export const loadJson = async path => {
    return fetch(path)
        .then(res=> res.json())
        .then(data=> data)
        .catch(error => { console.log("Erreur de chargement de la map", error)})
}

export const toDegrees = rad => {
    return (rad * 180 / Math.PI) + 180
}

export const toRadians = deg => {
    return deg * Math.PI / 180
}

export const getDistance = (v1, v2) =>{
    const vx = v1.x - v2.x
    const vy = v1.y - v2.y
    return vx * vx + vy * vy
}

export const getDistanceTo = (v1, v2) => {
    const vx = Math.abs(v1.x - v2.x)
    const vy = Math.abs(v1.y - v2.y)
    return {x: vx / 20, y: vy / 20}
}

export const getAngleTo = (v1, v2) => {
    return Math.atan2(v1.y - v2.y, v1.x - v2.x) + Math.PI
}

export const getOppositeFlag = color=> {
    switch(color){
        case "blue_flag": return "red_flag"
        case "red_flag": return "blue_flag"
    }
}

export const getTakenColor = color=> {
    switch(color){
        case "blue_flag": return "blue_taken"
        case "red_flag": return "red_taken"
    }
}

export const isMobile = () => {
    const match = window.matchMedia('(pointer:coarse)')
    return match && match.matches
}

export const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches
}

export const isIOS = () => {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}