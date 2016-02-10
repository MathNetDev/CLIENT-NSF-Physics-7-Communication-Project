
K = 9.0e9; 
var gridSpacing = 5;
var vectorFreq = 2;
var margin = {top: 40, right: 40, bottom: 40, left: 40},
    width = 680 - margin.left - margin.right,
    height = 480 - margin.top - margin.bottom,
    radius = MAX_DOT_SIZE,
    axisPadding = 10;
// see this site for validation: http://www.ilectureonline.com/lectures/subject/PHYSICS/5/47/699

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
      

function redraw_pointvectors() {
    var currentTime = new Date().getTime();

    if (selected === null)
        return;

    // pull current location data out of users array
    var charges = users.map(function(d) { return [d.x, d.y, d.charge]; });

    if (charges.length === 0)
        return;

    var chargeIndex = -1;
    for (var i=0; i < users.length; i++) {
        if (users[i] === selected) {
            chargeIndex = i;
        }
    }

    if (chargeIndex == -1) {
        console.log("UNABLE TO FIND selected in users!");
        return;
    }
    //Iterate for each charge
    //for (var chargeIndex = 0; chargeIndex < charges.length; chargeIndex++) {
    
     
            var curX = charges[chargeIndex][0];
            var curY = height - charges[chargeIndex][1];
            var curChg = charges[chargeIndex][2] * 1.0e-6;
            var polarity = (charges[chargeIndex][2] > 0) ? 1 : -1;

            console.log("---- calc for charge at " + curX + " " + curY + " sign " + polarity);

            var total_forceX = 0.0;
            var total_forceY = 0.0;

            //Superposition the force vector at the current point
            for (var j = 0; j < charges.length; j++) {
                // skip self in charge calculation
                if (j !== chargeIndex) {
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

                    var force = Math.abs((K * curChg * (charges[j][2] * 1.0e-6)) / distanceSq);

                    var theta_rad = Math.atan2(othY - curY, othX - curX);
                    var theta_deg = theta_rad * (180.0 / Math.PI);
                    console.log("** " + j + " (" + othX + "," + othY + ") d^2: " + distanceSq + " theta: " + theta_deg + " F: " + force);

                    var forceX = force * Math.cos(theta_rad);
                    var forceY = force * Math.sin(theta_rad);
                    console.log("raw forceX: " + forceX + " raw forceY: " + forceY);

                    if (polarity === othpolarity) {
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
            }

            var final_theta_rad = Math.atan2(total_forceY, total_forceX);
            var final_theta_deg = final_theta_rad * (180.0 / Math.PI);
            var final_mag = Math.sqrt(total_forceX*total_forceX + total_forceY*total_forceY);
            console.log("Final forceX: " + total_forceX + " forceY: " + total_forceY + " => " + final_theta_deg, " mag: " + final_mag);

            var final_dx = Math.cos(final_theta_rad) * pointVectorScale(final_mag);
            var final_dy = Math.sin(final_theta_rad) * pointVectorScale(final_mag);
            if(polarity == 1){
              svg.append("line")          // attach a line
                  .attr("class", "resultvector")
                  .attr("marker-end", "url(#arrow)")
                  .attr("x1", curX)     // x position of the first end of the line
                  .attr("y1", height - curY)      // y position of the first end of the line
                  .attr("x2", curX + final_dx)     // x position of the second end of the line
                  .attr("y2", height - (curY + final_dy));    // y position of the second end of the line
          } else if (polarity == -1) {
            svg.append("line")          // attach a line
                  .attr("class", "resultvector")
                  .attr("marker-start", "url(#revArrow)")
                  .attr("x1", curX)     // x position of the first end of the line
                  .attr("y1", height - curY)      // y position of the first end of the line
                  .attr("x2", curX + final_dx)     // x position of the second end of the line
                  .attr("y2", height - (curY + final_dy));    // y position of the second end of the line
          }
    // }

    currentTime -= new Date().getTime()
    console.log("redraw_pointvectors iteration took: " + (-1*currentTime)+"ms." )

}
function redraw_fieldvectors() {
    var currentTime = new Date().getTime();

    // pull current location data out of users array
    var charges = users.map(function(d) { return [d.x, d.y, d.charge]; });

    if (charges.length === 0)
        return;

    var chargeIndex = -1;
    for (var i=0; i < users.length; i++) {
        if (users[i] === selected) {
            chargeIndex = i;
        }
    }

    if (chargeIndex == -1) {
        console.log("UNABLE TO FIND selected in users!");
        return;
    }
    //Iterate for each charge
    for (var heightLoc = 0; heightLoc <= (height/(10*gridSpacing*vectorFreq)); heightLoc++){
      for (var widthLoc = 0; widthLoc <= (width/(10*gridSpacing*vectorFreq)); widthLoc++){
            var curX = widthLoc * 10 * gridSpacing * vectorFreq;
            var curY = height - (heightLoc * 10 * gridSpacing * vectorFreq);

            console.log("---- calc for charge at " + curX + " " + curY );


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

            var final_theta_rad = Math.atan2(total_forceY, total_forceX);
            var final_theta_deg = final_theta_rad * (180.0 / Math.PI);
            var final_mag = Math.sqrt(total_forceX*total_forceX + total_forceY*total_forceY);
            console.log("Final forceX: " + total_forceX + " forceY: " + total_forceY + " => " + final_theta_deg, " mag: " + final_mag);

            var final_dx = Math.cos(final_theta_rad) * pointVectorScale(final_mag);
            var final_dy = Math.sin(final_theta_rad) * pointVectorScale(final_mag);
            console.log(" ** final_dx : " + final_dx + "  final_dy: " + final_dy + "  ");
            svg.append("line")          // attach a line
                .attr("class", "resultvector")
                .attr("marker-end", "url(#arrow)")
                .attr("x1", curX)     // x position of the first end of the line
                .attr("y1", height - curY)      // y position of the first end of the line
                .attr("x2", curX + final_dx)     // x position of the second end of the line
                .attr("y2", height - (curY + final_dy));    // y position of the second end of the line
      }
   }

    currentTime -= new Date().getTime()
    console.log("redraw_pointvectors iteration took: " + (-1*currentTime)+"ms." )


}

function redraw_equipotentials() {

    var currentTime = new Date().getTime();

    // pull current location data out of users array
    var charges = users.map(function(d) { return [d.x, d.y, d.charge]; });

    //Separate the whole field on 10*10 blocks
    //If a block DOESN'T have a equipotential surface, create one at its middle.

    var fieldFilled = d3.range(1,10).map(function(){
        return d3.range(1,10).map(function(i){return false;})
    });

    var calculatedFields = [];
    var maxForce = 0;

    for (var i = 0; i < fieldFilled.length; i++) {
        var direction = 1;
        for (var jj=0; jj< fieldFilled[i].length; jj++) {
            if (!fieldFilled[i][jj]) {
               //create a path here

               //Iterate at most 2 times in case the surface gets out of the area
               for (var circleTimes = 0; circleTimes < 3; circleTimes+=2) {

                   //Define the center of the current block as a starting point of the surface
                   var curX = i*horizontalBlock + horizontalBlockHalf;
                   var curY = jj*verticalBlock + verticalBlockHalf;

                   var direction = 1-circleTimes;
                   var dots = [];
                   dots.push([curX, curY]);

                   //Superposition the fields from all charges, and get the resulting force vector
                   var dirX = 0;
                   var dirY = 0;
                   var totalForce = 0;
                   for (var j = 0; j < charges.length; j++) {
                       var distX = curX - charges[j][0];
                       var distY = curY - charges[j][1];
                       var distanceSq = distX*distX + distY*distY;
                       var force = charges[j][2] / distanceSq;

                       var distanceFactor = force/ Math.sqrt(distanceSq);

                       //Measure the initial force in order to match the equipotential surface points
                       totalForce+= force;
                       dirX += distX * distanceFactor;
                       dirY += distY * distanceFactor;
                   }

                   //Maximum 2000 dots per surface line
                   var times = 2000;
                   while (times-- > 0) {

                       var dirTotal = Math.sqrt(dirX*dirX + dirY*dirY);
                       var stepX = dirX/dirTotal;
                       var stepY = dirY/dirTotal;
                       //The equipotential surface moves normal to the force vector
                       curX = curX + direction*6*stepY;
                       curY = curY - direction*6*stepX;

                       //Correct the exact point a bit to match the initial force as near it can
                       var minForceIndex = -1;
                       var minForceDiff = 0;
                       var minDirX = 0;
                       var minDirY = 0;
                       var minCurX = 0;
                       var minCurY = 0;

                       curX -= 3*stepX;
                       curY -= 3*stepY;

                       for (var pointIndex = 0; pointIndex < 7; pointIndex++, curX += stepX, curY += stepY) {
                           dirX = 0;
                           dirY = 0;

                           var forceSum = 0;
                           for (var j = 0; j < charges.length; j++) {
                               var distX = curX - charges[j][0];
                               var distY = curY - charges[j][1];
                               var distanceSq = distX*distX + distY*distY;
                               var force = charges[j][2] / distanceSq;

                               var distanceFactor = force / Math.sqrt(distanceSq);


                               //Measure the initial force in order to match the equipotential surface points
                               forceSum += force;
                               dirX += distX * distanceFactor;
                               dirY += distY * distanceFactor;
                           }

                           var forceDiff = Math.abs(forceSum - totalForce);

                           if (minForceIndex == -1 || forceDiff < minForceDiff) {
                               minForceIndex = pointIndex;
                               minForceDiff = forceDiff;
                               minDirX = dirX;
                               minDirY = dirY;
                               minCurX = curX;
                               minCurY = curY;
                           } else {
                               break;
                           }
                       }

                       //Set the corrected equipotential point
                       curX = minCurX;
                       curY = minCurY;
                       dirX = minDirX;
                       dirY = minDirY;

                       //Mark the containing block as filled with a surface line.
                       var indI = parseInt(curX/horizontalBlock);
                       var indJ = parseInt(curY/verticalBlock);
                       if (indI >= 0 && indI < fieldFilled.length) {
                           if (indJ >= 0 && indJ < fieldFilled[indI].length) {
                            fieldFilled[indI][indJ] = true;
                           }
                        }

                       //Add the dot to the line
                       dots.push([curX, curY]);

                       if (dots.length > 5) {
                           //If got to the begining, a full circle has been made, terminate further iterations
                           if (indI == i && indJ == jj) {
                               distX = dots[0][0] - curX;
                               distY = dots[0][1] - curY;
                               if (distX*distX + distY*distY <= 49) {
                                   dots.push([dots[0][0], dots[0][1]]);
                                   times = 0;
                                   circleTimes = 3;
                               }
                           }
                           //If got out of the area, terminate furhter iterations for this turn.
                           if (curX < 0 || curX > 960 || curY < 0 || curY > 500) {
                               times=0;
                           }
                       }
                   }

                   calculatedFields.push([totalForce, dots]);
                   maxForce = Math.max(maxForce, Math.abs(totalForce));
               }
           }
       }
    }


    //Iterate through each generated equipotential surface
    for (var i=0; i<calculatedFields.length; i++) {
        var pair = calculatedFields[i];
        var stroke = "";
        var percentage = 9 - Math.min(9,parseInt(Math.abs(10 * pair[0])/maxForce ));
        //Set the stroke to be proportional to the surface potential
        if (pair[0]>=0) {
            //positive
            stroke = "#" + percentage+"b"+percentage;
        } else {
            //negative
            stroke = "#" + "b"+percentage + "" + percentage;
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
    var charges = users.map(function(d) { return [d.x, d.y, d.charge]; });

    //Draw the field lines

    //Starting points for positive/negative charges
    var dxPos = [3,0,-3,0];
    var dyPos = [0,3,0,-3];
    var dxNeg = [3, 3, -3 , -3];
    var dyNeg = [-3,3,3,-3];

    //Iterate for each charge
    for (var chargeIndex = 0; chargeIndex < charges.length; chargeIndex++) {

        //Four lines coming from a charge
        for (var pointIndex=0; pointIndex<4; pointIndex ++) {
            var curX = charges[chargeIndex][0];
            var curY = charges[chargeIndex][1];
            var polarity = 1;
            if (charges[chargeIndex][2] < 0) {
                polarity = -1;
            }
            if (polarity > 0) {
                curX += dxPos[pointIndex];
                curY += dyPos[pointIndex];
            } else {
                curX += dxNeg[pointIndex];
                curY += dyNeg[pointIndex];
            }

            var dots = [];
            dots.push([curX, curY]);

            //Maximum of 1000 points per force line
            var times = 1000;
            while (times-- > 0) {
                var dirX = 0;
                var dirY = 0;

                //Superposition the force vector at the current point
                for (var j = 0; j < charges.length; j++) {
                    var distX = curX - charges[j][0];
                    var distXSq = distX * distX;
                    var distY = curY - charges[j][1];
                    var distYSq = distY * distY;
                    var distanceSq = distXSq + distYSq;
                    //var distance = Math.sqrt(distanceSq);

                    var force = charges[j][2] / distanceSq;
                    var factor= force * polarity;// / distance;
                    dirX += distX * factor;
                    dirY += distY * factor;
                }

                //Move the next dot to follow the force vector
                var dirTotal = Math.sqrt(dirX*dirX + dirY*dirY);
                var addFactor = 7 / dirTotal;
                curX = curX + addFactor*dirX;
                curY = curY + addFactor*dirY;
                dots.push([curX, curY]);

                if (times%30 ==0) {
                    //Draw an arrow
                    if (polarity == 1) {
                        var destinationX = curX;
                        var destinationY = curY;
                        var source1X = dots[dots.length-2][0] + addFactor*dirY;
                        var source1Y = dots[dots.length-2][1] - addFactor*dirX;
                        var source2X = dots[dots.length-2][0] - addFactor*dirY;
                        var source2Y = dots[dots.length-2][1] + addFactor*dirX;
                    } else {
                        var destinationX = dots[dots.length-2][0];
                        var destinationY = dots[dots.length-2][1];
                        var source1X = curX + addFactor*dirY;
                        var source1Y = curY - addFactor*dirX;
                        var source2X = curX - addFactor*dirY;
                        var source2Y = curY + addFactor*dirX;
                    }
                    var arrowDots = [];
                    arrowDots.push([source1X, source1Y]);
                    arrowDots.push([destinationX, destinationY]);
                    arrowDots.push([source2X, source2Y]);
                    svg.insert("path", "circle")
                            .datum(arrowDots)
                            .attr("class", "line")
                            .attr("d", line);
                }

                //If the next dot is inside a circle, terminate further iterations
                for (var j = 0; j < charges.length; j++) {
                    distX = charges[j][0] - curX;
                    distY = charges[j][1] - curY;
                    if (distX*distX + distY*distY <= 16) {
                        times=0;
                    }
                }

            }

            //Render the line
            svg.insert("path", "circle")
                .datum(dots)
                .attr("class", "line")
                .attr("d", line);
        }

    }

    currentTime -= new Date().getTime()
    console.log("redraw_fieldlines iteration took: " + (-1*currentTime)+"ms." )

}

