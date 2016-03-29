
/*-------------------  Globals ----------------------*/

// users keeps track of members of group - coming from communication system
var users = [];
   /* {"name":"AAA", "x0": -1, "y0": -1, "x": 30, "y": 30, "radius": 20, "color" : "green", "active": true },
    {"name":"BBB", "x0": -1, "y0": -1, "x": 70, "y": 70, "radius": 20, "color" : "purple", "active": true },
    {"name":"CCC", "x0": -1, "y0": -1, "x": 110, "y": 100, "radius": 20, "color" : "red", "active": false }]; */
var testCharge = [{"name" : "test_charge", "x":300, "y":200, "x0":null,
            "y0":null, "charge":1, "rx":2, "ry":2, "active":true, "color":"rgba(128, 0, 128, 0.7)"
        }];
//create var for testcharge to see if it exists

// currently selected charge
var selected = null;


var MIN_DOT_SIZE = 10;
var MAX_DOT_SIZE = 20;
var AVE_DOT_SIZE = Math.floor((MIN_DOT_SIZE + MAX_DOT_SIZE) / 2.0);
console.log(AVE_DOT_SIZE);

var LABEL_Y_SPACING = 1.2;

var MAX_ABS_CHARGE = 10;
var CHARGE_STEP = 5;

var MIN_VECTOR_LENGTH = 10;

var colors = ["rgba(255, 0, 0, 0.7)","rgba(0, 128, 0, 0.7)"];

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

// global display variables set with checkboxes in index.html
var field_display_settings = {
    'show_particle_charge': false,
    'show_particle_size': false,
    'show_equipotentials': false,
    'show_fieldlines':false, 
    'show_forcevectors':false,
    'show_fieldvectors':false,
    'show_movement': false,
    'show_labels': true,
    'show_axes': true,
    'show_points': true,
    'draw_vectors': false,
    'show_testcharge': false
    };

//Fill the select combo with the values for the charges -10 .. 10
d3.range(-MAX_ABS_CHARGE, MAX_ABS_CHARGE+1, CHARGE_STEP).map(function(i){
    // for now, eliminate neutral charges
    if (i !== 0) {
        d3.select("#charge").append("option")
            .attr("value", i)
            .text(i + "uC"); 
    }
    else {
         d3.select("#charge").append("option")
            .attr("value", -1)
            .text(-1 + "uC");
        d3.select("#charge").append("option")
            .attr("value", 0)
            .text(0 + "uC");
         d3.select("#charge").append("option")
            .attr("value", 1)
            .text((i+1) + "uC"); 
    }
});

/*-------------------  SVG objects setup ----------------------*/

