var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
app.use(express.urlencoded())
const mongo = require('mongodb')
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');

// For auth
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');

app.use(express.static('public'));
app.use(bodyParser());

// Instantiate flash - used for login error
app.use(flash());

// Express session
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
let client;
let nsps = [];
//let groups = getGroups(client);

//Dataset
// Move to mongodb once working
let users = [
	{name: "John", username: "john", password: "password"},
	{name: "Jenny", username: "jenny", password: "password"},
	{name: "Rose", username: "rose", password: "password"},
	{name: "Peter", username: "peter", password: "password"},
	{name: "Ken", username: "ken", password: "password"}
];

let LocalStrategy = require('passport-local').Strategy;


io.on('connect', onConnect);

async function setupGroupRoomSocketNamespaces(){

  let groups = await getGroups(client);
  //console.log(groups)
  let j = 0;
  groups.forEach(content =>{
   
    for(let i = 0; i < content.rooms.length; i++){
      nsps[j] = io.of('/'+content.name+'-'+content.rooms[i]);
      //console.log('made socket: ', '/'+content.name+'-'+content.rooms[i]);
      j++;
    }
  })

}



main();
async function onConnect(socket){
  console.log('user connected to Dino-buddies')
  socket.on('load-page', async function(e){
    let groups = await getGroups(client);  
    let data = {groups: groups}
    //console.log(data);
    socket.emit('load-groups', data);
  })


  socket.on('join', data =>{
    console.log('user requested to join: ' , data)
    socket.join(data);
    socket.emit('room-accepted', data);
    socket.emit('messages', 'welcome to the chatroom ' + data)
  })

  socket.on('leave', data =>{
    console.log('user leaving: ', data)
    socket.leave(data)
    io.to(data).emit('messages', 'if you left you should not get this message ' + data)
  })
  
  socket.on('create-group', async function(e){
    console.log('group name: ', e)
    makeGroups(client, e);
    let groups = await getGroups(client);  
    let data = {groups: groups}
    console.log('reload users')
    io.emit('reload-groups', data);
  })

  socket.on('request-messages', async function(data){
    console.log('data: ', data);
    let messages = await getMessages(data.group, data.room);
    socket.emit('messages', messages);
  })

  socket.on('user-message', async function(data){
    //console.log('message data: ', data);
    saveMessage(client, data.group, data.room, data.message);
    console.log('/'+data.group+'-'+data.room)
    io.to('/'+data.group+'-'+data.room).emit('messages', data.message);
  })
}

//Authentication strategy. This handles any authentication logic - currently local
// Idea: implement this localstrategy to use mongodb database for login
// https://www.geeksforgeeks.org/nodejs-authentication-using-passportjs-and-passport-local-mongoose/
passport.use(new LocalStrategy(
	function(username, password, done) 
	{
		//Find and return the first instance of user object that match the username and password specified from the login form.
		let user = users.find((user) => {
			return (user.username === username && user.password === password);
		});
		
		if(user)
		{
			return done(null, user);
		}
		else
		{
			return done(null, false, { message: 'Incorrect username or password.' });
		}
	}
));


//On success authentication, this handles the serialization of the user data into a session storage
passport.serializeUser(function(user, done) {
  done(null, user);
});

//On success authentication, this handles the deserialization of the user data from a session storage
passport.deserializeUser(function(user, done) {
  done(null, user);
});

//Middleware to protect routes from users that are not logged on
function protectMiddleware(req, res, next)
{
	//if no user is logged-in, redirect to login page
	if(!req.user)
	{
		return res.redirect('/login');
	}
	return next();
}

app.get('/', protectMiddleware, async function(req, res){
  res.render('index', {user: req.user});
});

app.get('/login', function(req, res) {
    res.render('login', {message: req.flash('error')});
});

app.post('/login', 
  passport.authenticate('local', { successRedirect: '/',
                          failureRedirect: '/login',
                          failureFlash: true})
);

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
      await setupGroupRoomSocketNamespaces();

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
  group_name = group_name.replace(/\s/g, '-')
  await client.db('discord-clone').collection('group').updateOne(
    // condition that this doesn't exist
    {name: group_name},
    // if it doesn't exist, implement this in addition
    { $setOnInsert: {rooms: ['General', 'Work']}},
    // if it does exist, don't implement the addition
    {upsert: true}
    )
}

async function saveMessage(client, group, room, message){
  console.log(group, room, message);
  let data = {group: group, room: room, message: message}
  await client.db('discord-clone').collection('messages').insertOne(data);
}

async function makeRoom(client, group_name, room_name){
  await client.db('discord-clone').collection('group').updateOne(
    // condition that this doesn't exist
    {name: group_name},
    // if it doesn't exist, implement this in addition
    { $addToSet: {rooms: room_name}},
    { upsert : true })
}


async function getMessages(group, room){
  let messages = await client.db('discord-clone').collection('messages').find({group: group, room:room}).toArray();
  //console.log('message: ', messages);
  return messages;
}

http.listen(process.env.PORT || 3000 );
console.log("Listening on Port 3000");
