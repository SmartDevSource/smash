const { parentPort } = require('node:worker_threads')
const Player = require('./player.js')
const fs = require('fs')
const ShortUniqueId = require('short-unique-id')
const { rndBetween } = require('./server_misc_functions.js')

class Room{
    constructor(){
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

    addPlayer({id, username}){
        if (!this.players[id]){
            const position = {
                x: rndBetween(20, 70),
                y: rndBetween(20, 70)
            }
            this.players[id] = new Player(username, position)
        }
        this.showInfos()
    }

    removePlayer({id}){
        if (this.players[id]){
            delete this.players[id]
        }
        this.showInfos()
    }
}

let room = null

parentPort.on('message', data => {
    switch(data.header){
        case "instantiate":
            room = new Room()
        break
        case "connection":
            room.addPlayer({
                id: data.id,
                username: data.username
            })
        break
        case "disconnection":
            room.removePlayer({
                id: data.id
            })
        break
    }
})