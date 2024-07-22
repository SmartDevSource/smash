const preloadAudios = async urls => {
    const promises = urls.map(url => {
        return new Promise((resolve, reject)=>{
            const audio = new Audio()
            audio.src = url
            const name = url.split('/').at(-1).split('.').at(0)
            audio.addEventListener('canplaythrough', () => resolve({name: name, audio: audio}), {once: true})
            audio.addEventListener('error', () => reject(`Impossible de charger le fichier audio ${url}`, {once: true}))
        })
    })
    return Promise.all(promises).then(res=>{
        return res.reduce((acc, {name, audio}) => {
            acc[name] = audio
            return acc
        }, {})
    })
}

const preloadImages = async urls => {
    const promises = urls.map(url => {
        return new Promise((resolve, reject)=>{
            const image = new Image()
            image.src = url
            const name = url.split('/').at(-1).split('.').at(0)
            image.onload = () => resolve({name: name, image: image})
            image.onerror = () => reject(`Impossible de charger l'image ${url}`)
        })
    })
    return Promise.all(promises).then(res=>{
        return res.reduce((acc, {name, image}) => {
            acc[name] = image
            return acc
        }, {})
    })
}

const audios = [
    './assets/audio/sounds/explosion.mp3',
    './assets/audio/sounds/hit.mp3',
]

const images = [
    './assets/gfx/sprites/white_glow.png',
    './assets/gfx/sprites/green_glow.png',
    './assets/gfx/sprites/red_glow.png',
    './assets/gfx/sprites/orange_glow.png',
    './assets/gfx/sprites/purple_glow.png',
    './assets/gfx/sprites/yellow_glow.png',
    './assets/gfx/sprites/blue_glow.png',
    './assets/gfx/sprites/ship.png',
    './assets/gfx/sprites/explosion.png',
    './assets/gfx/sprites/impact.png',
    './assets/gfx/maps/first.png',
    './assets/gfx/maps/second.png',
]

export const preloadRessources = async () => {
    try{
        const [loadedAudios, loadedImages] = await Promise.all([preloadAudios(audios), preloadImages(images)])
        return {images: loadedImages, audios: loadedAudios}
    } catch (error) {
        console.log("Erreur lors du chargement des assets", error)
    }
}