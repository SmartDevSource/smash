import { getAngleTo, getDistance, getDistanceTo } from "../misc_functions.js"

export class Ship {
    constructor({ctx, screen, id, username, position, angle, color, score, max_server_score, images}){
        this.ctx = ctx
        this.screen = screen
        this.half_screen = {x: screen.w / 2, y: screen.h / 2}
        this.id = id
        this.username = username
        this.position = position
        this.angle = angle
        this.color = color
        this.score = score
        this.images = images

        this.is_exploding = false
        this.explosion = {
            sprite: this.images.explosion,
            frames_count: 15,
            frame_width: 0,
            current_frame: 0,
            timer: 0,
            speed_frame: 60,
            offset: 40,
            scale: 120
        }
        this.explosion.frame_width = this.explosion.sprite.width / this.explosion.frames_count

        this.is_dead = false

        this.max_server_score = max_server_score
        this.offset = 25
    }

    setCoords({position, angle}){
        this.position = position
        this.angle = angle
    }

    getScoreColor(){
        switch(true){
            case this.score >= 0 && this.score < 3: return "#FF474D"
            case this.score >= 3 && this.score < 6: return "orange"
            case this.score >= 6 && this.score < 8: return "yellow"
            case this.score >= 8: return "lime"
        }
    }

    kill(){
        this.is_exploding = true
        this.is_dead = true
    }

    respawn({position, angle}){
        this.is_exploding = false
        this.explosion.current_frame = 0
        this.explosion.timer = 0
        this.is_dead = false
        this.position = position
        this.angle = angle
    }

    drawInfos(){
        if (!this.is_dead){
            // USERNAME //
            this.ctx.save()
            this.ctx.font = "30px quicksand"
            this.ctx.strokeStyle = "black"
            this.ctx.lineWidth = 4
            this.ctx.strokeText(
                this.username,
                this.position.x - ((this.username.length - 3) * 6),
                this.position.y - 10
            )
            this.ctx.fillStyle = "white"
            this.ctx.fillText(
                this.username,
                this.position.x - ((this.username.length - 3) * 6),
                this.position.y - 10
            )
            this.ctx.restore()

            // SCORE //
            this.ctx.save()
            this.ctx.font = "20px quicksand"
            this.ctx.strokeStyle = "black"
            this.ctx.lineWidth = 3
            this.ctx.strokeText(
                `[${this.score}/${this.max_server_score}]`,
                this.position.x - 5,
                this.position.y + 80
            )
            this.ctx.fillStyle = this.getScoreColor()
            this.ctx.fillText(
                `[${this.score}/${this.max_server_score}]`,
                this.position.x - 5,
                this.position.y + 80
            )
            this.ctx.restore()
        }
    }

    drawShip(current_delta_time){
        if (!this.is_dead){
            // GLOW //
            this.ctx.drawImage(
                this.images[this.color],
                0,
                0,
                this.images[this.color].width,
                this.images[this.color].height,
                this.position.x - this.offset / 2,
                this.position.y - this.offset / 2,
                this.offset * 3,
                this.offset * 3
            )
            // SHIP //
            this.ctx.save()
            this.ctx.translate(this.position.x + this.offset, this.position.y + this.offset)
            this.ctx.rotate(this.angle - Math.PI / 2)
            this.ctx.drawImage(
                this.images.ship,
                0,
                0,
                this.images.ship.width,
                this.images.ship.height,
                -this.offset,
                -this.offset,
                50,
                50
            )
            this.ctx.restore()
        } else if (this.is_exploding){
            console.log(this.is_exploding)
            this.ctx.save()
            this.ctx.drawImage(
                this.explosion.sprite,
                this.explosion.current_frame * this.explosion.sprite.width / this.explosion.frames_count,
                0,
                this.explosion.sprite.width / this.explosion.frames_count,
                this.explosion.sprite.height,
                this.position.x - this.explosion.offset,
                this.position.y - this.explosion.offset,
                this.explosion.scale,
                this.explosion.scale
            )
            this.ctx.restore()
            if (this.explosion.timer > this.explosion.speed_frame){
                this.explosion.timer = 0
                this.explosion.current_frame++
                if (this.explosion.current_frame > this.explosion.max_frames){
                    this.is_exploding = false
                }
            }
            this.explosion.timer += 1 * current_delta_time
        }
    }   
}