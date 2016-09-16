/* DRAWING CONSTANTS */
var users = [];
var MIN_DOT_SIZE = 10;
var MAX_DOT_SIZE = 20;
var AVE_DOT_SIZE = Math.floor((MIN_DOT_SIZE + MAX_DOT_SIZE) / 2.0);

var LABEL_Y_SPACING = 1.2;

var MAX_ABS_CHARGE = 10;
var CHARGE_STEP = 5;

var MIN_VECTOR_LENGTH = 10;

var colors = ["red","green"];

// Need margin spacing to make room for axes
var margin = {top: 40, right: 40, bottom: 40, left: 40},
    width = 680 - margin.left - margin.right,
    height = 480 - margin.top - margin.bottom,
    radius = MAX_DOT_SIZE,
    axisPadding = 10;

// Grid size variables
var horizontalBlock = width/10;
var verticalBlock = height/10;

// Grid line spacing
var gridSpacing = 5;

var horizontalBlockHalf = horizontalBlock / 2;
var verticalBlockHalf = verticalBlock / 2;

// SCALES
// use d3 linear scales to map 0, 1, 2 ... to actual display pixels
var xScale = d3.scale.linear().domain([-width/20, width/20]).rangeRound([0, width]).clamp(true);
var yScale = d3.scale.linear().domain([-height/20, height/20]).rangeRound([height, 0]).clamp(true);    // up is +

// linear scale used to set point charge diameter
var partSizeScale = d3.scale.linear().domain([1, MAX_ABS_CHARGE]).rangeRound([MIN_DOT_SIZE, MAX_DOT_SIZE]).clamp(true);  

// Need margin spacing to make room for axes
var margin = {top: 40, right: 40, bottom: 40, left: 40},
    width = 680 - margin.left - margin.right,
    height = 480 - margin.top - margin.bottom,
    radius = MAX_DOT_SIZE;

// Axes  
var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .innerTickSize(-height)
        .outerTickSize(0)
        .tickPadding(verticalBlock/gridSpacing);

var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .innerTickSize(-width)
        .outerTickSize(0)
        .tickPadding(horizontalBlock/gridSpacing);

