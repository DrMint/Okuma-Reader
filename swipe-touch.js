export function swipedetect(el, callback) {

  function start(e, touchobj) {
    swipedir = 'none';
    dist = 0;
    startX = touchobj.pageX;
    startY = touchobj.pageY;
    startTime = new Date().getTime(); // record time when finger first makes contact with surface
    e.preventDefault();
  }

  function end(e, touchobj) {
    distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
    distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
    elapsedTime = new Date().getTime() - startTime; // get time elapsed
    if (elapsedTime <= allowedTime) { // first condition for awipe met
      if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) { // 2nd condition for horizontal swipe met
        swipedir = (distX < 0) ? 'left' : 'right';
      } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) { // 2nd condition for vertical swipe met
        swipedir = (distY < 0) ? 'up' : 'down';
      } else if (Math.abs(distX + distY) < thresholdClick) {
				swipedir = [touchobj.pageX, touchobj.pageY];
			}
    }
    // check that elapsed time is within specified, horizontal dist traveled >= threshold, and vertical dist traveled <= 100
    handleswipe(swipedir);
    e.preventDefault();
  }

  var touchsurface = el, swipedir, startX, startY, distX, distY, dist, elapsedTime, startTime,
    threshold = 50,
		thresholdClick = 10,
    restraint = 40,
    allowedTime = 300,
    ismousedown = false,
    handleswipe = callback || function (swipedir) {};

  touchsurface.addEventListener('touchstart', function (e) {start(e, e.changedTouches[0]);}, false);
  touchsurface.addEventListener('mousedown', function (e) {start(e, e); ismousedown = true;}, false);
  touchsurface.addEventListener('touchend', function (e) {end(e, e.changedTouches[0]);}, false);
  touchsurface.addEventListener('mouseup', function (e) {if (ismousedown) {end(e, e); ismousedown = false;}}, false);
}
