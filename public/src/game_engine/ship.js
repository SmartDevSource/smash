export class Ship {
    constructor({ctx, screen, id, username, position, angle, color, score, max_server_score, audios, images}){
        this.ctx = ctx
        this.screen = screen
        this.half_screen = {x: screen.w / 2, y: screen.h / 2}
        this.id = id
        this.username = username
        this.position = position
        this.angle = angle
        this.color = color
        this.score = score
        this.audios = audios
        this.images = images

        this.glow = {
            sprite: this.images[this.color],
            scale: 100,
            offset: -25
        }

        this.explosion = {
            state: false,
            audio: this.audios.explosion,
            sprite: this.images.explosion,
            frames_count: 15,
            frame_width: 0,
            current_frame: 0,
            timer: 0,
            speed_frame: 40,
            offset: 40,
            scale: 120
        }
        this.explosion.frame_width = this.explosion.sprite.width / this.explosion.frames_count

        this.impact = {
            state: false,
            audio: this.audios.hit,
            sprite: this.images.impact,
            frames_count: 7,
            frame_width: 0,
            force_impact: 0,
            angle_impact: 0,
            current_frame: 0,
            timer: 0,
            speed_frame: 40,
            offset: 40,
            scale: 130
        }
        this.impact.frame_width = this.impact.sprite.width / this.impact.frames_count

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
        this.explosion.audio.currentTime = 0
        this.explosion.audio.play()
        this.explosion.state = true
        this.is_dead = true
    }

    respawn({position, angle}){
        this.explosion.state = false
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
            const username_width = this.ctx.measureText(this.username).width
            this.ctx.strokeText(
                this.username,
                (this.position.x + this.offset) - (username_width / 2),
                this.position.y - 10
            )
            this.ctx.fillStyle = "white"
            this.ctx.fillText(
                this.username,
                (this.position.x + this.offset) - (username_width / 2),
                this.position.y - 10
            )
            this.ctx.restore()

            // SCORE //
            this.ctx.save()
            this.ctx.font = "20px quicksand"
            this.ctx.strokeStyle = "black"
            this.ctx.lineWidth = 3
            const score = `[${this.score}/${this.max_server_score}]`
            const score_width = this.ctx.measureText(score).width
            this.ctx.strokeText(
                `[${this.score}/${this.max_server_score}]`,
                (this.position.x + this.offset) - (score_width / 2),
                this.position.y + 80
            )
            this.ctx.fillStyle = this.getScoreColor()
            this.ctx.fillText(
                `[${this.score}/${this.max_server_score}]`,
                (this.position.x + this.offset) - (score_width / 2),
                this.position.y + 80
            )
            this.ctx.restore()
        }
    }

    takeImpact({force_impact, angle_impact}){
        this.impact.audio.play()
        this.impact.state = true
        this.impact.force_impact = force_impact
        this.impact.angle_impact = angle_impact
        this.impact.current_frame = 0
        this.impact.timer = 0
    }

    drawShip(current_delta_time){
        if (!this.is_dead){
            // GLOW //
            this.ctx.drawImage(
                this.glow.sprite,
                0,
                0,
                this.glow.sprite.width,
                this.glow.sprite.height,
                this.position.x + this.glow.offset,
                this.position.y + this.glow.offset,
                this.glow.scale,
                this.glow.scale
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
        } else if (this.explosion.state){
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
                    this.explosion.state = false
                }
            }
            this.explosion.timer += 1 * current_delta_time
        }

        if (this.impact.state){
            this.ctx.save()
            this.ctx.drawImage(
                this.impact.sprite,
                this.impact.current_frame * this.impact.sprite.width / this.impact.frames_count,
                0,
                this.impact.sprite.width / this.impact.frames_count,
                this.impact.sprite.height,
                this.position.x - this.impact.offset,
                this.position.y - this.impact.offset,
                this.impact.scale,
                this.impact.scale
            )
            this.ctx.restore()
            if (this.impact.timer > this.impact.speed_frame){
                this.impact.timer = 0
                this.impact.current_frame++
                if (this.impact.current_frame > this.impact.max_frames){
                    this.impact.state = false
                }
            }
            this.impact.timer += 1 * current_delta_time
        }
    }   
}