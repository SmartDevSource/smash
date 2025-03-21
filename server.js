/////////////////////////////////// INITIALISATION ///////////////////////////////////
require('dotenv').config()
const { Worker } = require('node:worker_threads')

const fs = require('fs')
const path = require('path')

const helmet = require('helmet')
const express = require('express')
const rateLimit = require('express-rate-limit')
const app = express()
const server = require('http').createServer(app)
const socket_io = require('socket.io')
const io = socket_io(server, {cors: { origin: '*', methods: ['GET']}})

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { OAuth2Client } = require('google-auth-library')
const session = require('express-session')
const { Database } = require('./server/src/database.js')

const PORT = process.env.PORT
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID

////////////////////////// SETTING UP FUNCTIONS /////////////////////////////////
const initRooms = () => {
    const maps_data = JSON.parse(fs.readFileSync("./server/data/maps_data.json", {encoding: "utf-8"}))
    for (const key in maps){
        maps[key].postMessage({
            header: "instantiate",
            map_data: maps_data[key],
            room_name: key
        })
        setRoomListeners(maps[key])
    }
}

const setRoomListeners = room => {
    room.on('message', data => {
        switch(data.header){
            case "init_game":
                sendToSinglePlayer(data.id, "init_game", {
                    max_server_score: data.max_server_score,
                    map_data: data.map_data,
                    players_data: data.players_data,
                    username: data.username,
                    color: data.color,
                    score: data.score,
                    angle: data.angle,
                    id: data.id
                })
            break
            case "new_player":
                sendToPlayers(data.room_name, "new_player", data.player_data)
            break
            case "del_player":
                sendToPlayers(data.room_name, "del_player", data.id)
            break
            case "coords":
                sendToPlayers(data.room_name, "coords", {
                    id: data.id,
                    position: data.position,
                    angle: data.angle
                })
            break
            case "can_collide":
                sendToPlayers(data.room_name, "can_collide", {
                    id: data.id,
                    can_collide: data.can_collide
                })
            break
            case "collision":
                sendToPlayers(data.room_name, "collision", {
                    id: data.id,
                    by: data.by
                })
            break
            case "score":
                sendToPlayers(data.room_name, "score", {
                    id: data.id,
                    score: data.score
                })
            break
            case "player_dead":
                sendToPlayers(data.room_name, "player_dead", {
                    id: data.id,
                    by: data.by
                })
            break
            case "player_respawn":
                sendToPlayers(data.room_name, "player_respawn", {
                    id: data.id,
                    position: data.position,
                    angle: data.angle,
                    can_collide: data.can_collide
                })
            break
            case "end_game":
                sendToPlayers(data.room_name, "end_game", {
                    winner_id: data.winner_id,
                })
                database.updateScore({google_id: data.google_id})
            break
            case "start_counter":
                sendToPlayers(data.room_name, "start_counter", {
                    counter: data.counter,
                })
            break
            case "restart_game":
                sendToPlayers(data.room_name, "restart_game", {
                    players_data: data.players_data,
                })
            break
        }
    })
}

const verifyToken = async token => {
    const ticket = await google_client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID
    })
    return ticket.getPayload()
}

const resetDatabase = database => {
    database.destroyUsersTable().then(is_destroyed => {
        if (is_destroyed){
            database.createUsersTable()
        }
    })
}

////////////////////////// SETTING UP VARIABLES & OBJECTS /////////////////////////////////
const sockets = {}
const players_ids = {}
const max_room_players = 8

const maps = {
    first: new Worker("./server/src/room.js"),
    second: new Worker("./server/src/room.js")
}

initRooms()
const google_client = new OAuth2Client(GOOGLE_CLIENT_ID)
const database = new Database()

// resetDatabase(database)
database.getAllUsers().then(all_users=>{
    console.log("Database users :")
    console.log(all_users)
})

const rate_limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    message: 'Too many requests.',
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({error: 'options.message'})
    }
})

app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://accounts.google.com"],
      },
    })
  )
app.use(rate_limiter)
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())
app.use(session({
    secret: process.env.GOOGLE_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        maxAge: 2629800000 // ce qui représente 1 mois de session active en millisecondes
    }
}))