// main svg element assigned to div in html page
var svg = d3.select("#field-container")
    .append("svg")
    .on("mousedown", vectorStart)
    .on("mouseup", vectorEnd)
	.on("touchstart", vectorStart)
    .on("touchend", vectorEnd)
	.on("touchcancel", vectorEnd)
    .attr("id", "field-svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// drag behavior - applied to circles 
var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("drag", dragmove)
    .on("dragstart", dragstart)
    .on("dragend", dragend);
    
// Vector drawing
var drawn_vector;
var drawn_vectors = [];

//use d3.svg.line for rendering field lines and equipotential surfaces
var line = d3.svg.line();

/*-------------------  Charge menu -------------------------*/

//When changing the value from the combo, change the target charge value
d3.select("#charge").on("change", function(){
    var new_charge = d3.select(this).node().value;
    
    if (selected && selected.name != "test_charge") { 
        selected.charge = new_charge;
        selected.radius = Math.abs(new_charge);
        selected.color = (new_charge < 0.0) ? colors[0] : colors[1];
        console.log(selected);
        // charge didn't move, but we do need to let other know about any change
        notify_group(0, 0);
    } else {
        //alert("Nothing selected");
    }
    //selected[2] = d3.select(this).node().value;
    redraw();
});

/*-------------------  Draw functions ----------------------*/

function redraw() {
    console.log("redraw...");

    //Clear all the lines
    //TODO: needs to be refactored as a pool of available lines/paths
    d3.selectAll(".line").remove();
    d3.selectAll(".field").remove();
    d3.selectAll(".pointvector").remove();
    d3.selectAll(".resultvector").remove();
    d3.selectAll(".testvector").remove();

    d3.selectAll("circle").remove();
    d3.selectAll(".name").remove();
    d3.selectAll(".axis").remove();
    d3.selectAll("ellipse").remove();
    // Draw the surfaces - these functions in field_lines.js
    // var currentTime = new Date().getTime();
    
    if (field_display_settings.show_axes === true) {
	   redraw_axes();
    }
    if (field_display_settings.show_fieldlines === true) {
        redraw_fieldlines();
    }
    if (field_display_settings.show_equipotentials === true) {
        redraw_equipotentials();
    }
   
    if (field_display_settings.show_labels === true && field_display_settings.show_points === true) {
	   redraw_labels();
    }
    if (field_display_settings.show_points === true) {
        redraw_charges();
    }
    if (field_display_settings.show_forcevectors === true) {
        redraw_forcevectors();
    }
    if (field_display_settings.show_testcharge === true) {
        redraw_testcharge();
    }
	 if (field_display_settings.show_fieldvectors === true) {
        redraw_fieldvectors();
    }

    //checkForZeros();
}
function checkForZeros() {
    var zeroCharge = svg.selectAll("circle")
                        .filter( function(d){ return d.charge == 0})
                        .remove();
    var zeroChargeText = svg.selectAll("text")
                        .filter( function(d){ return d.charge == 0})
                        .remove();
} //hides charge and labels of point charge 0 for "spectator" mode

function redraw_labels() {
    // Add name labels to circles
    // Note: Not actually grouped with circle, just placed relative, so probably not best implementation but works for now
    var labels = svg.append("g")
	    .attr("class", "name")
        .selectAll(".name")
	    .data(users)
        .enter().append("text")
	    .classed("selected", function(d) { return d === selected; })
        .attr("name", function (d) { return d.name; })
        .attr("charge", function (d) { return d.charge})
	    .attr("x", function(d) { return field_display_settings.show_particle_size ? (d.x - AVE_DOT_SIZE - (d.radius/2)) : (d.x - AVE_DOT_SIZE); })
	    .attr("y", function(d) { return field_display_settings.show_particle_size ? (d.y - AVE_DOT_SIZE*LABEL_Y_SPACING - (d.radius/2)) : (d.y - AVE_DOT_SIZE*LABEL_Y_SPACING); })
	    .text(function(d) { return d.name; });
	    //.call(drag);
}

function redraw_charges() {
    //console.log("redraw_charges...");
    console.log(users);

    var circles = svg.selectAll("circle")
                         .data(users);

    circles.enter()
            .append("circle");

    var circleAttributes = circles
                    .classed("selected", function(d) { return d === selected; })
                    .attr("name", function (d) { return d.name; })
                    .attr("cx", function (d) { return d.x; })
                    .attr("cy", function (d) { return d.y; })
                    .attr("x0", function (d) { return d.x0; })
                    .attr("y0", function (d) { return d.y0; })
                    .attr("charge", function (d) { return d.charge; })
                    .attr("r", function (d) { return field_display_settings.show_particle_size ? partSizeScale(d.radius) : AVE_DOT_SIZE; })
                    .attr("active", function(d) { return d.active; })
                    .style("fill", function(d) { return field_display_settings.show_particle_charge ? d.color : "LightGray"; });

    /* Two modes of use:
        Offline, single user, in which case user can create multiple points, sessionStorage("username") won't be set
        Online as part of group, sessionStorage("username") will be set by login routines.

        Offline: can only move charges that are active
        Online:
            at most one charge can be dragged by this user:
            1. name has to match the name I gave when logging in
            2. I have to be in an active state 
    */
    circles
        .filter(function(d) { return d.active == true && 
            (d.name === sessionStorage.getItem('username') /*|| sessionStorage.getItem("username") === null*/ )})
        .call(drag);

    circles.exit().remove();
}

function redraw_testcharge(){
    console.log("redraw_testcharge()");

    charge = svg.selectAll("ellipse").data(testCharge);
    charge.enter().append("ellipse");
    console.log(charge);
    var chargeAttributes = charge
                .classed("selected", function(d) { return d === selected; })
                .attr("name", function (d) { return d.name; })
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; })
                .attr("x0", function (d) { return d.x0; })
                .attr("y0", function (d) { return d.y0; })
                .attr("charge", function (d) { return d.charge; })
                .attr("ry", function (d) { return partSizeScale(d.ry) })
                .attr("rx", function (d) { return partSizeScale(d.rx) })
                .attr("active", function(d) { return d.active; })
                .style("fill", function(d) { return field_display_settings.show_particle_charge ? d.color : "LightGray"; });
    charge
        .filter(function(d) { return d.active == true && d.name === "test_charge" })
        .call(drag);

    charge.exit().remove();
    redraw_testvector();
}

