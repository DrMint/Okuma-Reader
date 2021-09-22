"use strict";

/* @->zoom */
//zoom();

/* @-<zoom ********************************************************************/
/******************************************************************************/
export function zoom(classNames, settings, clickCallback) {
    /* Settings */
    classNames = (typeof(classNames) !== 'undefined' && Object.keys(classNames).length ? classNames : {});
    settings = (typeof(settings) !== 'undefined' && Object.keys(settings).length ? settings : {});

    let C_scaleDefault = settings["scaleDefault"] || 2; // Used on doubleclick, doubletap and resize
    let C_scaleDifference = settings["scaleDifference"] || 0.3; // Used on wheel zoom
    let C_scaleMax = settings["scaleMax"] || 5;
    let C_scaleMin = settings["scaleMin"] || 1;

    /* Selectors */
    let _active = classNames["active"] || "active";
    let _dataScale = "data-scale";
    let _dataTranslateX = "data-translate-x";
    let _dataTranslateY = "data-translate-y";
    let _transition = classNames["transition"] || "transition";
    let _visible = classNames["visible"] || "visible";
    let $container;
    let $element;
    let $zoom = document.getElementsByClassName(classNames["zoom"] || "zoom");

    /* Helpers */
    let capture = false;
    let doubleClickMonitor = [null];
    let containerHeight;
    let containerWidth;
    let containerOffsetX;
    let containerOffsetY;
    let initialScale;
    let elementHeight;
    let elementWidth;
    let heightDifference;
    let initialOffsetX;
    let initialOffsetY;
    let initialPinchDistance;
    let initialPointerOffsetX;
    let initialPointerOffsetX2;
    let initialPointerOffsetY;
    let initialPointerOffsetY2;
    let limitOffsetX;
    let limitOffsetY;
    let mousemoveCount = 0;
    let offset;
    let pinchOffsetX;
    let pinchOffsetY;
    let pointerOffsetX;
    let pointerOffsetX2;
    let pointerOffsetY;
    let pointerOffsetY2;
    let scaleDirection;
    let scaleDifference;
    let targetOffsetX;
    let targetOffsetY;
    let targetPinchDistance;
    let targetScale;
    let touchable = false;
    let touchCount;
    let touchmoveCount = 0;
    let doubleTapMonitor = [null];
    let widthDifference;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    let edgeClickArea = 0.2;
    let doubleTapAllowOffset = 30;
    let hasDoubleTapTriggered = false;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /* EVENT - DOM ready ********************************************************/
    /****************************************************************************/
    for (let i = 0; i < $zoom.length; i++) {
        /* Initialize selectors */
        $container = $zoom[i];
        $element = $container.children[0];

        /* Set attributes */
        $element.setAttribute(_dataScale, 1);
        $element.setAttribute(_dataTranslateX, 0);
        $element.setAttribute(_dataTranslateY, 0);
    }

    /* EVENT - load - window ****************************************************/
    /****************************************************************************/
    window.addEventListener("load", function() {
        /* Wait for images to be loaded */
        for (let i = 0; i < $zoom.length; i++) {
            /* Initialize selectors */
            $container = $zoom[i];
            $element = $container.children[0];

            addClass($element, _visible);
        }

        /* EVENT - resize - window ************************************************/
        /**************************************************************************/
        window.addEventListener("resize", function() {
            for (let i = 0; i < $zoom.length; i++) {
                /* Initialize selectors */
                $container = $zoom[i];
                $element = $container.children[0];

                if (hasClass($container, _active) === false) {
                    continue;
                }

                /* Initialize helpers */
                containerHeight = $container.clientHeight;
                containerWidth = $container.clientWidth;
                elementHeight = $element.clientHeight;
                elementWidth = $element.clientWidth;
                initialOffsetX = parseFloat($element.getAttribute(_dataTranslateX));
                initialOffsetY = parseFloat($element.getAttribute(_dataTranslateY));
                targetScale = C_scaleDefault;
                limitOffsetX = ((elementWidth * targetScale) - containerWidth) / 2;
                limitOffsetY = ((elementHeight * targetScale) - containerHeight) / 2;
                targetOffsetX = (elementWidth * targetScale) > containerWidth ? minMax(initialOffsetX, limitOffsetX * (-1), limitOffsetX) : 0;
                targetOffsetY = (elementHeight * targetScale) > containerHeight ? minMax(initialOffsetY, limitOffsetY * (-1), limitOffsetY) : 0;

                if (targetScale === 1) {
                    removeClass($container, _active);
                }

                /* Set attributes */
                $element.setAttribute(_dataScale, targetScale);
                $element.setAttribute(_dataTranslateX, targetOffsetX);
                $element.setAttribute(_dataTranslateY, targetOffsetY);

                /* @->moveScaleElement */
                moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", targetScale);
            }
        });
    });

    /* EVENT - mousedown - $zoom ************************************************/
    /* **************************************************************************/
    massAddEventListener($zoom, "mousedown", mouseDown);

    /* EVENT - mousemove - document *********************************************/
    /****************************************************************************/
    document.addEventListener("mousemove", mouseMove);

    /* EVENT - mouseup - document ***********************************************/
    /****************************************************************************/
    document.addEventListener("mouseup", mouseUp);

    /* EVENT - touchstart - document ********************************************/
    /****************************************************************************/
    document.addEventListener("touchstart", function() {
        touchable = true;
    });

    /* EVENT - touchstart - $zoom ***********************************************/
    /* **************************************************************************/
    massAddEventListener($zoom, "touchstart", touchStart);

    /* EVENT - touchmove - document *********************************************/
    /****************************************************************************/
    document.addEventListener("touchmove", touchMove);

    /* EVENT - touchend - document **********************************************/
    /****************************************************************************/
    document.addEventListener("touchend", touchEnd);

    /* EVENT - wheel - $zoom ****************************************************/
    /****************************************************************************/
    massAddEventListener($zoom, "wheel", wheel);

    /* @-<mouseDown *************************************************************/
    /****************************************************************************/
    function mouseDown(e) {

        if (touchable === true || e.which !== 1) {
            return false;
        }

        /* Initialize selectors */
        $container = this;
        $element = this.children[0];

        /* Initialize helpers */
        initialPointerOffsetX = e.clientX;
        initialPointerOffsetY = e.clientY;

        /* Doubleclick */
        if (doubleClickMonitor[0] === null) {
            doubleClickMonitor[0] = e.target;
            doubleClickMonitor[1] = initialPointerOffsetX;
            doubleClickMonitor[2] = initialPointerOffsetY;

            setTimeout(function() {

              //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
              // If this was a normal click
              if (mousemoveCount < 5 && !capture) handlesSingleClick();
              hasDoubleTapTriggered = false;
              //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

              doubleClickMonitor = [null];

            }, 300);



        } else if (doubleClickMonitor[0] === e.target && mousemoveCount <= 5
          && isWithinRange(initialPointerOffsetX, doubleClickMonitor[1] - 10, doubleClickMonitor[1] + 10) === true
          && isWithinRange(initialPointerOffsetY, doubleClickMonitor[2] - 10, doubleClickMonitor[2] + 10) === true) {
            addClass($element, _transition);

            hasDoubleTapTriggered = true;

            if (hasClass($container, _active) === true) {
                /* Set attributes */
                $element.setAttribute(_dataScale, 1);
                $element.setAttribute(_dataTranslateX, 0);
                $element.setAttribute(_dataTranslateY, 0);

                removeClass($container, _active);

                /* @->moveScaleElement */
                moveScaleElement($element, 0, 0, 1);
            } else {
                /* Set attributes */
                $element.setAttribute(_dataScale, C_scaleDefault);
                $element.setAttribute(_dataTranslateX, 0);
                $element.setAttribute(_dataTranslateY, 0);

                addClass($container, _active);

                /* @->moveScaleElement */
                moveScaleElement($element, 0, 0, C_scaleDefault);
            }

            setTimeout(function()
            {
                removeClass($element, _transition);
            }, 200);

            doubleClickMonitor = [null];
            return false;
        }

        /* Initialize helpers */
        offset = $container.getBoundingClientRect();
        containerOffsetX = offset.left;
        containerOffsetY = offset.top;
        containerHeight = $container.clientHeight;
        containerWidth = $container.clientWidth
        elementHeight = $element.clientHeight;
        elementWidth = $element.clientWidth;
        initialOffsetX = parseFloat($element.getAttribute(_dataTranslateX));
        initialOffsetY = parseFloat($element.getAttribute(_dataTranslateY));
        initialScale = minMax(parseFloat($element.getAttribute(_dataScale)), C_scaleMin, C_scaleMax);

        mousemoveCount = 0;

        /* Set capture */
        capture = true;
    }

    /* @-<mouseMove *************************************************************/
    /****************************************************************************/
    function mouseMove(e) {
        if (touchable === true || capture === false) {
            return false;
        }

        /* Initialize helpers */
        pointerOffsetX = e.clientX;
        pointerOffsetY = e.clientY;
        targetScale = initialScale;
        limitOffsetX = ((elementWidth * targetScale) - containerWidth) / 2;
        limitOffsetY = ((elementHeight * targetScale) - containerHeight) / 2;
        targetOffsetX = (elementWidth * targetScale) <= containerWidth ? 0 : minMax(pointerOffsetX - (initialPointerOffsetX - initialOffsetX), limitOffsetX * (-1), limitOffsetX);
        targetOffsetY = (elementHeight * targetScale) <= containerHeight ? 0 : minMax(pointerOffsetY - (initialPointerOffsetY - initialOffsetY), limitOffsetY * (-1), limitOffsetY);
        mousemoveCount++;

        if (Math.abs(targetOffsetX) === Math.abs(limitOffsetX)) {
            initialOffsetX = targetOffsetX;
            initialPointerOffsetX = pointerOffsetX;
        }

        if (Math.abs(targetOffsetY) === Math.abs(limitOffsetY)) {
            initialOffsetY = targetOffsetY;
            initialPointerOffsetY = pointerOffsetY;
        }

        /* Set attributes */
        $element.setAttribute(_dataScale, targetScale);
        $element.setAttribute(_dataTranslateX, targetOffsetX);
        $element.setAttribute(_dataTranslateY, targetOffsetY);

        /* @->moveScaleElement */
        moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", targetScale);
    }

    /* @-<mouseUp ***************************************************************/
    /****************************************************************************/
    function mouseUp() {
        if (touchable === true || capture === false) {
            return false;
        }

        /* Unset capture */
        capture = false;
    }

    /* @-<touchStart ************************************************************/
    /****************************************************************************/
    function touchStart(e) {

        if (e.touches.length > 2) {
            return false;
        }

        /* Initialize selectors */
        $container = this;
        $element = this.children[0];

        /* Initialize helpers */
        offset = $container.getBoundingClientRect();
        containerOffsetX = offset.left;
        containerOffsetY = offset.top;
        containerHeight = $container.clientHeight;
        containerWidth = $container.clientWidth;
        elementHeight = $element.clientHeight;
        elementWidth = $element.clientWidth;
        initialPointerOffsetX = e.touches[0].clientX;
        initialPointerOffsetY = e.touches[0].clientY;
        initialScale = minMax(parseFloat($element.getAttribute(_dataScale)), C_scaleMin, C_scaleMax);
        touchCount = e.touches.length;

        if (touchCount === 1) /* Single touch */ {
            /* Doubletap */
            if (doubleTapMonitor[0] === null) {
                doubleTapMonitor[0] = e.target;
                doubleTapMonitor[1] = initialPointerOffsetX;
                doubleTapMonitor[2] = initialPointerOffsetY;

                setTimeout(function() {


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    // If this was a normal click
                    if (touchmoveCount < 1 && !capture) handlesSingleClick();
                    hasDoubleTapTriggered = false;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    doubleTapMonitor = [null];
                }, 300);

            } else if (doubleTapMonitor[0] === e.target && touchmoveCount <= 1
              && isWithinRange(initialPointerOffsetX, doubleTapMonitor[1] - doubleTapAllowOffset, doubleTapMonitor[1] + doubleTapAllowOffset) === true
              && isWithinRange(initialPointerOffsetY, doubleTapMonitor[2] - doubleTapAllowOffset, doubleTapMonitor[2] + doubleTapAllowOffset) === true) {
                addClass($element, _transition);

                hasDoubleTapTriggered = true;

                if (hasClass($container, _active) === true) {
                    /* Set attributes */
                    $element.setAttribute(_dataScale, 1);
                    $element.setAttribute(_dataTranslateX, 0);
                    $element.setAttribute(_dataTranslateY, 0);

                    removeClass($container, _active);

                    /* @->moveScaleElement */
                    moveScaleElement($element, 0, 0, 1);
                } else {
                    /* Set attributes */
                    $element.setAttribute(_dataScale, C_scaleDefault);
                    $element.setAttribute(_dataTranslateX, 0);
                    $element.setAttribute(_dataTranslateY, 0);

                    addClass($container, _active);

                    /* @->moveScaleElement */
                    moveScaleElement($element, 0, 0, C_scaleDefault);
                }

                setTimeout(function()
                {
                    removeClass($element, _transition);
                }, 200);

                doubleTapMonitor = [null];
                return false;
            }

            /* Initialize helpers */
            initialOffsetX = parseFloat($element.getAttribute(_dataTranslateX));
            initialOffsetY = parseFloat($element.getAttribute(_dataTranslateY));
        } else if (touchCount === 2) /* Pinch */ {
            /* Initialize helpers */
            initialOffsetX = parseFloat($element.getAttribute(_dataTranslateX));
            initialOffsetY = parseFloat($element.getAttribute(_dataTranslateY));
            initialPointerOffsetX2 = e.touches[1].clientX;
            initialPointerOffsetY2 = e.touches[1].clientY;
            pinchOffsetX = (initialPointerOffsetX + initialPointerOffsetX2) / 2;
            pinchOffsetY = (initialPointerOffsetY + initialPointerOffsetY2) / 2;
            initialPinchDistance = Math.sqrt(((initialPointerOffsetX - initialPointerOffsetX2) * (initialPointerOffsetX - initialPointerOffsetX2)) + ((initialPointerOffsetY - initialPointerOffsetY2) * (initialPointerOffsetY - initialPointerOffsetY2)));
        }

        touchmoveCount = 0;

        /* Set capture */
        capture = true;
    }

    /* @-<touchMove *************************************************************/
    /****************************************************************************/
    function touchMove(e) {

        if (capture === false) {
            return false;
        }

        /* Initialize helpers */
        pointerOffsetX = e.touches[0].clientX;
        pointerOffsetY = e.touches[0].clientY;
        touchCount = e.touches.length;
        touchmoveCount++;

        if (touchCount > 1) /* Pinch */ {
            pointerOffsetX2 = e.touches[1].clientX;
            pointerOffsetY2 = e.touches[1].clientY;
            targetPinchDistance = Math.sqrt(((pointerOffsetX - pointerOffsetX2) * (pointerOffsetX - pointerOffsetX2)) + ((pointerOffsetY - pointerOffsetY2) * (pointerOffsetY - pointerOffsetY2)));

            if (initialPinchDistance === null) {
                initialPinchDistance = targetPinchDistance;
            }

            if (Math.abs(initialPinchDistance - targetPinchDistance) >= 1) {
                /* Initialize helpers */
                targetScale = minMax(targetPinchDistance / initialPinchDistance * initialScale, C_scaleMin, C_scaleMax);
                limitOffsetX = ((elementWidth * targetScale) - containerWidth) / 2;
                limitOffsetY = ((elementHeight * targetScale) - containerHeight) / 2;
                scaleDifference = targetScale - initialScale;
                targetOffsetX = (elementWidth * targetScale) <= containerWidth ? 0 : minMax(initialOffsetX - ((((((pinchOffsetX - containerOffsetX) - (containerWidth / 2)) - initialOffsetX) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetX * (-1), limitOffsetX);
                targetOffsetY = (elementHeight * targetScale) <= containerHeight ? 0 : minMax(initialOffsetY - ((((((pinchOffsetY - containerOffsetY) - (containerHeight / 2)) - initialOffsetY) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetY * (-1), limitOffsetY);

                if (targetScale > 1) {
                    addClass($container, _active);
                } else {
                    removeClass($container, _active);
                }

                /* @->moveScaleElement */
                moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", targetScale);

                /* Initialize helpers */
                initialPinchDistance = targetPinchDistance;
                initialScale = targetScale;
                initialOffsetX = targetOffsetX;
                initialOffsetY = targetOffsetY;
            }
        } else /* Single touch */ {
            /* Initialize helpers */
            targetScale = initialScale;
            limitOffsetX = ((elementWidth * targetScale) - containerWidth) / 2;
            limitOffsetY = ((elementHeight * targetScale) - containerHeight) / 2;
            targetOffsetX = (elementWidth * targetScale) <= containerWidth ? 0 : minMax(pointerOffsetX - (initialPointerOffsetX - initialOffsetX), limitOffsetX * (-1), limitOffsetX);
            targetOffsetY = (elementHeight * targetScale) <= containerHeight ? 0 : minMax(pointerOffsetY - (initialPointerOffsetY - initialOffsetY), limitOffsetY * (-1), limitOffsetY);

            if (Math.abs(targetOffsetX) === Math.abs(limitOffsetX)) {
                initialOffsetX = targetOffsetX;
                initialPointerOffsetX = pointerOffsetX;
            }

            if (Math.abs(targetOffsetY) === Math.abs(limitOffsetY)) {
                initialOffsetY = targetOffsetY;
                initialPointerOffsetY = pointerOffsetY;
            }

            /* Set attributes */
            $element.setAttribute(_dataScale, initialScale);
            $element.setAttribute(_dataTranslateX, targetOffsetX);
            $element.setAttribute(_dataTranslateY, targetOffsetY);

            /* @->moveScaleElement */
            moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", targetScale);
        }
    }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function handlesSingleClick() {
      if (initialScale == 1 && $element.getAttribute(_dataScale) == "1") {

        let elPosition = $element.getBoundingClientRect();
        let elWidth = elPosition.right - elPosition.left;
        let leftArea = elPosition.left + elWidth * edgeClickArea;
        let rightArea = elPosition.left + elWidth * (1 - edgeClickArea);

        if (initialPointerOffsetX < leftArea) {
          clickCallback("clickLeft");
        } else if (initialPointerOffsetX > rightArea) {
          clickCallback("clickRight");
        } else {
          clickCallback("clickMiddle");
        }
      } else {
        if (!hasDoubleTapTriggered) {
          clickCallback("clickMiddle");
        }
      }
    }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    /* @-<touchEnd **************************************************************/
    /****************************************************************************/
    function touchEnd(e) {
        touchCount = e.touches.length;

        if (capture === false) {
            return false;
        }

        if (touchCount === 0) /* No touch */ {
            /* Set attributes */
            $element.setAttribute(_dataScale, initialScale);
            $element.setAttribute(_dataTranslateX, targetOffsetX);
            $element.setAttribute(_dataTranslateY, targetOffsetY);

            initialPinchDistance = null;
            capture = false;
        } else if (touchCount === 1) /* Single touch */ {
            initialPointerOffsetX = e.touches[0].clientX;
            initialPointerOffsetY = e.touches[0].clientY;
        } else if (touchCount > 1) /* Pinch */ {
            initialPinchDistance = null;
        }
    }

    /* @-<wheel *****************************************************************/
    /****************************************************************************/
    function wheel(e) {
        /* Initialize selectors */
        $container = this;
        $element = this.children[0];

        /* Initialize helpers */
        offset = $container.getBoundingClientRect();
        containerHeight = $container.clientHeight;
        containerWidth = $container.clientWidth;
        elementHeight = $element.clientHeight;
        elementWidth = $element.clientWidth;
        containerOffsetX = offset.left;
        containerOffsetY = offset.top;
        initialScale = minMax(parseFloat($element.getAttribute(_dataScale), C_scaleMin, C_scaleMax));
        initialOffsetX = parseFloat($element.getAttribute(_dataTranslateX));
        initialOffsetY = parseFloat($element.getAttribute(_dataTranslateY));
        pointerOffsetX = e.clientX;
        pointerOffsetY = e.clientY;
        scaleDirection = e.deltaY < 0 ? 1 : -1;
        scaleDifference = C_scaleDifference * scaleDirection;
        targetScale = initialScale + scaleDifference;

        addClass($element, _transition);
        setTimeout(function()
        {
            removeClass($element, _transition);
        }, 200);

        /* Prevent scale overflow */
        if (targetScale < C_scaleMin || targetScale > C_scaleMax) {
            return false;
        }

        /* Set offset limits */
        limitOffsetX = ((elementWidth * targetScale) - containerWidth) / 2;
        limitOffsetY = ((elementHeight * targetScale) - containerHeight) / 2;

        if (targetScale <= 1) {
            targetOffsetX = 0;
            targetOffsetY = 0;
        } else {
            /* Set target offsets */
            targetOffsetX = (elementWidth * targetScale) <= containerWidth ? 0 : minMax(initialOffsetX - ((((((pointerOffsetX - containerOffsetX) - (containerWidth / 2)) - initialOffsetX) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetX * (-1), limitOffsetX);
            targetOffsetY = (elementHeight * targetScale) <= containerHeight ? 0 : minMax(initialOffsetY - ((((((pointerOffsetY - containerOffsetY) - (containerHeight / 2)) - initialOffsetY) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetY * (-1), limitOffsetY);
        }

        if (targetScale > 1) {
            addClass($container, _active);
        } else {
            removeClass($container, _active);
        }

        /* Set attributes */
        $element.setAttribute(_dataScale, targetScale);
        $element.setAttribute(_dataTranslateX, targetOffsetX);
        $element.setAttribute(_dataTranslateY, targetOffsetY);

        /* @->moveScaleElement */
        moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", targetScale);
    }
}

/* Library ********************************************************************/
/******************************************************************************/

/* @-<addClass ****************************************************************/
/******************************************************************************/
function addClass($element, targetClass) {
    if (hasClass($element, targetClass) === false) {
        $element.className += " " + targetClass;
    }
}

/* @isWithinRange *************************************************************/
/******************************************************************************/
function isWithinRange(value, min, max) {
    if (value >= min && value <= max) {
        return true;
    } else {
        return false;
    }
}

/* @hasClass ******************************************************************/
/******************************************************************************/
function hasClass($element, targetClass) {
    const rgx = new RegExp("(?:^|\\s)" + targetClass + "(?!\\S)", "g");

    if ($element.className.match(rgx)) {
        return true;
    } else {
        return false;
    }
}

/* @-<massAddEventListener ****************************************************/
/******************************************************************************/
function massAddEventListener($elements, event, customFunction, useCapture) {
    useCapture = useCapture || false;

    for (let i = 0; i < $elements.length; i++) {
        $elements[i].addEventListener(event, customFunction, useCapture);
    }
}

/* @-<minMax ******************************************************************/
/******************************************************************************/
function minMax(value, min, max) {
    if (value < min) {
        value = min;
    } else if (value > max) {
        value = max;
    }

    return value;
}

/* @-<moveScaleElement ********************************************************/
/******************************************************************************/
function moveScaleElement($element, targetOffsetX, targetOffsetY, targetScale) {
    $element.style.transform = "translate(" + targetOffsetX + ", " + targetOffsetY + ") scale(" + targetScale + ")";
}

/* @removeClass ***************************************************************/
/******************************************************************************/
function removeClass($element, targetClass) {
    const rgx = new RegExp("(?:^|\\s)" + targetClass + "(?!\\S)", "g");

    $element.className = $element.className.replace(rgx, "");
}
