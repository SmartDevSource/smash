/////////////////////////////////// INITIALISATION ///////////////////////////////////
require('dotenv').config()
const { Worker } = require('node:worker_threads')

const fs = require('fs')
const path = require('path')

const private_key = fs.readFileSync('./mkcert/homekey.pem', 'utf-8')
const certificate = fs.readFileSync('./mkcert/homecert.pem', 'utf-8')
const credentials = {key: private_key, cert: certificate}

const express = require('express')
const app = express()
const server = require('https').createServer(credentials, app)
// const server = require('http').createServer(app)
const socket_io = require('socket.io')
const ShortUniqueId = require('short-unique-id')
const io = socket_io(server, {cors: { origin: '*', methods: ['GET']}})

const port = process.env.PORT
const sockets = {}

////////////////////////// SETTING UP FUNCTIONS /////////////////////////////////
const initRooms = () => {
    for (const key in maps){
        maps[key].postMessage({header: "instantiate"})
        setRoomListeners(maps[key])
    }
}

const setRoomListeners = room => {
    room.on('message', data => {
        switch(data.header){
            case "test":
                sendToPlayers(data.ids, "test", data)
            break
        }
    })
}

///////////////////////////////////////////////////////////////////////////////////////

const max_room_players = 2

const maps = {
    first: new Worker("./server/src/room.js"),
    second: new Worker("./server/src/room.js")
}

const players_ids = {}

initRooms()

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
    console.log("Players ids :", players_ids)
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

/////////////////////////////////// NETWORKING ///////////////////////////////////
/////////////////////////////////// SOCKETS ///////////////////////////////////
io.on('connection', socket => {
    console.log(`Connexion entrante ${socket.id}`)

    sendToAll("players_online", Object.keys(sockets).length)

    socket.on("get_players_count", () => {
        const players_count = {}
        for (const key in maps){
            const player_in_room = Object.values(players_ids).reduce((acc, curr) => acc += curr == key ? 1 : 0, 0)
            players_count[`${key}_players_count`] = `${player_in_room}/${max_room_players}`
        }
        socket.emit("players_count", players_count)
    })

    socket.on("join_server", data => {
        const players_in_room = Object.values(players_ids).reduce((acc, curr) => acc += curr == data.server ? 1 : 0, 0)
        if (players_in_room < max_room_players){
            players_ids[socket.id] = data.server
        } else {
            socket.emit("server_full")
        }
        showInfos()
    })

    socket.on('disconnect', () => {
        console.log(`Déconnexion de l'id ${socket.id}`)
        if (players_ids[socket.id]){
            delete players_ids[socket.id]
        }
        console.log(players_ids)
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