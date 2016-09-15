K = 9.0e9;
var forceVectorScale = 40000;
var gridSpacing = 5;
var vectorFreq = 1;
var margin = {top: 40, right: 40, bottom: 40, left: 40},
    width = 680 - margin.left - margin.right,
    height = 480 - margin.top - margin.bottom,
    radius = MAX_DOT_SIZE,
    axisPadding = 10;
// see this site for validation: http://www.ilectureonline.com/lectures/subject/PHYSICS/5/47/699

var boxSize = 5;
var numberOfBoxes_X = width/boxSize;
var numberOfBoxes_Y = height/boxSize;

defs = svg.append("defs")

defs.append("marker")
    .attr({
      "id":"arrow",
      "viewBox":"0 0 10 10",
      "refX":0,
      "refY":5,
      "markerWidth":3,
      "markerHeight":4,
      "orient":"auto"
    })
    .append("path")
      .attr("d", "M0,0L10,5L0,10");
defs.append("marker")
    .attr({
      "id":"revArrow",
      "viewBox":"0 0 10 10",
      "refX":5,
      "refY":5,
      "markerWidth":3,
      "markerHeight":4,
      "orient":"auto"
    })
    .append("path")
      .attr("d", "M-2,5L8,0L8,10");
defs.append("marker")
  .attr({
    "id":"testArrow",
    "viewBox":"0 0 10 10",
    "refX":0,
    "refY":5,
    "markerWidth":3,
    "markerHeight":4,
    "orient":"auto"
  })
  .append("path")
    .attr("d", "M0,0L10,5L0,10");
defs.append("marker")
  .attr({
    "id":"testChargeArrow",
    "viewBox":"0 0 10 10",
    "refX":0,
    "refY":5,
    "markerWidth":3,
    "markerHeight":4,
    "orient":"auto"
  })
  .append("path")
    .attr("d", "M0,0L10,5L0,10");
defs.append("marker")
  .attr({
    "id":"forceArrow",
    "viewBox":"0 0 10 10",
    "refX":0,
    "refY":5,
    "markerWidth":3,
    "markerHeight":4,
    "orient":"auto"
  })
  .append("path")
    .attr("d", "M0,0L10,5L0,10");

function getCharges() {
    var charges = [];
    var i, j;
    for (i = 0; i < users.length; i++) {
        var user_charges = users[i].charges;
        for (j = 0; j < user_charges.length; j++) {
            charges.push([user_charges[j].x, user_charges[j].y, user_charges[j].charge]);
        }
    }
    return charges;
}

//
// PHYSICS FUNCTIONS
//

function calculatePotentialAtPoint(p){
    var V = 0;
    var charges = getCharges(); 

    for (var j = 0; j < charges.length; j++) {
        var distX = p[0] - charges[j][0];
        var distY = p[1] - charges[j][1];
        var r_squared = distX*distX + distY*distY;
        var r = Math.sqrt(r_squared);

        V += charges[j][2] / r;
   }

   return V;
}


function calculateFieldComponentDueToChargeAtPosition(chargeIndex, position){
    
    var charges = getCharges();
    var x = position[0];
    var y = position[1];

    distX = x - charges[chargeIndex][0];
    distY = y - charges[chargeIndex][1];
    r_squared = distX*distX + distY*distY;
    r = Math.sqrt(r_squared);

    e = charges[chargeIndex][2] / r_squared;
    unitX = distX/r;
    unitY = distY/r;
    e_x = e*unitX;
    e_y = e*unitY;

    return [e_x, e_y];
}


function calculateFieldVectorAtPoint(p){
    
    var charges = getCharges();
    var E_x = 0;
    var E_y = 0;
    var component,
        j;

    for (j = 0; j < charges.length; j++) {
        var component = calculateFieldComponentDueToChargeAtPosition(j, p);

        E_x += component[0];
        E_y += component[1];
   }

   return [E_x, E_y];
}


function calculateForceOnCharge(chargeIndex){
    
    var charges = getCharges(); 
    var curX = charges[chargeIndex][0];
    var curY = charges[chargeIndex][1];
    var charge = charges[chargeIndex][2];

    var E_x = 0;
    var E_y = 0;
    var j,
        component;

    // calculate E at charge due to all other charges
    for (j = 0; j < charges.length; j++) {
        if (j !== chargeIndex) {
            component = calculateFieldComponentDueToChargeAtPosition(j, p);

            E_x += component[0];
            E_y += component[1];
        }
   }

   return [charge*E_x, charge*E_y];
}


