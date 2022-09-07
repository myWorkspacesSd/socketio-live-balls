app.controller('indexController', ['$scope', 'indexFactory', 'configFactory', ($scope, indexFactory, configFactory) => {

    $scope.messages = [];
    $scope.players = {};

    function scrollTop(){
        setTimeout(() => {
            const element = document.getElementById('chat-area');
            element.scrollTop = element.scrollHeight;
        }, 500);
    }

    $scope.init = () => {
        const username = prompt('Please enter a username');
        if(username){
            initSocket(username);
        }else{
            return false;
        }
    };

    function showBubble(id, message){
        $('#'+ id).find('.message').show().html(message);
        setTimeout(() => {
            $('#'+ id).find('.message').hide();
        }, 2000);
    }

    async function initSocket(username){
        const connectionOptions = {
            reconnectionAttempts: 3,
            reconnectionDelay: 600
        };

        try {
            const socketUrl = await configFactory.getConfig();
            const socket = await indexFactory.connectSocket(socketUrl.data.socketUrl, connectionOptions)
            socket.emit('newUser', {username});

            socket.on('initPlayers', (players) => {
                    $scope.players = players;
                    $scope.$apply();
                });

            socket.on('newUser', (data) => {
                const messageData={
                    type:{
                        code: 0,
                        text: 1
                    },
                    username: data.username
                };

                $scope.messages.push(messageData);
                $scope.players[data.id] = data;
                scrollTop();
                $scope.$apply();
            });

            socket.on('disUser', (data) => {
                const messageData={
                    type:{
                        code: 0,
                        text: 0
                    },
                    username: data.username
                };

                $scope.messages.push(messageData);
                delete $scope.players[data.id];
                scrollTop();
                $scope.$apply();
            });

            socket.on('animateForInfo', (data) => {
                    $('#'+data.socketId).animate({'left': data.x, 'top': data.y}, () => {
                        animate = false
                    });
            });

            let animate = false;
            $scope.onClickPlayer = ($event) => {
                console.log($event.offsetX, $event.offsetY)
                if(!animate){
                    animate = true;

                    let x = $event.offsetX;
                    let y = $event.offsetY;

                    socket.emit('animate', {x,y});

                    $('#'+socket.id).animate({'left': x, 'top':y}, () => {
                        animate = false
                    });
                }            
            }

            $scope.newMessage = () => {
                let message = $scope.message;

                const messageData={
                    type:{
                        code: 1,
                    },
                    username: username,
                    message: message
                };

                $scope.messages.push(messageData);
                $scope.message = '';

                socket.emit('newMessage', messageData);
                scrollTop();
                showBubble(socket.id, message);
                $scope.$apply();
            }

            socket.on('newMessage', (data) => {
                    $scope.messages.push(data);
                    showBubble(data.socketId, data.message);
                    scrollTop();
                    $scope.$apply();
            });
        } catch (err) {
            console.log(err);
        }
    }
}]);