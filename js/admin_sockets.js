"use strict";
(function (Admin, $) {
    var sock,
        listeners = [];

    // Using the namespace Admin, this is a custom Socket object that takes 
    // a socket.io socket object, and initializes the socket functions
    Admin.Socket = function (socket) {
        return init(socket);
    };


    // The initialization function for the Admin.Socket object
    var init = function (socket) {
       // sock = socket;

        // This funcrion takes a username and password provided by the user
        // The socket then emits this data to the server to create the admin
        var create_admin = function(username, password, secret) {
            socket.emit('create-admin', username, password, secret);
        };

        // This function takes a username and a password
        // The socket then emits this data to the server to check the combination
        var check_username = function (username, password, secret) {
            socket.emit('check-username', username, password, secret);
        }

        // Takes admin id and a normal string 
        // Socket then emits data to create a new session
        var create_session = function(admin_id, string) {
            socket.emit('create-session', admin_id, string);
        }

        // This function takes a class id and group id provided by the user.
        // The socket then emits this data to the server to delete a session
        // from the class.
        var delete_session = function (admin_id) {
            socket.emit('delete-session', admin_id);
        }

        // This function takes a admin id and check to see if the 
        // admin is already logged in
        var check_session = function (admin_id, check) {
            socket.emit('check-session', admin_id, check);
        }

        // This function takes a class name and group count provided by the 
        // user. The socket then emits this data to the server to create 
        // the class and groups. 
        var add_class = function (class_name, group_count, secret, admin_id) {
            socket.emit('add-class', class_name, group_count, secret, admin_id);
        };

        // This function takes a class id provided by the user. The socket then
        // emits this data to the server to join a class.
        var join_class = function (class_id, secret) {
            socket.emit('join-class', class_id, secret);
        };

        // This function takes a class name provided by the user.
        // The socket then emits this data to the server to create a 
        // group for the class.
        var add_group = function (class_id, secret) {
            socket.emit('add-group', class_id, secret);
        }

        // This function takes a class id and group id provided by the user.
        // The socket then emits this data to the server to delete a group
        // from the class.
        var delete_group = function (class_id, group_id, secret) {
            socket.emit('delete-group', class_id, group_id, secret);
        }

        // This function takes a class id provided by the user.
        // The socket then emits this data to the server to leave a class.
        var leave_class = function (class_id, secret) {
            socket.emit('leave-class', class_id, secret);
        }

        // This function takes a class id and settings data provided by the
        // user.
        // The socket then emits this data to the server to save the global
        // settings for the class.
        var save_settings = function (class_id, settings, secret) {
            socket.emit('save-settings', class_id, settings, secret);
        }

        // This function takes a secret password provided by the user
        // The socket then emits this to the server to send the list of
        // current created classes and their login IDs to the user.
        var get_classes = function (secret){
            socket.emit('get-classes', secret);
        }

        // This function disconnects the socket
        var disconnect = function() {
            socket.disconnect();
        };

        //
        // Socket event handlers
        //

        socket.on('server_error', function(data) {
            server_error(data.message);
        });

        socket.on('create-admin-response', function(data){
            create_admin_response(data.check);
        });

        socket.on('check-username-response', function(admin_id, check) {
            check_username_response(admin_id, check)
        });

        socket.on('check-session-response', function(admin_id, check) {
            check_session_response(admin_id, check);
        });

        socket.on('add-class-response', function(data) {
            //console.log('weeeeee');
            add_class_response(data.class_id, data.class_name, data.group_count);
        });

        socket.on('add-group-response', function(data) {
            add_group_response();
        });

        socket.on('delete-group-response', function(data) {
            delete_group_response();
        });

        socket.on('leave-class-response', function(data) {
            leave_class_response(data.disconnect);
        });

        socket.on('group_info_response', function(data) {
            group_info_response(data.username, data.class_id, data.group_id, 
                                data.other_members, data.status);
        });

        socket.on('coordinate_change_response', function(data) {
            coordinate_change_response(data.username, data.class_id, 
                                       data.group_id, data.x, data.y, data.info);
        });
        socket.on('get-classes-response', function(data){
            get_classes_response(data.classes);
        });

        return {
            create_admin: create_admin,
            check_username: check_username,
            create_session: create_session,
            delete_session: delete_session,
            check_session: check_session,
            add_class: add_class,
            join_class: join_class,
            add_group: add_group,
            delete_group: delete_group,
            leave_class: leave_class,
            save_settings: save_settings,
            get_classes: get_classes,
            disconnect: disconnect
        };
    };

    //var socket = io(location.host + '/admins');
})(window.Admin = window.Admin || {}, window.jQuery);
