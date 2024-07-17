import { loadJson, isMobile, isIOS, isStandalone } from "./misc_functions.js"
import { Game } from "./game.js"
import { Menu } from "./menu.js"
import { InstallMenu } from "./installmenu.js"
import { preloadRessources } from "../preload.js"

//////////////// DECLARATIONS ////////////////
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
canvas.width = 1280
canvas.height = 720
const screen = {w: canvas.width, h: canvas.height}

// let title_ost = null

// let ressources_preloaded = false
// let images = null, audios = null
// let socket = null
// let menu = null
// let install_menu = null
// let is_installed = isStandalone()
// let is_mobile = isMobile()

// const device_motion = {
//     default: null,
//     current: {x: 0, y: 0, z: 0} 
// }

// if (!is_installed){
//     install_menu = new InstallMenu(screen, ctx)
// }

// const scene_objects = await loadJson("../data/structs/scene_objects.json")

// let is_scene_loaded = false
// let map_data = null
// let game = null
// let map = null

// const keys = {'left': {isPressed: false},
//               'right': {isPressed: false},
//               'down': {isPressed: false},
//               'up': {isPressed: false},
//               'plus': {isPressed: false},
//               'minus': {isPressed: false},
//               'space': {isPressed: false},
//               'balance_left': {isPressed: false},
//               'balance_right': {isPressed: false}}

// //////////////// EVENTS LISTENERS ////////////////
// window.addEventListener("contextmenu", e=>{
//     e.preventDefault()
// })

// window.addEventListener("resize", ()=> {
//     if (screen && menu){
//         screen.w = canvas.width
//         screen.h = canvas.height
//         if (game){
//             game.screen = screen
//             map.screen = screen
//             map.half_w = screen.w / 2
//             map.half_h = screen.h / 2
//         }
//         menu.screen = screen
//     }
// })

// window.addEventListener("keydown", e=> {
//     // console.log(e.key)
//     switch(e.key){
//         case 'q': case 'Q': keys.left.isPressed = true; break
//         case 'd': case 'D': keys.right.isPressed = true; break
//         case 'z': case 'Z': keys.up.isPressed = true; break
//         case 's': case 'S': keys.down.isPressed = true; break
//         case '+': keys.plus.isPressed = true; break
//         case '-': keys.minus.isPressed = true; break
//         case ' ': keys.space.isPressed = true; break
//         case 'w': case 'W': keys.balance_left.isPressed = true; break
//         case 'c': case 'C': keys.balance_right.isPressed = true; break
//     }
// })

// window.addEventListener("keyup", e=> {
//     switch(e.key){
//         case 'q': case 'Q': keys.left.isPressed = false; break
//         case 'd': case 'D': keys.right.isPressed = false; break
//         case 'z': case 'Z': keys.up.isPressed = false; break
//         case 's': case 'S': keys.down.isPressed = false; break
//         case '+': keys.plus.isPressed = false; break
//         case '-': keys.minus.isPressed = false;  break
//         case ' ': keys.space.isPressed = false; break
//         case 'w': case 'W': keys.balance_left.isPressed = false; break
//         case 'c': case 'C': keys.balance_right.isPressed = false; break
//     }
// })

// //////////////// FUNCTIONS ////////////////
// const preload = async () => {
//     await preloadRessources().then(res=>{
//         audios = res.audios
//         images = res.images
//         title_ost = audios.title_ost
//         title_ost.loop = true
//         title_ost.volume = .8
//         title_ost.play()
//         ressources_preloaded = true
//     })
// }

// const reset = ({show_alert, text_alert, is_persistent}) => {
//     title_ost.play()
//     if (game) game.clear()
//     map_data = null
//     game = null
//     is_scene_loaded = false
//     menu = new Menu(screen, ctx, socket, images, audios)
//     if (show_alert){
//         if (is_persistent){
//             menu.page = ""
//         }
//         menu.alert.translate = {x: 13, y: 0}
//         menu.triggerAlert(text_alert, is_persistent)
//     }
// }

// const initSocketListeners = () => {
//     socket.on("opponent_leave", ()=>{
//         reset({
//             show_alert: true,
//             text_alert: "L'adversaire s'est déconnecté.", 
//             is_persistent: false
//         })
//     })
//     socket.on("connection", () => {
//         reset({
//             show_alert: false,
//             text_alert: "",
//             is_persistent: false
//         })
//     })
//     socket.on("disconnect", () => {
//         reset({
//             show_alert: true,
//             text_alert: "Serveur hors ligne.",
//             is_persistent: true
//         })
//     })
//     socket.on("load_scene", data => {
//         if (menu.page != "main_page" && menu.page != "")
//             loadScene(data)
//     })
//     socket.on("endgame", () => {
//         reset({
//             show_alert: true,
//             text_alert: "Fin de partie.", 
//             is_persistent: false
//         })
//     })
// }

