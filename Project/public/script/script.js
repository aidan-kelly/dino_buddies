window.onload = function (){
    const group_container = document.getElementById('groups');
    const room_container = document.getElementById('chatrooms')
    const new_group_form = document.getElementById('new-group-form')
    const new_group_form_input = document.getElementById("group-form-name")
    let groupList;
    let selectedGroup = null;
    let selectedRoom = null;

    const socket = io();

    function loadPage(){
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
    
    new_group_form.addEventListener('submit', function(e){
        e.preventDefault();
        socket.emit('create-group', new_group_form_input.value);
    });


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
                groupSelect(content.name)
                //deselectGroups();
                element.style = 'color:white'
                selectedGroup = element;
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
                    selectedRoom.style = 'color:black';
                }
                selectedRoom = element;
                element.style = 'color:white'    
                getMessages(group, selectedRoom.innerHTML)
            }
        }
        room_container.appendChild(createRoomForm(group));
    }

    function getMessages(group, room){
        console.log('requesting messages');
        socket.emit('request-messages', {group: group, room: room})
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



