(function (Student, $) {
    var listeners = [];

    Student.Socket = function (socket) {
        return init(socket);
    }

    var init = function (socket) {

        var login = function (username, class_id) {
            socket.emit('login', username, class_id);
        }

        var logout = function(username, class_id) {
            socket.emit('logout', username, class_id);
        }

        var groups_get = function(username, class_id) {
            socket.emit('groups_get', username, class_id);
        }

        var group_join = function(username, class_id, group_id) {
            socket.emit('group_join', username, class_id, group_id);
        }
        
        var group_leave = function(username, class_id, group_id) {
            socket.emit('group_leave', username, class_id, group_id);
        }

        var group_info = function(username, class_id, group_id) {
            socket.emit('group_info', username, class_id, group_id);
        }

        var coordinate_change = function(username, class_id, group_id, x, y) {
            socket.emit('coordinate_change', username, class_id, group_id, x, y);
        }

        var get_settings = function(class_id, group_id) {
            socket.emit('get-settings', class_id, group_id);
        }

        var disconnect = function() {
            socket.disconnect();
        }

        socket.on('server_error', function(data) {
            server_error(data.message);      
        });
       
        socket.on('login_response', function(data) {
            login_response(data.username, data.class_id);
        });

        socket.on('logout_response', function(data) {
            logout_response();
        });

        socket.on('groups_get_response', function(data) {
            groups_get_response(data.username, data.class_id, data.groups);
        });

        socket.on('group_join_response', function(data) {
            group_join_response(data.username, data.class_id, data.group_id);
        });

        socket.on('group_leave_response', function(data) {
            group_leave_response(data.username, data.class_id, data.group_id);
        });

        socket.on('group_info_response', function(data) {
            group_info_response(data.username, data.class_id, data.group_id, 
                                data.other_members);
        });

        socket.on('coordinate_change_response', function(data) {
            coordinate_change_response(data.username, data.class_id, 
                                       data.group_id, data.x, data.y);
        });

        socket.on('get-settings-response', function(data) {
            get_settings_response(data.class_id, data.settings);
        });

        return {
            login: login,
            logout: logout,
            groups_get: groups_get,
            group_join: group_join,
            group_leave: group_leave,
            group_info: group_info,
            coordinate_change: coordinate_change,
            get_settings: get_settings,
            disconnect: disconnect
        };
    }
    
})(window.Student = window.Student || {}, window.jQuery);
