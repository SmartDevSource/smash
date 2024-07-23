const { parentPort } = require('node:worker_threads')
const Player = require('./player.js')
const ShortUniqueId = require('short-unique-id')

class Room{
    constructor(map_data){
        this.map_data = map_data
        this.players = {}
        this.last_delta_time = Date.now()
        this.current_delta_time = 0
        this.interval = setInterval(this.update.bind(this), 1000 / 60)
        this.max_server_score = 1
        this.spawn_timeout = 2000
    }

    toMainThread(data){
        parentPort.postMessage(data)
    }

    update(){
        this.current_delta_time = (Date.now() - this.last_delta_time)
        this.last_delta_time = Date.now()
        for (const id in this.players){
            const player = this.players[id]
            player.update(this.current_delta_time, this.players)
            if (!player.isStopped() && player.is_alive){
                this.toMainThread({
                    ids: this.getIds([]),
                    header: "coords",
                    id: id,
                    position: player.position,
                    angle: player.angle
                })
            }
            if (player.has_collided_by_opponent){
                this.toMainThread({
                    ids: this.getIds([]),
                    header: "collision",
                    by: player.collided_by,
                    force_impact: player.force_impact,
                    angle_impact: player.angle_impact,
                    id: id
                })
                if (player.collided_by)
                    this.players[player.collided_by].has_collided_by_opponent = false
                player.has_collided_by_opponent = false
            }
            if (!player.is_alive && !player.is_waiting_for_respawn){
                player.is_waiting_for_respawn = true
                const opponent_id = player.collided_by
                if (opponent_id && this.players[opponent_id]){
                    this.players[opponent_id].score++
                    this.toMainThread({
                        ids: this.getIds([]),
                        header: "score",
                        score: this.players[opponent_id].score,
                        id: opponent_id
                    })
                } else {
                    if (player.score > 0) player.score--
                    this.toMainThread({
                        ids: this.getIds([]),
                        header: "score",
                        score: player.score,
                        id: id
                    })
                }
                this.toMainThread({
                    ids: this.getIds([]),
                    header: "player_dead",
                    id: id
                })
                setTimeout(() => {
                    player.respawn()
                    this.toMainThread({
                        ids: this.getIds([]),
                        header: "player_respawn",
                        id: id,
                        position: player.position,
                        angle: player.angle
                    })
                }, this.spawn_timeout)
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
                map_data: {...this.map_data}
            })

        this.toMainThread({
            ids: [id],
            header: "init_game",
            max_server_score: this.max_server_score,
            map_data: this.map_data,
            players_data: players_data,
            username: username,
            score: 0,
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
            this.players[id].functions_worker.terminate()
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