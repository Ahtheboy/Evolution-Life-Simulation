const canv = document.getElementById("simulation-disp");
const _ctx = canv.getContext("2d");
const canv_topo = document.getElementById("elevation-disp");
const _ctx_topo = canv_topo.getContext("2d");

const startButton = document.getElementById("start-sim-button")
startButton.addEventListener("click", updateHandler);

const GRIDSIZE = 256;

// The number of actual canvas pixels are along the side length of a displayed pixel.
const PDISPSIZE = 2;

// Plant characteristic indicides
const COMPINTENSITY_IND = 0;
const SEEDTRAVELDIST_IND = 1;
const LIFESPAN_IND = 2;
const SEEDLONGEVITY_IND = 3;
const COMPETSTRESS_IND = 4;
const PROPPRESSURE_IND = 5;
const COLDTOLER_IND = 6;
const AGE_IND = 7;

// Characteristics of the seedbank:
// Each seedbank: Center prop pressure, longevity, i, j,
// plant characteristics array (may become genetic makeup).

_ctx.fillStyle = "black";
//_ctx.fillRect(0, 0, GRIDSIZE, GRIDSIZE)

// Run setup code here.
const _basecircle = circularFalloff(32, 1, 2);

// Plantgrid
const _plantGrid = createPlantGrid();

//TODO: Create a blank competition grid that for now this should just be a measure of the proximity of the gridspace to other plants.
const _compGrid = createCompGrid();
updateCompGrid(_compGrid, _plantGrid);

const _topoGrid = createSimpleGrid();

//TODO: Create a seed bank map
// Represent each seedbank dispersal from the plant as a circle and an intensity.
// This should just include the radius, the location of the center,
// propagule pressure at the center, and seed characteristics
// (maybe eventually a probability distribution for variability between propagules from the same plant?).
// The stepwise simulation process should efficiently get a linear falloff for simplicity (Maybe an exponential falloff later?).

//TODO: Set up an array holding a sparse representation of seed locations.
const _seedbank = new Map();

// Display the initial configuration
dispSimpleGrid(_compGrid, _ctx);
dispSimpleGrid(_topoGrid, _ctx_topo)

