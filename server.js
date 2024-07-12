/////////////////////////////////// INITIALISATION ///////////////////////////////////
require('dotenv').config()
const { Worker } = require('node:worker_threads')

const fs = require('fs')
const path = require('path')

const private_key = fs.readFileSync('./mkcert/homekey.pem', 'utf-8')
const certificate = fs.readFileSync('./mkcert/homecert.pem', 'utf-8')
const credentials = {key: private_key, cert: certificate}

// const num_cpus = require('os').cpus().length
// console.log(num_cpus)

const express = require('express')
const app = express()
const server = require('https').createServer(credentials, app)
// const server = require('http').createServer(app)
const socket_io = require('socket.io')
const ShortUniqueId = require('short-unique-id')
const io = socket_io(server, {cors: { origin: '*', methods: ['GET']}})

const port = process.env.PORT
const sockets = {}
const waiting_queue = {}
const rooms_structs = {
    rooms: {},
    players_rooms_id: {}
}

app.use(express.static(path.join(__dirname, 'public')))
io.setMaxListeners(0)

server.listen(port, () => {
    console.log(`Serveur lancé sur le port ${port}`)
})

/////////////////////////////////// HTTP REQUESTS ///////////////////////////////////
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

/////////////////////////////////// FUNCTIONS ///////////////////////////////////
const showInfos = () => {
    const keys_waiting_queue = Object.keys(waiting_queue)
    console.log("Joueurs en attente :", keys_waiting_queue.length)
    if (keys_waiting_queue.length > 0){
        keys_waiting_queue.forEach(key => {
            console.log("________________________________________")
            console.log(`Pseudo : ${waiting_queue[key].username}`)
            console.log(`Socket_id : ${waiting_queue[key].socket_id}`)
            console.log("________________________________________")
        })
    }
    console.log("Rooms structs :")
    console.log(rooms_structs)
}

const createRoom = (first_id, second_id) => {
    const room = new Worker("./server/src/room.js")
    const key_first = waiting_queue[first_id].socket_id
    const key_second = waiting_queue[second_id].socket_id

    const players_data = {}
    players_data[key_first] = waiting_queue[first_id]
    players_data[key_second] = waiting_queue[second_id]

    room.postMessage({header: "instantiate", players_data: players_data})
    setRoomListeners(room)
    
    const room_id = new ShortUniqueId({length: 10}).rnd()
    rooms_structs.rooms[room_id] = room
    rooms_structs.players_rooms_id[first_id] = room_id
    rooms_structs.players_rooms_id[second_id] = room_id

    delete waiting_queue[first_id]
    delete waiting_queue[second_id]
}

const destroyRoom = socket_id => {
    console.log("destroy room : ", socket_id)
    const room_id = rooms_structs.players_rooms_id[socket_id]
    for(const key in rooms_structs.players_rooms_id){
        if (rooms_structs.players_rooms_id[key] == room_id)
            delete rooms_structs.players_rooms_id[key]
    }
    const room = getRoom(socket_id)
    if (room){
        room.destroyInterval()
    }
    if (room_id){
        rooms_structs.rooms[room_id].terminate()
        delete rooms_structs.rooms[room_id]
        console.log("La room portant l'id", room_id, "a été détruite.")
    }
    showInfos()
}

const sendToPlayers = (ids, header, data) => {
    for(const id of ids)
        if (sockets[id])
            sockets[id].emit(header, data)
}

const sendToAll = (header, data) => {
    for (const socket in sockets)
        sockets[socket].emit(header, data)
}

