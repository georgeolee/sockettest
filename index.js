// load environment variables for local development
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

// es6 import syntax
// import fetch from 'node-fetch' 

// commonjs workaround
const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));

const path = require('path')

const express = require('express')
const app = express()

app.use(express.static(path.join(__dirname, 'public')))


const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io') //import Server from socket.io module

const io = new Server(server)

const port = process.env.PORT || 3000

//connect to mongodb
const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
db.on('error', err => console.log(err))
db.once('open', () => console.log('connected to mongodb'))

const Message = require('./models/message')





app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

io.on('connection', async socket => {
    console.log(`a user connected; id: ${socket.id}`)

    //get old messages from mongodb
    let query = Message.find()
    try{
        const messages = await query.exec()
        
        const messageText = messages.map(m => m.text)

        io.to(socket.id).emit('missed messages', messages)

    }catch(err){
        console.log(err)
    }

    const adj = await getRandomWord('adjective')
    const noun = await getRandomWord('noun')
    const name = `${adj} ${noun}`.toUpperCase()
    console.log(name)

    io.to(socket.id).emit('name prompt', name)
    

    socket.on('disconnect', () => {
        console.log('user disconnected')
    })

    socket.on('chat message',  async msg => {
        console.log(`received chat message from use ${msg.user}: ${msg.text}`)
        io.emit('chat message', msg)

        const message = new Message({
            user: msg.user,
            text: msg.text,
            timestamp: Date.now()
        })

        try{
            await message.save();
        }catch(err){
            console.log(err)
        }
        
    })

    // socket.on('user')
})

server.listen(port, () => {
    console.log(`listening on *:${port}`)
})

async function getRandomWord(type=''){
    let word
    let url = 'https://api.api-ninjas.com/v1/randomword' //api endpoint for random word
    if(type) url += `?type=${type}` // noun | verb | adjective | adverb | (nothing)
    const options = {
        method: 'GET',
        headers: {
            'X-Api-Key':process.env.API_NINJA_KEY
        }
    }

    try{
        const response = await fetch(url, options)
        if(!response.ok) throw new Error(`fetch error; status ${response.status}`)
        
        word = await response.json().then(json => json.word)
        // console.log(word)

    }catch(e){
        console.log(e)
        word = 'thing'
    }
    return word
}