//TODO: Create an updating handler for controlling how often things are updated.
var toggleRun = 0;
var intervalID = 0;
function updateHandler()
{
   toggleRun = toggleRun + 1;
   toggleRun = toggleRun % 2;
   if (toggleRun == 1)
   {
      intervalID = setInterval(runStep, 20)
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
   for (var i = 0; i < GRIDSIZE; i++)
   {
      arr[i] = Array(GRIDSIZE);
      for (var j = 0; j < GRIDSIZE; j++)
      {
         arr[i][j] = [0, 0, 0, 0, 0, 0, 0, 0];
      }
   }
   
   const numPoints = 2048;//20000;
   // Use random noise. Try for only a few plants to begin with.
   // Place some random points
   var randPixelX;
   var randPixelY;
   var longevity;
   for (i = 0; i < numPoints; i++)
   {
      randPixelX = Math.floor(Math.random() * GRIDSIZE);
      randPixelY = Math.floor(Math.random() * GRIDSIZE);
      longevity = Math.floor(-Math.log(Math.random()) * 8);
      //console.log("Got a random longevity of: " + longevity)
      arr[randPixelX][randPixelY] = [1, Math.random(), longevity,
         Math.random(), Math.random(), Math.random(), 0, 0];
      // Colder would cause it to be harder to generate as many propagules.
      coldToler = .5 - arr[randPixelX][randPixelY][PROPPRESSURE_IND] / 2;
   }
   return arr;
}


//TODO: Display the grid, using the correct colors.
// This function should also be useful for displaying topography
// or other environmental gradient grids, which should have a similar format.
function dispPlantGrid(grid, ctx)
{
   ctx.fillStyle = "gray";
   ctx.fillRect(0, 0, GRIDSIZE * PDISPSIZE, GRIDSIZE * PDISPSIZE);
   //ctx.fillStyle = "black";
   for (var i = 0; i < GRIDSIZE; i++)
   {
      for (var j = 0; j < GRIDSIZE; j++)
      {
         if (grid[i][j][COMPINTENSITY_IND] > 0)
         {
            //console.log("Filling in at position " + i + ", " + j + ".");
            // TODO: display based on color, etc.
            ctx.fillStyle = `rgb(${Math.floor(200 * grid[i][j][SEEDTRAVELDIST_IND])}
                                 ${Math.floor(grid[i][j][LIFESPAN_IND])}
                                 ${Math.floor(200 * grid[i][j][SEEDLONGEVITY_IND])})`;
            ctx.fillRect((j * PDISPSIZE), (i * PDISPSIZE), PDISPSIZE, PDISPSIZE);
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
   for (var i = 0; i < GRIDSIZE; i++)
   {
      for (var j = 0; j < GRIDSIZE; j++)
      {
         ctx.fillStyle = `rgb(${Math.floor(256 * grid[i][j])}
                              ${Math.floor(256 * grid[i][j])}
                              ${Math.floor(256 * grid[i][j])})`;
         ctx.fillRect((j * PDISPSIZE), (i * PDISPSIZE), PDISPSIZE, PDISPSIZE);
      }
   }
}

function createSimpleGrid()
{
   var arr = Array();
   for (var i = 0; i < GRIDSIZE; i++)
   {
      arr[i] = Array(GRIDSIZE);
      for(var j = 0; j < GRIDSIZE; j++)
      {
         arr[i][j] = 0;
      }
   }
   return arr;
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
      for (var i = 0; i < arrSize; i++)
      {
         mask[i] = Array(arrSize);
         for (var j = 0; j < arrSize; j++)
         {
            // Get the intensity based on positioning
            xPos = j - radius;
            yPos = -i + radius;
            trueDist = (Math.pow(xPos, 2) + Math.pow(yPos, 2)) + 1;
            intensity = (Math.pow(trueDist * (Math.pow(spread_mult, -1)), -2));
            mask[i][j] = intensity * startIntensity;
         }
      }
   }
   //console.log("Falloff side to center: " + mask[radius][radius + 1]);
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
            //console.log("i j iloc jloc: " + i + " " + j + " "
            //   + i_loc + " " + j_loc + " ");
         }
      }
   }
}

function createCompGrid()
{
   arr = Array(GRIDSIZE);
   for (var i = 0; i < GRIDSIZE; i++)
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
   var mask = circularFalloff(16, 1, .7);
   for (var i = 0; i < GRIDSIZE; i++)
   {
      for (var j = 0; j < GRIDSIZE; j++)
      {
         if (plantGrid[i][j][COMPINTENSITY_IND] > 0)
         {
            //console.log("Applying mask at " + i + " " + j + ".");
            applyMask(mask, i, j, compGrid, plantGrid[i][j][COMPINTENSITY_IND]);
         }
      }
   }
}

function clearCompGrid(compGrid)
{
   for (var i = 0; i < GRIDSIZE; i++)
   {
      for (var j = 0; j < GRIDSIZE; j++)
      {
         compGrid[i][j] = 0;
      }
   }
}

function displaySeedbank(seedbank, ctx)
{
   ctx.fillStyle = "white";
   ctx.fillRect(0, 0, GRIDSIZE * PDISPSIZE, GRIDSIZE * PDISPSIZE);
   // TODO Later
}

function decaySeedbank(seedbank)
{
   var cutoff = .3;
   // Exponentially decay the intensity of existing seed circles based on their
   // longevities. Once below some reasonable threshold, remove the seed circle.
   var seediter;
   var toRemove = Array();
   for (var seedkey of seedbank.keys())
   {
      seediter = seedbank.get(seedkey);
      //console.log(seediter);
      seediter[0] *= 1 - ((1 - Math.pow((Math.E), -1)) / seediter[1]);
      if (seediter[0] < cutoff)
      {
         toRemove.push(seedkey);
      }
   }
   
   for (var iter of toRemove)
   {
      seedbank.delete(iter);
   }
}

