const { parentPort } = require('node:worker_threads')
const Player = require('./player.js')
const fs = require('fs')
const ShortUniqueId = require('short-unique-id')
const { get3dDistance } = require('./server_misc_functions.js')

let room = null

class Room{
    constructor(players_data){
        this.map_name = null
        this.map_data = {}
        this.players = {}
        this.players_id = []
        this.initGame(players_data)
        this.tick = Date.now()
        this.start_counter = 3
        this.game_variables = {
            explosion_distance: 150,
            add_object_delay: 5000,
            respawn_time: 3000,
            win_goals: 5,
            timer_endgame: 5000,
            burn_damage: 1,
            electric_damage: 2
        }
        this.bonus = {
            speedup: {
                speed: .012, 
                max_speed: .21,
                delay: 10000,
                after:{
                    speed: .005,
                    max_speed: .08
                }
            },
            life: 50,
            damage: {
                value: 25,
                delay: 10000
            }
        }
    }

    toMainThread(data){
        parentPort.postMessage(data)
    }

    //////////////////////// BEFORE GAME ////////////////////////
    notifyGameFound(){
        this.toMainThread({
            header: "game_found", 
            ids: this.players_id,
        })
        setTimeout(()=>this.loadScene(), 2000)
    }

    initGame(players_data){
        // GET MAP and PLAYERS //
        for (const key in players_data){
            const data = players_data[key]
            if (!this.map_name) this.map_name = data.map
            const player = new Player(data.username)
            this.players[data.socket_id] = player
            this.players_id.push(data.socket_id)
        }

        this.map_data = JSON.parse(fs.readFileSync(
            "./server/data/maps_data.json",
            "utf-8"
        ))

        let index = 0
        for (const key in this.players){
            let data = null
            data = index == 0 ?
                this.map_data[this.map_name].spawns.first :
                this.map_data[this.map_name].spawns.second
            this.players[key].initData(data)
            index++
        }

        this.initMapObjects()        
        this.notifyGameFound()
        //this.showPlayers()
    }

    initMapObjects(){
        this.map_objects = this.map_data[this.map_name].objects
        this.map_objects.forEach(object=>{
            const uid = new ShortUniqueId({length: 10})
            object.id = uid.rnd()
        })
    }

    loadScene(){
        const players_data = {}
        for (const key in this.players){
            const player = this.players[key]
            players_data[key] = {}
            players_data[key].username = player.username
            players_data[key].position = player.position
            players_data[key].angle = player.angle
            players_data[key].flag_color = player.flags.my_flag.color
        }
        this.toMainThread({
            header: "load_scene", 
            ids: this.players_id,
            map_name: this.map_name,
            map_objects: this.map_objects,
            players_data: players_data
        })
        setTimeout(()=>
            this.startCounter(),
            2000
        )
    }

    startCounter(){
        if (this.start_counter > -1){
            this.toMainThread({
                header: "start_counter", 
                start_counter: this.start_counter, 
                ids: this.players_id
            })
            this.start_counter--
            setTimeout(()=>
                this.startCounter(),
                1000
            )
        } else {
            this.toMainThread({
                header: "game_start", 
                ids: this.players_id
            })
        }
    }

    //////////////////////// EVENTS HANDLERS ////////////////////////
    handleCoords(socket_id, coords){
        this.players[socket_id].updateCoords(coords)
        this.toMainThread({
            header: "coords",
            ids: this.players_id,
            socket_id: socket_id,
            coords: coords
        })
    }

    handleDamages(type, damage_type, key, shooter_id=null){
        switch(type){
            case "life":
                setTimeout(() => {
                    this.toMainThread({
                        header: "life",
                        is_damage: true,
                        ids: this.players_id,
                        socket_id: key,
                        life: this.players[key].life,
                        damage_type: damage_type
                    })
                }, 10)
            break
            case "is_dead":
                this.toMainThread({
                    header: "is_dead",
                    ids: this.players_id,
                    socket_id: key,
                    by_player: shooter_id ? true : false
                })
                this.players[key].deaths++
                if (shooter_id)
                    this.players[shooter_id].frags++
                this.sendScores()
                setTimeout(()=>
                    this.respawnPlayer(key), 
                    this.game_variables.respawn_time
                )
            break
        }
    }

    sendScores(){
        const scores = this.getScores()
        setTimeout(() => {
            this.toMainThread({
                header: "scores",
                ids: this.players_id,
                scores: scores
            })
        }, 10)
    }

