const { parentPort } = require('node:worker_threads')
const Player = require('./player.js')

class Room{
    constructor(map_data){
        this.map_data = map_data
        this.players = {}
        this.last_delta_time = Date.now()
        this.current_delta_time = 0
        this.interval = setInterval(this.update.bind(this), 1000 / 60)
        this.max_server_score = 10
        this.spawn_timeout = 2000
        this.is_game_started = true
        this.timer_before_restart = 4000
    }

    toMainThread(data){
        parentPort.postMessage(data)
    }

    update(){
        if (this.is_game_started){
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
                if (player.can_collide_previous != player.can_collide){
                    this.toMainThread({
                        ids: this.getIds([]),
                        header: "can_collide",
                        can_collide: player.can_collide,
                        id: id
                    })
                    player.can_collide_previous = player.can_collide
                }
                if (player.has_collided_by_opponent && player.is_touchable){
                    this.toMainThread({
                        ids: this.getIds([]),
                        header: "collision",
                        by: player.collided_by,
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
                        if (this.players[opponent_id].score == this.max_server_score){
                            this.endGame({
                                winner_id: opponent_id,
                                google_id: this.players[opponent_id].google_id
                            })
                        }
                        this.toMainThread({
                            ids: this.getIds([]),
                            header: "score",
                            score: this.players[opponent_id].score,
                            id: opponent_id
                        })
                    }// else {
                    //     if (player.score > 0) player.score--
                    //     this.toMainThread({
                    //         ids: this.getIds([]),
                    //         header: "score",
                    //         score: player.score,
                    //         id: id
                    //     })
                    // }
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
                            angle: player.angle,
                            can_collide: player.can_collide
                        })
                    }, this.spawn_timeout)
                }
            }
        }
    }

    restartGame(){
        const players_data = {}
        for (const id in this.players){
            this.players[id].reset()
            players_data[id] = this.players[id].getPlayerData()
        }
        this.toMainThread({
            ids: this.getIds([]),
            header: "restart_game",
            players_data: players_data
        })
        setTimeout(() => this.is_game_started = true, 1000)
    }

    endGame({winner_id, google_id}){
        this.toMainThread({
            ids: this.getIds([]),
            header: "end_game",
            winner_id: winner_id,
            google_id: google_id
        })
        this.is_game_started = false
        setTimeout(() => {
            this.startCounter()
        }, this.timer_before_restart)
    }

    startCounter(){
        let counter = 3
        for(let i = 0 ; i <=3 ; i++){
            setTimeout(()=> {
                if (counter > 0){
                    this.toMainThread({
                        ids: this.getIds([]),
                        header: "start_counter",
                        counter: counter
                    })
                }
                if (counter <= 0) this.restartGame()
                counter--
            }, i*1000)
        }
    }

    showInfos(){
        console.log("*".repeat(10), "[room.js] showInfos", "*".repeat(10))
        console.log("Joueurs dans la room : ", this.players)
        console.log("*".repeat(50))
    }

    addPlayer({id, google_id, username, color}){
        const players_data = {}
        for (const id in this.players)
            players_data[id] = this.players[id].getPlayerData()

        if (!this.players[id])
            this.players[id] = new Player({
                id: id,
                google_id: google_id,
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
            score: this.players[id].score,
            angle: this.players[id].angle,
            color: color,
            id: id
        })

        this.toMainThread({
            ids: this.getIds({excepted: [id]}),
            header: "new_player",
            player_data: this.players[id].getPlayerData()
        })
        // this.showInfos()
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
        // this.showInfos()
    }

    handleJoystickCoords({id, coords}){
        if (this.is_game_started)
            this.players[id].handleJoystickDirection(coords)
    }

    handleKeyPress({id, key}){
        if (this.is_game_started)
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
                google_id: data.google_id,
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