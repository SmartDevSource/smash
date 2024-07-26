const { getDistance, getDistanceToLine, getAngleTo } = require('./server_utils.js')
const { Worker } = require('node:worker_threads')
const path = require('path')
class Player{
    constructor({id, google_id, username, color, map_data}){
        this.id = id
        this.google_id = google_id
        this.username = username
        this.color = color
        this.position = {...map_data.spawn}
        this.spawn_position = {...map_data.spawn}
        this.lines_colliders = [...map_data.colliders]
        this.angle = 0
        this.score = 0

        this.is_waiting_for_respawn = false
        this.is_alive = true

        this.bounce_offset = .30
        this.mass = 1
        this.offset = 25

        this.directions = {horizontal: '', vertical: ''}
        this.velocity = {
            vertical: 0,
            horizontal: 0,
            vertical_max_default: 8,
            horizontal_max_default: 8,
            vertical_max: 8,
            horizontal_max: 8,
            step: .012
        }

        this.collided_by = null
        this.collided_by_timer = 1000
        this.has_collided_by_opponent = false
        this.collide_time_multiplier = 400
        this.collide_offset = 300
        this.collide_distance = 1400
        this.collide_spawn = 4500
        this.line_distance_collider = 30

        this.can_collide_previous = false
        this.can_collide = false

        this.rotation_offset = .1
        this.current_delta_time = Date.now()

        this.functions_worker = new Worker(path.resolve(__dirname, 'workers/functions_worker.js'))
        this.initWorkerListener()
    }

    initWorkerListener(){
        this.functions_worker.on("message", data => {
            switch(data.header){
                case "lines_colliders":
                    if (data.intersect){
                        this.is_alive = false
                    }
                break
            }
        })
    }

    getPlayerData(){
        return {
            id: this.id,
            username: this.username,
            color: this.color,
            position: this.position,
            angle: this.angle,
            score: this.score,
            can_collide: this.can_collide
        }
    }

    update(current_delta_time, players){
        this.current_delta_time = current_delta_time
        this.move()
        this.handleIfCanCollide()
        this.handlePlayersCollisions(players)
        this.handleLinesCollisions()
    }

    respawn(){
        this.position = {...this.spawn_position}
        this.can_collide = false
        this.can_collide_previous = false
        this.angle = 0
        this.is_waiting_for_respawn = false
        this.is_alive = true
    }

    reset(){
        this.position = {...this.spawn_position}
        this.angle = 0
        this.is_waiting_for_respawn = false
        this.is_alive = true
        this.score = 0
        this.directions = {horizontal: '', vertical: ''}
        this.velocity = {
            vertical: 0,
            horizontal: 0,
            vertical_max_default: 6,
            horizontal_max_default: 6,
            vertical_max: 6,
            horizontal_max: 6,
            step: .006
        }
        this.collided_by = null
        this.can_collide = false
        this.can_collide_previous = false
        this.has_collided_by_opponent = false
    }

    handleIfCanCollide(){
        if (!this.can_collide){
            const distance = getDistance(this.position, this.spawn_position)
            if (distance >= this.collide_spawn){
                this.can_collide = true
            }
        }
    }

    handleLinesCollisions(){
        if (this.is_alive){
            this.functions_worker.postMessage({
                header: "lines_colliders",
                lines_colliders: this.lines_colliders,
                position: this.position,
                offset: this.offset,
                line_distance_collider: this.line_distance_collider
            })
        }
    }

    handlePlayersCollisions(players){
        for (const id in players){
            const ship = players[id]
            if (id == this.id || !ship.is_alive) continue
            if (!this.can_collide || !ship.can_collide) continue
            const distance = getDistance(ship.position, this.position)
            if (distance >= this.collide_distance - this.collide_offset && distance <= this.collide_distance){
                switch(true){
                    case ship.velocity.horizontal > 0:
                        ship.velocity.horizontal = -ship.velocity.horizontal - this.bounce_offset
                        this.velocity.horizontal -= ship.velocity.horizontal / this.mass
                    break
                    case ship.velocity.horizontal < 0:
                        ship.velocity.horizontal = Math.abs(ship.velocity.horizontal) + this.bounce_offset
                        this.velocity.horizontal -= ship.velocity.horizontal / this.mass
                    break
                }
                switch(true){
                    case ship.velocity.vertical > 0:
                        ship.velocity.vertical = -ship.velocity.vertical - this.bounce_offset
                        this.velocity.vertical -= ship.velocity.vertical / this.mass
                    break
                    case ship.velocity.vertical < 0:
                        ship.velocity.vertical = Math.abs(ship.velocity.vertical) + this.bounce_offset
                        this.velocity.vertical -= ship.velocity.vertical / this.mass
                    break
                }
                this.collided_by = ship.id
                this.has_collided_by_opponent = true
                setTimeout(() => {
                    this.collided_by = null
                }, this.collided_by_timer)
            }
        }
    }

