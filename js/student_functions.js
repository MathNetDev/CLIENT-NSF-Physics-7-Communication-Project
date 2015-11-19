function server_error(error) {
    var $login_view = $('.login_view');
    var $class_view = $('.class_view');
    var $group_view = $('.group_view');

    console.log(error);
    sessionStorage.setItem('error', error);
    location.reload();
}

function login_response(username, class_id) {
    var $login_view = $('.login_view');
    var $class_view = $('.class_view');
    var $group_view = $('.group_view');

    $login_view.hide();
    $class_view.show();
    $group_view.hide();

    sessionStorage.setItem('class_id', class_id);
    sessionStorage.setItem('username', username);
    socket.groups_get(username, class_id);
}

function groups_get_response(username, class_id, groups) {
    var $groups = $('#buttons');
    var current_user = sessionStorage.getItem('username');
    var current_class = sessionStorage.getItem('class_id');
    $groups.empty();
    for (var i in groups){
        var button = '<li><input type="button" id="grp' + groups[i].grp_name + '" value="Group ';
        button += groups[i].grp_name + ' - '+ groups[i].num;
        button += '" /></li>';
        $groups.append(button);
    }
}

function group_numbers_response(username, class_id, group_id, status, group_size){
    group_size = (status ? group_size++ : group_size--);
    $("#grp" + group_id).val('Group ' + group_id + ' - ' + group_size);
    //console.log(group_id + " " + group_size);

}

function group_join_response(username, class_id, group_id) {
    var $login_view = $('.login_view');
    var $class_view = $('.class_view');
    var $group_view = $('.group_view');
    var $messages = $('#messages');

    $messages.html('');
    $("#people").html('');

    $login_view.hide();
    $class_view.hide();
    $group_view.show();

    sessionStorage.setItem('group_id', group_id);

    socket.group_info(username, class_id, group_id, true);
    socket.get_settings(class_id, group_id);
}

function logout_response() {
    var $login_view = $('.login_view');
    var $class_view = $('.class_view');
    var $group_view = $('.group_view');

    $login_view.show();
    $class_view.hide();
    $group_view.hide();

    sessionStorage.removeItem('class_id');
    sessionStorage.removeItem('username');
}

// EDIT THIS FUNCTION
function group_info_response(username, class_id, group_id, members, status) {
    var current_user = sessionStorage.getItem('username');
    var current_group = sessionStorage.getItem('group_id');
    $group_name = $('#number');
    $people = $('#people');
    //$people.html('');
    if(status){
        for (var i in members) {
            if(members[i].member_name != current_user) {
                var member = '<li id="' + members[i].member_name + '">';
                member += members[i].member_name;
                member += ' - (<span class="x">' + members[i].member_x + '</span>, ';
                member += '<span class="y">' + members[i].member_y + '</span>) </li>';
            }
            else {
                $group_name.html('Group: ' + current_group); //only update this for the new member
                var member = '<li id="' + members[i].member_name + '">';
                member += members[i].member_name + ' (You)';
                member += ' - (<span class="x">' + members[i].member_x + '</span>, ';
                member += '<span class="y">' + members[i].member_y + '</span>) </li>';
            }
            $people.append(member);
            
        }
    
        $('#messages').append(username + ' has joined the group<br/>');
    } else {
        $("#" + username).remove();
        $('#messages').append(username + ' has left the group<br/>');
    }
}

// EDIT THIS FUNCTION
function coordinate_change_response(username, class_id, group_id, x, y, info) {
    $messages = $('#messages');
    
    $('#' + username + ' .x').html(x);
    $('#' + username + ' .y').html(y);
    $messages.append(username + ' has moved their point to (' 
                          + x + ', ' + y +')<br/>');
}

// EDIT THIS FUNCTION
function group_leave_response(username, class_id, group_id) {
    // This function must call socket.groups_get(username, class_id)
    var $login_view = $('.login_view');
    var $class_view = $('.class_view');
    var $group_view = $('.group_view');

    $login_view.hide();
    $class_view.show();
    $group_view.hide();
    sessionStorage.removeItem('group_id');
    
    //socket.group_info(username, class_id, group_id, false);
}

// EDIT THIS FUNCTION
function get_settings_response(class_id, settings) {
    $class_settings = $('#settings');
    $class_settings.html('');

    for (var setting in settings) {
        var setting_item = "<li>" + setting + ": " + settings[setting] + "</li>";
        $class_settings.append(setting_item);
    }
}

function add_group_response() {
    var $groups = $('#buttons');
    var group_number = $('#buttons > li:last').index() + 2;
    var button = '<li><input type="button" id="grp' + group_number + '" value="Group ';
    button += group_number + ' - '+ 0;
    button += '" /></li>';
    $groups.append(button);
}

function delete_group_response() {
    $('#buttons > li:last').remove();
}
