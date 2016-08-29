"use strict";

/**
 * @function escapeStr
 * @param {string} str the string to be escaped
 * @description to escape user inputted strings to prevent injection attacks
 */
function escapeStr(str) {
    if (str)
        return str.replace(/([ #;?%&,.+*~\':"!^$[\]()=><|\/@])/g,'\\$1');      

    return str;
}

/**
 * @function server_error
 * @param {string} error the error to output on the page
 * @description to handle errors sent by the server
 */
function server_error(error) {
    var $login_view = $('.login_view');
    var $class_view = $('.class_view');
    var $group_view = $('.group_view');

    console.log(error);
    sessionStorage.setItem('error', error);
    location.reload();
}

/**
 * @function login_response
 * @param {string} username name of user logging in
 * @param {number} class_id id of class user is logging into
 * @description shows class view, adds data to sessionStorage, and gets group data
 */
function login_response(username, class_id) {
    var $login_view = $('.login_view');
    var $class_view = $('.class_view');
    var $group_view = $('.group_view');

    $login_view.hide();
    $class_view.show();
    $group_view.hide();

    username = username.replace(/&lt;/g,'<').replace(/&gt;/g, '>');

    sessionStorage.setItem('class_id', class_id);
    sessionStorage.setItem('username', username);
    socket.groups_get(username, class_id);
}

/**
 * @function logout_response
 * @param {boolean} disconnect name of user logging in
 * @description switches to login view and deletes data from sessionStorage
 */
function logout_response(disconnect) {
    var $login_view = $('.login_view');
    var $class_view = $('.class_view');
    var $group_view = $('.group_view');

    $login_view.show();
    $class_view.hide();
    $group_view.hide();
    if(!disconnect){
        sessionStorage.removeItem('class_id');
        sessionStorage.removeItem('username');
    }
}

/**
 * @function groups_get_response
 * @param {string} username name of user getting the groups
 * @param {number} class_id id of class that groups belong to
 * @param {object[]} groups array of object holding each groups info
 * @description displays each group in class with user count
 */
//populates $groups with buttons with info from groups.
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
//increments group_size if status is true (user is joining group), else decrements
function group_numbers_response(username, class_id, group_id, status, group_size){
    var group_size = (status ? group_size++ : group_size--);
    $("#grp" + group_id).val('Group ' + group_id + ' - ' + group_size);

}
// sets group_id in sessionStorage, then calls group_info
// and get_settings
function group_join_response(username, class_id, group_id) {
    var $login_view = $('.login_view');
    var $class_view = $('.class_view');
    var $group_view = $('.group_view');

    $login_view.hide();
    $class_view.hide();
    $group_view.show();

    // Clear points and redraw
    users = [];
    remove_drawn_vectors();
    
    sessionStorage.setItem('group_id', group_id);

    socket.group_info(username, class_id, group_id, true);
    socket.get_settings(class_id, group_id);
}

// shows class_view, and removes group_id from sessionStorage if disconnect is not true
function group_leave_response(username, class_id, group_id, disconnect) {
    // This function must call socket.groups_get(username, class_id)
    var $login_view = $('.login_view');
    var $class_view = $('.class_view');
    var $group_view = $('.group_view');

    $login_view.hide();
    $class_view.show();
    $group_view.hide();
    if(!disconnect){
        sessionStorage.removeItem('group_id');
    }
    field_remove_user(username, class_id, group_id);
    //socket.group_info(username, class_id, group_id, false);
}

// populates $people with members array values, and appends join/leave message
// based on status. removes #username if leave
function group_info_response(username, class_id, group_id, members, status) {
    var current_user = sessionStorage.getItem('username');
    var current_group = sessionStorage.getItem('group_id');
    var $group_name = $('#number');
    var $people = $('#people');
    //$people.html('');
    if(status){
        for (var i in members) {
            members[i].member_info = JSON.parse(members[i].member_info);
            if(members[i].member_name.replace(/&lt;/g,'<').replace(/&gt;/g, '>') != current_user) {
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
        }
    } else {
        var escUsername = username.replace(/&lt;/g,'<').replace(/&gt;/g, '>');
        escUsername = escapeStr(escUsername);
        $("#" + escUsername).remove();
        field_remove_user(username, class_id, group_id);
    }
    field_sync_users(members);
}

// set #username.(x/y) with the respective coordinates, and adds relavent message
function coordinate_change_response(username, class_id, group_id, x, y, info) {
    var escUsername = username.replace(/&lt;/g,'<').replace(/&gt;/g, '>');
    escUsername = escapeStr(escUsername);
    $('#' + escUsername + ' .x').html(x);
    $('#' + escUsername + ' .y').html(y);

    info = JSON.parse(info);
    field_move_users(username, x, y, info);
}

function xml_change_response(username, class_id, group_id, xml) {
    update_vector_attributes(xml, true);  // redraw the drawn vectors
}

function get_xml_response(username, class_id, group_id, xml){
    update_vector_attributes(xml, false); // don't redraw the drawn vectors
}

// updates $class_settings based on settings array
function get_settings_response(class_id, settings) {
    for (var setting in settings) {
        if (setting == "Hide Options" ){
            settings[setting] ? (
                // $("#settings_button").prop('disabled', true),
                $("#display-settings").prop('hidden', true),
                $("#disabled_settings_message").prop('hidden', false)
            ) : (
                // $("#settings_button").prop('disabled', false),
                $("#display-settings").prop('hidden', false),
                $("#disabled_settings_message").prop('hidden', true)
            );//hide display options if certain global is turned on.
            
            update_display_settings();
        }
        //if setting == "whateveroption"
        //  enableOptionInApp(settings[setting]);
    }
}
//adds a new group button
function add_group_response() {
    var $groups = $('#buttons');
    var group_number = $('#buttons > li:last').index() + 2;
    var button = '<li><input type="button" id="grp' + group_number + '" value="Group ';
    button += group_number + ' - '+ 0;
    button += '" /></li>';
    $groups.append(button);
}
//removes last group button
function delete_group_response() {
    $('#buttons > li:last').remove();
}
