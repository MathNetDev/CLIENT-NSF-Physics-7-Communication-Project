var classes = require('./public/available_classes');
var socketio = require('socket.io');
var database = require('./database_actions');
var hash = require('./hashes');
var Q = require("q");
module.exports = server_sockets;

function add_user_to_class(username, class_id) {
    var deferred = Q.defer();
    if (username === "" || class_id === "") {
        deferred.reject('Invalid class ID or username.');
        return deferred.promise;
    }

    if (class_id in classes.available_classes) {
        if (!(username in classes.available_classes[class_id]["user"])) {
            classes.available_classes[class_id]["user"][username] = {};
            classes.available_classes[class_id]["user"][username]["x"] = 0.0;
            classes.available_classes[class_id]["user"][username]["y"] = 0.0;
            deferred.resolve();
        }
        else {
            deferred.reject('Username ' + username + ' is already taken.');
        }
    }
    else {
        deferred.reject('Class ID ' + class_id + ' does not exist.');
    }

    return deferred.promise;
}

function remove_user_from_class(username, class_id) {
    var deferred = Q.defer();
    
    if (class_id in classes.available_classes) {
        if (username in classes.available_classes[class_id]["user"]) {
            delete classes.available_classes[class_id]["user"][username]; 
            deferred.resolve();
        }
        else {
            deferred.reject('Username ' + username + ' is invalid.');
        }
    }
    else {
        deferred.reject('Class ID ' + class_id + ' is invalid.');
    }

    return deferred.promise;
}

function get_all_groups_from_class(class_id) {
    var deferred = Q.defer();
    if (class_id in classes.available_classes) {
        var groups = [];
        for (var i in classes.available_classes[class_id]){
            if (i != "user" && i != "class_name"){
                groups.push({
                    grp_name : i,
                    num : classes.available_classes[class_id][i]["students"].length
                });
            }
        }

        deferred.resolve(groups);
    }
    else {
        deferred.reject('Class ID ' + class_id + ' is invalid.');
    }

    return deferred.promise;
}

function add_user_to_group(username, class_id, group_id) {
    var deferred = Q.defer();

    if (class_id in classes.available_classes) {
        if (group_id in classes.available_classes[class_id]) {
            if (username in classes.available_classes[class_id]["user"]) {
            classes.available_classes[class_id][group_id]["students"].push(username);
            deferred.resolve();
            }
            else {
                deferred.reject('Username ' + username + ' is invalid.');
            }
        }
        else {
            deferred.reject('Group ID ' + group__id + ' is invalid.');
        }
    }
    else {
        deferred.reject('Class ID ' + class_id + ' is invalid.');
    }

    return deferred.promise;
}

function remove_user_from_group(username, class_id, group_id) {
    var deferred = Q.defer();
    
    if (class_id in classes.available_classes) {
        if (group_id in classes.available_classes[class_id]) {
            if (username in classes.available_classes[class_id]["user"]) {
                var index = classes.available_classes[class_id][group_id]["students"].indexOf(username);

                if (index > -1) {
                    classes.available_classes[class_id][group_id]["students"].splice(index, 1);
                    classes.available_classes[class_id]["user"][username]["x"] = 0.0;
                    classes.available_classes[class_id]["user"][username]["y"] = 0.0;
                    deferred.resolve();
                }
                else {
                    deferred.reject('Username ' + username + ' is invalid.');
                }

            }
            else {
                deferred.reject('Username ' + username + ' is invalid.');
            }
        }
        else {
            deferred.reject('Group ID ' + group_id + ' is invalid.');
        }
    }
    else {
        deferred.reject('Class ID ' + class_id + ' is invalid.');
    }

    return deferred.promise;
}

