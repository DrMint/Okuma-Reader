"use strict";
import { zoom } from './directive.js';
import { setCookie, getCookie } from './cookie.js';
import * as CONSTANTS from './constants.js';
import { findGetParameter, stringToBoolean } from './tools.js';

function infoToImageURL(TITLE, VOLUME, CHAPTER, PAGE) {
  return LIBRARY + TITLE + '/' + VOLUME + '/' + CHAPTER + '/' + PAGE + TCONFIG.fileExtension;
}

function getChapterNumPage(chapter = CHAPTER) {
  return VCONFIG.numPages[chapter - 1];
}

function getNumChapters() {
  return VCONFIG.numPages.length;
}

function getNumPagesBefore() {
  let result = 0;
  for (var i = 0; i < CHAPTER - 1; i++) {
    result += VCONFIG.numPages[i];
  }
  result += PAGE;
  return result;
}

function getTotalPages() {
  let result = 0;
  for (var i = 0; i < VCONFIG.numPages.length; i++) {
    result += VCONFIG.numPages[i];
  }
  return result;
}

function imgFinishedLoading() {

  /*  Create a list of pages to cache and then cache them asynchronously
      The list starts caching the next pages and then the previous pages
      (in case the user started from the middle of the book).*/
  {
    let numOfNextPagesToCache = 5;
    let numOfPreviousPagesToCache = 3;

    var pagesToCache = [];
    for (var i = 1; i < numOfNextPagesToCache + 1; i++) {
      if (PAGE + i <= getChapterNumPage()) {
        pagesToCache.push(infoToImageURL(TITLE, VOLUME, CHAPTER, PAGE + i));
      } else if (CHAPTER < getNumChapters()) {
        pagesToCache.push(infoToImageURL(TITLE, VOLUME, CHAPTER + 1, PAGE + i - getChapterNumPage()));
      }
    }
    for (var i = 1; i < numOfPreviousPagesToCache + 1; i++) {
      if (PAGE - i > 0) {
        pagesToCache.push(infoToImageURL(TITLE, VOLUME, CHAPTER, PAGE - i));
      } else if (CHAPTER > 1) {
        pagesToCache.push(infoToImageURL(TITLE, VOLUME, CHAPTER - 1, getChapterNumPage(CHAPTER - 1) - (i - 1)));
      }
    }

    // The list pagesToCache is finished, we can call the caching fonction
    precacheImages(pagesToCache);
  }

}

function precacheImages(pagesToCache, currentIndex = 0) {
  if (currentIndex < pagesToCache.length) {
    getImage(pagesToCache[currentIndex]).then(function(successUrl) {
      precacheImages(pagesToCache, currentIndex + 1);
    });
  }
}

function getImage(url) {
  return new Promise(function(resolve, reject){
    var img = new Image()
    img.onload = function() {
      resolve(url)
    }
    img.onerror = function() {
      reject(url)
    }
    img.src = url
  })
}

function toggleNavMenu() {
  if (IS_BAR_VISIBLE) {
    document.getElementById("topMenu").classList.add("hidden");
    document.getElementById("bottomMenu").classList.add("hidden");
  } else {
    document.getElementById("topMenu").classList.remove("hidden");
    document.getElementById("bottomMenu").classList.remove("hidden");
  }
  IS_BAR_VISIBLE = !IS_BAR_VISIBLE
}


function toggleHandlerElement(button, variableName, targets, className, refreshPages = false) {
  document.getElementById(button).onclick = function() {
    GLOBAL[variableName] = !GLOBAL[variableName];
    for (var i = 0; i < targets.length; i++) {
      if (GLOBAL[variableName]) {
        document.getElementById(targets[i]).classList.add(className[i]);
      } else {
        document.getElementById(targets[i]).classList.remove(className[i]);
      }
    }
    if (refreshPages) {
      refreshDipslayPages();
    }
    onOptionChanged()
  };
}

function onOptionChanged() {
  // Save in cookies the current GLOBAL state
  for (let [key, value] of Object.entries(GLOBAL)) {
    if (value != undefined) {
      if (getCookie(key) != value.toString()) setCookie(key, value, 365);
    }
  }
}