function getPointsNearPotentials(target_potentials, tolerance, color_scale) {
  
  var dots = [];
  var potential;
  var i,
      j,
      k,
      x,
      y;

  for (i = 0; i < numberOfBoxes_X; i++) {
    for (j = 0; j < numberOfBoxes_Y; j++) {
          
          x = i*boxSize + boxSize/2;
          y = j*boxSize + boxSize/2;

          potential = calculatePotentialAtPoint([x, y]);

          for (k = 0; k < target_potentials.length; k++){
            if (Math.abs((Math.abs(potential) - Math.abs(target_potentials[k]))) < tolerance) {
              dots.push([x, y, color_scale(potential)]);
          }
          }
        }
    }

    return dots;
}

//
//  REPRESENTATIONS HELPER FUNCTIONS
//

function renderDots(dots) {

    svg.selectAll("rect")
      .data(dots, function(d) {return d;})
      .enter()
      .append("rect")
      .attr("x", function(d) { return d[0]; })
        .attr("y", function(d) { return d[1]; })
        .attr("width", boxSize)
        .attr("height", boxSize) 
        .attr("class", "dot")
        .style("fill", function(d) { return d[2]; });
}

function zeros(dimensions) {
    var array = [];

    for (var i = 0; i < dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
    }

    return array;
}

function initiateEquipotentialAtPoint(p, direction){
    var circleTimes,
        curX,
        curY,
        E,
        E_mag,
        unitX,
        unitY,
        times,
        start_potential,
        new_potential,
        dL = 1;
    var dots = [];   

       // Begin at point p
       curX = p[0];
       curY = p[1];
       start_potential = calculatePotentialAtPoint([curX, curY]);
       dots.push([curX, curY]);

       times = 2000;
       while (times-- > 0) {

         // find field at current location
         E = calculateFieldVectorAtPoint([curX, curY]);
         E_mag = Math.sqrt(E[0]*E[0] + E[1]*E[1]);
         unitX = E[0]/E_mag;
         unitY = E[1]/E_mag;

         // move perpendicular to the field vector
         curX += -1* direction*dL*unitY;
         curY += direction*dL*unitX;

         // correct the point to be as close to equipotential as possible
         // try points along the direction of the force (perpendicular to the direction we just translated)
         // and if the potential is closer to the starting potential, keep that point instead.
         new_potential = calculatePotentialAtPoint([curX, curY]);
         minimum_potential_difference = Math.abs(new_potential - start_potential);
         minimum_potential_difference_index = 0;

         // try seven points along force vector
         for (var trialIndex = -2; trialIndex < 3; trialIndex++) {
             trialX = curX + trialIndex*unitX;
             trialY = curY + trialIndex*unitY;
             trial_potential = calculatePotentialAtPoint([trialX, trialY]);
             trial_potential_difference = Math.abs(trial_potential - start_potential);
         
             if(trial_potential_difference < minimum_potential_difference){
                 minimum_potential_difference = trial_potential_difference;
                 minimum_potential_difference_index = trialIndex;
             }
         }

         curX = curX + minimum_potential_difference_index*unitX;
         curY = curY + minimum_potential_difference_index*unitY;
         dots.push([curX, curY]);

         // check if we've completed the equipotential (or gone out of bounds)
         if (dots.length > 100) {
             
             distX = p[0] - curX;
             distY = p[1] - curY;
             if (distX*distX + distY*distY <= 100) {
                 dots.push([dots[0][0], dots[0][1]]);
                 times = 0;
             }
             
             //If got out of the area, terminate furhter iterations for this turn.
             if (curX < 0 || curX > width || curY < 0 || curY > height) {
                 times=0;
             }
        }
    }
    return dots;
}


function isBetween(a, b, c) {
    var min = Math.min(b, c),
        max = Math.max(b, c);
    
    return a >= min && a <= max;
}

function findCrossingPoint(target, p1, p2) {
    var dX = p2[0] - p1[0];
    var dY = p2[1] - p1[1];
    var curX = p1[0];
    var curY = p1[1];
    var minDiff = Math.abs(target - calculatePotentialAtPoint([curX, curY]));
    var closestPoint = [curX, curY];
    var pot,
        diff,
        i;

    for (i = 0; i < 100; i++) {
        pot = calculatePotentialAtPoint([curX, curY]);
        diff = Math.abs(target - pot);
        if (diff < minDiff) {
            minDiff = diff;
            closestPoint = [curX, curY];
        }
        curX += i*dX/100;
        curY += i*dY/100;
    }
    return closestPoint;
}

