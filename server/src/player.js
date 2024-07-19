const { getOppositeFlag } = require('./server_misc_functions.js')

class Player{
    constructor(username, position){
        this.username = username
        this.position = position
    }
}

module.exports = Player