function goNextPage() {
  if (GLOBAL.doublePage) {
    changePage(CHAPTER, PAGE + 2);
  } else {
    changePage(CHAPTER, PAGE + 1);
  }
}

function goPreviousPage() {
  if (GLOBAL.doublePage) {
    changePage(CHAPTER, PAGE - 2);
  } else {
    changePage(CHAPTER, PAGE - 1);
  }
}

function changePage(newChapter = null, newPage = null) {

  // When launch for the first time
  if (newChapter == null || newPage == null) {

    newPage = parseInt(findGetParameter('page'));
    newChapter = parseInt(findGetParameter('chapter'));

    // If no page/chapter is indicated in the GET
    if (Number.isNaN(newPage)) {
      // If a cookie is there to indicate the last visited page
      if (getCookie(TITLE + '_PAGE') != '') {
        newPage = parseInt(getCookie(TITLE + '_PAGE'));
      } else {
        newPage = 1;
      }
    }
    if (Number.isNaN(newChapter)) {
      // If a cookie is there to indicate the last visited chapter
      if (getCookie(TITLE + '_CHAPTER') != '') {
        newChapter = parseInt(getCookie(TITLE + '_CHAPTER'));
      } else {
        newChapter = 1;
      }
    }

  } else {

    /* Sanitize the parameters before actually changing the actual values */
    if (newChapter < 1) newChapter = 1;

    if (newChapter > getNumChapters()) newChapter = getNumChapters();

    if (newPage < 1) {
      // Go the previous chapter last page if tring to go previous page on the
      // first page on current chapter.
      if (newChapter > 1) {
        newChapter--;
        newPage = getChapterNumPage(newChapter) + newPage;
      } else {
         newPage = 1;
      }

    } else if (newPage > getChapterNumPage()) {
      // Go the next chapter first page if tring to go next page on the
      // last page on previous chapter.
      if (newChapter < getNumChapters()) {

        // If you currently are on the last page of a chapter and in double page
        // mode, the first page of the next chapter is already shown
        // thus go to the second page of the new chapter.
        if (PAGE == getChapterNumPage() && GLOBAL.doublePage) {
          newPage = 2;
        } else {
          newPage = 1;
        }
        newChapter++;

      } else {

        newPage = getChapterNumPage();

      }
    }

  }

  let hasPageChanged = newPage != PAGE;
  let hasChapterChanged = newChapter != CHAPTER;

  CHAPTER = newChapter
  PAGE = newPage;

  if (TCONFIG.bookType == 'webtoon' && hasChapterChanged) {
    document.getElementById('continuousScrollingPages').innerHTML = "";
    for (var i = 1; i <= getChapterNumPage(); i++) {
      var img = document.createElement('img');
      img.src = infoToImageURL(TITLE, VOLUME, CHAPTER, i);
      img.loading = "lazy";
      document.getElementById('continuousScrollingPages').appendChild(img);
    }
  }

  if (hasPageChanged || hasChapterChanged) {
    refreshDipslayPages();
    setCookie(TITLE + '_PAGE', PAGE, 365);
    setCookie(TITLE + '_CHAPTER', CHAPTER, 365);
  }

}


function addLoading() {
  ELEM_LOADING++;
  refreshLoading();
}

function removeLoading() {
  ELEM_LOADING--;
  refreshLoading();
}

function refreshLoading() {
  if (ELEM_LOADING > 0) {
    document.getElementById('loader').classList.add('enabled');
  } else {
    document.getElementById('loader').classList.remove('enabled');
  }
}

