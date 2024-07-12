import { drawLine, loadImageData, loadImage, 
         getDistance, toDegrees, getTakenColor } from "./misc_functions.js"
import { Opponent } from "./opponent.js"

export class Map{
    constructor(ctx, screen, images, audios, map_data, player_data, objects_settings, opponent_data, socket){
        this.socket = socket
        this.ctx = ctx
        this.opponent = new Opponent(opponent_data)
        this.player_data = player_data
        this.screen = screen
        this.images = images
        this.audios = audios
        this.map_data = map_data
        this.objects_settings = objects_settings
        this.is_loaded = false

        this.current_delta_time = 0
        this.last_delta_time = Date.now()

        this.pixels_data = null
        this.sky_image = null

        this.half_w = screen.w / 2
        this.half_h = screen.h / 2

        this.angle_offset = 4.8
        this.y_offset = 5
        this.radian_fov = .8
        this.fov = Math.PI / 2

        loadImageData(`../assets/gfx/maps/${map_data.data.map_name}.png`)
            .then(img_data=> { this.pixels_data = img_data })
        
        this.scene_objects = []

        this.sprite_near = 30
        this.collide_distance = 2300

        this.memoryCanvas = document.createElement("canvas")
        this.memoryCtx = this.memoryCanvas.getContext("2d")
        this.memoryCanvas.width = screen.w
        this.memoryCanvas.height = screen.h

        this.sprites = {
            ray: images.ray,
            ray_enhanced: images.ray_enhanced,
            explosion_1: images.explosion_1,
            ship: images.ship,
            red_taken: images.red_taken,
            blue_taken: images.blue_taken,
            goal_arrow: images.goal_arrow,
            skybox: images[map_data.data.sky_name]
        }

        this.music = null
        this.sounds = {
            opponent_beam: audios.beam,
            opponent_big_beam: audios.big_beam,
            explosion: audios.explosion
        }

        this.sounds.opponent_beam.volume = .7
        this.sounds.opponent_big_beam.volume = .7
        this.music = audios[map_data.data.music_file]
        this.music.loop = true
        this.music.play()

        this.speed_ray = .8
        this.ray_delay = 2000

        this.offset_goal_position = 30
        this.offset_arrow = 120
    
        this.initScene(map_data, objects_settings)
        this.initSocketListeners()

        this.current_collider = null
        this.flags = {
            my_flag:{
                is_taken: false,
                color: player_data.flag_color,
                taken_color: getTakenColor(player_data.flag_color)
            },
            opponent_flag:{
                is_taken: false,
                color: opponent_data.flag_color,
                taken_color: getTakenColor(opponent_data.flag_color)
            }
        }
    }

    async initScene(map_data, objects_settings){
        await this.loadSceneObjects(map_data, objects_settings)
        this.is_loaded = true
    }
    
    clear(){
        this.music.pause()
        this.music.currentTime = 0
        // this.music = null
        for (const key in this.sounds){
            this.sounds[key].pause()
            this.sounds[key].currentTime = 0
        }
        // this.sounds = null
    }

    initSocketListeners(){
        this.socket.on("coords", data => {
            if (this.socket.id != data.socket_id){
                this.opponent.updateCoords(data.coords)
            }
        })
        this.socket.on("is_shooting", () => {
            this.addOpponentRay()
        })
        this.socket.on("boost_damage", data => {
            if (this.socket.id != data.socket_id){
                this.opponent.boost_damage = true
            }
        })
        this.socket.on("restore_damage", data => {
            if (this.socket.id != data.socket_id){
                this.opponent.boost_damage = false
            }
        })
        this.socket.on("is_dead", data => {
            if (this.socket.id != data.socket_id){
                this.killOpponent()
            } else {
                if (this.flags.opponent_flag.is_taken){
                    this.flags.opponent_flag.is_taken = false
                }
            }
        })
        this.socket.on("respawn", data => {
            if (this.socket.id != data.socket_id){
                this.respawnOpponent(data)
            }
        })
        this.socket.on("explode_object", data => {
            if (data.object_id){
                this.explodeObject(data.object_id)
            }
        })
        this.socket.on("remove_object", data =>{
            const object_index = this.scene_objects.findIndex(e=>e.id == data.object_id)
            if (object_index != -1){
                this.scene_objects.splice(object_index, 1)
            }
        })
        this.socket.on("add_object", async data => {
            const settings_object = Object.assign({}, this.objects_settings[data.object.name])
            const new_object = await this.addNewObject(settings_object, data.object)
            console.log(new_object)
            this.scene_objects.push(new_object)
        })
        this.socket.on("flag_taken", data => {
            if (this.socket.id != data.socket_id){
                this.flags.my_flag.is_taken = true
            } else {
                this.flags.opponent_flag.is_taken = true
            }
        })
        this.socket.on("flag_goal", data => {
            if (this.socket.id != data.socket_id){
                this.flags.my_flag.is_taken = false
            } else {
                this.flags.opponent_flag.is_taken = false
            }
        })
        this.socket.on("winner", data => {
            this.music.pause()
            this.music.currentTime = 0
        })
    }