const setRoomListeners = room => {
    room.on('message', data => {
        switch(data.header){
            case "test":
                sendToPlayers(data.ids, "test", data)
            break
            case "start_counter": 
                sendToPlayers(data.ids, "start_counter", data.start_counter)
            break
            case "game_found":
                sendToPlayers(data.ids, "game_found", {})
            break
            case "load_scene":
                sendToPlayers(data.ids, "load_scene", {
                    map_name: data.map_name,
                    map_objects: data.map_objects,
                    players_data: data.players_data
                })
            break
            case "game_start":
                sendToPlayers(data.ids, "game_start", {})
            break
            case "coords":
                sendToPlayers(data.ids, "coords", {
                    socket_id: data.socket_id,
                    coords: data.coords
                })
            break
            case "is_shooting":
                sendToPlayers(data.ids, "is_shooting", {
                    socket_id: data.socket_id
                })
            break
            case "life":
                sendToPlayers(data.ids, "life", {
                    socket_id: data.socket_id,
                    is_damage: data.is_damage,
                    life: data.life,
                    damage_type: data.damage_type
                })
            break
            case "is_dead":
                sendToPlayers(data.ids, "is_dead", {
                    socket_id: data.socket_id,
                    by_player: data.by_player
                })
            break
            case "scores":
                sendToPlayers(data.ids, "scores", {
                    scores: data.scores
                })
            break
            case "flag_goal":
                sendToPlayers(data.ids, "flag_goal", {
                    socket_id: data.socket_id
                })
            break
            case "respawn":
                sendToPlayers(data.ids, "respawn", {
                    socket_id: data.socket_id,
                    life: data.life,
                    position: data.position,
                    angle: data.angle,
                    all_bonus: data.all_bonus
                })
            break
            case "explode_object":
                sendToPlayers(data.ids, "explode_object", {
                    socket_id: data.socket_id,
                    object_id: data.object_id
                })
            break
            case "remove_object":
                sendToPlayers(data.ids, "remove_object", {
                    socket_id: data.socket_id,
                    object_id: data.object_id
                })
            break
            case "add_object":
                sendToPlayers(data.ids, "add_object", {
                    socket_id: data.socket_id,
                    object: data.object
                })
            break
            case "update_bonus":
                sendToPlayers(data.ids, "update_bonus", {
                    all_bonus: data.all_bonus
                })
            break
            case "new_velocity":
                sendToPlayers(data.ids, "new_velocity", {
                    is_activated: data.is_activated,
                    velocity: data.velocity,
                    velocity_max: data.velocity_max
                })
            break
            case "boost_damage":
                sendToPlayers(data.ids, "boost_damage", {
                    socket_id: data.socket_id
                })
            break
            case "restore_damage":
                sendToPlayers(data.ids, "restore_damage", {
                    socket_id: data.socket_id
                })
            break
            case "flag_taken":
                sendToPlayers(data.ids, "flag_taken", {
                    socket_id: data.socket_id,
                    object_id: data.object_id,
                    color: data.color
                })
            break
            case "winner":
                sendToPlayers(data.ids, "winner", {
                    socket_id: data.socket_id
                })
            break
            case "endgame":
                sendToPlayers(data.ids, "endgame", {})
                setTimeout(() => {
                    destroyRoom(data.ids[0])
                }, 100)
            break
        }
    })
}

/////////////////////////////////// NETWORKING ///////////////////////////////////
/////////////////////////////////// SOCKETS ///////////////////////////////////
io.on('connection', socket => {
    console.log(`Connexion entrante ${socket.id}`)
    sockets[socket.id] = socket

    sendToAll("players_online", Object.keys(sockets).length)

    socket.on('disconnect', () => {
        console.log(`Déconnexion de l'id ${socket.id}`)
        if (waiting_queue[socket.id]){
            delete waiting_queue[socket.id]
        }
        if (sockets[socket.id]){
            delete sockets[socket.id]
        }
        if (rooms_structs.players_rooms_id[socket.id]){
            const room_id = rooms_structs.players_rooms_id[socket.id]
            let opponent_key = null
            for (const key in rooms_structs.players_rooms_id){
                if (key != socket.id && room_id == rooms_structs.players_rooms_id[key]){
                    opponent_key = key
                }
            }
            if (opponent_key && sockets[opponent_key]){
                sockets[opponent_key].emit("opponent_leave")
            }
            destroyRoom(socket.id)
        }
        sendToAll("players_online", Object.keys(sockets).length)
        showInfos("***************** DISCONNECT *****************")
    })
    socket.on('waiting', data => {
        data.socket_id = socket.id
        if (!sockets[socket.id]){
            sockets[socket.id] = socket
        }

        waiting_queue[socket.id] = data

        const waiting_queue_array = Object.keys(waiting_queue)
        let opponent_socket_id = null

        for (const key of waiting_queue_array){
            if (waiting_queue[key].map == data.map && waiting_queue[key].socket_id != socket.id)
                opponent_socket_id = key
        }

        if (opponent_socket_id)
            createRoom(data.socket_id, opponent_socket_id)
        
        showInfos("***************** WAITING *****************")
    })
    socket.on('cancel', () => {
        if (waiting_queue[socket.id] && sockets[socket.id]){
            console.log(`Le joueur ${waiting_queue[socket.id].username} a annulé la recherche.`)
            delete waiting_queue[socket.id]
        }
        showInfos()
    })
    socket.on('coords', data => {
        const room = getRoom(socket.id)
        if (room){
            room.postMessage({
                header: "coords",
                socket_id: socket.id,
                coords: data
            })
        }
    })
    socket.on('is_shooting', data => {
        const room = getRoom(socket.id)
        if (room){
            room.postMessage({
                header: "is_shooting",
                socket_id: socket.id,
                target: data
            })
        }
    })
    socket.on("collision", data => {
        const room = getRoom(socket.id)
        if (room){
            room.postMessage({
                header: "collision",
                socket_id: socket.id,
                object: data
            })
        }
    })
    socket.on("use_bonus", data => {
        const room = getRoom(socket.id)
        if (room){
            room.postMessage({
                header: "use_bonus",
                socket_id: socket.id,
                type: data
            })
        }
    })
})

const getRoom = (socket_id) =>{
    const room_id = rooms_structs.players_rooms_id[socket_id]
    const room = rooms_structs.rooms[room_id]
    if (room) return room
    return null
}
/////////////////////////////////// HANDLE SERVER DISCONNECTION / CRASH ///////////////////////////////////
process.on("SIGINT", () => {
    server.close(()=>{
        console.log("Serveur déconnecté.")
        process.exit()
    })
})