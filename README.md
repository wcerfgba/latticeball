# latticeball
## A game with a ball.

Live version at <http://www.jlpreston.uk/latticeball>.

Similar to many classic games of the past (\*cough\*Pong\*cough\*), play in a 
regular polygon or on a lattice.


### Code showcase
 * Lightweight cached computed properties implementation (see
   `app/comprops.js`). This is used extensively in the vector library
   (`app/vect.js`).
 * Spatial partitioning for collision detection and caching (see `app/Game.js`).


### TODO
 * Networked muliplayer version.
 * More lightweight game over deection.
 * Add mouse and touch listeners for control.
 * Make lattice generation more even and flexible.
 * Add shield velocity to ball on collision.
 * MULTIBALL!