function get_info_of_group(class_id, group_id) {
    var deferred = Q.defer();
    var other_members = [];
    
    if (class_id in classes.available_classes) {
        if (group_id in classes.available_classes[class_id]) {
            for (var i in classes.available_classes[class_id][group_id]["students"]) {
                var student_name = classes.available_classes[class_id][group_id]["students"][i];
                other_members.push({
                    member_name : student_name,
                    member_x : classes.available_classes[class_id]["user"][student_name]["x"], 
                    member_y : classes.available_classes[class_id]["user"][student_name]["y"]
                });
            }
            deferred.resolve(other_members);
        }
        else {
            deferred.reject('Group ID ' + group_id + ' is invalid.');
        }
    }
    else {
        deferred.reject('Class ID ' + class_id + ' is invalid.');
    }
    
    return deferred.promise;
}

function update_users_coordinates(username, class_id, x, y) {
    var deferred = Q.defer();

    if (class_id in classes.available_classes) {
        if (username in classes.available_classes[class_id]["user"]) {
            if (!isNaN(x) && !isNaN(y)) {
                classes.available_classes[class_id]["user"][username]["x"] += x;
                classes.available_classes[class_id]["user"][username]["y"] += y;

                var data = {
                    x : classes.available_classes[class_id]["user"][username]["x"], 
                    y : classes.available_classes[class_id]["user"][username]["y"] 
                }

                deferred.resolve(data);
            }
            else {
                deferred.reject('Coordinate shift (' + x + ', ' + y + ') is invalid.');
            }
        }
        else {
            deferred.reject('Username ' + username + ' is invalid.');
        }
    }
    else {
        deferred.reject('Class ID ' + class_id + ' is invalid.');
    }
    return deferred.promise;
}