server.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`))
io.setMaxListeners(0)

/////////////////////////////////// HTTP REQUESTS ///////////////////////////////////
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/session_status', (req, res) => {
    if (req.session.user){
     res.json({is_logged: true, user: req.session.user})
    } else {
     res.json({is_logged: false})
    }
 })

app.get('/googleexists', (req, res) => {
    if (req.session.user){
        database.getUser({id: req.session.user.id}).then(response=>{
            if (response){
                res.json({
                    exists: true,
                    nickname: response.nickname,
                    score: response.score,
                    google_id: req.session.user.id
                })
            } else {
                res.json({
                    exists: false,
                    name: req.session.user.name
                })
            }
        })
    }
 })

app.post('/createaccount', (req, res) => {
    if (req.session.user){
        database.checkUsername({nickname: req.body.username}).then(response=>{
            console.log("response /createaccount", response)
            if (response){
                res.json({already_exists: true})
            } else {
                const user = {
                    google_id: req.session.user.id,
                    name: req.session.user.name,
                    nickname: req.body.username,
                    email: req.session.user.email
                }
                database.addUser({user: user}).then(()=>{
                    res.json({already_exists: false})
                }).catch(err => {
                    console.log(err)
                    res.status(500).json({error: 'Impossible de créer le compte.'})
                })
            }
        })
    }
 })

 app.get('/topten', (req, res) => {
    database.getBestScores({limit: 10}).then(response=>{
        const topten = {}
        response.map(e=>{ topten[e.nickname] = e.score})
        res.json({topten: topten})
    })
 })
 
app.post('/tokensignin', async (req, res) => {
    const token = req.body.idToken
    try{
        const payload = await verifyToken(token)
        req.session.user = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            imageUrl: payload.picture
        }
        console.log(payload.name, "s'est connecté.")
        res.send(req.session.user)
    } catch (err){
        console.log(err)
        res.status(400).send('Token Invalide')
    }
})
 
app.post('/signout', async (req, res) => {
    if (req.session.user){
        const name = req.session.user.name
        req.session.destroy(err=> {
            if (err){
                res.status(500).json({error: 'Déconnexion impossible.'})
            } else {
                console.log(name, "s'est déconnecté.")
                res.json({message: 'Déconnexion OK.'})
            }
        })
    }
})

/////////////////////////////////// FUNCTIONS ///////////////////////////////////
const showInfos = () => {
    console.log("*".repeat(10), "[server.js] showInfos", "*".repeat(10))
    console.log("Players ids :", players_ids)
    console.log("Sockets length :", Object.keys(sockets).length)
    console.log("*".repeat(50))
}

const sendToSinglePlayer = (id, header, data) => {
    if (sockets[id])
        sockets[id].emit(header, data)
}

const sendToPlayers = (room, header, data) => {
    io.to(room).emit(header, data)
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
io.on('connection', socket => {
    console.log(`Connexion entrante ${socket.id}`)
    sockets[socket.id] = socket
    showInfos()

    socket.on('disconnect', () => {
        console.log(`Déconnexion de l'id ${socket.id}`)
        if (players_ids[socket.id]){
            const map_name = players_ids[socket.id]
            maps[map_name].postMessage({header: "disconnection", id: socket.id})
            delete players_ids[socket.id]
            socket.leave(map_name)
            delete sockets[socket.id]
            sendPlayersCount(sockets)
        } else if (sockets[socket.id]){
            delete sockets[socket.id]
        }
        showInfos()
    })
    socket.on("get_players_count", () => {
        sendPlayersCount({[socket.id]: socket})
    })
    socket.on("join_server", data => {
        const players_in_room = Object.values(players_ids).filter(e=>e==data.server).length
        if (players_in_room < max_room_players){
            players_ids[socket.id] = data.server
            socket.join(data.server)
            maps[data.server].postMessage({
                header: "connection", 
                id: socket.id,
                google_id: data.google_id,
                color: data.color,
                username: data.username
            })
            sendPlayersCount(sockets)
        } else {
            socket.emit("server_full")
        }
        showInfos()
    })
    socket.on("joy_coords", coords => {
        const server_map = players_ids[socket.id]
        maps[server_map].postMessage({
            header: "joy_coords",
            id: socket.id,
            coords: coords
        })
    })
    socket.on("key", key => {
        const server_map = players_ids[socket.id]
        maps[server_map].postMessage({
            header: "key",
            id: socket.id,
            key: key
        })
    })
})

process.on("SIGINT", () => {
    server.close(()=>{
        console.log("Serveur déconnecté.")
        process.exit()
    })
})