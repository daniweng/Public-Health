let table;
let colors = {
  'Heat Stress (Heat-related Illness)': '#ea7af4',
  'Carbon Monoxide Poisoning': '#4361EE',
  'Asthma': '#DBFF9C',
  'Myocardial Infarction (Heart Attack)': ' #4CC9F0',
  'Chronic Obstructive Pulmonary Disease (COPD)': '#fb6f92'
};

let maxCount, scaleFactor, dataRadius, labelOffset, outerRadius, angleIncrement, additionalOffset;
let healthConditionsData = {};
let totalCasesPerYear = {};

let hoveredIndex = -1; // Variable to keep track of the hovered data point index
let tooltipVisible = false;  // Variable to manage tooltip visibility
let tooltipText = "";        // Variable to store the tooltip text

function preload() {
  table = loadTable('Health.csv', 'csv', 'header');
}

function setup() {
  let vizDiv = document.getElementById('visualization');
  let canvasWidth = vizDiv.offsetWidth;
  let canvasHeight = vizDiv.offsetHeight;

  var canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('visualization');
  background('#201F1F');

  maxCount = max(table.getColumn('Case Count'));
  scaleFactor = 800 / 1600;
  dataRadius = 400 * scaleFactor;
  labelOffset = 60;
  outerRadius = 350 * scaleFactor;;
  additionalOffset = 120; // Adjust this value for the distance from the center
  angleIncrement = TWO_PI / (2020 - 2011 + 1);

  table.rows.forEach(row => {
    let year = row.getNum('Year');
    let health = row.getString('Health');
    let caseCount = row.getNum('Case Count');

    if (!healthConditionsData[health]) {
      healthConditionsData[health] = [];
    }
    if (!totalCasesPerYear[year]) {
      totalCasesPerYear[year] = 0;
    }
    totalCasesPerYear[year] += caseCount;
    healthConditionsData[health].push({ year, health, caseCount });
  });
}
function windowResized() {
  let vizDiv = document.getElementById('visualization');
  let canvasWidth = vizDiv.offsetWidth;
  let canvasHeight = vizDiv.offsetHeight;
  resizeCanvas(windowWidth, windowHeight);
}
function draw() {
  background('#201F1F');
  translate(width / 2, height / 2);
  drawRadialChart();
  
  // Detect mouse hover and display tooltip
  let mousePos = createVector(mouseX - width / 2, mouseY - height / 2);
  for (let health in healthConditionsData) {
    healthConditionsData[health].forEach(data => {
      let year = data.year;
      let r = map(data.caseCount, 0, maxCount, 0, dataRadius);
      let x = cos(angleIncrement * (year - 2011) - HALF_PI) * r;
      let y = sin(angleIncrement * (year - 2011) - HALF_PI) * r;

      // Draw a dot for each data point
      fill(colors[health]);
      let d = dist(mousePos.x, mousePos.y, x, y);
      if (d < 10) { // Hover effect: increase size of the dot
        fill(colors[health]);
        ellipse(x, y, 15, 15);  // Increased size
        // Display tooltip text
        fill('#FFFFFF');
        textSize(14);
        textAlign(LEFT, CENTER);
        text(`Year: ${year}, Health: ${health}, Cases: ${data.caseCount}`, mousePos.x + 10, mousePos.y - 20);
      } else {
        fill(colors[health]);
        ellipse(x, y, 6, 6); // Original size
      }
    });
  }

  // Draw Legend
  drawLegend();
}

