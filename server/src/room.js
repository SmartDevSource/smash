const { parentPort } = require('node:worker_threads')
const Player = require('./player.js')
const fs = require('fs')
const ShortUniqueId = require('short-unique-id')
const { rndBetween } = require('./server_misc_functions.js')

class Room{
    constructor(map_data){
        this.map_data = map_data
        this.players = {}
    }

    toMainThread(data){
        parentPort.postMessage(data)
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
    }

    removePlayer({id}){
        if (this.players[id])
            delete this.players[id]
        this.showInfos()
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
    }
})