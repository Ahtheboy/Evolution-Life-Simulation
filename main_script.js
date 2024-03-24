const canv = document.getElementById("simulation-disp");
const ctx = canv.getContext("2d");

const startButton = document.getElementById("start-sim-button")
startButton.addEventListener("click", updateHandler);

const GRIDSIZE = 256;

// The number of actual canvas pixels are along the side length of a displayed pixel.
const PDISPSIZE = 2;

ctx.fillStyle = "black";
//ctx.fillRect(0, 0, GRIDSIZE, GRIDSIZE)

// Run setup code here.

// Plantgrid
const plantGrid = createPlantGrid();

//TODO: Create a blank competition grid that for now this should just be a measure of the proximity of the gridspace to other plants.
const compGrid = createCompGrid();
updateCompGrid(compGrid, plantGrid);

//TODO: Create a seed bank array
// Represent each seedbank dispersal from the plant as a circle and an intensity.
// This should just include the radius, the location of the center,
// propagule pressure at the center, and seed characteristics
// (maybe eventually a probability distribution for variability between propagules from the same plant?).
// The stepwise simulation process should efficiently get a linear falloff for simplicity (Maybe an exponential falloff later?).

// Display the initial configuration
dispSimpleGrid(compGrid, ctx);

//TODO: Create an updating handler for controlling how often things are updated.
var toggleRun = 0;
var intervalID = 0;
function updateHandler()
{
   toggleRun = toggleRun + 1;
   toggleRun = toggleRun % 2;
   if (toggleRun == 1)
   {
      intervalID = setInterval(runStep, 200)
   }
   else
   {
      clearInterval(intervalID);
   }
}


//TODO: Set up the plant grid starting conditions
// This should keep a vector of numbers in each cell representing characteristics
// of the plants. This should be an easily expandable representation.
function createPlantGrid()
{
   // Array of characteristics:
   // Intensity of plant (0 to 1) Most should be around 1
   // overall cold tolerance (lower temperatures kill the plant)
   // Minimum growing season for reproduction (Defined by the climate - time above 0°C)
   // Minimum growing season for survival (Defined by the climate - time above 0°C)
   // flower phenology temperature threshold (GDD above a minimum of 0°C)
   // seed travel distance
   // pollen travel distance
   // average lifespan.
   //Associated traits:
   // A trait representing seed bank longevity, a trait representing energy units needed to produce seeds. A simplification of this for early testing for running the simulation should just have
   // arbitrary values for this.
   // Energy units produced per growing day, trading off with a resource competitiveness threshold for survival.
   // Transient traits modified each step:
   // age, energy stress.
   
   // Later: Do pollination characteristics and evolution. Only add pollination if finished with base simulation where
   // plants have propagules identical

   var arr = Array(GRIDSIZE);
   for (i = 0; i < GRIDSIZE; i++)
   {
      arr[i] = Array(GRIDSIZE);
      for (j = 0; j < GRIDSIZE; j++)
      {
         arr[i][j] = [0, 0, 0, 0];
      }
   }
   
   const numPoints = 64;
   // Use random noise. Try for only a few plants to begin with.
   // Place some random points
   for (i = 0; i < numPoints; i++)
   {
      var randPixelX = Math.floor(Math.random() * GRIDSIZE);
      var randPixelY = Math.floor(Math.random() * GRIDSIZE);
      arr[randPixelX][randPixelY] = [1, Math.random(), Math.random(), Math.random()];
   }
   return arr;
}


//TODO: Display the grid, using the correct colors.
// This function should also be useful for displaying topography
// or other environmental gradient grids, which should have a similar format.
function dispPlantGrid(grid, ctx)
{
   ctx.fillStyle = "white";
   ctx.fillRect(0, 0, GRIDSIZE * PDISPSIZE, GRIDSIZE * PDISPSIZE);
   //ctx.fillStyle = "black";
   for (i = 0; i < GRIDSIZE; i++)
   {
      for (j = 0; j < GRIDSIZE; j++)
      {
         if (grid[i][j][0] == 1)
         {
            //console.log("Filling in at position " + i + ", " + j + ".");
            // TODO: display based on color, etc.
            ctx.fillStyle = `rgb(${Math.floor(256 * grid[i][j][1])}
                                 ${Math.floor(256 * grid[i][j][2])}
                                 ${Math.floor(256 * grid[i][j][3])})`;
            ctx.fillRect((i * PDISPSIZE), (j * PDISPSIZE), PDISPSIZE, PDISPSIZE);
         }
      }
   }
}