function draw_mirror(selector) {
    
    var svg = d3.select(selector)
        .attr("id", "field-container")
        .append("svg")
        .attr("id", "field-svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("id", "trans")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      
    redraw_axes(svg);
}

function redraw(group_id, users) {
    var selector = ".g" + group_id + " #field-svg #trans";
    var svg = d3.select(selector)

    svg.selectAll("circle").remove();
    svg.selectAll(".name").remove();
    svg.selectAll(".axis").remove();
    
    redraw_axes(svg);
    redraw_labels(svg, users[group_id-1]);
    redraw_charges(svg, users[group_id-1]);
    //checkForZeros(svg);
}


function redraw_axes(svg)
{
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
}

function redraw_labels(svg, users) {
    // Add name labels to circles
    // Note: Not actually grouped with circle, just placed relative, so probably not best implementation but works for now
    for (var i = 0; i < users.length; i++) {
        var labels = svg.append("g")
            .attr("class", "name")
            .selectAll(".name")
            .data(users[i].charges)
            .enter().append("text")
            .attr("class", function(d, i) { return d.name + "_L" + (i+1)})
            .attr("name", function (d) { return d.name; })
            .attr("charge", function (d) { return d.charge})
            .attr("x", function(d) { return (d.x - AVE_DOT_SIZE - (d.radius/2)); })
            .attr("y", function(d) { return (d.y - AVE_DOT_SIZE*LABEL_Y_SPACING - (d.radius/2)); })
            .text(function(d) { return d.name; });
            //.call(drag);
    }
}

function redraw_charges(svg, users) {

    var all_charges = [];
    for (i = 0; i < users.length; i++) {
        users[i].charges.forEach(function(charge, index) {
            all_charges.push(charge);
        });
    }
    for (i = 0; i < all_charges.length; i++) {
        var circles = svg.selectAll("circle")
                             .data(all_charges);

        circles.enter()
                .append("circle");

        var circleAttributes = circles
                        .attr("index", function(d) { return d.index; })
                        .attr("name", function (d) { return d.name; })
                        .attr("cx", function (d) { return d.x; })
                        .attr("cy", function (d) { return d.y; })
                        .attr("x0", function (d) { return d.x0; })
                        .attr("y0", function (d) { return d.y0; })
                        .attr("charge", function (d) { return d.charge; })
                        .attr("r", function (d) { return partSizeScale(d.radius); })
                        .attr("active", function(d) { return d.active; })
                        .style("fill", function(d) { return d.color; });

        circles.exit().remove();
    }
}

function checkForZeros(svg) {
    var zeroCharge = svg.selectAll("circle")
                        .filter( function(d){ return d.charge == 0})
                        .remove();
    var zeroChargeText = svg.selectAll("text")
                        .filter( function(d){ return d.charge == 0})
                        .remove();
} //hides charge and labels of point charge 0 for "spectator" mode

function field_sync_users(group, other_members) {
    
        // get list of user names we are already tracking
        var known_users = users[group-1].map(function(d) {return d.name;});
    
        // add any new users 
        for (var i in other_members) {
            var info = JSON.parse(other_members[i].member_info);
            other_members[i].member_name = other_members[i].member_name.replace(/&lt;/g,'<').replace(/&gt;/g, '>');
            // test to see if this member_name is known, if not, add this user to users
            if (known_users.indexOf(other_members[i].member_name) == -1) {
    
                var user = {};
                user.name = other_members[i].member_name;
                user.charges = info.charges;
    
                if (user.charges.length === 1 && user.charges[0].charge === undefined) {
                    user.charges[0].charge = -10;
                    user.charges[0].radius = 10;
                    user.charges[0].color = (user.charges[0].charge < 0.0) ? colors[0] : colors[1];
                    user.charges[0].x = xScale(0);
                    user.charges[0].y = yScale(0);
                }
    
                // check various cases of where this user is in initialization
                // 1) Is this me?

                if ((other_members[i].member_info !== "" || other_members[i].member_info !== null) && info.index !== undefined) {
                    console.log("Got expected member_info !== ''");

                    console.log(user);
                    console.log(info);


                    if (info.charges[info.index].hasOwnProperty('charge')) {
                        console.log("Found'charge' property in info_obj");
                        user.charges[info.index].charge = info.charges[info.index].charge;
                    } else {
                        console.log("ERROR: Did not find 'charge' property in info_obj");
                    }

                    if (info.charges[info.index].hasOwnProperty('radius')) {
                        console.log("Found'radius' property in info_obj");
                        user.charges[info.index].radius = info.charges[info.index].radius;
                    } else {
                        console.log("ERROR: Did not find 'radius' property in info_obj");
                    }

                    if (info.charges[info.index].hasOwnProperty('color')) {
                        console.log("Found'color' property in info_obj");
                        user.charges[info.index].color = info.charges[info.index].color;
                    } else {
                        console.log("ERROR: Did not find 'color' property in info_obj");
                    }
                }

                users[group-1].push(user);
    
            } else {
                var user = find_user(other_members[i].member_name, group);
                user.name = other_members[i].member_name;
                user.charges = info.charges;
            }
    
        }
    
        // need to 
        redraw(group, users);
}

function find_user(user_name, group) {
    for (var i in users[group-1]) {
        if (users[group-1][i].name === user_name) {
            return users[group-1][i];
        }
    }
    return null;
}

function field_move_users(username, group_id, info) {
    console.log("field_move_users called.");
    username = username.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    var user_data = find_user(username, group_id);
    if (user_data) {
        console.log("updating user_data for user: " + username);

        if (user_data.charges.length <= info.index) {
            user_data.charges.push({});
        }

        if (info === "" || info === null || info == "null") {
            console.log("WARNING: info is null - must have been an arrow push!");
        } else {
            

            if (info.charges[info.index].hasOwnProperty('charge')) {
                console.log("Found'charge' property in info");
                user_data.charges[info.index].charge = info.charges[info.index].charge;
            } else {
                console.log("ERROR: Did not find 'charge' property in info");
            }

            if (info.charges[info.index].hasOwnProperty('radius')) {
                console.log("Found'radius' property in info");
                user_data.charges[info.index].radius = info.charges[info.index].radius;
            } else {
                console.log("ERROR: Did not find 'radius' property in info");
            }

            if (info.charges[info.index].hasOwnProperty('color')) {
                console.log("Found'color' property in info");
                user_data.charges[info.index].color = info.charges[info.index].color;
            } else {
                console.log("ERROR: Did not find 'color' property in info");
            }
        } 

        user_data.charges[info.index].name = info.charges[info.index].name;
        user_data.charges[info.index].index = info.charges[info.index].index;
        user_data.charges[info.index].x = info.charges[info.index].x;
        user_data.charges[info.index].y = info.charges[info.index].y;


    } else {
        console.log("ERROR: Oh, oh: got a move_user message about somebody we don't know: " + username);
        console.log("TODO: could add this user here???");
    }

    redraw(group_id, users);
}

function field_remove_charge(username, group_id, info) {
    var user_data = find_user(username, group_id);
    user_data.charges.pop();
    redraw(group_id, users);
}

function field_remove_user(username, group_id) {
    console.log("*** field_remove_user ***");
    username = username.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    // remove user that has left the group - must work backwards in case there are multiple deletes

    for(var i = users[group_id-1].length-1; i > -1; i--) {
        if (users[group_id-1][i].name === username) {
            console.log("field_remove_user: removing " + users[group_id-1][i].name);
            users[group_id-1].splice(i, 1);
        }
    }
}