function initiateFieldLineAtPoint(p, direction) {

    var dots = [];
    var curX = p[0];
    var curY = p[1];
    var times = 1000;
    var E_min = 0;
    var chargesHit = [];
    var E_min = .00001;
    var dL = 3;
    var charges = getCharges();
    var destinationX;
    var destinationY;
    var source1X;
    var source1Y;
    var source2X;
    var source2Y;
    var arrowDots;
    var j;
    var E,
        E_x,
        E_y,
        E_mag,
        times;

    dots.push([curX, curY]);

    //Maximum of 1000 points per force line
    while (times-- > 0) {

        E = calculateFieldVectorAtPoint([curX, curY]);
        E_x = E[0];
        E_y = E[1];            
        E_mag = Math.sqrt(E_x*E_x + E_y*E_y);

        // if field value near zero, terminate
        if( E_mag < E_min ) {
            times = 0;
        }

        //Move the next dot to follow the force vector
        if(direction > 0) {
            curX = curX + dL*E_x/E_mag;
            curY = curY + dL*E_y/E_mag;
        } else {
            curX = curX - dL*E_x/E_mag;
            curY = curY - dL*E_y/E_mag;
        }

        dots.push([curX, curY]);
        
        if (times%50 == 0) {
            //Draw an arrow
            if (direction == 1) {
                destinationX = curX;
                destinationY = curY;
                source1X = dots[dots.length-2][0] + dL*E_y/E_mag;
                source1Y = dots[dots.length-2][1] - dL*E_x/E_mag;
                source2X = dots[dots.length-2][0] - dL*E_y/E_mag;
                source2Y = dots[dots.length-2][1] + dL*E_x/E_mag;
            } else {
                destinationX = dots[dots.length-2][0];
                destinationY = dots[dots.length-2][1];
                source1X = curX + dL*E_y/E_mag;
                source1Y = curY - dL*E_x/E_mag;
                source2X = curX - dL*E_y/E_mag;
                source2Y = curY + dL*E_x/E_mag;
            }
            arrowDots = [];
            arrowDots.push([source1X, source1Y]);
            arrowDots.push([destinationX, destinationY]);
            arrowDots.push([source2X, source2Y]);
            svg.insert("path", "circle")
                    .datum(arrowDots)
                    .attr("class", "line")
                    .attr("d", line);
        }


        //If the next dot is inside a circle, terminate further iterations
        for (j = 0; j < charges.length; j++) {
            distX = charges[j][0] - curX;
            distY = charges[j][1] - curY;
            if (distX*distX + distY*distY <= 16 && charges[j][2] != 0) {
                if(charges[j][2].linesDrawn >= charges[j][2].numFieldLines) {
                  times=0;
                } else {
                  charges[j].linesDrawn += 1;
                  times=0;
                }
            }
        }
    } // end line
    return [dots, chargesHit];
}



function redraw_forcevectors() {
    var currentTime = new Date().getTime();

    if (selected === null)
        return;

    // pull current location data out of users array
    var charges = getCharges(); 

    if (charges.length === 0)
        return;

    var chargeIndex = -1;
    for (var i=0; i < users.length; i++) {
        user_charges = users[i].charges;
        for (var j=0; j < user_charges.length; j++) {
            if (user_charges[j] == selected) {
                chargeIndex = i+j;
            }
        }
    }

    if (chargeIndex == -1) {
        console.log("UNABLE TO FIND selected in users!");
        return;
    }
    
    // for selected charge
    var F = calculateForceOnCharge(chargeIndex);

    var curX = charges[chargeIndex][0];
    var curY = charges[chargeIndex][1];
    
    if (!isNaN(F[0]) && !isNaN(F[1])) {
        svg.append("line")          // attach a line
            .attr("class", "resultvector")
            .attr("marker-end", "url(#arrow)")
            .attr("x1", curX)     // x position of the first end of the line
            .attr("y1", curY)      // y position of the first end of the line
            .attr("x2", curX + forceVectorScale * F[0])     // x position of the second end of the line
            .attr("y2", curY + forceVectorScale * F[1]);    // y position of the second end of the line
    }

    currentTime -= new Date().getTime()
    console.log("redraw_forcevectors iteration took: " + (-1*currentTime)+"ms." )

}

