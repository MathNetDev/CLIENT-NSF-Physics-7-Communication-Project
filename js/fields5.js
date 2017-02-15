
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
var startCharge = 10;
var MAX_CHARGES = 5;

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
    'show_particle_charge': true,
    'show_particle_size': true,
    'show_energy': false,
    'show_potential': false,
    'show_equipotentials': false,
    'show_fieldlines':false, 
    'show_forcevectors':false,
    'show_fieldvectors':false,
    'show_movement': false,
    'show_labels': true,
    'show_axes': true,
    'show_points': true,
    'show_drawn_vectors' : false,
    'show_testcharge': false
    };

//Fill the select combo with the values for the charges -10 .. 10
d3.range(-MAX_ABS_CHARGE, MAX_ABS_CHARGE+1, CHARGE_STEP).map(function(i){
    // for now, eliminate neutral charges
    if (i !== 0) {
        d3.select("#charge").append("option")
            .attr("value", i)
            .text(i + "μC"); 
    }
    else {
         d3.select("#charge").append("option")
            .attr("value", -1)
            .text(-1 + "μC");
        d3.select("#charge").append("option")
            .attr("value", 0)
            .text(0 + "μC");
         d3.select("#charge").append("option")
            .attr("value", 1)
            .text((i+1) + "μC"); 
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
var vector_attribute;
var my_vector_attributes = []; // holds user's drawn vectors if show_drawn_vectors is false
var vector_attributes = [];    // holds all vectors including user's drawn vectors if show_drawn_vectors is true
var drawn_vector;
var drawn_vectors = [];

var toolbar_settings = {
    'draw_vectors_mode': false,
    'delete_mode': false
};

//use d3.svg.line for rendering field lines and equipotential surfaces
var line = d3.svg.line();

/*-------------------  Charge menu -------------------------*/

//When changing the value from the combo, change the target charge value
d3.select("#charge").on("change", function(){
    var new_charge = parseFloat(d3.select(this).node().value);

    socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " changed charge value to " + d3.select(this).node().value
                          );

    if (selected && selected.name != "test_charge") { 
        selected.charge = new_charge;
        selected.radius = Math.abs(new_charge);
        selected.color = (new_charge < 0.0) ? colors[0] : colors[1];
        console.log(selected);
        // charge didn't move, but we do need to let other know about any change
        notify_group(selected.index);
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
    d3.selectAll(".dot").remove();
    d3.selectAll(".line").remove();
    d3.selectAll(".field").remove();
    d3.selectAll(".pointvector").remove();
    d3.selectAll(".resultvector").remove();
    d3.selectAll(".testvector").remove();
    d3.selectAll(".forcevector").remove();

    d3.selectAll("circle").remove();
    d3.selectAll(".name").remove();
    d3.selectAll(".energy").remove();
    d3.selectAll(".axis").remove();
    d3.selectAll("ellipse").remove();

    d3.selectAll("line").remove();
    
    $('.testcharge_options').hide();

    // Draw the surfaces - these functions in field_lines.js
    // var currentTime = new Date().getTime();
    
    if (field_display_settings.show_axes === true) {
	   redraw_axes();
    }
    if (field_display_settings.show_fieldlines === true) {
        redraw_fieldlines();
    }
    if (field_display_settings.show_energy === true && field_display_settings.show_testcharge === true) {
        redraw_energy_label();
    }
    if (field_display_settings.show_potential === true) {
        redraw_potential();
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
    if (sessionStorage.getItem("username") !== null) {
        redraw_drawn_vectors();
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

function redraw_energy_label() {
    charge = svg.selectAll("ellipse").data(testCharge);
    charge.enter().append("text")
        .attr("class", "energy")
        .attr("x", function(d) { return d.x - AVE_DOT_SIZE; })
        .attr("y", function(d) { return d.y - AVE_DOT_SIZE*LABEL_Y_SPACING; })
        .text(function(d) { 
            var potential = calculatePotentialAtPoint([d.x, d.y]);
            var energy = Math.floor(100*potential*d.charge);
            return energy + " J"; 
        });
}

function redraw_labels() {
    // Add name labels to circles
    // Note: Not actually grouped with circle, just placed relative, so probably not best implementation but works for now
    for (var i = 0; i < users.length; i++) {
        var labels = svg.append("g")
    	    .attr("class", "name")
            .selectAll(".name")
    	    .data(users[i].charges)
            .enter().append("text")
            .attr("class", function(d, i) { return d.name + "_L" + (i+1)})
    	    .classed("selected", function(d) { return d === selected; })
            .attr("name", function (d) { return d.name; })
            .attr("charge", function (d) { return d.charge})
    	    .attr("x", function(d) { return field_display_settings.show_particle_size ? (d.x - AVE_DOT_SIZE - (d.radius/2)) : (d.x - AVE_DOT_SIZE); })
    	    .attr("y", function(d) { return field_display_settings.show_particle_size ? (d.y - AVE_DOT_SIZE*LABEL_Y_SPACING - (d.radius/2)) : (d.y - AVE_DOT_SIZE*LABEL_Y_SPACING); })
    	    .text(function(d) { return d.name; });
    	    //.call(drag);
    }
}

function redraw_charges() {
    //console.log("redraw_charges...");
    console.log(users);

    // push current user to end of users array to draw charge last
    var user; 
    for (var i = 0; i < users.length; i++) {
        if (sessionStorage.getItem("username") === users[i]["name"]) {
            user = users.splice(i, 1)[0];
            users.push(user);
            break;
        }
    }

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
                        .classed("selected", function(d) { return d === selected; })
                        .attr("index", function(d) { return d.index; })
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
}

function redraw_testcharge(){
    console.log("redraw_testcharge()");

    $('.testcharge_options').show();

    if ($('#testcharge_value').val() === "positive") {
        testCharge[0].charge = 1;
    }
    else if ($('#testcharge_value').val() === "negative") {
        testCharge[0].charge = -1;
    }

    charge = svg.selectAll("ellipse").data(testCharge);
    charge.enter().append("ellipse");
    console.log(testCharge);
    // mapCoord() in 
    // map pixel values to graph coordinates
    // subtract MAX_DOT_SIZE/2 from x and y positions to get center of charge as charges have 20x20 bounding box
    var xGraph = mapCoord(testCharge[0].x - MAX_DOT_SIZE/2,width - MAX_DOT_SIZE,30,-30);
    var yGraph = mapCoord(testCharge[0].y - MAX_DOT_SIZE/2,height - MAX_DOT_SIZE,-20,20);
    socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " changed test charge coordinates to " + xGraph + "," + yGraph 
                          );
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

function redraw_drawn_vectors() {
    remove_drawn_vectors();
    // send vectors to other users' view
    if (field_display_settings.show_drawn_vectors === true) {
        var attribute;
        while (attribute = my_vector_attributes.pop()) {
            vector_attributes.push(attribute);
        }
    }
    // remove vectors from other users' view
    else {
        var usr = sessionStorage.getItem("username");
        my_vector_attributes = my_vector_attributes.concat(vector_attributes.filter(function(attribute) {
            return usr === attribute["user"];
        }));
        vector_attributes = vector_attributes.filter(function(attribute) {
            return usr !== attribute["user"];
        });
    }
    socket.xml_change(sessionStorage.getItem("username"), 
                      sessionStorage.getItem("class_id"), 
                      sessionStorage.getItem("group_id"), 
                      JSON.stringify(vector_attributes));
    draw_drawn_vectors();
}

function draw_vector(attribute) {
    var longpress = 750;
    var start;
    return svg.append("line")
        .attr(
        {
            "class" : "vectors",
            "user" : attribute["user"],
            "x1" : attribute["x1"],
            "y1" : attribute["y1"],
            "x2" : attribute["x2"],
            "y2" : attribute["y2"],
            "stroke" : "steelblue",
            "stroke-width" : "4px",
            "opacity" : 0.4,
            "marker-end": "url(#testArrow)"
        })
        .on('touchstart', onStart)
        .on('touchmove', onMove)
        .on('touchend', onEnd)
        .on('mousedown', onStart)
        .on('mousemove', onMove)
        .on('mouseup', onEnd);


    // Call back functions
    function onStart(e) { start = new Date().getTime(); }
    function onMove(e)  { start = 0; }
    function onEnd(e) {
        if (new Date().getTime() >= (start + longpress)) {
            console.log("longclick");
            var line = d3.select(this);
            var label = svg.append("text");
            var delta_x = Math.abs(parseFloat(line.attr("x1")) - parseFloat(line.attr("x2")));
            var delta_y = Math.abs(parseFloat(line.attr("y1")) - parseFloat(line.attr("y2")));
            var x = ((parseFloat(line.attr("x1")) + parseFloat(line.attr("x2"))) / 2);
            var y = ((parseFloat(line.attr("y1")) + parseFloat(line.attr("y2"))) / 2);
            var theta = Math.atan2(delta_y, delta_x) * (180.0 / Math.PI);
            if (theta < 45) {
                (y > -19) ? y -= 10 : y += 10;
            }
            else {
                (x > 612) ? x -= 10 : x += 10;
            }
            label.attr("fill", "steelblue")
                .attr("x", x)
                .attr("y", y)
                .attr("font-weight", "bold")
                .text(function(d) { return line.attr("user"); });
            window.setTimeout(function() { label.remove(); } , 2000);
        }
        else if (toolbar_settings.delete_mode === true && $(this).attr("user") == sessionStorage.getItem("username")) {
            var i;
            for (i = 0; i < my_vector_attributes.length; i++) {
                if ($(this).attr("x1") == my_vector_attributes[i]["x1"] && $(this).attr("x2") == my_vector_attributes[i]["x2"] 
                    && $(this).attr("y1") == my_vector_attributes[i]["y1"] && $(this).attr("y2") == my_vector_attributes[i]["y2"]) {
                    my_vector_attributes.splice(i, 1);
                    this.remove();
                    return;
                }
            }
            for (i = 0; i < vector_attributes.length; i++) {
                if ($(this).attr("x1") == vector_attributes[i]["x1"] && $(this).attr("x2") == vector_attributes[i]["x2"] 
                    && $(this).attr("y1") == vector_attributes[i]["y1"] && $(this).attr("y2") == vector_attributes[i]["y2"]) {
                    vector_attributes.splice(i, 1);
                    this.remove();
                    socket.xml_change(sessionStorage.getItem("username"), 
                                      sessionStorage.getItem("class_id"), 
                                      sessionStorage.getItem("group_id"), 
                                      JSON.stringify(vector_attributes));
                    return;
                }
            }
        }
    }
}

function draw_drawn_vectors() {
    for (i = 0; i < vector_attributes.length; i++) {
        drawn_vectors.push(draw_vector(vector_attributes[i]));
    }
    for (i = 0; i < my_vector_attributes.length; i++) {
        drawn_vectors.push(draw_vector(my_vector_attributes[i]));
    }
}

function remove_drawn_vectors() {
    for (var i = 0; i < drawn_vectors.length; i++) {
        drawn_vectors[i].remove();
    }
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

function redraw_axes() {
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



/*-------------------  Drag functions ----------------------*/

function dragmove(d, i) {
  if((d.name === sessionStorage.getItem('username') || d.name === "test_charge")
	 && toolbar_settings.draw_vectors_mode === false && toolbar_settings.delete_mode === false)
  {
  	d3.select(this)
      		.attr("cx", d.x = Math.max(radius, Math.min(width - radius, d3.event.x)))
      		.attr("cy", d.y = Math.max(radius, Math.min(height - radius, d3.event.y)));

	d3.select('.name .' + d.name + "_L" + (i+1))
            .attr("x", function(d) { return field_display_settings.show_particle_size ? (d.x - AVE_DOT_SIZE - (d.radius/2)) : (d.x - AVE_DOT_SIZE); })
            .attr("y", function(d) { return field_display_settings.show_particle_size ? (d.y - AVE_DOT_SIZE*LABEL_Y_SPACING - (d.radius/2)) : (d.y - AVE_DOT_SIZE*LABEL_Y_SPACING); });
  }
}

function dragstart(d, i) {

    // record where the drag started
  if((d.name === sessionStorage.getItem('username') || d.name === "test_charge")
	 && toolbar_settings.draw_vectors_mode === false && toolbar_settings.delete_mode === false)
  { 

    d.x0 = d.x;
    d.y0 = d.y;
    
    // update the charge menu and selected var
    selected = d;
    changeSelected();
    
  }
}

function dragend(d, i) {

  if((d.name === sessionStorage.getItem('username') || d.name === "test_charge")
	 && toolbar_settings.draw_vectors_mode === false && toolbar_settings.delete_mode === false)
  {

    d3.select(this)
            .attr("cx", d.x = Math.max(radius, Math.min(width - radius, Math.round(d.x/10)*10)))
            .attr("cy", d.y = Math.max(radius, Math.min(height - radius, Math.round(d.y/10)*10)));

    if(d.name === sessionStorage.getItem('username')){
        notify_group(i);
    }

    redraw();
  }
}

function changeSelected() {
  //Change current charge value
  d3.select("#charge").node().value = parseInt(selected.charge);
  
}

function vectorStart() {
    if (toolbar_settings.draw_vectors_mode === true) {
		var coordinates = d3.mouse(this);
        vector_attribute = {
            "user" : sessionStorage.getItem("username"),
            "x1" : coordinates[0] - margin.left,
            "y1" : coordinates[1] - margin.top,
            "x2" : coordinates[0] - margin.left,
            "y2" : coordinates[1] - margin.top,
        };
		drawn_vector = draw_vector(vector_attribute);
		
		// Prevent scrolling while drawing lines
		$('html, body').on('touchmove', function(e){ 
			e.preventDefault(); 
		});
		
		d3.select("#field-svg").on("mousemove", vectorMove);
		d3.select("#field-svg").on("touchmove", vectorMove);
    }
}

function vectorMove() {
    if (toolbar_settings.draw_vectors_mode === true) {
		var coordinates = d3.mouse(this);
		drawn_vector
			.attr("x2", coordinates[0] - margin.left)
			.attr("y2", coordinates[1] - margin.top);
    }
}

function vectorEnd() {
    if (toolbar_settings.draw_vectors_mode === true) {
		if ((Math.pow((drawn_vector.attr("y2") - drawn_vector.attr("y1")), 2) +
			 Math.pow((drawn_vector.attr("x2") - drawn_vector.attr("x1")), 2)) < MIN_VECTOR_LENGTH) {
			drawn_vector.remove();
		}
		else {
            vector_attribute["x2"] = drawn_vector.attr("x2");
            vector_attribute["y2"] = drawn_vector.attr("y2");
            if (field_display_settings.show_drawn_vectors === true) {
                vector_attributes.push(vector_attribute);
                socket.xml_change(sessionStorage.getItem("username"), 
                                  sessionStorage.getItem("class_id"), 
                                  sessionStorage.getItem("group_id"), 
                                  JSON.stringify(vector_attributes));
            }
            else {
                my_vector_attributes.push(vector_attribute);
            }
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
    
    if (other_members == null) {
        redraw();
        return;
    }

    // get list of user names we are already tracking
    var known_users = users.map(function(d) {return d.name;});
    // users = [];
    other_members.forEach(function(member, index) {
        var user = {};
        user.charges = member.member_info.charges;
        user.name = member.member_name.replace(/&lt;/g,'<').replace(/&gt;/g, '>');

        if (known_users.indexOf(user.name) !== -1) {
            return;
        }

        if (user.charges.length === 1 && user.charges[0].charge === undefined) {
            user.charges[0].charge = startCharge * -1;
            user.charges[0].radius = startCharge;
            user.charges[0].color = (user.charges[0].charge < 0.0) ? colors[0] : colors[1];
            user.charges[0].x = xScale(0);
            user.charges[0].y = yScale(0);
            if (user.name === sessionStorage.getItem('username')) {
                selected = user.charges[0];
            }
        }

        user.charges.forEach(function(charge, i) {
            user.charges[i].x0 = null;
            user.charges[i].y0 = null;
            user.charges[i].index = i;
        });

        if (user.name === sessionStorage.getItem('username')) {

            user.charges.forEach(function(charge, i) {
                user.charges[i].active = true;
            });
            // selected = user;
        
            if (typeof(socket) !== 'undefined') {
                var info_object = {
                    remove_charge: false,
                    state: "initialized"
                };
                info_object.charges = user.charges;
                // update vector_attributes
                if (users.length == 0) {
                    vector_attributes = [];
                    socket.xml_change(sessionStorage.getItem('username'),
                                      sessionStorage.getItem('class_id'),
                                      sessionStorage.getItem('group_id'),
                                      "[]");
                }
                else { 
                    socket.get_xml(sessionStorage.getItem('username'),
                                   sessionStorage.getItem('class_id'),
                                   sessionStorage.getItem('group_id'));
                }
                user.charges.forEach(function(charge, i) {
                    info_object.index = i;
                    socket.coordinate_change(sessionStorage.getItem('username'),
                                             sessionStorage.getItem('class_id'),
                                             sessionStorage.getItem('group_id'),
                                             info_object
                                            );
                });
            } 
        }
        else {
            user.charges.forEach(function(charge, i) {
                user.charges[i].active = false;
            });
        }   
        users.push(user);
    });
    // add any new users 
   /* for (var i in other_members) {
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
                if (typeof other_members[i].member_info === "object" && other_members[i].member_info !== null) {
                    console.log("Got expected member_info == ''");
                    // go ahead and set my charge 
                    // generate a random integer charge magnitude between 1 and MAX_ABS_CHARGE
                    var rad = startCharge;;
                    // randomly select pos or neg for the charge
                    var chg =  startCharge * -1 ;
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

                if (typeof other_members[i].member_info === "object" && other_members[i].member_info !== null){
                    console.log("Got expected member_info !== ''");

                    var info_obj = other_members[i].member_info;
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

    */
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


// this function gets called each time any single user moves their point or removes their point
function field_move_users(username, info) {
    console.log("field_move_users called.");
    username = username.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    console.log(username);
    var user_data = find_user(username);
    console.log(user_data);
    if (user_data) {
        console.log("updating user_data for user: " + username);

        if (user_data.charges.length <= info.index) {
            user_data.charges.push({});
        }

        // make any necessary updates to our local information from OTHERs based on member_info
        if (username !== sessionStorage.username) {

            if ($.isEmptyObject(info)) {
                console.log("WARNING: info is null - must have been an arrow push!");
            } else {
                console.log(info);
                console.log("typeof(info) = " + typeof(info) + " converting to obj");

                console.log(info);

                if (info.charges[info.index].hasOwnProperty('charge')) {
                    console.log("Found'charge' property in info_obj");
                    user_data.charges[info.index].charge = info.charges[info.index].charge;
                } else {
                    console.log("ERROR: Did not find 'charge' property in info_obj");
                }

                if (info.charges[info.index].hasOwnProperty('radius')) {
                    console.log("Found'radius' property in info_obj");
                    user_data.charges[info.index].radius = info.charges[info.index].radius;
                } else {
                    console.log("ERROR: Did not find 'radius' property in info_obj");
                }

                if (info.charges[info.index].hasOwnProperty('color')) {
                    console.log("Found'color' property in info_obj");
                    user_data.charges[info.index].color = info.charges[info.index].color;
                } else {
                    console.log("ERROR: Did not find 'color' property in info_obj");
                }
            } 

        } else {
            console.log("Don't need to update charge from coord_change for SELF.");
        }

        user_data.charges[info.index].name = info.charges[info.index].name;
        user_data.charges[info.index].index = info.charges[info.index].index;
        user_data.charges[info.index].x = info.charges[info.index].x;
        user_data.charges[info.index].y = info.charges[info.index].y;

        


    } else {
        console.log("ERROR: Oh, oh: got a move_user message about somebody we don't know: " + username);
        console.log("TODO: could add this user here???");
    }

    redraw();
}

function field_remove_charge(username, info) {
    if (username !== sessionStorage.getItem("username")) {
        var user_data = find_user(username);
        user_data.charges.pop();
        redraw();
    }
}

function field_remove_user(username, class_id, group_id) {
    console.log("*** field_remove_user ***");
    username = username.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    // remove username's vector attributes
    vector_attributes = vector_attributes.filter(function(attribute) {
        return username !== attribute["user"];
    });

    // remove username's vectors that are only displayed to self
    if (username == sessionStorage.getItem("username")) {
        my_vector_attributes = [];
    }
    socket.xml_change(sessionStorage.getItem("username"), 
                  sessionStorage.getItem("class_id"), 
                  group_id, 
                  JSON.stringify(vector_attributes));

    // remove user that has left the group - must work backwards in case there are multiple deletes
    for (var i = users.length; i--;) {
        if (users[i].name === username) {
            console.log("field_remove_user: removing " + users[i].name);
            users.splice(i, 1);
        }
    }
}

function notify_group(index) {

    var user_obj = find_user(sessionStorage.getItem('username'));

    var info_object = {
        state:"active",
        remove_charge: false,
        index: index
    };
    info_object.charges = user_obj.charges;
    
    // this code is also used by standalone, single user app,
    // in which case socket will not be defined.
    if (typeof socket !== 'undefined') {
        // socket.emit('coordinate_change', send_object);

        socket.coordinate_change(sessionStorage.getItem('username'),
                                 sessionStorage.getItem('class_id'),
                                 sessionStorage.getItem('group_id'),
                                 info_object
                                );
    }
}

function update_vector_attributes(xml, redraw) {
    // Note: check if xml is undefined?
    vector_attributes = eval(JSON.parse(xml));
    if (redraw === true) {
        remove_drawn_vectors();
        draw_drawn_vectors();
    }
}

/*-------------------  Options processing -----------------*/

function update_display_settings () {

    var temp = [];
    /* unset all the display properties */
    for (var property in field_display_settings) {
        if (field_display_settings.hasOwnProperty(property)) {
            temp[property] = field_display_settings[property];
            field_display_settings[property] = false;
        }
    }

    /* reset based on check boxes */
    $("input:checked").each(function () {
        var id = $(this).attr("id");
        field_display_settings[id] = true;

    });

     for (var property in field_display_settings) {
        if (field_display_settings.hasOwnProperty(property)) {
            if(field_display_settings[property] != temp[property]) {
                if(field_display_settings[property]) {
                    socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " Turned on the button " + property
                          );
                }
                else {
                    socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " Turned off the button " + property
                          );
                }
            }
                
        }
    }



    console.log(field_display_settings);
    redraw();
}

function is_default_setting(id) {
    return (id == 'show_particle_charge'
         || id == 'show_particle_size'
         || id == 'show_labels'
         || id == 'show_axes'
         || id == 'show_points');
}

function set_to_default() {
    $('form#display-settings input').each(function() {
        var id = $(this).attr("id");
        if (is_default_setting(id)) {
            $(this).prop('checked', true);
            field_display_settings[id] = true;
        }
        else {
            $(this).prop('checked', false);
            field_display_settings[id] = false;
        }
    });
    update_display_settings();
}

/*-------------------  Toolbar Settings -------------------*/

function add_charge(btn) {
    btn.blur();

    var usr = find_user(sessionStorage.getItem("username"));
    if (usr.charges.length >= MAX_CHARGES) return;
    var charge = {
        active: true,
        charge: -10,
        color: "rgba(255, 0, 0, 0.7)",
        name: usr.name,
        radius: 10,
        x: xScale(0),
        y: yScale(0),
        x0: null,
        y0: null
    };
    charge.index = usr.charges.length;
    usr.charges.push(charge);

    selected = charge;
    changeSelected();
    info = { 
        remove_charge: false,
        index: charge.index 
    };
    info.charges = usr.charges;
    socket.coordinate_change(sessionStorage.getItem('username'),
                             sessionStorage.getItem('class_id'),
                             sessionStorage.getItem('group_id'),
                             info
                            );

    socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " added a charge"
                          );
    redraw();
}

function remove_charge(btn) {
    btn.blur();

    var usr = find_user(sessionStorage.getItem("username"));
    if (usr.charges.length <= 1) return;
    if (selected == usr.charges[usr.charges.length-1]) {
        selected = usr.charges[usr.charges.length-2];
        changeSelected();
    }
    usr.charges.pop();
    info = {remove_charge: true};
    info.charges = usr.charges;
    socket.coordinate_change(sessionStorage.getItem('username'),
                             sessionStorage.getItem('class_id'),
                             sessionStorage.getItem('group_id'),
                             info
                            );
    socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " removed a charge"
                          );

    redraw();
}

function activate_button(btn_id, toolbar_id) {
    $(btn_id).css("background-color", "#6bb0fa");
    toolbar_settings[toolbar_id] = true;
}

function deactivate_button(btn_id, toolbar_id) {
    $(btn_id).css("background-color", "white");
    toolbar_settings[toolbar_id] = false;
}

function toggle_draw_vectors_mode() {
    if (toolbar_settings.draw_vectors_mode === false) {
        activate_button("#draw_vectors_button", "draw_vectors_mode");
        deactivate_button("#delete_mode_button", "delete_mode");

        socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " started drawing vectors"
                          );
    }
    else {
        deactivate_button("#draw_vectors_button", "draw_vectors_mode");

        socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " stopped drawing vectors"
                          );
    }
}

function toggle_delete_mode() {
    if (toolbar_settings.delete_mode === false) {
        activate_button("#delete_mode_button", "delete_mode");
        deactivate_button("#draw_vectors_button", "draw_vectors_mode");

        socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " toggled delete mode to on"
                          );
    }
    else {
        deactivate_button("#delete_mode_button", "delete_mode");

        socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " toggled delete mode to off"
                          );
    }
}

function clear_vectors() {
    socket.add_log(sessionStorage.getItem('username'),
                           sessionStorage.getItem('class_id'),
                           sessionStorage.getItem('group_id'),
                           " cleared all the vectors"
                          );
    if (field_display_settings.show_drawn_vectors === true) {
        var usr = sessionStorage.getItem("username");
        var my_vectors = vector_attributes.filter(function(attribute) {
            return usr === attribute["user"];
        });
        if (my_vectors !== []) {
            vector_attributes = vector_attributes.filter(function(attribute) {
                return usr !== attribute["user"];
            });
            remove_drawn_vectors();
            draw_drawn_vectors();
            socket.xml_change(sessionStorage.getItem("username"), 
                              sessionStorage.getItem("class_id"), 
                              sessionStorage.getItem("group_id"), 
                              JSON.stringify(vector_attributes));
        }

        
    }
    else {
        if (my_vector_attributes !== []) {
            my_vector_attributes = [];
            remove_drawn_vectors();
            draw_drawn_vectors();
        }
    }
}