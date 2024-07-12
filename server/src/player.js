const { getOppositeFlag } = require('./server_misc_functions.js')

class Player{
    constructor(username){
        this.username = username
        this.spawn_position = {x: 0, y: 0, z: 0}
        this.spawn_angle = 0
        this.position = {x: 0, y: 0, z: 0}
        this.angle = 0
        this.life = 100
        this.max_life = 100
        this.points = 0
        this.frags = 0
        this.deaths = 0
        this.base_damage = 10
        this.damage = 10
        this.velocity = .003
        this.velocity_max = .06
        this.is_alive = true
        this.bonus = {
            speedup: 0,
            health: 0,
            damage: 0
        }
        this.flags = {
            opponent_flag:{
                is_taken: false,
                color: null
            },
            my_flag:{
                is_taken: false,
                color: null
            }
        }
    }
    initData(data){
        this.spawn_position = data.position
        this.position = data.position
        this.spawn_angle = data.angle
        this.angle = data.angle
        this.flags.my_flag.color = data.flag_color
        this.flags.opponent_flag.color = getOppositeFlag(data.flag_color)
    }
    updateCoords(coords){
        this.position = coords.position
        this.angle = coords.angle
    }
    respawn(){
        this.life = 100
        this.position = Object.assign({}, this.spawn_position)
        this.angle = Object.assign({}, this.spawn_angle)
        this.bonus = {
            speedup: 0,
            health: 0,
            damage: 0
        }
        this.is_alive = true
        this.flags.opponent_flag.is_taken = false
    }
}

module.exports = Player