function redraw_testvector(){
  var currentTime = new Date().getTime();

    if (selected === null)
        return;
    
    var curX = testCharge[0].x;
    var curY = testCharge[0].y;

    var E = calculateFieldVectorAtPoint([curX, curY]);
    var F = [testCharge[0].charge*E[0], testCharge[0].charge*E[1]];

    if (!isNaN(F[0]) && !isNaN(F[1])) {
        svg.append("line")          // attach a line
            .attr("class", "testvector")
            .attr("marker-end", "url(#testChargeArrow)")
            .attr("x1", curX)     // x position of the first end of the line
            .attr("y1", curY)      // y position of the first end of the line
            .attr("x2", curX + forceVectorScale*F[0])     // x position of the second end of the line
            .attr("y2", curY + forceVectorScale*F[1]);    // y position of the second end of the line
    }

    currentTime -= new Date().getTime()
    console.log("redraw_testvector iteration took: " + (-1*currentTime)+"ms." )
}

function redraw_fieldvectors() {
    var currentTime = new Date().getTime();
    var maxForce = 0;
    var calcVectors = [];
    // pull current location data out of users array
    var charges = getCharges(); 

    if (charges.length === 0)
        return;

    //Iterate for each charge
    for (var heightLoc = 0; heightLoc <= (height/(10*gridSpacing*vectorFreq)); heightLoc++){
      for (var widthLoc = 0; widthLoc <= (width/(10*gridSpacing*vectorFreq)); widthLoc++){
            var curX = widthLoc * 10 * gridSpacing * vectorFreq;
            var curY = height - (heightLoc * 10 * gridSpacing * vectorFreq);
            // var fields = calculateFieldVectorAtPoint([curX, curY]);
            // // console.log("---- calc for charge at " + curX + " " + curY );


            // var total_forceX = fields[0];
            // var total_forceY = fields[1];
            var total_forceX = 0.0;
            var total_forceY = 0.0;

            //Superposition the force vector at the current point
            for (var j = 0; j < charges.length; j++) {                
                var othX = charges[j][0];
                var othY = height - charges[j][1];
                console.log("---- against charge at " + othX + " " + othY);
                var othpolarity = (charges[j][2] > 0) ? 1 : -1;
                var distX = (((curX - othX) / 115.0) * .0254);  // to convert from pixels to inches to meters
                var distY = (((curY - othY) / 115.0) * .0254);  // this assumes a screen dpi of 115 (19" 1920x1080 screen)
                console.log("distX: " + distX + " distY: " + distY);
                var distXSq = distX * distX;
                var distYSq = distY * distY;
                var distanceSq = distXSq + distYSq;
                //var distance = Math.sqrt(distanceSq);

                var force = Math.abs((K * 1e-6 *(charges[j][2] * 1.0e-6)) / distanceSq);

                var theta_rad = Math.atan2(othY - curY, othX - curX);
                var theta_deg = theta_rad * (180.0 / Math.PI);
                console.log("** " + j + " (" + othX + "," + othY + ") d^2: " + distanceSq + " theta: " + theta_deg + " F: " + force);

                var forceX = force * Math.cos(theta_rad);
                var forceY = force * Math.sin(theta_rad);
                console.log("raw forceX: " + forceX + " raw forceY: " + forceY);

                if (othpolarity == 1) {
                    forceX *= -1;
                    forceY *= -1;
                }

                console.log("forceX: " + forceX + " forceY: " + forceY);

                total_forceX += forceX;
                total_forceY += forceY;

                /*
                // draw a line from center out to other charge
                svg.append("line")          // attach a line
                    .attr("class", "pointvector")
                    .attr("x1", curX)     // x position of the first end of the line
                    .attr("y1", height - curY)      // y position of the first end of the line
                    .attr("x2", othX)     // x position of the second end of the line
                    .attr("y2", height - othY);    // y position of the second end of the line
                */
                
            }
            console.log(total_forceY + '  ' + total_forceX);
            var final_theta_rad = Math.atan2(total_forceY, total_forceX);
            var final_theta_deg = final_theta_rad * (180.0 / Math.PI);
            var final_mag = Math.sqrt(total_forceX*total_forceX + total_forceY*total_forceY);
            if(!isNaN(final_mag)){
              maxForce = Math.max(maxForce, Math.abs(final_mag));
              console.log("Final forceX: " + total_forceX + " forceY: " + total_forceY + " => " + final_theta_deg, " mag: " + final_mag);

              var final_dx = Math.cos(final_theta_rad) * pointVectorScale(final_mag);
              var final_dy = Math.sin(final_theta_rad) * pointVectorScale(final_mag);
              console.log(" ** final_dx : " + final_dx + "  final_dy: " + final_dy + "  ");
            
              calcVectors.push([final_dx, final_dy, final_theta_rad, curX, curY, final_mag]);
            }
            
      }
   } 
   for (i= 0; i < calcVectors.length; i++){
        var vector = calcVectors[i];
        var stroke = "";
        var percentage =  Math.max(Math.cbrt(vector[5] / maxForce), 0.2);
        var dirX = Math.cos(vector[2]) * 35;
        var dirY = Math.sin(vector[2]) * 35;
        svg.append("line")          // attach a line
          .attr("class", "forcevector")
          .attr("marker-end", "url(#forceArrow)")
          .style("opacity", percentage)
          .attr("x1", vector[3] - (dirX/2))     // x position of the first end of the line
          .attr("y1", height - (vector[4] - (dirY/2)))      // y position of the first end of the line
          .attr("x2", vector[3] + (dirX/2))     // x position of the second end of the line
          .attr("y2", height - (vector[4] + (dirY/2)));    // y position of the second end of the line
        
   }

    currentTime -= new Date().getTime()
    console.log("redraw_fieldvectors iteration took: " + (-1*currentTime)+"ms." )
}