function refreshDipslayPages() {

  if (TCONFIG.bookType == 'webtoon') {

    window.scrollTo(0, 0);

  /* -------------------------- FOR BOOK MODE ONLY (NOT CONTINUOUS SCROLLING) ------------------------------------*/
  } else {

    // To use double page, the user should have asked for double page
    GLOBAL.doublePage = GLOBAL.useDoublePage;

    // To use double page, VCONFIG.allowDoublePage should be true
    GLOBAL.doublePage = GLOBAL.doublePage && VCONFIG.allowDoublePage;

    // If the VCONFIG file asked for the fist page to be single, doublePage should
    // only be enable for pages other than the first one
    GLOBAL.doublePage = GLOBAL.doublePage && !(VCONFIG.fistPageSingle && PAGE == 1 && CHAPTER == 1);

    // Lastly double page should be disable if the last page is left alone.
    GLOBAL.doublePage = GLOBAL.doublePage && (PAGE + 1 <= getChapterNumPage() || CHAPTER < getNumChapters());

    if (GLOBAL.doublePage) {
      imgPageRight.style.display = null;
      navImage.classList.add("doublePage");
    } else {
      imgPageRight.style.display = "none";
      navImage.classList.remove("doublePage");
    }

    /* Load the current page*/
    {

      let leftPageURL = infoToImageURL(TITLE, VOLUME, CHAPTER, PAGE);

      if (GLOBAL.doublePage) {

        let rightPageURL = infoToImageURL(TITLE, VOLUME, CHAPTER, PAGE + 1);

        // If the current page is the first of a chapter that isn't the first
        // one, then we should show the last page of the previous chapter
        if (VCONFIG.fistPageSingle && getNumPagesBefore() % 2 == 1) {
          if (PAGE == 1) {
            leftPageURL = infoToImageURL(TITLE, VOLUME, CHAPTER - 1, getChapterNumPage(CHAPTER - 1));
          } else {
            leftPageURL = infoToImageURL(TITLE, VOLUME, CHAPTER, PAGE - 1);
          }
          rightPageURL = infoToImageURL(TITLE, VOLUME, CHAPTER, PAGE);
        }

        // If the current page is the last of a chapter that isn't the last chapter
        // then we should show the first page and the next chapter
        if (PAGE == getChapterNumPage() && CHAPTER < getNumChapters()) {
          rightPageURL = infoToImageURL(TITLE, VOLUME, CHAPTER + 1, 1);
        }

        addLoading();
        getImage(rightPageURL).then(function(successUrl) {
          imgPageRight.src = rightPageURL;
          removeLoading();
        });

      }

      addLoading();
      getImage(leftPageURL).then(function(successUrl) {
        imgPageLeft.src = leftPageURL;
        imgFinishedLoading();
        removeLoading();
      });

    }


    /* Move the side page to simulate the fact that you place the next page on the side */
    {
      if (GLOBAL.sidePages && GLOBAL.doublePage) {
        let sidePageMaxValue = Math.min(getTotalPages() / 150 * 4, 6);
        let progress = getNumPagesBefore() / getTotalPages();
        let viewedPagesWidth = (progress * sidePageMaxValue).toString() + "vmin";
        let toBeViewedPagesWidth = ((1 - progress) * sidePageMaxValue).toString() + "vmin";

        if (TCONFIG.japaneseOrder) {
          navImage.style.paddingLeft = toBeViewedPagesWidth;
          navImage.style.paddingRight = viewedPagesWidth;
        } else {
          navImage.style.paddingLeft = viewedPagesWidth;
          navImage.style.paddingRight = toBeViewedPagesWidth;
        }
        document.getElementById("lighting").style.backgroundSize = "calc(100% + " + (navImage.style.paddingLeft).toString() + " - " + (navImage.style.paddingRight).toString() + ") 100%";
        document.getElementById("specular").style.backgroundSize = "calc(100% + " + (navImage.style.paddingLeft).toString() + " - " + (navImage.style.paddingRight).toString() + ") 100%";
        document.getElementById("bookFold").style.backgroundSize = "calc(100% + " + (navImage.style.paddingLeft).toString() + " - " + (navImage.style.paddingRight).toString() + ") 100%";

      } else {

        navImage.style.paddingLeft = null;
        navImage.style.paddingRight = null;
        document.getElementById("lighting").style.backgroundSize = null;
        document.getElementById("specular").style.backgroundSize = null;
        document.getElementById("bookFold").style.backgroundSize = null;

      }
    }

    if (GLOBAL.useDoublePage) {
      document.getElementById("bookFoldButton").style.display = null;
      document.getElementById("sidePagesButton").style.display = null;
    } else {
      document.getElementById("bookFoldButton").style.display = "none";
      document.getElementById("sidePagesButton").style.display = "none";
    }


  }

  /* -------------------------- FOR BOTH BOOK MODE AND CONTINUOUS SCROLLING ------------------------------------*/

  /*  Replace the current URL without reloading the page.
      Furthermore, if the use use to go back button, it will not go to the
      previous image but the actual previous page */
  {
    if (window.history.replaceState) {
      //prevents browser from storing history with each change:
      let newURL = CONSTANTS.readerURL() + '?library=' + LIBRARY + '&title=' + TITLE + '&volume=' + VOLUME + '&chapter=' + CHAPTER + '&page=' + PAGE;
      window.history.replaceState(null, '', newURL);
    }
  }


  /* Refresh the slider bar */
  {
    pageSlider.max = getChapterNumPage();
    pageSlider.value = PAGE.toString();
    pageSliderCurrent.innerHTML = PAGE.toString();
    pageSliderTotal.innerHTML = getChapterNumPage();
  }

  if (getNumChapters() > 1) {
    // Change currently selected chapter in chapterSelection
    chapterSelection.selectedIndex = CHAPTER - 1;

    // Showing or hiding the previous chapter button$
    if (CHAPTER > 1) {
      previousChapterButton.style.display = null;
    } else {
      previousChapterButton.style.display = "none";
    }

    // Showing or hiding the next chapter button
    if (CHAPTER < getNumChapters()) {
      nextChapterButton.style.display = null;
    } else {
      nextChapterButton.style.display = "none";
    }
  }

  // Move the paper texture arround so it doesn't always looks the same between pages
  document.getElementById("paperTexture").style.backgroundPosition = Math.floor((Math.random() * 100) + 1).toString() + "%" + Math.floor((Math.random() * 100) + 1).toString() + "%";

  // Refresh the book info at the top
  bookChapter.innerHTML = "Chapter " + CHAPTER;

  // Update the slider background gradient
  {
    let currentPosition = (parseInt(pageSlider.value) - 0.5) / parseInt(pageSlider.max) * 100;
    pageSlider.style.background = "linear-gradient(90deg, var(--menu-text-color) 0%, var(--menu-text-color) " + currentPosition.toString() + "%, gray " + currentPosition.toString() + "%, gray 100%)";
  }

}


