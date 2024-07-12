import { drawPoint, drawLine, screenLog, loadImage, isIOS } from "./misc_functions.js"

export class Game{
    constructor(is_mobile, ctx, screen, images, audios, map_data, player_data, opponent_data, socket){
        this.is_mobile = is_mobile
        this.ctx = ctx
        this.screen = screen
        this.socket = socket
        this.map_data = map_data

        this.last_delta_time = Date.now()
        this.current_delta_time = 0
        this.target = {type: null, index: 0, id: null}

        this.position = [...player_data.position]
        this.angle = player_data.angle
        this.username = player_data.username
    
        this.opponent_data = {
            username: opponent_data.username,
            position: opponent_data.position
        }

        this.speed_move = .3

        this.multipliers = {
            balance: 30,
            angle: 50,
            z_position: 30
        }

        this.max_bounds = {x: screen.w, y: screen.h}
        this.is_bouncing = false

        this.scale_text = 1.5

        this.sprites = {
            crosshair: images.crosshair,
            ray: images.hud_ray,
            ray_enhanced: images.hud_ray_enhanced,
            life: images.life,
            hud_shoot: images.hud_shoot,
            hud_calibrate: images.hud_calibrate,
            me_captured: images.me_captured,
            opponent_captured: images.opponent_captured
        }

        this.scores = {
            me:{
                points: 0,
                deaths: 0
            },
            opponent:{
                points: 0,
                deaths: 0
            }
        }

        this.sounds = {
            explosion: audios.explosion,
            me_point: audios.me_point,
            opponent_point: audios.opponent_point,
            victory: audios.victory,
            defeat: audios.defeat,
            burn: audios.burn,
            electrify: audios.electrify,
            collision: audios.collision,
        }

        this.counter_sounds = {
            0: audios.go,
            1: audios["1"],
            2: audios["2"],
            3: audios["3"]
        }

        this.center_text = {
            show: true,
            position: {
                x: (screen.w / 2) - 62,
                y: (screen.h / 2) - 30
            },
            text: "Prêt ?",
            color: "red",
            size: 48,
            outline_size: 2
        }

        this.timers_events = {
            "hit_screen":{
                is_active: false,
                switch: true,
                current: 0,
                delay: 200,
                step: 1
            }
        }

        this.mouse = {
            is_down: false,
            has_touched: false,
            coords: {x: 0, y: 0}
        }

        this.calibrate_button = {
            position: {
                x: this.screen.w - 110,
                y: 400
            },
            offset:{
                x: 90,
                y: 115
            }
        }

        this.can_act = false
        this.messages = []
        this.message_delay = 150

        this.end_game = false

        this.initSocketListeners()
        this.initWindowListeners()

        this.info = ""
    }

    clear(){
        for (const key in this.sounds){
            this.sounds[key].pause()
            this.sounds[key].currentTime = 0
        }
        for (const key in this.counter_sounds){
            this.counter_sounds[key].pause()
            this.counter_sounds[key].currentTime = 0
        }
    }

    initWindowListeners(){
        if (this.is_mobile){
            ontouchstart = e => {
                const touch = e.touches[0]
                this.mouse.is_down = true
                this.mouse.has_touched = true
                const x = touch.clientX * this.ctx.canvas.width / this.ctx.canvas.offsetWidth,
                      y = touch.clientY * this.ctx.canvas.height / this.ctx.canvas.offsetHeight
                this.mouse.coords = {x: x, y: y}
            }
            ontouchend = e => {
                this.mouse.is_down = false
            }
        } else {
            onmousedown = e => {
                this.mouse.is_down = true
                this.mouse.has_touched = true
                const x = e.offsetX * this.ctx.canvas.width / this.ctx.canvas.offsetWidth,
                      y = e.offsetY * this.ctx.canvas.height / this.ctx.canvas.offsetHeight
                this.mouse.coords = {x: x, y: y}
            }
            onmouseup = e => {
                this.mouse.is_down = false
            }
        }
    }

