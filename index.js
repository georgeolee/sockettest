// load environment variables for local development
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

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
    console.log('a user connected')

    let query = Message.find()

    try{
        const messages = await query.exec()
        
        const messageText = messages.map(m => m.text)

        io.to(socket.id).emit('missed messages', messageText)

    }catch(err){
        console.log(err)
    }
    
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })

    socket.on('chat message',  async msg => {
        console.log('received message: ' + msg)
        io.emit('chat message', msg)

        const message = new Message({
            text: msg,
            timestamp: Date.now()
        })

        try{
            await message.save();
        }catch(err){
            console.log(err)
        }
        
    })
})

server.listen(port, () => {
    console.log(`listening on *:${port}`)
})