// -----------------------------------------------------------------------------


function setHandlers() {
  /* EVENTS HANDLERS */

  /* -------------------------- FOR BOOK MODE ONLY (NOT CONTINUOUS SCROLLING) ------------------------------------*/
  if (TCONFIG.bookType != 'webtoon') {
    document.onkeydown = function() {
      //console.log(window.event.keyCode);
      switch (window.event.keyCode) {
        case 36: changePage(CHAPTER, 1); break;
        case 35: changePage(CHAPTER, getChapterNumPage()); break;
      }

      if (TCONFIG.japaneseOrder) {
        switch (window.event.keyCode) {
          case 33: goPreviousPage(); break;
          case 34: goNextPage(); break;
          case 39: goPreviousPage(); break;
          case 37: goNextPage(); break;
        }
      } else {
        switch (window.event.keyCode) {
          case 34: goPreviousPage(); break;
          case 33: goNextPage(); break;
          case 37: goPreviousPage(); break;
          case 39: goNextPage(); break;
        }
      }
    };


    pageSlider.oninput = function() {
      changePage(CHAPTER, parseInt(pageSlider.value));
    }

    pageSlider.onmousedown = function() {
      pageSlider.classList.add("inUse");
    }

    pageSlider.onmouseup = function() {
      document.activeElement.blur(); // Remove focus
      pageSlider.classList.remove("inUse");
    }

    toggleHandlerElement("doublePageButton", "useDoublePage", ["doublePageButton"], ["enabled"], true);
    toggleHandlerElement("bookFoldButton", "bookFold", ["bookFoldButton", "bookFold"], ["enabled", "enabled"]);
    toggleHandlerElement("lightingButton", "lighting", ["lightingButton", "lighting", "specular"], ["enabled", "enabled", "enabled"]);
    toggleHandlerElement("sidePagesButton", "sidePages", ["sidePagesButton"], ["enabled"], true);
    toggleHandlerElement("paperTextureButton", "paperTexture", ["paperTextureButton", "paperTexture"], ["enabled", "enabled"]);
    toggleHandlerElement("bookShadowButton", "bookShadow", ["bookShadowButton", "navImage"], ["enabled", "bookShadow"]);

    zoom(undefined, undefined, function (actionType) {
        if (actionType == "clickMiddle") {
          toggleNavMenu();

        } else {

          if (TCONFIG.bookType != 'webtoon') {

            if (actionType == "clickLeft") {
              if (TCONFIG.japaneseOrder) {
                goNextPage()
              } else {
                goPreviousPage();
              }

            } else if (actionType == "clickRight") {

              if (TCONFIG.japaneseOrder) {
                goPreviousPage();
              } else {
                goNextPage()
              }
            }

          }
        }
    });
    document.getElementsByClassName("zoom")[0].click();

  /* -------------------------- FOR CONTINUOUS SCROLLING MODE ONLY ------------------------------------*/
  } else {

    toggleHandlerElement("paperTextureButton", "continuousScrolling_paperTexture", ["paperTextureButton", "paperTexture"], ["enabled", "enabled"]);
    toggleHandlerElement("bookShadowButton", "continuousScrolling_bookShadow", ["bookShadowButton", "navImage"], ["enabled", "bookShadow"]);

    document.getElementById("pageWidthSlider").oninput = function() {
      document.getElementById("continuousScrollingPages").style.width = document.getElementById("pageWidthSlider").value + "vw";
    }

    document.getElementById("pageWidthSlider").onmouseup = function() {
      document.activeElement.blur(); // Remove focus
    }

    document.getElementById("navImageContainer").onclick = function() {
      toggleNavMenu();
    }
  }

  /* -------------------------- FOR BOTH BOOK AND SCROLLING MODE ------------------------------------*/

  previousChapterButton.onclick = function() {
    changePage(CHAPTER - 1, 1);
  }

  nextChapterButton.onclick = function() {
    changePage(CHAPTER + 1, 1);
  }

  fullScreenButton.onclick = function() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else if (document.fullscreenEnabled) {
        document.documentElement.requestFullscreen({ navigationUI: "hide" });
    }
  }

  document.onfullscreenchange = function ( event ) {
    if (document.fullscreenElement) {
      fullScreenButton.classList.add("enabled");
    } else {
      fullScreenButton.classList.remove("enabled");
    }
  };

  chapterSelection.onchange = function() {
    changePage(chapterSelection.selectedIndex + 1, 1);
    document.activeElement.blur(); // Remove focus
  }

  themeSelection.onchange = function() {

    // Save value to cookie
    GLOBAL.themeSelection = themeSelection.selectedIndex;
    onOptionChanged();

    body.classList.remove("lightTheme");
    body.classList.remove("darkTheme");
    switch (themeSelection.selectedIndex) {
      case 0: body.classList.add("darkTheme"); break;
      case 1: body.classList.add("lightTheme"); break;
    }
    document.activeElement.blur(); // Remove focus
  }


  toggleHandlerElement("configButton", "configOpened", ["configMenu"], ["enabled"]);

  document.getElementById("closeMenu").onclick = function() {
    document.getElementById("configButton").click();
  };

}