// function redraw_equipotentials() {

//     var currentTime = new Date().getTime();

//     // pull current location data out of users array
//     var charges = getCharges(); 

//     //Separate the whole field on 10*10 blocks
//     //If a block DOESN'T have a equipotential surface, create one at its middle.

//     var fieldFilled = d3.range(1,10).map(function(){
//         return d3.range(1,10).map(function(i){return false;})
//     });

//     var calculatedFields = [];
//     var maxForce = 0;

//     for (var i = 0; i < fieldFilled.length; i++) {
//         var direction = 1;
//         for (var jj=0; jj< fieldFilled[i].length; jj++) {
//             if (!fieldFilled[i][jj]) {
//                //create a path here

//                //Iterate at most 2 times in case the surface gets out of the area
//                for (var circleTimes = 0; circleTimes < 3; circleTimes+=2) {

//                    //Define the center of the current block as a starting point of the surface
//                    var curX = i*horizontalBlock + horizontalBlockHalf;
//                    var curY = jj*verticalBlock + verticalBlockHalf;

//                    var direction = 1-circleTimes;
//                    var dots = [];
//                    dots.push([curX, curY]);

//                    //Superposition the fields from all charges, and get the resulting force vector
//                    var dirX = 0;
//                    var dirY = 0;
//                    var totalForce = 0;
//                    for (var j = 0; j < charges.length; j++) {
//                        var distX = curX - charges[j][0];
//                        var distY = curY - charges[j][1];
//                        var distanceSq = distX*distX + distY*distY;
//                        var force = (K * 1e-6 * (charges[j][2]*1e-6)) / distanceSq;

//                        var distanceFactor = force/ Math.sqrt(distanceSq);

//                        //Measure the initial force in order to match the equipotential surface points
//                        totalForce+= force;
//                        dirX += distX * distanceFactor;
//                        dirY += distY * distanceFactor;
//                    }

//                    //Maximum 2000 dots per surface line
//                    var times = 2000;
//                    while (times-- > 0) {

//                        var dirTotal = Math.sqrt(dirX*dirX + dirY*dirY);
//                        var stepX = dirX/dirTotal;
//                        var stepY = dirY/dirTotal;
//                        //The equipotential surface moves normal to the force vector
//                        curX = curX + direction*6*stepY;
//                        curY = curY - direction*6*stepX;

//                        //Correct the exact point a bit to match the initial force as near it can
//                        var minForceIndex = -1;
//                        var minForceDiff = 0;
//                        var minDirX = 0;
//                        var minDirY = 0;
//                        var minCurX = 0;
//                        var minCurY = 0;

//                        curX -= 3*stepX;
//                        curY -= 3*stepY;