    async addOpponentSprite(){
        const opponent_sprite_data = Object.assign({}, this.objects_settings["ship"])
        opponent_sprite_data.image = this.sprites.ship
        this.scene_objects.push(opponent_sprite_data)
    }

    async addAnothersSprites(){
        const red_taken = Object.assign({}, this.objects_settings["flag_taken"]),
              blue_taken = Object.assign({}, this.objects_settings["flag_taken"]),
              goal_arrow = Object.assign({}, this.objects_settings["goal_arrow"])
        red_taken.type = "red_taken"
        red_taken.image = this.sprites.red_taken
        blue_taken.type = "blue_taken"
        blue_taken.image = this.sprites.blue_taken
        goal_arrow.type = "goal_arrow"
        goal_arrow.image = this.sprites.goal_arrow
        goal_arrow.position = {
            x: this.player_data.position.x + this.offset_goal_position,
            y: this.player_data.position.y + this.offset_goal_position,
            z: this.offset_arrow
        }
        this.scene_objects.push(red_taken)
        this.scene_objects.push(blue_taken)
        this.scene_objects.push(goal_arrow)
    }

    addOpponentRay(){
        const forward_position = {
            x: this.opponent.position.x + 30 * Math.cos(this.opponent.angle),
            y: this.opponent.position.y + 30 * Math.sin(this.opponent.angle),
            z: this.opponent.position.z + 5
        }
        const opponent_ray_data = Object.assign({}, this.objects_settings["ray"])
        opponent_ray_data.angle = this.opponent.angle
        opponent_ray_data.position = forward_position
        switch(this.opponent.boost_damage){
            case true:
                opponent_ray_data.image = this.sprites.ray_enhanced
                this.sounds.opponent_big_beam.play()
            break
            case false:
                opponent_ray_data.image = this.sprites.ray
                this.sounds.opponent_beam.play()
            break
        }
        this.scene_objects.push(opponent_ray_data)
    }

    explodeObject(object_id){
        this.sounds.explosion.play()
        const index = this.scene_objects.findIndex(e=>e.id == object_id)
        if (index != -1){
            const obj = this.scene_objects[index]
            obj.type = null
            obj.is_flat = true
            obj.is_animated = true
            obj.current_frame = 0
            obj.frame_timer = 0
            obj.frames_count = 32
            obj.frame_speed = 100
            obj.image = this.sprites.explosion_1
            obj.destroy_after_anim = true
        }
    }

    killOpponent(){
        if (this.flags.my_flag.is_taken){
            this.flags.my_flag.is_taken = false
        }
        this.sounds.explosion.currentTime = 0
        this.sounds.explosion.play()
        this.opponent.is_dead = true
        const opponent_ship = this.scene_objects.filter(e=>e.type == "ship")[0]
        if (opponent_ship){
            opponent_ship.type = null
            opponent_ship.is_flat = true
            opponent_ship.is_animated = true
            opponent_ship.current_frame = 0
            opponent_ship.frame_timer = 0
            opponent_ship.frames_count = 32
            opponent_ship.frame_speed = 100
            opponent_ship.image = this.sprites.explosion_1
            opponent_ship.destroy_after_anim = true
        }
    }
    
    async respawnOpponent(data){
        this.opponent.is_dead = false
        this.opponent.updateCoords(data)
        await this.addOpponentSprite()
    }

    async loadSceneObjects(map_data, objects_settings){
        for (let map_object of map_data.objects){
            const settings_object = objects_settings[map_object.name]
            const new_object = await this.addNewObject(settings_object, map_object)
            this.scene_objects.push(new_object)
        }
        await this.addOpponentSprite()
        await this.addAnothersSprites()
    }

