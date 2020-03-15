var express = require('express');
var app = express();
var io = require('socket.io')(http);
app.use(express.urlencoded())
const mongo = require('mongodb')
const MongoClient = require('mongodb').MongoClient;
var http = require('http').createServer(app);
app.use(express.static('public'))
app.set('view engine', 'ejs')
let client;


app.get('/', async function(req, res){
  await main();
  let groups = await getGroups(client);  
  data = {groups: groups}
  console.log(data);
  res.render('index', data);
});

app.post('/new_group', async function(req, res){
  console.log(req.body.name);
  makeGroups(client, req.body.name)
  res.render('index');
});

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
  await client.db('discord-clone').collection('group').update(
    // condition that this doesn't exist
    {name: group_name},
    // if it doesn't exist, implement this in addition
    { $setOnInsert: {rooms: ['General', 'Work']}},
    // if it does exist, don't implement the addition
    {upsert: true}
    )
}


app.listen(process.env.PORT || 3000 );