//                        for (var pointIndex = 0; pointIndex < 7; pointIndex++, curX += stepX, curY += stepY) {
//                            dirX = 0;
//                            dirY = 0;

//                            var forceSum = 0;
//                            for (var j = 0; j < charges.length; j++) {
//                                var distX = curX - charges[j][0];
//                                var distY = curY - charges[j][1];
//                                var distanceSq = distX*distX + distY*distY;
//                                var force = (K * 1e-6 * (charges[j][2] * 1e-6)) / distanceSq;

//                                var distanceFactor = force / Math.sqrt(distanceSq);


//                                //Measure the initial force in order to match the equipotential surface points
//                                forceSum += force;
//                                dirX += distX * distanceFactor;
//                                dirY += distY * distanceFactor;
//                            }

//                            var forceDiff = Math.abs(forceSum - totalForce);

//                            if (minForceIndex == -1 || forceDiff < minForceDiff) {
//                                minForceIndex = pointIndex;
//                                minForceDiff = forceDiff;
//                                minDirX = dirX;
//                                minDirY = dirY;
//                                minCurX = curX;
//                                minCurY = curY;
//                            } else {
//                                break;
//                            }
//                        }

//                        //Set the corrected equipotential point
//                        curX = minCurX;
//                        curY = minCurY;
//                        dirX = minDirX;
//                        dirY = minDirY;

//                        //Mark the containing block as filled with a surface line.
//                        var indI = parseInt(curX/horizontalBlock);
//                        var indJ = parseInt(curY/verticalBlock);
//                        if (indI >= 0 && indI < fieldFilled.length) {
//                            if (indJ >= 0 && indJ < fieldFilled[indI].length) {
//                             fieldFilled[indI][indJ] = true;
//                            }
//                         }

//                        //Add the dot to the line
//                        dots.push([curX, curY]);

//                        if (dots.length > 5) {
//                            //If got to the begining, a full circle has been made, terminate further iterations
//                            if (indI == i && indJ == jj) {
//                                distX = dots[0][0] - curX;
//                                distY = dots[0][1] - curY;
//                                if (distX*distX + distY*distY <= 49) {
//                                    dots.push([dots[0][0], dots[0][1]]);
//                                    times = 0;
//                                    circleTimes = 3;
//                                }
//                            }
//                            //If got out of the area, terminate furhter iterations for this turn.
//                            if (curX < 0 || curX > 960 || curY < 0 || curY > 500) {
//                                times=0;
//                            }
//                        }
//                    }

//                    calculatedFields.push([totalForce, dots]);
//                    maxForce = Math.max(maxForce, Math.abs(totalForce));
//                }
//            }
//        }
//     }


//     //Iterate through each generated equipotential surface
//     for (var i=0; i<calculatedFields.length; i++) {
//         var pair = calculatedFields[i];
//         var stroke = "";
//         var percentage = 9 - Math.min(9,parseInt(Math.abs(10 * pair[0])/maxForce ));
//         //Set the stroke to be proportional to the surface potential
//         if (pair[0]>=0) {
//             //positive
//             stroke = "#" + percentage+"b"+percentage;
//         } else {
//             //negative
//             stroke = "#" + "b"+percentage + "" + percentage;
//         }

//         //Render the line
//         svg.append("path")
//             .datum(pair[1])
//             .attr("class", "field")
//             .attr("d", line)
//             .style("stroke", stroke);
//     }

//     currentTime -= new Date().getTime()
//     console.log("redraw_equipotentials iteration took: " + (-1*currentTime)+"ms." )

// }

// different way of drawing equipotentials
function redraw_equipotentials2() {
    // set range and color scale by the potential nearby the strongest charge
    var charges = getCharges();

    var maxChargeIndex = 0;
    var maxCharge = charges[0][2];
    for (var i = 0; i < charges.length; i++) {
      if (Math.abs(charges[i][2]) > maxCharge) {
        maxCharge = Math.abs(charges[i][2]);
        maxChargeIndex = i;
      }
    }
    var x = charges[maxChargeIndex][0];
    var y = charges[maxChargeIndex][1];
    var cutoff = Math.abs(calculatePotentialAtPoint([x + 40, y + 40]));
    var color_scale = d3.scale.linear().domain([-1*cutoff, 0, cutoff]).range(['red', 'purple', 'blue']);

    // set target potentials and tolerance (how close to target potential do you need to be to be drawn)
    var numEquipotentials = 6;
    var interval = 2 * cutoff/numEquipotentials;
      var tolerance = cutoff / 15;

      var target_potentials = [];
      for(i = 0; i < numEquipotentials; i++){
        target_potentials[i] = -cutoff + i * interval;
      }

      var dots = getPointsNearPotentials(target_potentials, tolerance, color_scale);
      renderDots(dots);
}

