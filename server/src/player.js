class Player{
    constructor({id, username, color, position, angle}){
        this.id = id
        this.username = username
        this.color = color
        this.position = position
        this.angle = angle
        this.score = 0
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
}

module.exports = Player