function remove_drawn_vectors() {
	$.each(drawn_vectors, function(i, vector) {
		vector.remove();
	})
	
	drawn_vectors = [];
}

/*-------------------  Scales ----------------------*/

// use d3 linear scales to map 0, 1, 2 ... to actual display pixels
var xScale = d3.scale.linear().domain([-width/20, width/20]).rangeRound([0, width]).clamp(true);
var yScale = d3.scale.linear().domain([-height/20, height/20]).rangeRound([height, 0]).clamp(true);    // up is +

// linear scale used to set point charge diameter
var partSizeScale = d3.scale.linear().domain([1, MAX_ABS_CHARGE]).rangeRound([MIN_DOT_SIZE, MAX_DOT_SIZE]).clamp(true);  

// square root scale used by point force vectors - this is a compromise of precision with display
var pointVectorScale = d3.scale.sqrt().domain([-250.0, 250.0]).rangeRound([-100, 100]).clamp(true);  

/*-------------------  Axes ----------------------*/

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

function redraw_axes()
{
    svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

    svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);
	
    /*-------------------  Grid ----------------------*/
    /*
    // draw grid lines for y values
    svg.selectAll("line.yLineGrid").data(yScale.ticks(verticalBlock/gridSpacing)).enter()
	.append("line")
	    .attr(
	    {
		"class" : "axes",
		"x1" : 0,
		"x2" : width,
		"y1" : function(d){ return yScale(d);},
		"y2" : function(d){ return yScale(d);},
		"fill" : "none",
		"shape-rendering" : "crispEdges",
		"stroke" : "black",
		"stroke-width" : "1px",
		"opacity" : "0.2"
	    });
    
    // draw grid lines for x values
    svg.selectAll("line.xLineGrid").data(xScale.ticks(horizontalBlock/gridSpacing)).enter()
	.append("line")
	    .attr(
	    {
		"class" : "axes",
		"x1" : function(d){ return xScale(d);},
		"x2" : function(d){ return xScale(d);},
		"y1" : height,
		"y2" : 0,
		"fill" : "none",
		"shape-rendering" : "crispEdges",
		"stroke" : "black",
		"stroke-width" : "1px",
		"opacity" : "0.2"
		
	    });
	    */
}

/*
*/


/*-------------------  Drag functions ----------------------*/

function dragmove(d) {
  if((d.name === sessionStorage.getItem('username') || d.name === "test_charge")
	 && field_display_settings.draw_vectors === false)
  {
  	d3.select(this)
      		.attr("cx", d.x = Math.max(radius, Math.min(width - radius, d3.event.x)))
      		.attr("cy", d.y = Math.max(radius, Math.min(height - radius, d3.event.y)));

	d3.select('.name .selected')
		.attr("x", d3.event.x - AVE_DOT_SIZE)
		.attr("y", d3.event.y - AVE_DOT_SIZE*LABEL_Y_SPACING);
  }
}

