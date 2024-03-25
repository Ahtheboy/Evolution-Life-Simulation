# Evolution-Life-Simulation
I made this at AppHack 2024
This is a Javascript simulation of plant competition and simplified evolutionary genetics.


Features:
- A landscape with topography can be generated randomly and modified by clicking and moving around with a brush.
- Starting conditions should be random. (Maybe start with a species that has randomized alleles)
- The simulation can be paused and unpaused.
- Clicking on the gray canvas places topography, visible on the black canvas.
- Occasional mutations. Right now it is only for a tolerance value for higher topography.

Other Originally Planned Features:
- A control slider for the temperature of the climate should be available.
- Sexual reproduction
- A graphic could show a distribution of the alleles for predefined traits.

Most predefined traits should have an optimum that works in only some situations.
Predefined traits should be:
- overall cold tolerance (lower temperatures kill the plant)
- Minimum growing season for reproduction (Defined by the climate - time above 0°C)
- Minimum growing season for survival (Defined by the climate - time above 0°C)
- flower phenology temperature threshold (GDD above a minimum of 0°C)
- seed travel distance
- pollen travel distance
- average lifespan.
Associated traits:
- A trait representing seed bank longevity, a trait representing energy units needed to produce seeds.
- Energy units produced per growing day, trading off with a resource competitiveness threshold for survival.

Climate variables:
- Minimum and maximum temp averages during the year (used to calculate growing season length)
  - This should be set with the slider for sea level, but both min and max should decrease with increasing altitude as a function of lapse rate.
- Temperature variability - Defines a normal distribution deviation around the slider value. This means that the growing season length could vary by year.

Environment and Platform:
- Run locally in an HTML document with additional files.
