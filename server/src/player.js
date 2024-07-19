const { getOppositeFlag } = require('./server_misc_functions.js')

class Player{
    constructor(id, username, color, position){
        this.id = id
        this.username = username
        this.color = color
        this.position = position
    }
}

module.exports = Player