const { Pool } = require('pg')

class Database{
    constructor(){
        this.pool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_DATABASE,
            password: process.env.DB_PASSWORD,
            port: 5432,
            ssl:{ rejectUnauthorized: false }
        })
        this.pool.connect((err, client, release)=>{
            if (err){
                console.log("Connexion à la base de données impossible.")
            } else {
                console.log("Connexion à la base de données réussie !")
                release()
            }
        })
    }
    
    addUser({user}){
        const query = `INSERT INTO users (google_id, name, nickname, email) 
        VALUES ($1, $2, $3, $4)`
        const values = [user.google_id, user.name, user.nickname, user.email]
        return new Promise((resolve, reject)=>{
            this.pool.query(query, values, (err, res) => {
                if (err){
                    console.log(err.stack)
                    reject(err)
                } else {
                    console.log(`L'utilisateur ${user.email} a été crée !`)
                    resolve(res)
                }
            })
        })
    }

    updateScore({google_id}){
        const query = `UPDATE users SET score = score + 1 WHERE google_id = $1`
        const values = [ google_id]
        return new Promise((resolve, reject) => {
            this.pool.query(query, values, (err, res)=>{
                if (err){
                    console.log(err.stack)
                    reject(err.stack)
                } else {
                    resolve(true)
                }
            })
        })
    }

    getAllUsers(){
        const query = `SELECT * FROM users`
        return new Promise((resolve, reject) => {
            this.pool.query(query, (err, res) => {
                if (err){
                    console.log(err.stack)
                    reject(err)
                } else {
                    if (res.rows.length > 0){
                        resolve(res.rows[0])
                    } else {
                        resolve(null)
                    }
                }
            })
        })
    }

    getUser({id}){
        const query = `SELECT * FROM users WHERE google_id = $1`
        const values = [id]
        return new Promise((resolve, reject)=>{
            this.pool.query(query, values, (err, res) => {
                if (err){
                    console.log(err.stack)
                    return reject(err)
                } else {
                    if (res.rows.length > 0){
                        resolve(res.rows[0])
                    } else {
                        resolve(null)
                    }
                }
            })
        })
    }

    checkUsername({nickname}){
        const query = `SELECT * FROM users WHERE nickname = $1`
        const values = [nickname]
        return new Promise((resolve, reject)=>{
            this.pool.query(query, values, (err, res) => {
                if (err){
                    console.log(err.stack)
                    return reject(err)
                } else {
                    if (res.rows.length > 0){
                        resolve(res.rows[0])
                    } else {
                        resolve(null)
                    }
                }
            })
        })
    }

    closeConnexion(){
        this.pool.end()
    }

    createUsersTable(){
        const query_create_table = `CREATE TABLE users(
            id SERIAL PRIMARY KEY,
            google_id VARCHAR(255),
            name VARCHAR(255),
            nickname VARCHAR(255),
            email VARCHAR(255),
            score INT DEFAULT 0
        )`
        this.pool.query(query_create_table, (err, res) => {
            if (err){
                console.log(err.stack)
            } else {
                console.log("Table users créee !")
            }
        })
    }

    getBestScores({limit}){
        const query = `SELECT * FROM users ORDER BY score DESC LIMIT ${limit}`
        return new Promise((resolve, reject)=>{
            this.pool.query(query, (err, res) => {
                if (err){
                    console.log(err.stack)
                    return reject(err)
                } else {
                    if (res.rows.length > 0){
                        resolve(res.rows[0])
                    } else {
                        resolve(null)
                    }
                }
            })
        })
    }

    destroyUsersTable(){
        this.pool.query('DROP TABLE IF EXISTS users', (err, res) => {
            if (err){
                console.log(err.stack)
            } else {
                console.log("Table users détruite !")
            }
        })
    }
}

module.exports = { Database }

// const query_create_table = `CREATE TABLE users(
//     id INT PRIMARY KEY NOT NULL,
//     name VARCHAR(255),
//     email VARCHAR(255),
//     victories INT
// )`

// const query_alter = 'ALTER TABLE users ADD COLUMN google_id VARCHAR(255)'