    initSocketListeners(){
        this.socket.on("test", data => {
            console.log("__SOCKET TEST__", data)
        })
        this.socket.on("start_counter", data => {
            this.startCounter(data)
        })
        this.socket.on("game_start", () => {
            this.center_text.show = false
            this.can_act = true
        })
        this.socket.on("is_dead", data => {
            if (this.socket.id == data.socket_id){
                if (data.by_player){
                    this.messages.push({
                        text: `${this.opponent_data.username} marque le point !`,
                        color: "red",
                        timer: 0
                    })
                } else {
                    this.messages.push({
                        text: `Vous vous êtes tué..`,
                        color: "red",
                        timer: 0
                    })
                }
                this.killMe()
            } else {
                if (data.by_player){
                    this.messages.push({
                        text: `Vous marquez le point !`,
                        color: "red",
                        timer: 0
                    })
                } else {
                    this.messages.push({
                        text: `${this.opponent_data.username} s'est tué..`,
                        color: "red",
                        timer: 0
                    })
                }
            }
        })
        this.socket.on("respawn", data => {
            if (!this.end_game){
                if (this.socket.id == data.socket_id){
                    this.respawnMe(data)
                } else {
                    this.respawnOpponent(data)
                }
            }
        })
        this.socket.on("scores", data =>{
            this.manageScores(data)
        })
        this.socket.on("winner", data => {
            if (data.socket_id){
                this.end_game = true
                this.can_act = false
                this.sounds.opponent_point.pause()
                this.sounds.opponent_point.currentTime = 0
                this.sounds.me_point.pause()
                this.sounds.me_point.currentTime = 0
                if (this.socket.id == data.socket_id){
                    this.sounds.victory.currentTime = 0
                    this.sounds.victory.play()
                    this.endMessage("win")
                } else {
                    this.sounds.defeat.currentTime = 0
                    this.sounds.defeat.play()
                    this.endMessage("loose")
                }
            }
        })
    }

    endMessage(type){
        this.center_text.size = 72
        this.center_text.outline_size = 3
        this.center_text.show = true
        switch(type){
            case "win":
                this.center_text.text = "VICTOIRE !"
                this.center_text.color = "lime"
                this.center_text.position = {
                    x: (this.screen.w / 2) - 200,
                    y: (this.screen.h / 2)
                }
            break
            case "loose":
                this.center_text.text = "DÉFAITE"
                this.center_text.color = "red"
                this.center_text.position = {
                    x: (this.screen.w / 2) - 160,
                    y: (this.screen.h / 2)
                }
            break
        }
    }

    update(keys, device_motion){
        this.current_delta_time = (Date.now() - this.last_delta_time)
        this.last_delta_time = Date.now()
        this.timersEvents()
        if (this.can_act){
            switch(this.is_mobile){
                case true:
                    this.handleDeviceMotion(device_motion)
                break
                case false:
                    this.handleKeyboard(keys)
                break
            }
            this.move()
        }
        this.handleWorkers(scene_objects)
        this.handleEvents()
        this.handleCollisions(current_collider)
        this.drawHud(device_motion)
        this.mouse.has_touched = false
    }

    startCounter(data){
        this.counter_sounds[data].play()
        this.center_text.size = 72
        this.center_text.text = data > 0 ? data : "C'est parti !"
        this.center_text.position = {
            x: data > 0 ? (this.screen.w / 2) - 40 :
                          (this.screen.w / 2) - 70, 
            y: (this.screen.h / 2) - 35
        }
        this.center_text.show = true
    }

    manageScores(data){
        for (const key in data.scores){
            if (key == this.socket.id){
                this.scores.me.deaths = data.scores[key].deaths
                this.scores.me.points = data.scores[key].points
            } else {
                this.scores.opponent.deaths = data.scores[key].deaths
                this.scores.opponent.points = data.scores[key].points
            }
        }
    }

    killMe(){
        this.sounds.explosion.currentTime = 0
        this.sounds.explosion.play()
        this.can_act = false
    }

    respawnMe(data){
        this.current_collider = null
        this.life.value = data.life
        this.position = data.position
        this.can_act = true
    }

    takeDamage(life, damage_type){
        if (life <= this.life.low_life){
            this.timers_events.low_life.is_active = true
        }
        switch(damage_type){
            case "shoot":
                this.sounds.hit.currentTime = 0
                this.sounds.hit.play()
            break
            case "burn":
                this.sounds.burn.play()
            break
            case "electrify":
                this.sounds.electrify.play()
            break
        }
        this.timers_events.hit_screen.is_active = true
        this.life.value = life
    }
    
    heal(life){
        if (life > this.life.low_life){
            this.timers_events.low_life.is_active = false
        }
        this.timers_events.heal_screen.is_active = true
        this.life.value = life
    }

    timersEvents(){
        for (const key in this.timers_events){
            const timer = this.timers_events[key]
            if (timer.is_active){
                timer.current += timer.step * this.current_delta_time
                if (timer.current >= timer.delay){
                    if (timer.switch) timer.is_active = false
                    timer.current = 0
                }
            }
        }
    }