function dragstart(d) {

    // record where the drag started
  if((d.name === sessionStorage.getItem('username') || d.name === "test_charge")
	 && field_display_settings.draw_vectors === false)
  { 

    d.x0 = d.x;
    d.y0 = d.y;
    
    // update the charge menu and selected var
    selected = d;
    changeSelected();
    
  }
}

function dragend(d) {

  if((d.name === sessionStorage.getItem('username') || d.name === "test_charge")
	 && field_display_settings.draw_vectors === false)
  {

    var x0_scaled = xScale.invert(d.x0);
    var y0_scaled = yScale.invert(d.y0);
    var x_scaled = xScale.invert(d.x);
    var y_scaled = yScale.invert(d.y);
    var delta_x = Math.round(x_scaled - x0_scaled);
    var delta_y = Math.round(y_scaled - y0_scaled);
    console.log("delta_x: " + delta_x + " delta_y: " + delta_y);
    if(d.name === "test_charge"){
        testCharge[0].x += delta_x;
        testCharge[0].y += delta_y;
    }
    if(d.name === sessionStorage.getItem('username')){
        notify_group(delta_x, delta_y);
    }

    redraw();
  }
}

function changeSelected() {
  //Change current charge value
  d3.select("#charge").node().value = parseInt(selected.charge);
}

function vectorStart() {
    if (field_display_settings.draw_vectors === true) {
		var coordinates = d3.mouse(this);
		drawn_vector = svg.append("line")
			.attr(
			{
			"class" : "vectors",
			"x1" : coordinates[0] - margin.left,
			"y1" : coordinates[1] - margin.top,
			"x2" : coordinates[0] - margin.left,
			"y2" : coordinates[1] - margin.top,
			"stroke" : "steelblue",
			"stroke-width" : "4px",
			"opacity" : 0.4,
			"marker-end": "url(#testArrow)"
			})
			.on("click", function() {this.remove();})
			.on("touchstart", function() {this.remove();});
		
		// Prevent scrolling while drawing lines
		$('html, body').on('touchmove', function(e){ 
			e.preventDefault(); 
		});
		
		d3.select("#field-svg").on("mousemove", vectorMove);
		d3.select("#field-svg").on("touchmove", vectorMove);
    }
}

function vectorMove() {
    if (field_display_settings.draw_vectors === true) {
		var coordinates = d3.mouse(this);
		drawn_vector
			.attr("x2", coordinates[0] - margin.left)
			.attr("y2", coordinates[1] - margin.top);
    }
}

function vectorEnd() {
    if (field_display_settings.draw_vectors === true) {
		if ((Math.pow((drawn_vector.attr("y2") - drawn_vector.attr("y1")), 2) +
			 Math.pow((drawn_vector.attr("x2") - drawn_vector.attr("x1")), 2)) < MIN_VECTOR_LENGTH) {
			drawn_vector.remove();
		}
		else {
			drawn_vectors.push(drawn_vector);
		}
		
		$('html, body').off('touchmove');
		d3.select("#field-svg").on("mousemove", null);
		d3.select("#field-svg").on("touchmove", null);
    }
}



/*-------------------  Synchronization across users -----------------*/

function active_member(other_members, uname) {
    for (var i in other_members) {
        if (other_members[i].member_name === uname) {
            return true;
        }
    }
    return false;
}