    handleJoystickDirection(coords){
        if (this.is_alive){
            this.velocity.horizontal_max = Math.abs(coords.x) + 1
            this.velocity.vertical_max = Math.abs(coords.y) + 1
            switch(true){
                case coords.x < 0:
                    this.directions.horizontal = 'l'
                break
                case coords.x > 0:
                    this.directions.horizontal = 'r'
                break
            }
            switch(true){
                case coords.y < 0:
                    this.directions.vertical = 'u'
                break
                case coords.y > 0:
                    this.directions.vertical = 'd'
                break
            }
        }
    }

    handleKeyDirection(key){
        if (this.is_alive){
            switch(key){
                case 'l':
                    this.directions.horizontal = key
                    if (this.velocity.vertical == 0)
                        this.velocity.vertical = -this.rotation_offset
                break
                case 'r':
                    this.directions.horizontal = key
                    if (this.velocity.vertical == 0)
                        this.velocity.vertical = this.rotation_offset
                break
                case 'u':
                    this.directions.vertical = key
                    if (this.velocity.horizontal == 0)
                        this.velocity.horizontal = -this.rotation_offset
                break
                case 'd':
                    this.directions.vertical = key
                    if (this.velocity.horizontal == 0)
                        this.velocity.horizontal = this.rotation_offset
                break
            }
        }
    }

    isStopped(){
        return this.velocity.horizontal == 0 && this.velocity.vertical == 0
    }

    move(){
        switch(this.directions.horizontal){
            case 'l':
                if (this.velocity.horizontal > -this.velocity.horizontal_max)
                    this.velocity.horizontal -= this.velocity.step * this.current_delta_time
                if (this.velocity.horizontal < -this.velocity.horizontal_max)
                    this.velocity.horizontal = -this.velocity.horizontal_max
            break
            case 'r':
                if (this.velocity.horizontal < this.velocity.horizontal_max)
                    this.velocity.horizontal += this.velocity.step * this.current_delta_time
                if (this.velocity.horizontal > this.velocity.horizontal_max)
                    this.velocity.horizontal = this.velocity.horizontal_max
            break
            default:
                if (this.velocity.horizontal < 0){
                    this.velocity.horizontal += this.velocity.step * this.current_delta_time
                    if (this.velocity.horizontal > 0){
                        this.velocity.horizontal = 0
                    }
                }
                if (this.velocity.horizontal > 0){
                    this.velocity.horizontal -= this.velocity.step * this.current_delta_time
                    if (this.velocity.horizontal < 0){
                        this.velocity.horizontal = 0
                    }
                }
            break
        }

        switch(this.directions.vertical){
            case 'u':
                if (this.velocity.vertical > -this.velocity.vertical_max)
                    this.velocity.vertical -= this.velocity.step * this.current_delta_time
                if (this.velocity.vertical < -this.velocity.vertical_max)
                    this.velocity.vertical = -this.velocity.vertical_max
            break
            case 'd':
                if (this.velocity.vertical < this.velocity.vertical_max)
                    this.velocity.vertical += this.velocity.step * this.current_delta_time
                if (this.velocity.vertical > this.velocity.vertical_max)
                    this.velocity.vertical = this.velocity.vertical_max
            break
            default:
                if (this.velocity.vertical < 0){
                    this.velocity.vertical += this.velocity.step * this.current_delta_time
                    if (this.velocity.vertical > 0){
                        this.velocity.vertical = 0
                    }
                }
                if (this.velocity.vertical > 0){
                    this.velocity.vertical -= this.velocity.step * this.current_delta_time
                    if (this.velocity.vertical < 0){
                        this.velocity.vertical = 0
                    }
                }
            break
        }

        this.position.x += this.velocity.horizontal
        this.position.y += this.velocity.vertical

        if (this.velocity.horizontal !== 0 && this.velocity.vertical !== 0)
            if (!this.collided_by)
                this.angle = Math.atan2(-this.velocity.vertical, -this.velocity.horizontal)

        this.directions.horizontal = ''
        this.directions.vertical = ''
        this.velocity.horizontal_max = this.velocity.horizontal_max_default
        this.velocity.vertical_max = this.velocity.vertical_max_default
    }
}

module.exports = Player