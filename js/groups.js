"use strict";
$(function() {

    var $leave_group_button = $('#leave_group');
    var $coord_change_buttons = $('.change_coord');
  
    $coord_change_buttons.bind('click', function(event) {
        var cx = parseFloat(d3.select("circle[class=\"selected\"]").attr("cx")) 
            + parseFloat($(event.target).attr('data-x'));
        var cy = parseFloat(d3.select("circle[class=\"selected\"]").attr("cy")) 
            - parseFloat($(event.target).attr('data-y'));

        if (cx > 580 || cx < 20) return;
        if (cy > 380 || cy < 20) return;
      
        var x = parseInt($(event.target).attr('data-x'));
        var y = parseInt($(event.target).attr('data-y'));
        socket.coordinate_change(sessionStorage.getItem('username'),
                                 sessionStorage.getItem('class_id'),
                                 sessionStorage.getItem('group_id'),
                                 x,
                                 y
                                );
    });
    
    $leave_group_button.bind('click', function() {
        socket.group_leave(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           false
                          );
    });
});
