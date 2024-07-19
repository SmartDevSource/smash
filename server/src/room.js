const { parentPort } = require('node:worker_threads')
const Player = require('./player.js')
const fs = require('fs')
const ShortUniqueId = require('short-unique-id')
const { get3dDistance } = require('./server_misc_functions.js')

class Room{
    constructor(){
        this.players = {}
    }

    toMainThread(data){
        parentPort.postMessage(data)
    }
}

let room = null

parentPort.on('message', data => {
    switch(data.header){
        case "instantiate":
            room = new Room()
        break
        case "coords":
            room.handleCoords(data.socket_id, data.coords)
        break
        case "is_shooting":
            room.handleShooting(data.socket_id, data.target)
        break
        case "collision":
            room.handleCollision(data.socket_id, data.object.object_type, data.object.object_id)
        break
        case "use_bonus":
            room.handleBonus(data.socket_id, data.type)
        break
    }
})