function field_sync_users(other_members) {
    console.log("*** field_sync_users ");
    console.log(other_members);

    // get list of user names we are already tracking
    var known_users = users.map(function(d) {return d.name;});

    // add any new users 
    for (var i in other_members) {
        other_members[i].member_name = other_members[i].member_name.replace(/&lt;/g,'<').replace(/&gt;/g, '>');
        // test to see if this member_name is known, if not, add this user to users
        if (known_users.indexOf(other_members[i].member_name) == -1) {

            var user_obj = {"name":other_members[i].member_name, 
                    "x":xScale(other_members[i].member_x),
                    "y":yScale(other_members[i].member_y),
                    "x0":null, "y0":null,
                    "charge":null, "radius":null, "active":false, "color":null};

            users.push(user_obj);

            // check various cases of where this user is in initialization
            // 1) Is this me?
            if (user_obj.name === sessionStorage.getItem('username')) {
                console.log("Found self - *** set selected");
                // set selected to myself
                selected = user_obj;

                // my member_info field should be ""
                if (other_members[i].member_info === "") {
                    console.log("Got expected member_info == ''");
                    // go ahead and set my charge 
                    // generate a random integer charge magnitude between 1 and MAX_ABS_CHARGE
                    var rad = Math.floor(Math.random() * MAX_ABS_CHARGE) + 1;
                    // randomly select pos or neg for the charge
                    var chg = (Math.random() < 0.5) ? rad * -1 : rad;
                    // based on -/+, select the color: red / green
                    var col = (chg < 0.0) ? colors[0] : colors[1];

                    // update my user_obj
                    user_obj.active = true;
                    user_obj.charge = chg;
                    user_obj.radius = rad;
                    user_obj.color = col;


                    // this code is also used by standalone, single user app,
                    // in which case socket will not be defined.
                    if (typeof(socket) !== 'undefined') {
                        var info_object = {
                            state:"initialized",
                            charge:user_obj.charge,
                            radius:user_obj.radius,
                            color:user_obj.color
                        };
                        socket.coordinate_change(sessionStorage.getItem('username'),
                                 sessionStorage.getItem('class_id'),
                                 sessionStorage.getItem('group_id'),
                                 0,     // dx
                                 0,     // dy
                                 info_object
                                );
                    } else {
                        console.log("typeof(socket) is undefined - this must be local mode");
                    }
                } else {
                    console.log("ERROR: Did not expect member_info to be NON-NULL at this point!");
                    console.log(other_members[i]);
                }
            } else {
                console.log("Adding OTHER user to my users list");

                if (other_members[i].member_info !== "") {
                    console.log("Got expected member_info !== ''");

                    var info_obj = JSON.parse(other_members[i].member_info);
                    console.log(info_obj);

                    if (info_obj.hasOwnProperty('charge')) {
                        console.log("Found'charge' property in info_obj");
                        user_obj.charge = info_obj.charge;
                    } else {
                        console.log("ERROR: Did not find 'charge' property in info_obj");
                    }

                    if (info_obj.hasOwnProperty('radius')) {
                        console.log("Found'radius' property in info_obj");
                        user_obj.radius = info_obj.radius;
                    } else {
                        console.log("ERROR: Did not find 'radius' property in info_obj");
                    }

                    if (info_obj.hasOwnProperty('color')) {
                        console.log("Found'color' property in info_obj");
                        user_obj.color = info_obj.color;
                    } else {
                        console.log("ERROR: Did not find 'color' property in info_obj");
                    }

                } else {
                    console.log("*** Adding OTHER but there is no member_info - is this okay?");
                }

            }

        } else {
            //update info in case
            console.log("Username " + other_members[i].member_name + " already in users list!");
        }

    }

    // remove any users that have left - must work backwards in case there are multiple deletes
    // for(var i = users.length; i--;) {
    //     if (!active_member(other_members, users[i].name)) {
    //         console.log("field_sync: did not find " + users[i].name + " in active members");
    //         users.splice(i, 1);
    //     }
    // }


    // need to 
    redraw();
}



function field_sync_users_old(other_members) {
    console.log("*** field_sync_users ");
    console.log(other_members);

    // get list of user names we are already tracking
    var known_users = users.map(function(d) {return d.name;});

    // add any new users 
    for (var i in other_members) {
        // test to see if this member_name is known
        if (known_users.indexOf(other_members[i].member_name) == -1) {
            // if not, add this user to users
            // generate a random integer charge magnitude between 1 and MAX_ABS_CHARGE
            var rad = Math.floor(Math.random() * MAX_ABS_CHARGE) + 1;
            // randomly select pos or neg for the charge
            var chg = (Math.random() < 0.5) ? rad * -1 : rad;
            // based on -/+, select the color: red / green
            var col = (chg < 0.0) ? colors[0] : colors[1];
            users.push({"name":other_members[i].member_name, 
                    "x0":-1, 
                    "y0":-1, 
                    "x":xScale(other_members[i].member_x),
                    "y":yScale(other_members[i].member_y),
                    "charge": chg,
                    "radius": rad,
                    "active":other_members[i].member_name === sessionStorage.getItem('username') ? true : false,
                    "color":col});
        }

    }

    // remove any users that have left - must work backwards in case there are multiple deletes
    for(var i = users.length; i--;) {
        if (!active_member(other_members, users[i].name)) {
            console.log("field_sync: did not find " + users[i].name + " in active members");
            users.splice(i, 1);
        }
    }


    // need to 
    redraw();
}


