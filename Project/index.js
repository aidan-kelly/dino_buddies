var express = require('express');
var app = express();
var io = require('socket.io')(http);
const mongo = require('mongodb')
const MongoClient = require('mongodb').MongoClient;
var http = require('http').createServer(app);
app.use(express.static('public'))
app.set('view engine', 'ejs')


app.get('/', async function(req, res){
  let client = await main();
  let groups = await getGroups(client);  
  let rooms = await getRooms(client, 'SENG513')
  data = {rooms: rooms, groups: groups}
  console.log(data);
  res.render('index', data);
});

async function main(){
  const url = "mongodb+srv://admin:nxLMpNZw4Gxejkw1@cluster0-v7p6o.mongodb.net/test?retryWrites=true&w=majority";
  const client = new MongoClient(url, {useUnifiedTopology: true});
 
  try {
      // Connect to the MongoDB cluster
      await client.connect();

  } catch (e) {
      console.error(e);
  } 
  //getRooms(client)
  return client;
}


async function getGroups(client){
  let results = await client.db('discord-clone').collection('group').find().toArray()
  return results;
}

async function getRooms(client, group_name){
  let result = await client.db('discord-clone').collection('chat-room').find({"group": group_name}).toArray();
  return result;
}





app.listen(process.env.PORT || 3000 );