    handleShooting(socket_id, target){
        let player_key = null
        for (const key of this.players_id){
            if (key != socket_id){
                player_key = key
                this.toMainThread({
                    header: "is_shooting",
                    ids: [player_key]
                })
            }
        }
        switch(target.type){
            case "ship":
                if (player_key && this.players[player_key].is_alive){
                    const player = this.players[player_key],
                          opponent = this.players[socket_id]
                    player.life -= opponent.damage
                    if (player.life <= 0){
                        player.is_alive = false
                        this.handleDamages("is_dead", "shoot", player_key, socket_id)
                    } else {
                        this.handleDamages("life", "shoot", player_key)
                    }
                }
            break
            case "explosive":
                if (target.id){
                    const object_index = this.map_objects.findIndex(e=>e.id == target.id)
                    if (object_index != -1){
                        const explosive = this.map_objects[object_index]
                        explosive.bullets_count -= 1
                        if (explosive.bullets_count <= 0){
                            this.toMainThread({
                                header: "explode_object",
                                ids: this.players_id,
                                socket_id: socket_id,
                                object_id: explosive.id
                            })
                            for (const key in this.players){
                                const player = this.players[key]
                                const distance = get3dDistance(player.position, explosive.position) / 100
                                if (distance <= this.game_variables.explosion_distance){
                                    // -75 car 80 de dégats MAX pour une explosion moins 5 dégats minimum en fonction de la distance //
                                    const damage_scale = -75 / this.game_variables.explosion_distance // donne environ -0.375
                                    const proportional_damage = damage_scale * distance + 80
                                    player.life -= proportional_damage
                                    if (player.life <= 0){
                                        player.is_alive = false
                                        this.handleDamages("is_dead", "explosion", key)
                                    } else {
                                        this.handleDamages("life", "explosion", key)
                                    }
                                }
                            }
                            this.map_objects.splice(object_index, 1)
                            setTimeout(()=>{
                                this.addNewObject({
                                    name: explosive.name,
                                    position: this.generateNewPosition(),
                                    angle: Math.random() * (Math.PI * 2),
                                    bullets_count: 4
                                })
                            }, this.game_variables.add_object_delay)
                        }
                    }
                }
            break
        }
    }

    addNewObject(object){
        const uid = new ShortUniqueId({length: 10})
        object.id = uid.rnd()
        this.map_objects.push(object)
        this.toMainThread({
            header: "add_object",
            ids: this.players_id,
            object: object
        })
    }

    generateNewPosition(){
        return {
            x:(Math.random() * 700) + 50,
            y:(Math.random() * 700) + 50,
            z:(Math.random() * 220) + 100
        }
    }

    handleCollision(socket_id, object_type, object_id){
        if (object_type){
            const object_index = this.map_objects.findIndex(e=>e.id == object_id)
            const player = this.players[socket_id]
            if (object_type.includes("bonus")){
                if (object_index != -1){
                    switch(object_type){
                        case "bonus_speedup": player.bonus.speedup++; break
                        case "bonus_health": player.bonus.health++; break
                        case "bonus_damage": player.bonus.damage++; break
                    }
                    this.toMainThread({
                        header: "remove_object",
                        ids: this.players_id,
                        object_id: object_id
                    })
                    setTimeout(() => {
                        this.toMainThread({
                            header: "update_bonus",
                            ids: [socket_id],
                            all_bonus: player.bonus
                        })
                    }, 10)
                    setTimeout(()=>{
                        this.addNewObject({
                            name: object_type,
                            position: this.generateNewPosition()
                        })
                    }, this.game_variables.add_object_delay)
                    this.map_objects.splice(object_index, 1)
                }
            } else {
                switch(object_type){
                    case "blue_flag": case "red_flag":
                        if (!player.flags.opponent_flag.is_taken){
                            if (object_type == player.flags.opponent_flag.color){
                                player.flags.opponent_flag.is_taken = true
                                this.toMainThread({
                                    header: "flag_taken",
                                    socket_id: socket_id,
                                    ids: this.players_id,
                                    object_id: object_id
                                })
                            }
                        }
                        if (object_type == player.flags.my_flag.color && 
                            player.flags.opponent_flag.is_taken)
                        {
                            player.points++
                            player.flags.opponent_flag.is_taken = false
                            this.sendScores()
                            setTimeout(() => {
                                this.toMainThread({
                                    header: "flag_goal",
                                    ids: this.players_id,
                                    socket_id: socket_id,
                                })
                                setTimeout(() => {
                                    this.checkWinner(socket_id)
                                }, 10)
                            }, 10)
                        }
                    break
                    case "fire":
                        if (player.is_alive){
                            player.life -= this.game_variables.burn_damage
                            if (player.life <= 0){
                                player.is_alive = false
                                this.handleDamages("is_dead", "burn", socket_id)
                            } else {
                                this.handleDamages("life", "burn", socket_id)
                            }
                        }
                    break
                    case "electric":
                        if (player.is_alive){
                            player.life -= this.game_variables.electric_damage
                            if (player.life <= 0){
                                player.is_alive = false
                                this.handleDamages("is_dead", "electrify", socket_id)
                            } else {
                                this.handleDamages("life", "electrify", socket_id)
                            }
                        }
                    break
                }
            }
        }
    }