function find_user(user_name) {
    for (var i in users) {
        if (users[i].name === user_name) {
            return users[i];
        }
    }
    return null;
}


// this function gets called each time any single user moves their point
// data is an object containing the user's name, and new x_coord and y_coord.
function field_move_users(username, x_coord, y_coord, info) {
    console.log("field_move_users called.");
    username = username.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    console.log(username);
    var user_data = find_user(username);
    console.log(user_data);
    if (user_data) {
        console.log("updating user_data for user: " + username);

        // make any necessary updates to our local information from OTHERs based on member_info
        if (username !== sessionStorage.username) {

            if (info === "" || info === null || info == "null") {
                console.log("WARNING: info is null - must have been an arrow push!");
            } else {
                console.log(info);
                console.log("typeof(info) = " + typeof(info) + " converting to obj");

                var info_obj = JSON.parse(info);
                console.log(info_obj);

                if (info_obj.hasOwnProperty('charge')) {
                    console.log("Found'charge' property in info_obj");
                    user_data.charge = info_obj.charge;
                } else {
                    console.log("ERROR: Did not find 'charge' property in info_obj");
                }

                if (info_obj.hasOwnProperty('radius')) {
                    console.log("Found'radius' property in info_obj");
                    user_data.radius = info_obj.radius;
                } else {
                    console.log("ERROR: Did not find 'radius' property in info_obj");
                }

                if (info_obj.hasOwnProperty('color')) {
                    console.log("Found'color' property in info_obj");
                    user_data.color = info_obj.color;
                } else {
                    console.log("ERROR: Did not find 'color' property in info_obj");
                }
            } 

        } else {
            console.log("Don't need to update charge from coord_change for SELF.");
        }

        // also update the coordinates
        user_data.x = xScale(x_coord);
        user_data.y = yScale(y_coord);


    } else {
        console.log("ERROR: Oh, oh: got a move_user message about somebody we don't know: " + username);
        console.log("TODO: could add this user here???");
    }

    redraw();
}

function field_remove_user(username) {
    console.log("*** field_remove_user ***");
    username = username.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    // remove user that has left the group - must work backwards in case there are multiple deletes
    for(var i = users.length; i--;) {
        if (users[i].name === username) {
            console.log("field_remove_user: removing " + users[i].name);
            users.splice(i, 1);
        }
    }
}

function notify_group(dx, dy) {

    var user_obj = find_user(sessionStorage.getItem('username'));

    var info_object = {
        state:"active",
        charge:user_obj.charge,
        radius:user_obj.radius,
        color:user_obj.color
    };
    
    // this code is also used by standalone, single user app,
    // in which case socket will not be defined.
    if (typeof socket !== 'undefined') {
        // socket.emit('coordinate_change', send_object);

        socket.coordinate_change(sessionStorage.getItem('username'),
                                 sessionStorage.getItem('class_id'),
                                 sessionStorage.getItem('group_id'),
                                 dx,
                                 dy,
                                 info_object
                                );
    }
}

/*-------------------  Options processing -----------------*/

function update_display_settings () {
    /* unset all the display properties */
    for (var property in field_display_settings) {
        if (field_display_settings.hasOwnProperty(property)) {
            field_display_settings[property] = false;
        }
    }

    /* reset based on check boxes */
    $("input:checked").each(function () {
        var id = $(this).attr("id");
        field_display_settings[id] = true;
    });


    console.log(field_display_settings);
    redraw();

}