window.onload = function (){
    const group_container = document.getElementById('groups');
    const room_container = document.getElementById('chatrooms')
    const new_group_form = document.getElementById('new-group-form')
    const new_group_form_input = document.getElementById("group-form-name")
    const message_form = document.getElementById('send-container')
    const message_form_input = document.getElementById('message-input');
    let groupList;
    let selectedGroup = null;
    let selectedRoom = null;
    let id = null;
    let socket = io();
    let roomSocket = null;


    var ID = function () {
        return Math.random().toString(36).substr(2, 9);
    };

    function loadPage(){
        id = ID();
        console.log(id);
        socket.emit('load-page')
    }

    socket.on('load-groups', e=>{
        groupList = e.groups;
        loadGroups(e.groups)
    })

    socket.on('reload-groups', e=>{
        console.log('reloading groups')
        group_container.innerHTML = ''
        let groups_content = e.groups;
        loadGroups(groups_content)
    })

    socket.on('room-accepted', e =>{
        //console.log('accepted to room')
        roomSocket = io(e);
    })

    socket.on('messages', messages =>{
        console.log(messages);
    })
    
    new_group_form.addEventListener('submit', function(e){
        e.preventDefault();
        socket.emit('create-group', new_group_form_input.value);
    });

    message_form.addEventListener('submit', function(e){
        e.preventDefault();
        console.log(selectedGroup.innerHTML, selectedRoom.innerHTML, message_form_input.value);
        socket.emit('user-message', {group: selectedGroup.innerHTML, room: selectedRoom.innerHTML, message: message_form_input.value})
        message_form_input.value = '';
    })


    loadPage();
    
    // prints the groups name to the page as a list
    function loadGroups(groups){
        group_container.innerHTML = '';
        groups.forEach(content => { 
            let element = document.createElement('p');
            element.innerHTML = content.name;
            element.onclick = function(){
                if(selectedGroup != null){
                    selectedGroup.style = 'color:black';
                }
                selectedGroup = null;
                selectedGroup = element;
                
                console.log(element)
                groupSelect(content.name)
                //deselectGroups();
                element.style = 'color:white'
            }
            group_container.appendChild(element);
        });
    }

    function groupSelect(group){
        groupList.forEach(content => { 
            if(content.name == group){
                //console.log(group, content.rooms);
                loadChatrooms(group, content.rooms);
            }
        });
    }

    function loadChatrooms(group, rooms){
        room_container.innerHTML = '';
        for(let i = 0; i < rooms.length; i++){
            let element = document.createElement('p')
            element.appendChild(document.createTextNode(rooms[i]));
            room_container.appendChild(element)
            element.onclick = function(){
                if(selectedRoom != null){
                    console.log('leaving', '/'+group+'-'+ selectedRoom.innerHTML)
                    socket.emit('leave', '/'+group+'-'+ selectedRoom.innerHTML);
                    selectedRoom.style = 'color:black';
                }
                selectedRoom = element;
                element.style = 'color:white'    
                getMessages(selectedGroup.innerHTML, selectedRoom.innerHTML)
                //console.log('/'+group+'-'+rooms[i]);
                socket.emit('join', '/'+group+'-'+rooms[i])
            }
        }
        room_container.appendChild(createRoomForm(group));
    }

    function getMessages(group, room){
        console.log('requesting messages');
        socket.emit('request-messages', {group: group, room: room})
    }

    function chatroomSelected(element){

    }




    function createRoomForm(group){
        let form = document.createElement('form');
        form.action = "/new_room";
        form.id = 'room_form';
        form.method = 'POST';

        let input = document.createElement('input');
        input.id = 'new_room';
        input.type = 'hidden';
        input.name = 'group'; 
        input.value = group

        let input2 = document.createElement('input');
        input2.id = 'new_room';
        input2.style = 'width: 95%'
        input2.type = 'text';
        input2.name = 'room_name'; 
        input2.placeholder = 'add room'

        form.appendChild(input);
        form.appendChild(input2);
        return form;
    }


}



