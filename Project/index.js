var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
app.use(express.urlencoded())
const mongo = require('mongodb')
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
app.use(express.static('public'))
app.use(bodyParser())
app.set('view engine', 'ejs')
let client;

io.on('connect', onConnect);


async function onConnect(socket){
  console.log('user connected')
  socket.on('load-page', async function(e){
    await main();
    let groups = await getGroups(client);  
    let data = {groups: groups}
    console.log(data);
    socket.emit('load-groups', data);
  })

  socket.on('create-group', async function(e){
    console.log('group name: ', e)
    makeGroups(client, e);
    let groups = await getGroups(client);  
    let data = {groups: groups}
    console.log('reload users')
    io.emit('reload-groups', data);
  })

  socket.on('request-messages', data =>{
    console.log('data: ', data);
    getMessages(data.group, data.room);
  })


}

app.get('/', async function(req, res){
  res.render('index');
});

app.post('/', async function(req, res){
  console.log(req.body)
})

app.post('/new_room', async function(req, res){
  console.log(req.body)

  if(req.body.room_name != null){
    let room_name = req.body.room_name;
    let group_name = req.body.group;
    makeRoom(client, group_name, room_name);
  }
  
  let groups = await getGroups(client);  
  let data = {groups: groups}
  console.log('reload users')
  
  io.emit('reload-groups', data);
  res.redirect('/')
})


async function main(){
  const url = "mongodb+srv://admin:nxLMpNZw4Gxejkw1@cluster0-v7p6o.mongodb.net/test?retryWrites=true&w=majority";
  client = new MongoClient(url, {useUnifiedTopology: true});
 
  try {
      // Connect to the MongoDB cluster
      await client.connect();

  } catch (e) {
      console.error(e);
  } 
}

// these functions work asynconicly so you have to wait for them to finish before using them.
async function getGroups(client){
  let results = await client.db('discord-clone').collection('group').find().toArray()
  return results;
}

async function makeGroups(client, group_name){
  await client.db('discord-clone').collection('group').updateOne(
    // condition that this doesn't exist
    {name: group_name},
    // if it doesn't exist, implement this in addition
    { $setOnInsert: {rooms: ['General', 'Work']}},
    // if it does exist, don't implement the addition
    {upsert: true}
    )
}

async function makeRoom(client, group_name, room_name){
  await client.db('discord-clone').collection('group').updateOne(
    // condition that this doesn't exist
    {name: group_name},
    // if it doesn't exist, implement this in addition
    { $addToSet: {rooms: [room_name]}},
    { upsert : true })
}


async function getMessages(group, room){
  let messages = await client.db('discord-clone').collection('messages').find({group: group, room:room}).toArray();
  console.log(messages);
}

http.listen(process.env.PORT || 3000 );