function disperseSeedbank(seedbank, compGrid, topoGrid, plantGrid)
{
   // For each plant location, add or update the seedbank intensity associated with
   // hashing a combination of the consistent plant characteristics and its location.
   // The seedbank intensity should be based on a fecundity score for the plant.
   var concatMapStr = "";
   var oldSeedCircle;
   var progenyState;
   
   var curLongevity;
   var curPressure;
   var curLikelihood;
   
   var rand;
   var setIntensity;
   
   for (var i = 0; i < GRIDSIZE; i++)
   {
      for (var j = 0; j < GRIDSIZE; j++)
      {
         if (plantGrid[i][j][COMPINTENSITY_IND] > 0)
         {
            // TODO: Make it hash based on all of the characteristics.
            concatMapStr = "" + i + " " + j + " "
               + plantGrid[i][j][SEEDTRAVELDIST_IND] + " "
               + plantGrid[i][j][LIFESPAN_IND] + " "
               + plantGrid[i][j][SEEDLONGEVITY_IND] + " "
               + plantGrid[i][j][COMPETSTRESS_IND];
            oldSeedCircle = seedbank.get(concatMapStr);
            progenyState = Array(plantGrid[i][j].length) //plantGrid[i][j];
            for (var pos = 0; pos < progenyState.length - 1; pos++)
            {
               progenyState[pos] = plantGrid[i][j][pos];
            }
            progenyState[AGE_IND] = 0;
            
            curLikelihood = (2 - compGrid[i][j]) - Math.pow((topoGrid[i][j] -
               plantGrid[i][j][COLDTOLER_IND]), 2);
            //console.log("elev factor for propagules: " + (topoGrid[i][j] *
            //   10000 * (1 - plantGrid[i][j][COLDTOLER_IND])));
            rand = Math.random();
            if (rand < curLikelihood)
            {
               //console.log("curLikelihood: " + i + " " + j + " " + curLikelihood);
               //oldSeedCircle[0] += .2; //plantGrid[i][j][...] * ...;
               setIntensity = .4 * plantGrid[i][j][PROPPRESSURE_IND];
            }
            else
            {
               setIntensity = 0;
            }
            
            // Occasionally change the values some.
            var change = Math.random() - 0.5;
            rand = Math.random();
            if (rand < 0.01)
            {
               progenyState[COLDTOLER_IND] += change;
               progenyState[PROPPRESSURE_IND] -= change;
               //if (progenyState[COLDTOLER_IND] > .4)
               //{
               //   console.log("mutation at " + i + " " + j + " to cold tolerance of "
               //   + progenyState[COLDTOLER_IND]);
               //}
            }
            
            if (oldSeedCircle == undefined)
            {
               // Each seedbank: Center prop pressure, longevity, i, j,
               // plant characteristics array (may become genetic makeup).
               curLongevity = plantGrid[i][j][SEEDLONGEVITY_IND] * 24;
               curPressure = plantGrid[i][j][PROPPRESSURE_IND];
               //console.log("curLongevity " + curLongevity);
               seedbank.set(concatMapStr, [setIntensity, curLongevity, i, j, progenyState]);
            }
            else
            {
               // TODO: Actually get the seed longevity based on the plant
               // behavior.
               oldSeedCircle[0] += setIntensity;
            }
         }
      }
   }
}