    handleCollisions(current_collider){
        if (current_collider){
            switch(current_collider){
                case "fixed":
                    if (!this.is_bouncing){
                        this.sounds.collision.currentTime = 0
                        this.sounds.collision.play()
                        this.move_velocity = 0
                        this.is_bouncing = true
                    }
                break
            }
        }
    }

    drawHud(){
        //////////// VISUAL RAY SHOOTING EFFECT ////////////
        if (this.ray.is_shooting){
            switch(this.ray.side){
                case "left":
                    this.ray.position.x += (this.ray.speed_shoot + this.ray.x_offset) * this.current_delta_time
                    this.ray.position.y -= (this.ray.speed_shoot + this.ray.y_offset) * this.current_delta_time

                    this.ray.scale -= this.ray.speed_shoot * this.current_delta_time 
                    if (this.ray.scale < 0) this.ray.scale = 0

                    if (this.ray.position.x > this.screen.w / 2 && 
                        this.ray.position.y < this.screen.h / 2)
                    {
                        this.ray.is_shooting = false
                        this.ray.side = "right"
                    }
                    this.ctx.save()
                    this.ctx.scale(-1, 1)
                    this.ctx.drawImage(
                        this.ray.image,
                        -this.ray.position.x,
                        this.ray.position.y,
                        this.ray.scale,
                        this.ray.scale
                    )
                    this.ctx.restore()
                break
                case "right":
                    this.ray.position.x -= (this.ray.speed_shoot + this.ray.x_offset) * this.current_delta_time
                    this.ray.position.y -= (this.ray.speed_shoot + this.ray.y_offset) * this.current_delta_time

                    this.ray.scale -= this.ray.speed_shoot * this.current_delta_time 
                    if (this.ray.scale < 0) this.ray.scale = 0

                    if (this.ray.position.x < this.screen.w / 2 && 
                        this.ray.position.y < this.screen.h / 2)
                    {
                        this.ray.is_shooting = false
                        this.ray.side = "left"
                    }
                    this.ctx.drawImage(
                        this.ray.image,
                        this.ray.position.x,
                        this.ray.position.y,
                        this.ray.scale,
                        this.ray.scale
                    )
                break
            }
        }
        //////////// HUD TOP BOX ////////////
        this.ctx.save()
        this.ctx.globalAlpha = .7
        this.ctx.fillStyle = "rgb(40,40,40)"
        this.ctx.fillRect(
            0,
            0,
            800,
            100
        )
        this.ctx.restore()
        //////////// CROSSHAIR DRAWING ////////////
        const sprite_offset = this.target.type ? this.sprites.crosshair.width / 2 : 0
        this.ctx.drawImage(
            this.sprites.crosshair,
            sprite_offset,
            0,
            this.sprites.crosshair.width / 2,
            this.sprites.crosshair.height,
            this.screen.w - this.crosshair_horizontal_offset,
            this.screen.h / 2,
            55,
            70
        )
        //////////// CALIBRATE BUTTON DRAWING ////////////
        this.ctx.drawImage(
            this.sprites.hud_calibrate,
            0,
            0,
            this.sprites.hud_calibrate.width,
            this.sprites.hud_calibrate.height,
            this.calibrate_button.position.x,
            this.calibrate_button.position.y,
            this.calibrate_button.offset.x,
            this.calibrate_button.offset.y
        )

        if (this.mouse.coords.x >= this.calibrate_button.position.x && 
            this.mouse.coords.x <= this.calibrate_button.position.x + this.calibrate_button.offset.x &&
            this.mouse.coords.y >= this.calibrate_button.position.y && 
            this.mouse.coords.y <= this.calibrate_button.position.y + this.calibrate_button.offset.y &&
            this.mouse.has_touched)
        {
            device_motion.default = null
        }
        //////////// DYING DRAWING ////////////
        if (this.timers_events.die_screen.is_active){
            this.ctx.save()
            const alpha = this.timers_events.die_screen.current / this.timers_events.die_screen.delay
            this.ctx.globalAlpha = alpha
            this.ctx.fillStyle = "red"
            this.ctx.fillRect(
                0,
                0,
                this.screen.w,
                this.screen.h
            )
            this.ctx.restore()
        }
        //////////// HEAL DRAWING ////////////
        if (this.timers_events.heal_screen.is_active){
            this.ctx.save()
            this.ctx.globalAlpha = .7
            this.ctx.fillStyle = "lime"
            this.ctx.fillRect(
                0,
                0,
                this.screen.w,
                this.screen.h
            )
            this.ctx.restore()
        }
        //////////// SCORES DRAWING ////////////
        this.ctx.save()
        this.ctx.scale(1, this.scale_text)
        /// MY SCORES ///
        screenLog({
            ctx: this.ctx,
            position: {x: 85, y: 35 / this.scale_text},
            text: `${this.username}`,
            color: this.opposite_flag[this.flag_color],
            size: 22,
            font: "Arial"
        })
        screenLog({
            ctx: this.ctx,
            position: {x: 20, y: 75 / this.scale_text},
            text: `points : ${this.scores.me.points} | morts : ${this.scores.me.deaths}`,
            color: "rgb(255,255,255)",
            size: 18,
            font: "Arial"
        })
        /// OPPONENT SCORES ///
        screenLog({
            ctx: this.ctx,
            position: {x: 610, y: 35 / this.scale_text},
            text: `${this.opponent_data.username}`,
            color: this.opposite_flag[this.opponent_data.flag_color],
            size: 22,
            font: "Arial"
        })
        screenLog({
            ctx: this.ctx,
            position: {x: 545, y: 75 / this.scale_text},
            text: `points : ${this.scores.opponent.points} | morts : ${this.scores.opponent.deaths}`,
            color: "rgb(255,255,255)",
            size: 18,
            font: "Arial"
        })
        this.ctx.restore()

        //////////// SCREENLOG DRAWING ////////////
        if (this.center_text.show){
            screenLog({
                ctx: this.ctx,
                position: this.center_text.position,
                text: this.center_text.text,
                color: this.center_text.color,
                size: this.center_text.size,
                outline_size: this.center_text.outline_size
            })
        }
        //////////// GAME STATE MESSAGES ////////////
        for (let i = 0 ; i < this.messages.length ; i++){
            screenLog({
                ctx: this.ctx,
                position: {x: 10, y: 150 + (i*25)},
                color: this.messages[i].color,
                text: this.messages[i].text,
                size: 18
            })
            this.messages[i].timer++
            if (this.messages[i].timer > this.message_delay){
                this.messages.splice(i, 1)
                i--
            }
        }
    }

