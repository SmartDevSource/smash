import { loadImage, isStandalone } from './misc_functions.js'

export class InstallMenu{
    constructor(screen, ctx){
        this.ask_mobile = document.getElementById("askMobile")

        this.screen = screen
        this.ctx = ctx
        this.text_alpha = {
            switch: false,
            value: 1
        }
        this.text_wobble = {
            value: 1,
            min: 1,
            max: 1.2,
            tick_speed: .03,
            reverse: false
        }
        this.game_logo = {
            image: null,
            position: {x: 320, y: 150}
        }
        this.stars_background = {
            image: null,
            offset: {w: 0, h: 0}
        }
        this.ship_background = {
            image: null,
            offset: {w: 0, h: 0},
            position: {x: -140, y: 500}
        }
        this.loadImages()
        this.global_alpha = 0
        this.background_frame = 0
        this.frames_count = 60
        this.tick_anim = Date.now()
        this.tick_refresh = 60
        this.labels = []

        const font_operator = new FontFace(
            "operator",
            "url('./assets/fonts/operator.ttf')"
        )
        document.fonts.add(font_operator)
        this.images_loaded = false

        this.labels = {
            ask_install: {
                text: "Veuillez lancer l'application sur mobile", 
                position: {x: 210, y: 550},
                animated: true,
                wobble: false,
                on_click: () => null
            }
        }
    }

    update(is_mobile, is_standalone){
        this.deltaClock()
        if (this.images_loaded){
            this.drawBackground()
        }
        
        if (isStandalone() && this.ask_mobile.style.display == "block")
            this.ask_mobile.style.display = "none"
        // if (!is_mobile || !is_standalone){
        //     this.label({
        //         text: this.labels.ask_install.text,
        //         position: this.labels.ask_install.position,
        //         animated: this.labels.ask_install.animated,
        //         on_click: this.labels.ask_install.on_click,
        //         size: this.labels.ask_install.size || 16,
        //         wobble: this.labels.ask_install.wobble
        //     })
        // }
    }

    label({text, position, animated = false, on_click, size = 16, wobble=false}){
        const original_position = Object.assign({}, position)
        this.ctx.save()
        if (animated){
            this.ctx.globalAlpha = !this.is_menu_ready ? this.global_alpha : this.text_alpha.value
        }
        if (wobble){
            this.ctx.scale(this.text_wobble.value, this.text_wobble.value + 3)
            original_position.x /= this.text_wobble.value
            original_position.x -= (this.text_wobble.value) * text.length + size
            original_position.y /= this.text_wobble.value + 3
        } else {
            this.ctx.scale(1, 3)
            original_position.x /= 1
            original_position.y /= 3
        }
        this.ctx.font = `${size}px operator`
        this.ctx.fillStyle = "white"
        this.ctx.strokeStyle = "blue"
        this.ctx.lineWidth = 1
        this.ctx.strokeText(text, original_position.x, original_position.y)
        this.ctx.fillText(text, original_position.x, original_position.y)
        this.ctx.restore()
    }

    async loadImages(){
        try{
            this.game_logo.image = await loadImage("../assets/gfx/menu/retrowar_logo.png")
            this.stars_background.image = await loadImage("../assets/gfx/menu/stars_background.png")
            this.ship_background.image = await loadImage("../assets/gfx/menu/ship_background.png")

            for (const m in this.maps){
                this.maps[m].img = await loadImage(`../assets/gfx/maps/${this.maps[m].name}.png`)
            }
            this.stars_background.offset = {
                w: this.stars_background.image.width / this.frames_count, 
                h: this.stars_background.image.height
            }
            this.ship_background.offset = {
                w: this.ship_background.image.width / this.frames_count, 
                h: this.ship_background.image.height
            }
            this.images_loaded = true
        } catch (err) {
            console.log("Erreur lors du chargement des images :", err)
        }
    }

    drawBackground(){
        if (this.background_frame >= this.frames_count)
            this.background_frame = 0

        this.ctx.drawImage(
            this.stars_background.image, 
            this.background_frame * this.stars_background.offset.w, 
            0,
            this.stars_background.offset.w,
            this.stars_background.offset.h,
            0,
            0,
            this.screen.w,
            this.screen.h
        )

        this.ctx.save()
        this.ctx.scale(1.5, .7)
        this.ctx.drawImage(
            this.ship_background.image, 
            this.background_frame * this.ship_background.offset.w, 
            0,
            this.ship_background.offset.w,
            this.ship_background.offset.h,
            this.ship_background.position.x,
            this.ship_background.position.y,
            this.screen.w,
            this.screen.h
        )
        this.ctx.restore()

        this.ctx.save()
        this.ctx.globalAlpha = this.global_alpha
        this.ctx.scale(.5, .5)
        this.ctx.drawImage(
            this.game_logo.image, 
            this.game_logo.position.x,
            this.game_logo.position.y,
        )
        this.ctx.restore()
    }

    deltaClock(){
        if (Date.now() - this.tick_anim > this.tick_refresh){
            this.tick_focus++
            if (this.tick_focus > 5){
                this.tick_focus = 0
                this.focus_cursor = !this.focus_cursor
            }
            this.background_frame++
            if (this.ship_background.position.y > 40)
                this.ship_background.position.y -= 20
            if (this.global_alpha < 1)
                this.global_alpha += .03
            if (this.global_alpha >= 1)
                this.is_menu_ready = true
            if (this.is_menu_ready){
                switch(this.text_alpha.switch){
                    case true:
                        this.text_alpha.value -= .05
                        if (this.text_alpha.value <= .4)
                            this.text_alpha.switch = false
                    break
                    case false:
                        this.text_alpha.value += .05
                        if (this.text_alpha.value >= 1)
                            this.text_alpha.switch = true
                    break
                }
            }
            switch(this.text_wobble.reverse){
                case true:
                    if (this.text_wobble.value > this.text_wobble.min)
                        this.text_wobble.value -= this.text_wobble.tick_speed
                    else 
                        this.text_wobble.reverse = false
                break
                case false:
                    if (this.text_wobble.value < this.text_wobble.max)
                        this.text_wobble.value += this.text_wobble.tick_speed
                    else 
                        this.text_wobble.reverse = true
                break
            }
            this.tick_anim = Date.now()
        }
    }
}