function redraw_equipotentials() {

    var currentTime = new Date().getTime();

    // pull current location data out of users array
    var charges = getCharges();

    // define a range of potential to divide up into evenly spaced "target" equipotentials
    var maxChargeIndex = 0;
    var minChargeIndex = 0;
    var maxCharge = charges[0][2];
    var minCharge = charges[0][2];
    for (var i = 0; i < charges.length; i++) {
      if (charges[i][2] > maxCharge) {
        maxCharge = charges[i][2];
        maxChargeIndex = i;
      } if (charges[i][2] < minCharge) {
        minCharge = charges[i][2];
        minChargeIndex = i;
      }
    }

    var cutoff_high,
        cutoff_low;

    // if charges both positive, .35 to zero.
    if(maxCharge >=0 && minCharge >=0) {
      cutoff_high = .20;
      cutoff_low = 0;
    } else if (maxCharge <=0 && minCharge <=0) {
      cutoff_high = 0;
      cutoff_low = -.20;
    } else if (maxCharge >=0 && minCharge <=0) {
      cutoff_high = .20;
      cutoff_low = -.20;
    } 
   
    // find "target" values of potential
    var dots = [];
    var equipotentials = [];
    var crossing;
    var numEquipotentials = 9;
    var interval = (cutoff_high - cutoff_low)/(numEquipotentials-1);

    var target_potentials = [];
    for(i = 0; i < numEquipotentials; i++){
      target_potentials.push(cutoff_low + i * interval);
    }

    var x_boxes = 24;
    var y_boxes = 12;
    var boxWidth = width/x_boxes;
    var boxHeight = height/y_boxes;

    // calculate potentials on corners of a grid
    var potentials = zeros([x_boxes + 1, y_boxes + 1]);
    for (var i = 0; i < (x_boxes + 1); i++) {
        for (var j = 0; j < (y_boxes + 1); j++) {
            potentials[i][j] = calculatePotentialAtPoint([i*boxWidth, j*boxHeight]);
        }
    }

    // loop through grid and determine whether target equipotential will cross through box
    for (var i = 0; i < x_boxes -1; i++) {
        for (var j = 1; j < y_boxes; j++) {
            for (var k = 0; k < target_potentials.length; k++){
                target = target_potentials[k];
                dots = [];

                    // does equipotential cross box top? right side? bottom? left?
                    if (isBetween(target, potentials[i][j], potentials[i+1][j])) {
                        // if so, find point of crossing
                        crossing = findCrossingPoint(target, [i*boxWidth, j*boxHeight], [(i+1)*boxWidth, j*boxHeight]);
                        var render = 1;

                        // check whether that equipotential has already been drawn
                        for (var eq = 0; eq < equipotentials.length; eq++) {
                            for (var kk = 0; kk < equipotentials[eq][1].length; kk++) {
                                var dx = crossing[0] - equipotentials[eq][1][kk][0];
                                var dy = crossing[1] - equipotentials[eq][1][kk][1];
                                if (Math.hypot(dx, dy) < 5) {
                                   render = 0;
                                }
                            }
                        }
                            
                        if(render) {
                            // if equipotential hasn't already been drawn, initiate equipotential at the crossing point
                            for (var direction = -1; direction < 2; direction+=2) {
                                dots = initiateEquipotentialAtPoint(crossing, direction);
                                equipotentials.push([target, dots]);
                            }
                        }
                    } else if (isBetween(target, potentials[i+1][j], potentials[i+1][j+1])){
                        crossing = findCrossingPoint(target, [(i+1)*boxWidth, j*boxHeight], [(i+1)*boxWidth, (j+1)*boxHeight]);
                        var render = 1;
                        for (var eq = 0; eq < equipotentials.length; eq++) {
                            for (var kk = 0; kk < equipotentials[eq][1].length; kk++) {
                                var dx = crossing[0] - equipotentials[eq][1][kk][0];
                                var dy = crossing[1] - equipotentials[eq][1][kk][1];
                                if (Math.hypot(dx, dy) < 5) {
                                   render = 0;
                                }
                            }
                        }
                            
                        if(render) {
                            for (var direction = -1; direction < 2; direction+=2) {
                                dots = initiateEquipotentialAtPoint(crossing, direction);
                                equipotentials.push([target, dots]);
                            }
                        }               
                    } 
            }
        }
    }

    //Iterate through each generated equipotential surface
    for (var i=0; i < equipotentials.length; i++) {
        var pair = equipotentials[i];
        var stroke = "";
        //var percentage = 9 - Math.min(9,parseInt(Math.abs(10 * pair[0])/maxForce ));
        //Set the stroke to be proportional to the surface potential
        if (pair[0]>=0) {
            //positive
            stroke = "green"; // "#" + percentage+"b"+percentage;
        } else {
            //negative
            stroke = "red"; //"#" + "b"+percentage + "" + percentage;
        }

        //Render the line
        svg.append("path")
            .datum(pair[1])
            .attr("class", "field")
            .attr("d", line)
            .style("stroke", stroke);
    }

    currentTime -= new Date().getTime()
    console.log("redraw_equipotentials iteration took: " + (-1*currentTime)+"ms." )

}

