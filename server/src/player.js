const { getDistance, getDistanceToLine } = require('./server_misc_functions.js')

class Player{
    constructor({id, username, color, map_data}){
        this.id = id
        this.username = username
        this.color = color
        this.position = {...map_data.spawn}
        this.spawn_position = {...map_data.spawn}
        this.lines_colliders = [...map_data.colliders]
        this.angle = 0
        this.score = 0

        this.is_waiting_for_respawn = false
        this.is_alive = true

        this.bounce_offset = .15
        this.mass = 1
        this.offset = 25

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
        this.collide_time_multiplier = 400
        this.collide_distance = 1400
        this.collide_repulsion = 1000
        this.line_distance_collider = 30
        this.can_collide = true

        this.rotation_offset = .1
        this.current_delta_time = Date.now()
    }

    getPlayerData(){
        return {
            id: this.id,
            username: this.username,
            color: this.color,
            position: this.position,
            angle: this.angle,
            score: this.score
        }
    }

    update(current_delta_time, players){
        this.current_delta_time = current_delta_time
        this.move()
        this.handlePlayersCollisions(players)
        this.handleLinesCollisions()
    }

    respawn(){
        this.position = {...this.spawn_position}
        this.angle = 0
        this.is_waiting_for_respawn = false
        this.is_alive = true
    }

    handleLinesCollisions(){
        if (this.is_alive){
            for (const line of this.lines_colliders){
                const line_coords = getDistanceToLine({
                    first_point: line.points.a,
                    second_point: line.points.b,
                    vector: {
                        x: this.position.x + (this.offset / 2),
                        y: this.position.y + (this.offset / 2),
                    }
                })
                if (line_coords.distance && line_coords.distance < this.line_distance_collider){
                    this.is_alive = false
                }
            }
        }
    }

    handlePlayersCollisions(players){
        for (const id in players){
            const ship = players[id]
            if (id == this.id || !ship.is_alive) continue
            const distance = getDistance(ship.position, this.position)
            if (distance > this.collide_repulsion && distance <= this.collide_distance && this.can_collide){
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
                const force_impact = Math.abs((ship.velocity.horizontal + ship.velocity.vertical) / 2)
                setTimeout(() => {
                    this.collided_by = null
                }, Math.floor(this.collide_time_multiplier * force_impact))

            } else if (distance <= this.collide_repulsion){
                this.can_collide = false
                setTimeout(() => this.can_collide = true, 300)
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