    handleKeyboard(keys){
        if (keys.left.isPressed){
            this.balance += this.balance_offset
            if (this.balance > this.max_balance) this.balance = this.max_balance
            this.angle -= this.speed_rotation
            if (this.angle < -Math.PI) this.angle = Math.PI
        }
        if (keys.right.isPressed){
            this.balance -= this.balance_offset
            if (this.balance < -this.max_balance) this.balance = -this.max_balance
            this.angle += this.speed_rotation
            if (this.angle > Math.PI) this.angle = -Math.PI
        }
        if (keys.plus.isPressed){
            this.position.z += this.z_speed
            if (this.position.z > this.max_z){
                this.position.z = this.max_z
            }
        }
        if (keys.minus.isPressed){
            this.position.z -= this.z_speed
            if (this.position.z <= this.min_z){
                this.position.z = this.min_z
            }
        }
        this.info = this.balance
    }

    handleDeviceMotion(device_motion){
        this.balance += device_motion.current.y / this.multipliers.balance
        if (this.balance > this.max_balance) this.balance = this.max_balance
        if (this.balance < -this.max_balance) this.balance = -this.max_balance
        this.angle -= device_motion.current.y / this.multipliers.angle
        if (this.angle < -Math.PI) this.angle = Math.PI
        if (this.angle > Math.PI) this.angle = -Math.PI
        this.position.z += device_motion.current.z
        if (this.position.z > this.max_z) this.position.z = this.max_z
        if (this.position.z <= this.min_z) this.position.z = this.min_z
    }

    move(){
        if (!this.is_bouncing){
            this.move_velocity +=  this.forward_velocity
            if (this.move_velocity > this.forward_velocity_max){
                this.move_velocity = this.forward_velocity_max
            }
        }
        if (this.is_bouncing){
            this.move_velocity -= this.backward_velocity
            if (this.move_velocity < -this.backward_velocity_max){
                this.move_velocity = 0
                this.is_bouncing = false
            }
        }
        this.position.x += Math.cos(this.angle) * this.move_velocity * this.current_delta_time
        this.position.y += Math.sin(this.angle) * this.move_velocity * this.current_delta_time
        
        if (this.position.x < 0) this.position.x = 0
        if (this.position.y < 0) this.position.y = 0
        if (this.position.x > this.max_bounds.x) this.position.x = this.max_bounds.x
        if (this.position.y > this.max_bounds.y) this.position.y = this.max_bounds.y
    
        this.socket.emit("coords", {
            position: this.position,
            angle: this.angle
        })
    }
}