import { isMobile, isIOS, isStandalone } from "./client_utils.js"
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

////////////////// SOCKET LISTENERS //////////////////
const initSocketListeners = () => {
    struct.socket.on("disconnect", () => {
        reload()
    })
    struct.socket.on("init_game", init_data => {
        struct.game_engine = new GameEngine(
            ctx,
            screen,
            struct.socket,
            isMobile(),
            init_data,
            struct.images,
            struct.audios
        )
        const json_string = JSON.stringify(init_data)
        const bytes_size = new TextEncoder().encode(json_string).length
        console.log("Taille de l'objet init_game en octets :", bytes_size)
        struct.menu.clear()
        struct.menu = null
        struct.is_game_started = true
    })
}

////////////////// FUNCTIONS //////////////////
const preload = async () => {
    await preloadRessources().then(res=>{
        struct.audios = res.audios
        struct.images = res.images
        // title_ost = struct.audios.title_ost
        // title_ost.loop = true
        // title_ost.volume = .8
        struct.ressources_preloaded = true
        connectToServer()
    })
}

const connectToServer = () =>{
    try{
        struct.socket = io()
        if (struct.socket){
            struct.socket.on('connect', () => {
                struct.menu = new Menu(
                    struct.socket, 
                    isMobile(), 
                    isStandalone(), 
                    struct.images, 
                    struct.audios
                )
                initSocketListeners()
            })
        }
    } catch (err) {
        console.log("Erreur de connexion :", err)
    }
}

const reload = () => {
    console.log("Rechargement de la page")
    location.reload()
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
update()