// -----------------------------------------------------------------------------
var imgPageLeft;
var imgPageRight;
var previousChapterButton;
var nextChapterButton;
var pageSliderCurrent;
var pageSliderTotal;

const navImage = document.getElementById("navImage");
const bookTitle = document.getElementById("bookTitle");
const bookChapter = document.getElementById("bookChapter");
const body = document.getElementsByTagName("body")[0];

const fullScreenButton = document.getElementById("fullScreenButton");
const doublePageButton = document.getElementById("doublePageButton");

const themeSelection = document.getElementById("themeSelection");
const chapterSelection = document.getElementById("chapterSelection");
const pageSlider = document.getElementById("pageSlider");


var LIBRARY = findGetParameter('library');
if (LIBRARY == null) LIBRARY = CONSTANTS.booksURL();

var TITLE;
var VOLUME;
var CHAPTER;
var PAGE;

var GLOBAL = {}
var OCONFIG; // Okuma JSON config File
var TCONFIG; // Title JSON config File
var VCONFIG; // Volume JSON config File

var IS_BAR_VISIBLE = true;
var ELEM_LOADING = 0;


fetch(LIBRARY + 'config.json')
  .then(response => response.json())
  .then(data => {
    OCONFIG = data;


    // Retrieve the TITLE
    // If the title isn't valid, go back to home page
    TITLE = findGetParameter('title');
    if (OCONFIG.titles.indexOf(TITLE) == -1) {
      window.location.href = CONSTANTS.homeURL();
    }


    if (TITLE) {
      // Load the TCONFIG file from the specific gallery
      fetch(LIBRARY + TITLE + '/' + 'config.json')
        .then(response => response.json())
        .then(data => {
          TCONFIG = data;

          body.classList.add(TCONFIG.bookType);

          if (TCONFIG.japaneseOrder) {

            imgPageLeft = document.getElementById("imgPageRight");
            imgPageRight = document.getElementById("imgPageLeft");

            pageSliderCurrent = document.getElementById("pageSliderRight");
            pageSliderTotal = document.getElementById("pageSliderLeft");

            previousChapterButton = document.getElementById("rightChapterButton");
            nextChapterButton = document.getElementById("leftChapterButton");

            pageSlider.style.transform = "rotateZ(180deg)";

          } else {

            imgPageLeft = document.getElementById("imgPageLeft");
            imgPageRight = document.getElementById("imgPageRight");

            pageSliderCurrent = document.getElementById("pageSliderLeft");
            pageSliderTotal = document.getElementById("pageSliderRight");

            previousChapterButton = document.getElementById("leftChapterButton");
            nextChapterButton = document.getElementById("rightChapterButton");

          }

          // Change the title of the webpage
          document.title = CONSTANTS.websiteName() + ' - ' + TCONFIG.title;




          // Retrieve the VOLUME
          VOLUME = parseInt(findGetParameter('volume'));
          if (Number.isNaN(VOLUME)) VOLUME = 1;

          fetch(LIBRARY + TITLE + '/' + VOLUME + '/' + 'config.json')
            .then(response => response.json())
            .then(data => {
              VCONFIG = data;

              /* Populate the chapterSelection menu with the chapter from this title */
              for (var i = 0; i < getNumChapters(); i++) {
                var option = document.createElement("option");
                option.text = "Chapter " + (i + 1).toString();
                chapterSelection.add(option);
              }

              changePage();
              setHandlers();

              if (!VCONFIG.allowDoublePage) doublePageButton.style.display = "none";

              // Set default value for continuous pages
              {
                if (TCONFIG.bookType == 'webtoon') {
                  document.getElementsByTagName('body')[0].classList.add("continuousScrolling");
                  imgPageLeft.style.display = "none";
                  imgPageRight.style.display = "none";
                  sliderContainer.style.display = "none";

                  if( window.innerHeight > window.innerWidth ) {
                    document.getElementById("pageWidthSlider").value = "100";
                  } else {
                    document.getElementById("pageWidthSlider").value = "40";
                  }
                  document.getElementById("continuousScrollingPages").style.width = document.getElementById("pageWidthSlider").value + "vw";
                }
              }

              // Refresh the book info at the top
              bookTitle.innerHTML = TCONFIG.title;

              // Hide the select chapter menu if there is just one chapter
              if (getNumChapters() < 2) {
                document.getElementById("chapterSelectionContainer").style.display = "none";
                document.getElementById("bookChapter").style.display = "none";
                nextChapterButton.style.display = "none";
                previousChapterButton.style.display = "none";
              } else {
                document.getElementById("chapterSelectionContainer").style.display = null;
                document.getElementById("bookChapter").style.display = null;
                nextChapterButton.style.display = null;
                previousChapterButton.style.display = null;
              }

              // Hide config options when not suited
              {
                if (TCONFIG.bookType == 'webtoon') {
                  document.getElementById("pageWidthContainer").style.display = null;
                  document.getElementById("bookFoldButton").style.display = "none";
                  document.getElementById("sidePagesButton").style.display = "none";
                  document.getElementById("lightingButton").style.display = "none";
                  document.getElementsByTagName("body")[0].style.touchAction = "pan-y";
                } else {
                  document.getElementById("pageWidthContainer").style.display = "none";
                  document.getElementById("bookFoldButton").style.display = null;
                  document.getElementById("sidePagesButton").style.display = null;
                  document.getElementById("lightingButton").style.display = null;
                  document.getElementsByTagName("body")[0].style.touchAction = "none";
                }

              }


              // If the user has already used Okuma, load their last settings
              if (getCookie('themeSelection') != '') {

                GLOBAL.useDoublePage = false;
                if (getCookie('useDoublePage') == 'true') {
                  if (TCONFIG.bookType == 'webtoon' || !VCONFIG.allowDoublePage) {
                    GLOBAL.useDoublePage = true;
                  } else {
                    doublePageButton.click();
                  }
                }

                themeSelection.selectedIndex = parseInt(getCookie('themeSelection'));
                themeSelection.onchange();

                if (TCONFIG.bookType == 'webtoon') {

                  GLOBAL.bookFold = stringToBoolean(getCookie('bookFold'));
                  GLOBAL.lighting = stringToBoolean(getCookie('lighting'));
                  GLOBAL.sidePages = stringToBoolean(getCookie('sidePages'));
                  GLOBAL.paperTexture = stringToBoolean(getCookie('paperTexture'));
                  GLOBAL.bookShadow = stringToBoolean(getCookie('bookShadow'));

                  GLOBAL.continuousScrolling_paperTexture = false;
                  if (getCookie('continuousScrolling_paperTexture') == 'true') paperTextureButton.click();
                  GLOBAL.continuousScrolling_bookShadow = false;
                  if (getCookie('continuousScrolling_bookShadow') == 'true') bookShadowButton.click();

                } else {

                  GLOBAL.continuousScrolling_paperTexture = stringToBoolean(getCookie('continuousScrolling_paperTexture'));
                  GLOBAL.continuousScrolling_bookShadow = stringToBoolean(getCookie('continuousScrolling_bookShadow'));

                  GLOBAL.bookFold = false;
                  if (getCookie('bookFold') == 'true') bookFoldButton.click();
                  GLOBAL.lighting = false;
                  if (getCookie('lighting') == 'true') lightingButton.click();
                  GLOBAL.sidePages = false;
                  if (getCookie('sidePages') == 'true') sidePagesButton.click();
                  GLOBAL.paperTexture = false;
                  if (getCookie('paperTexture') == 'true') paperTextureButton.click();
                  GLOBAL.bookShadow = false;
                  if (getCookie('bookShadow') == 'true') bookShadowButton.click();
                }



              } else {

                // Default values
                {

                  GLOBAL.useDoublePage = window.innerHeight < window.innerWidth;
                  GLOBAL.bookFold = true;
                  GLOBAL.lighting = true;
                  GLOBAL.sidePages = true;
                  GLOBAL.paperTexture = true;
                  GLOBAL.bookShadow = true;
                  GLOBAL.continuousScrolling_bookShadow = true;
                  GLOBAL.continuousScrolling_paperTexture = false;

                  themeSelection.selectedIndex = 0;
                  themeSelection.onchange();

                  if (TCONFIG.bookType == 'webtoon') {
                    GLOBAL.continuousScrolling_bookShadow = !GLOBAL.continuousScrolling_bookShadow;
                    bookShadowButton.click();

                  } else {
                    // If screen is in landscape mode
                    if (window.innerHeight < window.innerWidth) {
                      GLOBAL.paperTexture = !GLOBAL.paperTexture;
                      GLOBAL.lighting = !GLOBAL.lighting;
                      GLOBAL.useDoublePage = !GLOBAL.useDoublePage;
                      paperTextureButton.click();
                      lightingButton.click();
                      doublePageButton.click();
                    }
                    GLOBAL.bookFold = !GLOBAL.bookFold;
                    GLOBAL.sidePages = !GLOBAL.sidePages;
                    GLOBAL.bookShadow = !GLOBAL.bookShadow;
                    bookFoldButton.click();
                    sidePagesButton.click();
                    bookShadowButton.click();
                  }

                }
              }



            });
        });
    }



  });