function server_sockets(server, client){

    var io = socketio.listen(server);
    io.on('connection', function(socket) {

        socket.on('login', function(username, class_id) {
            add_user_to_class(username, class_id).then(function() {
                var response = {
                    username : username,
                    class_id : class_id 
                }
                socket.emit('login_response', response);
            }).fail(function(error) {
                server_error(error, error); 
            });
        }); //authenticates class ID and makes sure there is not another user with the same name. 
            //adds in user info to datastructure if unique. else displays an error message

        socket.on('logout', function(username, class_id) {
            remove_user_from_class(username, class_id).then(function() { 
                socket.leave(class_id + "x");
                var response = {
                    username : username,
                    class_id : class_id
                }
                socket.emit('logout_response', {});
            }).fail(function(error) {
                server_error(error, error);
            });
        }); 

        socket.on('groups_get', function(username, class_id) {
            get_all_groups_from_class(class_id).then(function(groups) {
                socket.join(class_id + "x");
                var response = {
                    username : username,
                    class_id : class_id,
                    groups : groups
                }
                io.sockets.to(class_id + "x").emit('groups_get_response', response);
            }).fail(function(error) {
                server_error(error, error);
            });
        }); //populates groups array with groups with the given class id and returns it to client.

        socket.on('group_join', function(username, class_id, group_id) {
            add_user_to_group(username, class_id, group_id).then(function() {
                get_all_groups_from_class(class_id).then(function(groups) {
                    var response = {
                        username : username,
                        class_id : class_id,
                        group_id : group_id,
                        groups : groups
                    }
                    socket.emit('group_join_response', response);
                    io.sockets.to(class_id + "x").emit('groups_get_response', response);
                }).fail(function(error) {
                    server_error(error, error);
                });
            }).fail(function(error) {
                server_error(error, error);
            });
        }); //adds user to the students array of given group

        socket.on('group_leave', function(username, class_id, group_id) {
            remove_user_from_group(username, class_id, group_id).then(function() {
                socket.leave(class_id + "x" + group_id);
                get_info_of_group(class_id, group_id).then(function(other_members) {
                    var response = {
                        username : username,
                        class_id : class_id,
                        group_id : group_id,
                        other_members : other_members
                    }
                    socket.emit('group_leave_response', response);
                    io.sockets.to(class_id + "x" + group_id).emit('group_info_response', response);
                }).fail(function(error) {
                    server_error(error, error);
                });
            }).fail(function(error) {
                server_error(error, error);
            });
        }); //resets user coordinates and removes them from the students array in current group, leaves your socket group

        socket.on('group_info', function(username, class_id, group_id) {
            get_info_of_group(class_id, group_id).then(function(other_members) {
                socket.join(class_id + "x");
                socket.join(class_id + "x" + group_id);
                var response = {
                    username : username,
                    class_id : class_id,
                    group_id : group_id,
                    other_members : other_members,
                }
                io.sockets.to(class_id + "x" + group_id).emit('group_info_response', response);
            }).fail(function(error) {
                server_error(error, error);
            });
        }); //populates array other_members with the other students and their coordinates in the given group, 
            //emits different response if user is leaving or joining. updates number of members in the group in class.html

        socket.on('coordinate_change', function(username, class_id, group_id, x, y) {
            update_users_coordinates(username, class_id, x, y).then(function(data) {
                var response = {
                    username : username,
                    class_id : class_id,
                    group_id : group_id,
                    x : data.x,
                    y : data.y
                }
                io.sockets.to(class_id + "x" + group_id).emit('coordinate_change_response', response);
            }).fail(function(error) {
                server_error(error, error);
            });
        }); //registers the change of coordinates in the datastructure and passes them back to group
       
        // This function will notify the client when an error has occurred 
        // due to a client socket emission
        function server_error(error, message) {
            console.log(error);
            socket.emit('server_error', {message: message});
        };

        // This is the handler for the add-class client socket emission
        // It calls a database function to create a class and groups
        socket.on('add-class', function(class_name, group_count, secret) {
            if (secret == "ucd_247") {
                database.create_class(class_name, group_count, function(class_id) {
                    var id_hash = hash.add_hash(class_id);
                    console.log(class_id);
                    console.log(id_hash);
                    classes.available_classes[id_hash] = {}
                    for(var i=0; i<group_count; i++) {
                        classes.available_classes[id_hash][i+1] = {students:[], deleted:false};
                    }
                    classes.available_classes[id_hash]['user'] = {}
                    classes.available_classes[id_hash]['class_name'] = class_name;
                    socket.emit('add-class-response', {class_id: id_hash});
                });

            }
        });

        // This is the handler for the add-group client socket emission
        // It calls a database function to create a group for a class
        socket.on('add-group', function(class_id, secret) {
            if (secret == "ucd_247") {
                hash.find_id(class_id, function(unhashed_id) {
                    database.create_group(unhashed_id, function(group_id) {
                        console.log(group_id, unhashed_id);
                        classes.available_classes[class_id][group_id] = {students:[], deleted:false};
                        var groups = get_all_groups_from_class(class_id);
                        var response = {
                            username : "Admin",
                            class_id : class_id,
                            groups : groups
                        }
                        //console.log(JSON.stringify(classes.available_classes, null, 2));
                        //console.log(JSON.stringify(groups, null, 2));

                        socket.emit('add-group-response', {});
                        io.sockets.to(class_id + "x").emit('groups_get_response', response);
                    });
                });
            }
        }); 

        // This is the handler for the delete-group client socket emission
        // It calls a database function to delete a group for a class
        socket.on('delete-group', function(class_id, group_id, secret) {
            if (secret == "ucd_247") {
                hash.find_id(class_id, function (unhashed_id) {
                    database.delete_group(unhashed_id, group_id, function() {
                        delete classes.available_classes[class_id][group_id];
                        var groups = get_all_groups_from_class(class_id);
                        var response = {
                            username : "Admin",
                            class_id : class_id,
                            group_id : group_id,
                            groups : groups
                        }
                        socket.emit('delete-group-response', {});
                        io.sockets.to(class_id + "x" + group_id).emit('group_leave_response', response);
                        io.sockets.to(class_id + "x").emit('groups_get_response', response);
                    });
                });
            }
        });

        // This is the handler for the leave-class client socket emission
        socket.on('leave-class', function(class_id, secret) {
            if (secret == "ucd_247") {
                console.log(class_id);
                hash.remove_hash(class_id);
                delete classes.available_classes[class_id];
                socket.emit('leave-class-response', {});
                io.to(class_id + "x").emit('logout_response', {});
            }
        });

    });
}