//TODO: Display the grid, using the correct colors.
// This function should also be useful for displaying topography
// or other environmental gradient grids, which should have a similar format.
function dispSimpleGrid(grid, ctx)
{
   ctx.fillStyle = "white";
   ctx.fillRect(0, 0, GRIDSIZE * PDISPSIZE, GRIDSIZE * PDISPSIZE);
   ctx.fillStyle = "black";
   for (i = 0; i < GRIDSIZE; i++)
   {
      for (j = 0; j < GRIDSIZE; j++)
      {
         ctx.fillStyle = `rgb(${Math.floor(256 * grid[i][j])}
                              ${Math.floor(256 * grid[i][j])}
                              ${Math.floor(256 * grid[i][j])})`;
         ctx.fillRect((i * PDISPSIZE), (j * PDISPSIZE), PDISPSIZE, PDISPSIZE);
      }
   }
}

// TODO: Calculate a radius and start intensity for circular falloff.
function circularFalloff(radius, startIntensity, spread_mult)
{
   // radius should be the cutoff distance
   var arrSize = radius * 2 + 1;
   var mask = Array(arrSize);
   var xPos = 0;
   var yPos = 0;
   var intensity = 0;
   var trueDist = 0;
   for (i = 0; i < arrSize; i++)
   {
      mask[i] = Array(arrSize);
      for (j = 0; j < arrSize; j++)
      {
         // Get the intensity based on positioning
         xPos = j - radius;
         yPos = -i + radius;
         trueDist = (Math.pow(xPos, 2) + Math.pow(yPos, 2));
         intensity = (Math.pow(trueDist * (Math.pow(spread_mult, -1)), -2));
         mask[i][j] = intensity;
      }
   }
   return mask;
}

function applyMask(mask, i_loc, j_loc, target, startIntensity)
{
   var radius = Math.floor(mask.length / 2);
   var i_diff = i_loc - radius;
   var j_diff = j_loc - radius;
   
   //target[i_loc][j_loc] += 1;
   //console.log("Applying mask of size " + mask.length)
   for (var i = 0; i < mask.length; i++)
   {
      for (var j = 0; j < mask.length; j++)
      {
      
         if (((i + i_diff) < GRIDSIZE) && ((i + i_diff) >= 0)
            && ((j + j_diff) < GRIDSIZE) && ((j + j_diff) >= 0))
         {
             target[i + i_diff][j + j_diff] += 
                (startIntensity * mask[i][j]);
         }
      }
   }
}

function createCompGrid()
{
   arr = Array(GRIDSIZE);
   for (i = 0; i < GRIDSIZE; i++)
   {
      arr[i] = Array(GRIDSIZE);
      for (j = 0; j < GRIDSIZE; j++)
      {
         arr[i][j] = 0;
      }
   }
   return arr;
}

function updateCompGrid(compGrid, plantGrid)
{
   var mask = circularFalloff(16, 1, 8);
   for (i = 0; i < GRIDSIZE; i++)
   {
      for (j = 0; j < GRIDSIZE; j++)
      {
         if (plantGrid[i][j][0] == 1)
         {
            //console.log("Applying mask at " + i + " " + j + ".");
            applyMask(mask, i, j, compGrid, 1);
         }
      }
   }
}

//TODO: Set up an array holding a sparse representation of seed locations.
function createSeedbank()
{

}


//TODO: Use a noise pattern to generate topography
function createTopographyGrid()
{
  // To begin, just have a simple grid display.
}


//TODO: This should set up the traits and run through a step of the simulation.
function runStep()
{
   //Parts to simulate:
   // 0. (After other parts involving selection are working): Choose the climate variation for the step based on stochasticity and a baseline.
   // 1. Seed decay for each seedbank circle (exponential decay in intensity based on seed longevity)
   // 2. In the same loop, produce new plants based on propagule pressure, competition intensity,
   //  and also hopefully based on stochastic and gradient based climate values for each seed circle.
   // 3. Update the competition grid based on new plant locations while going through and updating the ages
   //    of the plants.
   // 4. TODO: Flesh out evolutionary parts of simulation.
}