    async addNewObject(settings_object, map_object){
        const object_data = {
            is_visible: false,
            image: this.images[settings_object.image_name],
            scale: settings_object.scale,
            screen_scale: 0,
            position: map_object.position,
            angle: map_object.angle?? 0,
            screen_position: {x: 0, y: 0},
            is_flat: settings_object.is_flat,
            is_animated: settings_object.is_animated,
            z_collider: settings_object.z_collider,
            target_offset: settings_object.target_offset,
            target_scale_offset: 0,
            type: settings_object.type,
            id: map_object.id || null
        }
        
        if (!object_data.is_flat){
            object_data.angle = map_object.angle
            object_data.faces = settings_object.faces
        }

        if (object_data.is_animated){
            object_data.current_frame = 0
            object_data.frame_timer = 0
            object_data.frames_count = settings_object.frames_count
            object_data.frame_speed = settings_object.frame_speed
            object_data.destroy_after_anim = false
        }
        return object_data
    }

    update(camera_position, camera_angle, camera_balance){
        if (this.is_loaded){
            this.current_delta_time = (Date.now() - this.last_delta_time)
            this.last_delta_time = Date.now()
            this.ctx.save()
            this.ctx.translate(this.half_w, this.half_h)
            this.ctx.scale(1.2, 1.2)
            this.ctx.rotate(camera_balance)
            this.ctx.translate(-this.half_w, -this.half_h)
            this.animateSprites()
            this.project3DMap(camera_position, camera_angle)
            this.renderSprites(camera_position, camera_angle)
            this.ctx.restore()
        }
    }

    animateSprites(){
        for(let i = 0; i < this.scene_objects.length; i++){
            const obj = this.scene_objects[i]
            if (obj.is_animated){
                obj.frame_timer += obj.frame_speed
                if (obj.frame_timer >= 100){
                    obj.frame_timer = 0
                    obj.current_frame++
                    if (obj.current_frame > obj.frames_count - 1){
                        if (obj.destroy_after_anim){
                            this.scene_objects.splice(i, 1)
                            i--
                        } else {
                            obj.current_frame = 0
                        }
                    }
                }
            }
        }
    }

    sendCollisionType(object_type, object_id){
        this.socket.emit("collision", {
            object_type: object_type,
            object_id: object_id
        })
    }

    renderSprites(camera_position, camera_angle){
        this.scene_objects.sort((a, b) =>
            getDistance(camera_position, b.position) 
            -
            getDistance(camera_position, a.position)
        )

        const without_rays = this.scene_objects.filter(e=>e.type == "fixed" || e.type=="explosive")

        for (let i = 0 ; i < this.scene_objects.length ; i ++){
            const object = this.scene_objects[i]
            //"3D" RENDER//
            const transforms = this.projectSprite(
                camera_position,
                camera_angle,
                object.position,
                object.angle,
                object.scale
            )

            switch(object.type){
                case "ship":
                    object.position = this.opponent.position
                    object.angle = this.opponent.angle

                    if (this.opponent.is_dead)
                        continue
                break
                case "ray":
                    object.position.x += Math.cos(object.angle) * this.speed_ray * this.current_delta_time
                    object.position.y += Math.sin(object.angle) * this.speed_ray * this.current_delta_time

                    object.delay += 1 * this.current_delta_time
                    if (object.delay >= this.ray_delay){
                        this.scene_objects.splice(i, 1)
                        i--
                        continue
                    }
                    let go_next = false
                    without_rays.forEach((obj)=>{
                        const dist = getDistance(obj.position, object.position)
                        const z_diff = obj.position.z - object.position.z
                        if (z_diff >= object.z_collider.min && z_diff <= object.z_collider.max){
                            if (dist < this.collide_distance){
                                this.scene_objects.splice(i, 1)
                                i--
                                go_next = true
                                return
                            }
                        }
                    })
                    if (go_next) continue
                break
                case "red_flag": case "blue_flag":
                    if (object.type == this.flags.my_flag.color &&
                        this.flags.my_flag.is_taken || 
                        object.type == this.flags.opponent_flag.color &&
                        this.flags.opponent_flag.is_taken
                        )
                    {
                        continue
                    }
                break
                case "red_taken": case "blue_taken":
                    if (this.flags.my_flag.is_taken && this.flags.my_flag.taken_color == object.type){
                        object.position = this.opponent.position
                    } else {
                        continue
                    }
                break
                case "goal_arrow":
                    if (!this.flags.opponent_flag.is_taken)
                        continue
                break
            }
            this.current_collider = null

            if (transforms && object.image){
                this.checkCollisions(camera_position, object)
                object.is_visible = true
                object.screen_position = transforms.screen_coords
                object.screen_scale = transforms.scale

                if (!object.is_flat){
                    const faces_divided = Math.floor(360 / object.faces)
                    const image_size = {w: object.image.width, h: object.image.height}
                    const width_frame = Math.floor(image_size.w / object.faces)
                    var current_frame = Math.floor(object.faces - (transforms.orientation_degrees / faces_divided)) * width_frame
                    if (current_frame < 0) current_frame = 0

                    this.ctx.drawImage(
                        object.image,
                        current_frame,
                        0,
                        width_frame,
                        image_size.h,
                        transforms.screen_coords.x, 
                        transforms.screen_coords.y,
                        transforms.scale,
                        transforms.scale,
                    )
                } else {
                    switch(object.is_animated){
                        case true:
                            this.ctx.drawImage(
                                object.image,
                                object.current_frame * object.image.width / object.frames_count,
                                0,
                                object.image.width / object.frames_count,
                                object.image.height,
                                transforms.screen_coords.x,
                                transforms.screen_coords.y,
                                transforms.scale,
                                transforms.scale,
                            )
                        break
                        case false:
                            this.ctx.drawImage(
                                object.image,
                                0,
                                0,
                                object.image.width,
                                object.image.height,
                                transforms.screen_coords.x,
                                transforms.screen_coords.y,
                                transforms.scale,
                                transforms.scale,
                            )
                        break
                    }
                }
                const target_scale_offset = transforms.scale / object.target_offset
                object.target_scale_offset = target_scale_offset
                // this.drawBoxes(transforms.screen_coords, transforms.scale, target_scale_offset)
            } else {
                object.is_visible = false
            }
        }
    }