function ageKillPlants(plantGrid, topoGrid)
{
   // TODO: Make the cold part of a separate climate/stochastic control thing:
   var randColdThreshold = Math.random();
   var coldKill;
   for (var i = 0; i < GRIDSIZE; i++)
   {
      for (var j = 0; j < GRIDSIZE; j++)
      {
         //coldKill = randColdThreshold > plantGrid[i][j][COLDTOLER_IND] - (topoGrid[i][j] / 12);
         // This uses an arbitrary impact from competition for now.
         if (plantGrid[i][j][LIFESPAN_IND] < (plantGrid[i][j][AGE_IND]
            + ((plantGrid[i][j][COMPETSTRESS_IND] - plantGrid[i][j][COMPINTENSITY_IND]) * 4)))
         {
            //console.log("Killed plant at " + i + " " + j);
            plantGrid[i][j] = [0, 0, 0, 0, 0, 0, 0, 0];
         }
         else
         {
            //console.log(plantGrid[i][j][AGE_IND], plantGrid[i][j][COMPETSTRESS_IND])
            plantGrid[i][j][AGE_IND] += 1;
            //console.log("Age, lifespan: " + plantGrid[i][j][AGE_IND]
            //   + plantGrid[i][j][LIFESPAN_IND]);
         }
      }
   }
   //console.log("Finished killing plants for this round.");
}

function addNewPlants(seeddist, compGrid, plantGrid)
{
   var checkRadius = 8;
   var i_diff = seeddist[2] - checkRadius;
   var j_diff = seeddist[3] - checkRadius;
   //console.log(i_diff)
   var mask = circularFalloff(checkRadius, 1, 1);
   var curProb;
   var rand_val;
   // For the given, spawn new plants based on probabilities.
   for (var i = 0; i < mask.length; i++)
   {
      for (var j = 0; j < mask.length; j++)
      {
         if (((i + i_diff) < GRIDSIZE) && ((i + i_diff) >= 0)
            && ((j + j_diff) < GRIDSIZE) && ((j + j_diff) >= 0))
         {
            curProb = ((mask[i][j] * seeddist[0]) - compGrid[i + i_diff][j + j_diff]) / 32;
            rand_val = Math.random();
            //console.log(curProb);
            // If the cutoff was reached, add the 'progeny' data stored by
            // seeddist.
            if ((rand_val < curProb)
               && plantGrid[i + i_diff][j + j_diff][COMPINTENSITY_IND] == 0)
            {
               //console.log(curProb, rand_val);
               plantGrid[i + i_diff][j + j_diff] = seeddist[4];
            }
         }
      }
   }
}


function drawElev()
{
   //var randPixelX = Math.floor(Math.random() * GRIDSIZE);
   //var randPixelY = Math.floor(Math.random() * GRIDSIZE);
   //_topoGrid[randPixelX][randPixelY] = 1;
   // Get the x and y coordinates:
   var positioning = canv.getBoundingClientRect();
   var clickposX = Math.floor((event.clientX - positioning.left) / PDISPSIZE);
   var clickposY = Math.floor((event.clientY - positioning.top) / PDISPSIZE);
   
   console.log(clickposX + " " + clickposY);
   // Add a brush stroke there
   //_topoGrid[clickposY][clickposX] = 1;
   applyMask(_basecircle, clickposY, clickposX, _topoGrid, 6);
   
   dispSimpleGrid(_topoGrid, _ctx_topo);
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
   console.log("Seedbank size at start of step: " + _seedbank.size);
   decaySeedbank(_seedbank);
   disperseSeedbank(_seedbank, _compGrid, _topoGrid, _plantGrid);
   for (var iter of _seedbank.values())
   {
      //console.log("Got to iter of: " + iter);
      //console.log("Spot in compgrid: " + _compGrid[20][20]);
      addNewPlants(iter, _compGrid, _plantGrid);
   }
   ageKillPlants(_plantGrid, _topoGrid);
   dispPlantGrid(_plantGrid, _ctx);
   
   // At the end:
   clearCompGrid(_compGrid);
   updateCompGrid(_compGrid, _plantGrid);
   //dispSimpleGrid(_compGrid, _ctx);
   
}