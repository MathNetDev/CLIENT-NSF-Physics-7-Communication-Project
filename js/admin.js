"use strict";
$(function() {

    // Initialize variables
    var $create_user_view = $('.create_user_view'); // Div holding user creation view
    var $username_password = $('.username_password_view'); // Div holding user creation view
    var $create_view = $('.create_view'); // Div holding class creation view
    var $manage_view = $('.manage_view'); // Div holding class management view
    var $settings_view = $('.settings_view'); // Div holding class settings view
    var $Secret = $('.Secret'); // Div asking for secret

    var $create_button = $('.create_button'); // Button for creation of class
    var $create_admin_button = $('.create_admin_button'); //Create admin button
    var $create_admin_back = $('.create_admin_back'); //Create admin back
    var $class_input = $('.class_input'); // Input for class name
    var $group_input = $('.group_input'); // Input for # of groups
    var $class_id = $('.class_id'); // Input for class id
    var $new_username = $('.new_username'); // Input for new username
    var $new_password = $('.new_password'); // Input for new password
    var $re_new_password = $('.re_new_password'); // Input for re password
    var $username = $('.username'); // Input for username
    var $password = $('.password'); // Input for password

    var $join_button = $('.join_button'); // Button for joining a class
    var $leave_button = $('.leave_button'); // Button for leaving a class
    var $class_name = $('.class_name'); // Header line for class name
    var $groups = $('.groups'); // List that will hold groups
    var $add_button = $('.add_button'); // Button for adding a group
    var $delete_button = $('.delete_button'); // Button for deleting a group
    var $logout_class_button = $('.logout_class_button'); //Button for loggin out for the admin
    
    var $save_button = $('.save_button'); // Button for saving class settings
    var $settings = $('.setting');
    var $get_classes_button = $('.get_classes_button');
    var $login_button = $('.login_button'); // Login button
    var $new_user = $('.new_user'); // new username field
    var $secret_button = $('.secret_button');

    // Connect to the server using the Admin.Socket object constructor
    
    var class_id;
    
    // Holds secret needed to allow socket calls
    var $secret = "ucd_247";     
    
    // Start with secret view visible and create/manage/settings view hidden
    $create_user_view.hide();
    $create_view.hide();
    $manage_view.hide();
    $settings_view.hide();

    //secret rejoin cookie
    if(localStorage.getItem('admin_id')){
        if(localStorage.getItem('check')){
            socket.check_session(localStorage.getItem('admin_id'), localStorage.getItem('check'));
        }
    }
    else {
        $('.username_password_view').show();
    }
    $('body').show();

    //
    // SECRET INPUT
    //
    $login_button.bind('click', function() {
        socket.check_username($username.val(), $password.val(), $secret);
    });

    //
    // TO CREATE NEW USER
    //
    $new_user.bind('click', function() {
        $('.username_password_view').hide();
        $('.create_user_view').show();
    });

    //
    // CREATE CLASS
    //
    $create_button.bind('click', function() {
        // Tell the server to create a class in the database
        if ($class_input.val() === "") return;
        socket.add_class($class_input.val().trim(), parseInt($group_input.val().trim()), $secret, localStorage.getItem('admin_id'));
        $class_input.val("");
    });

    //
    // GETTING BACK TO LOGIN SCREEN
    //
    $create_admin_back.bind('click', function() {
        $create_user_view.hide();
        $username_password.show();
        $('.new_username').val("");
        $('.new_password').val("");
        $('.re_new_password').val("");
        $('.Secret').val("");

    });

    //
    // JOIN CLASS
    //
    $join_button.bind('click', function() {
        socket.join_class($class_id.val().trim(), $secret);
    });

    //
    // ADD GROUP
    //
    $add_button.bind('click', function() {
        // Tell the server to create a new group for the class in the database
        socket.add_group(sessionStorage.getItem('admin_class_id'), $secret);
    });

    //
    // CREATING A NEW ADMIN
    //
    $create_admin_button.bind('click', function() {

        if($new_password.val() == $re_new_password.val())
            socket.create_admin($new_username.val(), $new_password.val(),  $Secret.val());
        else
            alert(" Both your passwords dont match each other");
    });

    //
    // DELETE GROUP
    //
    $delete_button.bind('click', function() {
        // Only remove if there are groups
        if ($('.groups > li').length > 0) {
            socket.delete_group(sessionStorage.getItem('admin_class_id'), $('.groups > li:last').index() + 1, $secret);
        }
    });

    //
    // LEAVE CLASS
    //
    $leave_button.bind('click', function() {
        socket.leave_class(sessionStorage.getItem('admin_class_id'), $secret, false);

    });

    //
    // SAVE SETTTINGS
    //
    $save_button.bind('click', function() {
        var data = {};
        for(var i=0; i<$settings.length; i++) {
            data[$settings[i].name] = $settings[i].checked;
        }
        socket.save_settings(sessionStorage.getItem('admin_class_id'), data, $secret);
    });

    //
    // LOGGING OUT
    //
    $logout_class_button.bind('click', function(){
        
        $create_view.hide();
        $username_password.show();
        
        socket.delete_session(localStorage.getItem('admin_id'));

        localStorage.setItem('admin_id', '');
        localStorage.setItem('check', '');
        sessionStorage.setItem('admin_secret', '');
    });

});
