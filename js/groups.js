"use strict";
$(function() {

    var $leave_group_button = $('#leave_group');
    var $coord_change_buttons = $('.change_coord');
  
    $coord_change_buttons.bind('click', function(event) {
        var usr = find_user(sessionStorage.getItem('username'));
        var selected_charge = d3.select("circle[class=\"selected\"]");
        if (selected_charge.empty()) return;
        var index = selected_charge.attr("index");
        var cx = usr.charges[index].x + parseFloat($(event.target).attr('data-x'))*10;
        var cy = usr.charges[index].y - parseFloat($(event.target).attr('data-y'))*10;

        if (cx > 580 || cx < 20) return;
        if (cy > 380 || cy < 20) return;

        parseFloat(d3.select("circle[class=\"selected\"]").attr("cx", cx));
        parseFloat(d3.select("circle[class=\"selected\"]").attr("cy", cy));
        usr.charges[index].x = cx;
        usr.charges[index].y = cy;
        var info = {index: index};
        info.charges = usr.charges;

      
        socket.coordinate_change(sessionStorage.getItem('username'),
                                 sessionStorage.getItem('class_id'),
                                 sessionStorage.getItem('group_id'),
                                 info
                                );
        socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " moved point to "+ cx + " " + cy
                          );
    });
    
    $leave_group_button.bind('click', function() {
        socket.group_leave(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           false
                          );

        socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " left the group"
                          );
    });

});
