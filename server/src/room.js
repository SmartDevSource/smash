const { parentPort } = require('node:worker_threads')
const Player = require('./player.js')
const fs = require('fs')
const ShortUniqueId = require('short-unique-id')
const { rndBetween } = require('./server_misc_functions.js')

class Room{
    constructor(map_data){
        this.map_data = map_data
        this.players = {}
        this.interval = setInterval(this.update.bind(this), 1000 / 60)
    }

    toMainThread(data){
        parentPort.postMessage(data)
    }

    update(){
        for (const id in this.players){
            const player = this.players[id]
            player.update()
            if (!player.isStopped()){
                
            }
        }
    }

    showInfos(){
        console.log("*".repeat(10), "[room.js] showInfos", "*".repeat(10))
        console.log("Joueurs dans la room : ", this.players)
        console.log("*".repeat(50))
    }

    addPlayer({id, username, color}){
        const players_data = {}
        for (const id in this.players)
            players_data[id] = this.players[id].getPlayerData()

        if (!this.players[id])
            this.players[id] = new Player({
                id: id, 
                username: username, 
                color: color, 
                position: {...this.map_data.spawn}, 
                angle: 0
            })

        this.toMainThread({
            ids: [id],
            header: "init_game",
            map_data: this.map_data,
            players_data: players_data,
            angle: 0,
            color: color,
            id: id
        })

        this.toMainThread({
            ids: this.getIds({excepted: [id]}),
            header: "new_player",
            player_data: this.players[id].getPlayerData()
        })
    }

    removePlayer({id}){
        if (this.players[id]){
            delete this.players[id]
            this.toMainThread({
                ids: this.getIds({excepted: [id]}),
                header: "del_player",
                id: id
            })
        }
        this.showInfos()
    }

    handleJoystickCoords({id, coords}){
        this.players[id].handleJoystickDirection(coords)
    }

    handleKeyPress({id, key}){
        this.players[id].handleKeyDirection(key)
    }

    getIds({excepted=[]}){
        const ids = []
        for (const id in this.players)
            if (!excepted.includes(id))
                ids.push(id)
        return ids
    }
}

let room = null

parentPort.on('message', data => {
    switch(data.header){
        case "instantiate":
            room = new Room(data.map_data)
        break
        case "connection":
            room.addPlayer({
                id: data.id,
                username: data.username,
                color: data.color
            })
        break
        case "disconnection":
            room.removePlayer({
                id: data.id
            })
        break
        case "joy_coords":
            room.handleJoystickCoords({
                id: data.id,
                coords: data.coords
            })
        break
        case "key":
            room.handleKeyPress({
                id: data.id,
                key: data.key
            })
        break
    }
})