function redraw_fieldlines () {
    var currentTime = new Date().getTime();

    // pull current location data out of users array
    var charges = getCharges();
    var linesPerCharge = 5;
    var linesToDraw;
    var fieldLineStartRadius = 20;
    var start_angle;
    var curX;
    var cury;
    var polarity;
    var chargeIndex,
        pointIndex,
        result,
        chargesHit,
        direction,
        dots,
        render;

    //Draw the field lines
    for (chargeIndex = 0; chargeIndex < charges.length; chargeIndex++) {
        charges[chargeIndex].linesDrawn = 0;
        charges[chargeIndex].numFieldLines = Math.abs(linesPerCharge * Math.floor(charges[chargeIndex][2]));
    }


    // find the order of charges from smallest to largest magnitude
    // var sortedCharges = charges;
    // var minChargeIndex;
    // var minCharge;

    // // loop through the charges
    // for (var j = 0; j < sortedCharges.length; j++) {
    //   minChargeIndex = j;
    //   minCharge = charges[j][2];
    //   for (var k = j + 1; k < sortedCharges.length; k++) {
    //       if (sortedCharges[k][2] < minCharge) {
    //         minChargeSoFar = sortedCharges[k][2];
    //         minChargeIndex = k;
    //       }
    //   }
    // }

    var sortedCharges = charges;
    function sortFunction(a, b) {
        if (Math.abs(parseInt(a[2])) === Math.abs(parseInt(b[2]))) {
            return 0;
        }
        else {
            return (Math.abs(parseInt(a[2])) < Math.abs(parseInt(b[2]))) ? -1 : 1;
        }
    }
    sortedCharges.sort(sortFunction);

    //Iterate for each charge
    //for (chargeIndex = 0; chargeIndex < charges.length; chargeIndex++) {

        //Number of field lines proportional to charge strength
        //linesToDraw = charges[chargeIndex].numFieldLines - charges[chargeIndex].linesDrawn;

        //for (pointIndex=0; pointIndex<linesToDraw; pointIndex ++) {
            
            render = true;

            console.log("DRAWING ", linesToDraw, " LINES FROM CHARGE ", chargeIndex);

            // start uniformly spaced around the charge
            // start_angle = 2*Math.PI*pointIndex/linesToDraw;
            // curX = charges[chargeIndex][0] + fieldLineStartRadius * Math.cos(start_angle);
            // curY = charges[chargeIndex][1] + fieldLineStartRadius * Math.sin(start_angle);
            // polarity = 1;
            // if (charges[chargeIndex][2] < 0) {
            //     polarity = -1;
            // }

            //for (var i = 0; i < )
            for (direction = -1; direction < 2; direction+=2){
                result = initiateFieldLineAtPoint([200, 200], direction);
                chargesHit = result[1];
                dots = result[0];

                if (render) {
                 //Render the line
                  svg.insert("path", "circle")
                      .datum(dots)
                      .attr("class", "line")
                      .attr("d", line);
                }
            }

        //}
    //}

    currentTime -= new Date().getTime()
    console.log("redraw_fieldlines iteration took: " + (-1*currentTime)+"ms." )
}