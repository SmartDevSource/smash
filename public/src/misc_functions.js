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

export const getPythagoreanDistance = (v1, v2) => {
    return Math.sqrt(Math.pow(v2.x - v1.x,2) + Math.pow(v2.y - v1.y, 2))
}

export const getDistanceTo = (v1, v2) => {
    const vx = Math.abs(v1.x - v2.x)
    const vy = Math.abs(v1.y - v2.y)
    return {x: vx / 20, y: vy / 20}
}

export const getAngleTo = (v1, v2) => {
    return Math.atan2(v1.y - v2.y, v1.x - v2.x) + Math.PI
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

export const getDistanceToLine = ({first_point, second_point, vector, offset}) => {
    const x_min = Math.min(first_point.x, second_point.x)
    const x_max = Math.max(first_point.x, second_point.x)
    const y_min = Math.min(first_point.y, second_point.y)
    const y_max = Math.max(first_point.y, second_point.y)

    let distance = null,
        points = {}

    if (vector.x >= x_min && vector.x <= x_max){
        const scale = ((vector.x - x_min) / (x_max - x_min))
        const diff_y = second_point.y > first_point.y ? 0 : (y_max - y_min)
        const y_prop = y_min + scale * (second_point.y - first_point.y) + diff_y
        points = {x: vector.x , y: y_prop }
        distance = getPythagoreanDistance(vector, points)
    }

    return {distance: distance, points: points}
}