    checkCollisions(camera_position, object){
        if (getDistance(camera_position, object.position) < this.collide_distance){
            const z_diff = camera_position.z - object.position.z
            if (z_diff >= object.z_collider.min && z_diff <= object.z_collider.max){
                this.current_collider = object.type
                this.sendCollisionType(object.type, object.id)
            }
        }
    }

    projectSprite(camera_position, camera_angle, sprite_position, sprite_angle, sprite_scale){
        const vector_x = sprite_position.x - camera_position.x
        const vector_y = sprite_position.y - camera_position.y
        const distance = Math.sqrt(vector_x ** 2 + vector_y ** 2)

        const angle_to_player = Math.atan2(vector_y, vector_x)
        const both_angles = angle_to_player - (camera_angle+.1)
        const abs_diff_angle = Math.abs(Math.atan2(Math.sin(both_angles), Math.cos(both_angles)))
        const diff_angle = Math.atan2(Math.sin(both_angles), Math.cos(both_angles))
        const sprite_orientation = angle_to_player - sprite_angle
        const diff_orientation = Math.atan2(Math.sin(sprite_orientation), Math.cos(sprite_orientation))

        const orientation_degrees = toDegrees(diff_orientation)
        const height_diff = camera_position.z - sprite_position.z
        const scale = ((sprite_scale*1000)/ distance)
        const vertical_offset = (height_diff) / (distance*.8) * (this.screen.h / 2)

        if (abs_diff_angle < this.radian_fov + 1 && distance >= this.sprite_near){
            const screen_coords = {
                x: ((this.screen.w / 2) * ((diff_angle / this.radian_fov) + 1)),
                y: this.half_h + vertical_offset + abs_diff_angle * 10
            }
            return {
                screen_coords: screen_coords,
                scale: scale,
                orientation_degrees: orientation_degrees
            }
        }
        return null
    }

    drawBoxes(screen_coords, scale, target_scale_offset){
        drawLine(
            this.ctx, 
            {x: screen_coords.x + target_scale_offset,
             y: screen_coords.y + target_scale_offset},
            {x: screen_coords.x + scale - target_scale_offset,
             y: screen_coords.y + target_scale_offset},
            "red"
        )
        drawLine(
            this.ctx, 
            {x: screen_coords.x + scale - target_scale_offset,
             y: screen_coords.y + target_scale_offset},
            {x: screen_coords.x + scale - target_scale_offset,
             y: screen_coords.y + scale - target_scale_offset},
            "red"
        )
        drawLine(
            this.ctx, 
            {x: screen_coords.x + scale - target_scale_offset,
             y: screen_coords.y + scale - target_scale_offset},
            {x: screen_coords.x + target_scale_offset,
             y: screen_coords.y + scale - target_scale_offset},
            "red"
        )
        drawLine(
            this.ctx, 
            {x: screen_coords.x + target_scale_offset,
             y: screen_coords.y + scale - target_scale_offset},
            {x: screen_coords.x + target_scale_offset,
             y: screen_coords.y + target_scale_offset},
            "red"
        )
    }