    checkWinner(socket_id){
        if (this.players[socket_id].points >= this.game_variables.win_goals){
            this.toMainThread({
                header: "winner",
                ids: this.players_id,
                socket_id: socket_id
            })
            setTimeout(() => {
                this.toMainThread({
                    header: "endgame",
                    ids: this.players_id
                })
            }, this.game_variables.timer_endgame)
        }
    }

    handleBonus(socket_id, type){
        const player = this.players[socket_id]
        if (player.is_alive){
            switch(type){
                case "speedup":
                    player.velocity = this.bonus.speedup.speed
                    player.velocity_max = this.bonus.speedup.max_speed
                    this.toMainThread({
                        header: "new_velocity",
                        ids: [socket_id],
                        is_activated: true,
                        velocity: player.velocity,
                        velocity_max: player.velocity_max
                    })
                    player.bonus.speedup--
                    setTimeout(()=>{
                        player.velocity = this.bonus.speedup.after.speed
                        player.velocity_max = this.bonus.speedup.after.max_speed
                        this.toMainThread({
                            header: "new_velocity",
                            ids: [socket_id],
                            is_activated: false,
                            velocity: player.velocity,
                            velocity_max: player.velocity_max
                        })
                    }, this.bonus.speedup.delay)
                break
                case "health":
                    if (player.life < player.max_life){
                        player.life += this.bonus.life
                        if (player.life > player.max_life)
                            player.life = player.max_life
                        player.bonus.health--
                        setTimeout(() => {
                            this.toMainThread({
                                header: "life",
                                is_damage: false,
                                ids: [socket_id],
                                socket_id: socket_id,
                                life: player.life
                            })
                        }, 10)
                    }
                break
                case "damage":
                    player.damage = this.bonus.damage.value
                    player.bonus.damage--
                    setTimeout(()=>{
                        this.toMainThread({
                            header: "boost_damage",
                            ids: this.players_id,
                            socket_id: socket_id
                        })
                    }, 10)
                    setTimeout(() => {
                        player.damage = player.base_damage
                        this.toMainThread({
                            header: "restore_damage",
                            ids: this.players_id,
                            socket_id: socket_id
                        })
                    }, this.bonus.damage.delay)
                break
            }
            if (player){
                this.toMainThread({
                    header: "update_bonus",
                    ids: [socket_id],
                    all_bonus: player.bonus
                })
            }
        }
    }

    ////////////////////////// GAME FUNCTIONS ////////////////////////////
    respawnPlayer(id_player_dead){
        this.players[id_player_dead].respawn()
        this.toMainThread({
            header: "respawn",
            ids: this.players_id,
            socket_id: id_player_dead,
            life: this.players[id_player_dead].life,
            position: this.players[id_player_dead].spawn_position,
            angle: this.players[id_player_dead].spawn_angle,
            all_bonus: this.players[id_player_dead].bonus
        })
    }

    getScores(){
        const scores = {}
        for (const key in this.players){
            scores[key] = {}
            scores[key].frags = this.players[key].frags
            scores[key].deaths = this.players[key].deaths
            scores[key].points = this.players[key].points
        }
        return scores
    }

    showPlayers(){
        console.log("_______ Players : _______")
        for (const key in this.players){
            const player = this.players[key]
            console.log("Username :", player.username)
            console.log("Position (x/y/z) :",
                player.position.x+
                "/"+
                player.position.y+
                "/"+
                player.position.z
            )
            console.log("Angle :", player.angle)
            console.log()
        }
        console.log("_________________________")
    }
}

parentPort.on('message', data => {
    switch(data.header){
        case "instantiate":
            room = new Room(data.players_data)
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