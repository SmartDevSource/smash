class Player{
    constructor({id, username, color, position, angle}){
        this.id = id
        this.username = username
        this.color = color
        this.position = position
        this.angle = angle
        this.score = 0

        this.collide_distance = 1200
        this.bounce_offset = .15
        this.mass = 1

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

    update(current_delta_time, opponents){
        this.current_delta_time = current_delta_time
        this.move()
        this.handleColliding(opponents)
    }

    handleColliding(opponents){
        
    }

    handleJoystickDirection(coords){
        this.velocity.horizontal_max = Math.abs(coords.x)
        this.velocity.vertical_max = Math.abs(coords.y)

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

    handleKeyDirection(key){
        switch(key){
            case 'l': case 'r': this.directions.horizontal = key; break
            case 'u': case 'd': this.directions.vertical = key; break
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

        if (this.velocity.horizontal != 0 && this.velocity.vertical != 0)
            this.angle = Math.atan2(-this.velocity.vertical, -this.velocity.horizontal)

        this.directions.horizontal = ''
        this.directions.vertical = ''
        this.velocity.horizontal_max = this.velocity.horizontal_max_default
        this.velocity.vertical_max = this.velocity.vertical_max_default
    }
}

module.exports = Player