    project3DMap(camera_position, angle) {    
        if (!this.pixels_data) return
    
        const render_image = new ImageData(this.pixels_data.width, this.pixels_data.height)
        const cos_angle = Math.cos((angle - Math.PI) + this.angle_offset)
        const sin_angle = Math.sin((angle - Math.PI) + this.angle_offset)
        const half_h = this.half_h
        const half_w = this.half_w
        const width = this.pixels_data.width
        const height = this.pixels_data.height
        const pixels_data = this.pixels_data.data
        const render_data = render_image.data
    
        const camera_z = camera_position.z
        const camera_x = camera_position.x
        const camera_y = camera_position.y
        const cos_angle_z_half = Math.cos(angle) * camera_z / 2
        const sin_angle_z_half = Math.sin(angle) * camera_z / 2
    
        const pixelsDataUint32 = new Uint32Array(pixels_data.buffer)
        const renderDataUint32 = new Uint32Array(render_data.buffer)
    
        for (let y = half_h; y < height; y++) {
            const z = y / camera_z
            const view_angle = y - half_h
    
            for (let x = -half_w; x < half_w; x++) {
                const x_temp = (x / (z * view_angle)) * half_w
                const y_temp = (camera_z / view_angle) * half_h
    
                const x_prime = (x_temp * cos_angle) + (y_temp * sin_angle + camera_x) - cos_angle_z_half
                const y_prime = (x_temp * sin_angle) - (y_temp * cos_angle - camera_y) - sin_angle_z_half
    
                const x_prime_floor = Math.floor(x_prime)
                const y_prime_floor = Math.floor(y_prime)
    
                if (x_prime_floor >= 0 && x_prime_floor < width - 1 && y_prime_floor >= 0 && y_prime_floor < height - 1) {
                    const dx = x_prime - x_prime_floor
                    const dy = y_prime - y_prime_floor
    
                    const i_dest_tl = (y_prime_floor * width + x_prime_floor)
                    const i_dest_tr = i_dest_tl + 1
                    const i_dest_bl = i_dest_tl + width
                    const i_dest_br = i_dest_bl + 1
    
                    const color_tl = pixelsDataUint32[i_dest_tl]
                    const color_tr = pixelsDataUint32[i_dest_tr]
                    const color_bl = pixelsDataUint32[i_dest_bl]
                    const color_br = pixelsDataUint32[i_dest_br]
    
                    const r = ((color_tl & 0xff0000) * (1 - dx) * (1 - dy) + (color_tr & 0xff0000) * dx * (1 - dy) +
                               (color_bl & 0xff0000) * (1 - dx) * dy + (color_br & 0xff0000) * dx * dy) >>> 16
                    const g = ((color_tl & 0xff00) * (1 - dx) * (1 - dy) + (color_tr & 0xff00) * dx * (1 - dy) +
                               (color_bl & 0xff00) * (1 - dx) * dy + (color_br & 0xff00) * dx * dy) >>> 8
                    const b = ((color_tl & 0xff) * (1 - dx) * (1 - dy) + (color_tr & 0xff) * dx * (1 - dy) +
                               (color_bl & 0xff) * (1 - dx) * dy + (color_br & 0xff) * dx * dy) >>> 0
                    const a = ((color_tl >>> 24) * (1 - dx) * (1 - dy) + (color_tr >>> 24) * dx * (1 - dy) +
                               (color_bl >>> 24) * (1 - dx) * dy + (color_br >>> 24) * dx * dy) >>> 0
    
                    renderDataUint32[(y * width + x + half_w)] = (a << 24) | (r << 16) | (g << 8) | b
                }
            }
        }
        let sky_translate = -(angle * 720)
        this.memoryCtx.putImageData(render_image, 0, 0)
        this.ctx.drawImage(this.sprites.skybox, sky_translate - this.sprites.skybox.width + 1, 0)
        this.ctx.drawImage(this.sprites.skybox, sky_translate + this.sprites.skybox.width - 1, 0)
        this.ctx.drawImage(this.sprites.skybox, sky_translate, 0)
        this.ctx.drawImage(this.memoryCanvas, 0, 0)
    }
}