// const loadScene = async data => {
//     title_ost.currentTime = 0
//     title_ost.pause()

//     map_data = await loadJson(`../data/maps/${data.map_name}.json`)
//     let player_data, opponent_data = null

//     for (const key in data.players_data){
//         if (key == socket.id){
//             player_data = data.players_data[key]
//         } else {
//             opponent_data = data.players_data[key]
//         }
//     }

//     const json_string = JSON.stringify(data)
//     const bytes_size = new TextEncoder().encode(json_string).length
//     console.log("Taille de l'objet load_scene en octets :", bytes_size)
//     map_data.objects = data.map_objects

//     is_mobile = isMobile()
//     game = new Game(
//         is_mobile,
//         ctx,
//         screen,
//         images,
//         audios,
//         map_data, 
//         player_data,
//         opponent_data,
//         socket
//     )

//     is_scene_loaded = true
// }

// const updateGame = () => {
//     game.update(keys, device_motion)
//     screenLog({
//         ctx: ctx,
//         position: {x: 10, y: 130},
//         color: "white",
//         size: 20,
//         text: `screenlog in index.js`
//     })
// }

// const updateMenu = () => {
//     if (menu){
//         menu.update()
//     }
// }

// const initMotionModule = () => {
//     if (isIOS()){
//         if (typeof DeviceMotionEvent.requestPermission === 'function'){
//             DeviceMotionEvent.requestPermission().then(response=>{
//                 if (response == 'granted'){
//                     ondevicemotion = e => handleMotion(e)
//                 }
//             }).catch(console.error)
//         } else {
//             ondevicemotion = e => handleMotion(e)
//         }
//     } else {
//         ondevicemotion = e => handleMotion(e)
//     }
// }

// const handleMotion = e => {
//     if (!device_motion.default){
//         device_motion.default = e.accelerationIncludingGravity
//     }
//     device_motion.current = {
//         x: device_motion.default.x - e.accelerationIncludingGravity.x,
//         y: device_motion.default.y - e.accelerationIncludingGravity.y,
//         z: device_motion.default.z - e.accelerationIncludingGravity.z
//     }
// }

// const handleInstallScreen = () => {
//     if (is_installed && !socket){
//         try{
//             socket = io()
//             if (socket){
//                 initSocketListeners()
//                 socket.on('connect', () => {
//                     menu = new Menu(screen, ctx, socket, images, audios)
//                     initMotionModule()
//                     // menu.quickLaunch({map_name: "sand"})
//                 })
//             }
//         } catch (err) {
//             console.log("Erreur de connexion :", err)
//         }
//     } else if (!is_installed){
//         install_menu.update(isMobile(), isStandalone())
//         is_installed = isStandalone()
//     }
// }

// const scene = () => {
//     requestAnimationFrame(scene)
//     ctx.clearRect(0, 0, screen.w, screen.h)
//     if (ressources_preloaded){
//         switch(is_scene_loaded){
//             case true: 
//                 updateGame()
//             break
//             case false:
//                 if (is_installed && socket)
//                     updateMenu()
//                 else
//                     handleInstallScreen()
//             break
//         }
//     }
// }

// preload()
// scene()





import { TestEngine } from "./test_engine/test_engine.js"
let socket = null,
    test_engine = null,
    is_mobile = false

const keys = {'left': {isPressed: false},
              'right': {isPressed: false},
              'down': {isPressed: false},
              'up': {isPressed: false},
              'plus': {isPressed: false},
              'minus': {isPressed: false},
              'space': {isPressed: false},
              'balance_left': {isPressed: false},
              'balance_right': {isPressed: false}}

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

try{
    socket = io()
    if (socket){
        socket.on('connect', () => {
            const is_mobile = isMobile()
            test_engine = new TestEngine(ctx, screen, is_mobile)
        })
    }
} catch (err) {
    console.log("Erreur de connexion :", err)
}

const update = () => {
    requestAnimationFrame(update)
    ctx.clearRect(0, 0, screen.w, screen.h)
    if (test_engine){
        test_engine.update(keys)
    }
}

update()