function drawRadialChart() {
  stroke('#717171');
  let sides = 10;
  let angle = -HALF_PI;

  // Calculate the intervals for the gray circular lines
  let interval = outerRadius / 4; // Adjust the number of lines as needed

  // Draw the outer gray circular line
  for (let i = 0; i < sides; i++) {
    let x = cos(angle) * outerRadius*1.23 ;
    let y = sin(angle) * outerRadius *1.23;
    line(0, 0, x, y);
    angle += angleIncrement;
  }

  noFill();
  stroke('#717171');
  strokeWeight(1 * scaleFactor);
  ellipse(0, 0, outerRadius * 2, outerRadius * 2);

  // Draw 2 equally spaced gray circular lines inside the outer circle
  for (let i = 1; i <= 3; i++) {
    let innerCircleRadius = i * interval;
    ellipse(0, 0, innerCircleRadius * 3.3, innerCircleRadius * 3.3);
  }

  // Draw the radial lines connecting to data points
  for (let health in healthConditionsData) {
    beginShape();
    noStroke(); // Remove stroke to eliminate the border

    fill(colors[health]);
    strokeWeight(2 * scaleFactor);
    noFill();
    healthConditionsData[health].forEach(data => {
      let year = data.year;
      let r = map(data.caseCount, 0, maxCount, 0, dataRadius);
      let x = cos(angleIncrement * (year - 2011) - HALF_PI) * r;
      let y = sin(angleIncrement * (year - 2011) - HALF_PI) * r;

      fill(color(colors[health]).levels[0], color(colors[health]).levels[1], color(colors[health]).levels[2], 150); // 128 is 50% transparency

      vertex(x, y);
    });
    endShape(CLOSE);
  }

  textSize(28 * scaleFactor);
  angle = -HALF_PI;
  for (let year = 2011; year <= 2020; year++) {
    let totalCases = totalCasesPerYear[year];

    // Coordinates for Pie Charts
    let pieX = cos(angle) * (outerRadius + additionalOffset);
    let pieY = sin(angle) * (outerRadius + additionalOffset);

    // Adjusted Coordinates for Year Labels (closer to the radial chart)
    let labelX = cos(angle) * (outerRadius + 60); // Closer to the radial chart
    let labelY = sin(angle) * (outerRadius + 60);

    let sortedHealths = Object.keys(colors).sort((a, b) => {
      let aData = healthConditionsData[a].find(d => d.year === year) || { caseCount: 0 };
      let bData = healthConditionsData[b].find(d => d.year === year) || { caseCount: 0 };
      return bData.caseCount - aData.caseCount;
    });

    let startAngle = 0;
    sortedHealths.forEach(health => {
      let data = healthConditionsData[health].find(d => d.year === year) || { caseCount: 0 };
      let proportion = data.caseCount / totalCases;
      let endAngle = startAngle + proportion * TWO_PI;

      fill(colors[health]);
      arc(pieX, pieY, labelOffset, labelOffset, startAngle - HALF_PI, endAngle - HALF_PI, PIE);

      // Check for mouse hover on pie charts and update tooltip
      if (dist(mouseX - width / 2, mouseY - height / 2, pieX, pieY) < labelOffset / 2 &&
          isMouseInArc(pieX, pieY, labelOffset, startAngle - HALF_PI, endAngle - HALF_PI)) {
        tooltipVisible = true;
        tooltipText = `${health}: ${(proportion * 100).toFixed(2)}%`;
      }

      startAngle = endAngle;
    });

    fill('#F3F6EF');
    noStroke();
    textAlign(CENTER, CENTER);
    push();
    translate(labelX, labelY);
    rotate(angle + HALF_PI);
    text(year.toString(), 0, -20);
    pop();

    angle += angleIncrement;
  }

  // Display tooltip if hovering over a pie chart
  if (tooltipVisible) {
    fill('#FFFFFF');
    textSize(14);
    textAlign(CENTER, CENTER);
    text(tooltipText, mouseX - width / 2, mouseY - height / 2 - 20);
    tooltipVisible = false; // Reset tooltip visibility for next frame
  }
}

function drawLegend() {
  let legendX = -700; // Adjusted X-coordinate for the legend
  let legendY = -150; // Adjusted Y-coordinate for the legend

  // Loop through health conditions and create legend entries
  let legendOffsetY = 0;
  for (let health in healthConditionsData) {
    let fillColor = colors[health];

    // Draw colored rectangle as legend key
    fill(fillColor);
    noStroke();
    rect(legendX, legendY + legendOffsetY, 15, 15);

    // Display health condition name next to the legend key
    fill('#FFFFFF'); // Adjust the text color
    textSize(14);
    textAlign(LEFT, CENTER);
    text(health, legendX + 30, legendY + legendOffsetY + 10);

    legendOffsetY += 30; // Adjust the vertical spacing between legend entries
  }
}



// Helper function to check if mouse is inside a pie chart arc
function isMouseInArc(cx, cy, radius, startAngle, endAngle) {
  let x = mouseX - width / 2 - cx;
  let y = mouseY - height / 2 - cy;
  let angle = atan2(y, x);

  if (angle < -PI) angle += TWO_PI;
  if (startAngle < -PI) startAngle += TWO_PI;
  if (endAngle < -PI) endAngle += TWO_PI;

  return dist(cx, cy, mouseX - width / 2, mouseY - height / 2) <= radius / 2 &&
         angle >= startAngle && angle <= endAngle;
}
