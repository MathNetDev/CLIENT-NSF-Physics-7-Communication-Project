$(function() {
    var $logout_button = $('#logout');

    $logout_button.click(function() {
        socket.logout(sessionStorage.getItem('username'), 
                      sessionStorage.getItem('class_id')
                     );
    });

     $('#buttons').on('click', ':input', function() {
        socket.group_join(sessionStorage.getItem('username'), 
                          sessionStorage.getItem('class_id'),
                          $(this).index('#buttons :input') + 1
                         );
    });
});
