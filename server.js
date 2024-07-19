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
    const maps_data = JSON.parse(fs.readFileSync("./server/data/maps_data.json", {encoding: "utf-8"}))
    
    for (const key in maps){
        maps[key].postMessage({
            header: "instantiate",
            map_data: maps_data[key]
        })
        setRoomListeners(maps[key])
    }
}

const setRoomListeners = room => {
    room.on('message', data => {
        switch(data.header){
            case "test":
                sendToPlayers(data.ids, "test", data)
            break
            case "init_game":
                sendToPlayers(data.ids, "init_game", {
                    map_data: data.map_data,
                    id: data.id
                })
            break
        }
    })
}

///////////////////////////////////////////////////////////////////////////////////////

const max_room_players = 8

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
    console.log("*".repeat(10), "[server.js] showInfos", "*".repeat(10))
    console.log("Players ids :", players_ids)
    console.log("Sockets length :", Object.keys(sockets).length)
    console.log("*".repeat(50))
}

const sendToPlayers = (ids, header, data) => {
    for(const id of ids)
        if (sockets[id])
            sockets[id].emit(header, data)
}

const sendPlayersCount = sockets => {
    const players_count = {}
    for (const key in maps){
        const player_in_room = Object.values(players_ids).filter(e=>e==key).length
        players_count[`${key}_players_count`] = `${player_in_room}/${max_room_players}`
    }

    for(const id in sockets){
        sockets[id].emit("players_count", players_count)
    }
}

/////////////////////////////////// NETWORKING ///////////////////////////////////
/////////////////////////////////// SOCKETS ///////////////////////////////////
io.on('connection', socket => {
    console.log(`Connexion entrante ${socket.id}`)
    sockets[socket.id] = socket

    socket.on("get_players_count", () => {
        sendPlayersCount({[socket.id]: socket})
    })

    socket.on("join_server", data => {
        const players_in_room = Object.values(players_ids).filter(e=>e==data.server).length
        if (players_in_room < max_room_players){
            players_ids[socket.id] = data.server
            maps[data.server].postMessage({
                header: "connection", 
                id: socket.id,
                username: data.username
            })
            sendPlayersCount(sockets)
        } else {
            socket.emit("server_full")
        }
        showInfos()
    })

    socket.on('disconnect', () => {
        console.log(`Déconnexion de l'id ${socket.id}`)
        if (players_ids[socket.id]){
            const map_name = players_ids[socket.id]
            maps[map_name].postMessage({header: "disconnection", id: socket.id})
            delete players_ids[socket.id]
            delete sockets[socket.id]
            sendPlayersCount(sockets)
        } else if (sockets[socket.id]){
            delete socket[sockets.id]
        }
        showInfos()
    })
})

/////////////////////////////////// HANDLE SERVER DISCONNECTION / CRASH ///////////////////////////////////
process.on("SIGINT", () => {
    server.close(()=>{
        console.log("Serveur déconnecté.")
        process.exit()
    })
})