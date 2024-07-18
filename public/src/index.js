import { loadJson, isMobile, isIOS, isStandalone } from "./misc_functions.js"
import { GameEngine } from "./game_engine/game_engine.js"
import { Menu } from "./menu.js"
import { preloadRessources } from "../preload.js"
import { struct } from '../data/structs/struct.js'

//////////////// DECLARATIONS ////////////////
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
canvas.width = 1280
canvas.height = 720
const screen = {w: canvas.width, h: canvas.height}

let title_ost = null

const scene_objects = await loadJson("../data/structs/scene_objects.json")
let is_mobile = isMobile()

const keys = {'left': {isPressed: false},
              'right': {isPressed: false},
              'down': {isPressed: false},
              'up': {isPressed: false}}

// //////////////// EVENTS LISTENERS ////////////////
window.addEventListener("contextmenu", e=>{
    e.preventDefault()
})

window.addEventListener("keydown", e=> {
    switch(e.key){
        case 'q': case 'Q': keys.left.isPressed = true; break
        case 'd': case 'D': keys.right.isPressed = true; break
        case 'z': case 'Z': keys.up.isPressed = true; break
        case 's': case 'S': keys.down.isPressed = true; break
    }
})

window.addEventListener("keyup", e=> {
    switch(e.key){
        case 'q': case 'Q': keys.left.isPressed = false; break
        case 'd': case 'D': keys.right.isPressed = false; break
        case 'z': case 'Z': keys.up.isPressed = false; break
        case 's': case 'S': keys.down.isPressed = false; break
    }
})

// window.addEventListener("onmousedown", () => {
//     if (title_ost && title_ost.currentTime == 0){
//         title_ost.play()
//     }
// })

////////////////// SOCKET LISTENERS //////////////////
const initSocketListeners = () => {
    struct.socket.on("opponent_leave", ()=>{
        message({
            text_alert: "L'adversaire s'est déconnecté.", 
            is_persistent: false
        })
        reload()
    })
    struct.socket.on("disconnect", () => {
        message({
            text_alert: "Serveur hors ligne", 
            is_persistent: false
        })
        reload()
    })
    struct.socket.on("load_scene", data => {
        message({
            text_alert: "Chargement de la scène", 
            is_persistent: false
        })
    })
    struct.socket.on("endgame", () => {
        message({
            text_alert: "Fin de partie", 
            is_persistent: false
        })
        reload()
    })
}

////////////////// FUNCTIONS //////////////////
const preload = async () => {
    await preloadRessources().then(res=>{
        console.log(res)
        struct.audios = res.audios
        struct.images = res.images
        title_ost = struct.audios.title_ost
        title_ost.loop = true
        title_ost.volume = .8
        struct.ressources_preloaded = true
    })
}

const connectToServer = () =>{
    try{
        struct.socket = io()
        if (struct.socket){
            struct.socket.on('connect', () => {
                struct.menu = new Menu(struct.socket, struct.images, struct.audios)
                initSocketListeners()
            })
        }
    } catch (err) {
        console.log("Erreur de connexion :", err)
    }
}

const reload = () => {
    location.reload()
}

const message = ({text_alert, is_persistent}) => {

}

const loadScene = async data => {
    title_ost.currentTime = 0
    title_ost.pause()

    map_data = await loadJson(`../data/maps/${data.map_name}.json`)

    const json_string = JSON.stringify(data)
    const bytes_size = new TextEncoder().encode(json_string).length
    console.log("Taille de l'objet load_scene en octets :", bytes_size)
    map_data.objects = data.map_objects

    struct.is_game_started = true
}

const updateGame = () => {
    if (struct.game_engine)
        struct.game_engine.update(keys)
}

const updateMenu = () => {
    if (struct.menu){
        struct.menu.update()
    }
}

const update = () => {
    requestAnimationFrame(update)
    ctx.clearRect(0, 0, screen.w, screen.h)
    if (struct.ressources_preloaded){
        switch(struct.is_game_started){
            case true: 
                updateGame()
            break
            case false:
                updateMenu()
            break
        }
    }
}

preload()
connectToServer()
update()