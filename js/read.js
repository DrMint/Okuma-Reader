"use strict";
import { zoom } from './directive.js';
import * as CONSTANTS from './constants.js';
import { findGetParameter, stringToBoolean, fetchLanguages, infoToPageURL, infoToImageURL, assertsTitleExists, chooseLanguage, fetchLanguage, fetchLibrary, fetchBook, fetchVolume } from './tools.js';
import { setCookie, getCookie, getPosCookie, setPosCookie } from './cookie.js';

function getChapterNumPage(chapter = CHAPTER) {
  return VCONFIG.numPages[chapter - 1];
}

function getNumChapters() {
  return VCONFIG.numPages.length || 1;
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
        pagesToCache.push(infoToImageURL(LIBRARY, TITLE, VOLUME, CHAPTER, PAGE + i, TCONFIG.fileExtension));
      } else if (CHAPTER < getNumChapters()) {
        pagesToCache.push(infoToImageURL(LIBRARY, TITLE, VOLUME, CHAPTER + 1, PAGE + i - getChapterNumPage(), TCONFIG.fileExtension));
      }
    }
    for (var i = 1; i < numOfPreviousPagesToCache + 1; i++) {
      if (PAGE - i > 0) {
        pagesToCache.push(infoToImageURL(LIBRARY, TITLE, VOLUME, CHAPTER, PAGE - i, TCONFIG.fileExtension));
      } else if (CHAPTER > 1) {
        pagesToCache.push(infoToImageURL(LIBRARY, TITLE, VOLUME, CHAPTER - 1, getChapterNumPage(CHAPTER - 1) - (i - 1), TCONFIG.fileExtension));
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
    UCONFIG[variableName] = !UCONFIG[variableName];
    for (var i = 0; i < targets.length; i++) {
      if (UCONFIG[variableName]) {
        document.getElementById(targets[i]).classList.add(className[i]);
      } else {
        document.getElementById(targets[i]).classList.remove(className[i]);
      }
    }
    if (refreshPages) refreshDipslayPages();
  };
}

function goNextPage() {
  if (UCONFIG.doublePage) {
    changePage(CHAPTER, PAGE + 2);
  } else {
    changePage(CHAPTER, PAGE + 1);
  }
}

function goPreviousPage() {
  if (UCONFIG.doublePage) {
    changePage(CHAPTER, PAGE - 2);
  } else {
    changePage(CHAPTER, PAGE - 1);
  }
}

function changePage(newChapter = null, newPage = null) {

  // When launch for the first time
  if (newChapter == null || newPage == null) {

    var paramPage = parseInt(findGetParameter('page'));
    var paramChapter = parseInt(findGetParameter('chapter'));
    var pos = getPosCookie(TITLE);

    // If a page/chapter is indicated in the GET
    if (!(Number.isNaN(paramPage) || Number.isNaN(paramChapter))) {
      newPage = paramPage;
      newChapter = paramChapter;
    // If a page/chapter has been saved in the cookie
    } else if (pos != undefined && pos[VOLUME] != undefined) {
      newPage = pos[VOLUME].page;
      newChapter = pos[VOLUME].chapter;
    // Else open the first page/chapter
    } else {
      newPage = 1;
      newChapter = 1;
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
        if (PAGE == getChapterNumPage() && UCONFIG.doublePage) {
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
      img.src = infoToImageURL(LIBRARY, TITLE, VOLUME, CHAPTER, i, TCONFIG.fileExtension);
      img.loading = "lazy";
      document.getElementById('continuousScrollingPages').appendChild(img);
    }
  }

  if (hasPageChanged || hasChapterChanged) {
    refreshDipslayPages();
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
    UCONFIG.doublePage = UCONFIG.useDoublePage;

    // To use double page, VCONFIG.allowDoublePage should be true
    UCONFIG.doublePage = UCONFIG.doublePage && VCONFIG.allowDoublePage;

    // If the VCONFIG file asked for the fist page to be single, doublePage should
    // only be enable for pages other than the first one
    UCONFIG.doublePage = UCONFIG.doublePage && !(VCONFIG.fistPageSingle && PAGE == 1 && CHAPTER == 1);

    // Lastly double page should be disable if the last page is left alone.
    UCONFIG.doublePage = UCONFIG.doublePage && (PAGE + 1 <= getChapterNumPage() || CHAPTER < getNumChapters());

    if (UCONFIG.doublePage) {
      imgPageRight.style.display = null;
      navImage.classList.add("doublePage");
    } else {
      imgPageRight.style.display = "none";
      navImage.classList.remove("doublePage");
    }

    /* Load the current page*/
    {

      let leftPageURL = infoToImageURL(LIBRARY, TITLE, VOLUME, CHAPTER, PAGE, TCONFIG.fileExtension);

      if (UCONFIG.doublePage) {

        let rightPageURL = infoToImageURL(LIBRARY, TITLE, VOLUME, CHAPTER, PAGE + 1, TCONFIG.fileExtension);

        // If the current page is the first of a chapter that isn't the first
        // one, then we should show the last page of the previous chapter
        if (VCONFIG.fistPageSingle && getNumPagesBefore() % 2 == 1) {
          if (PAGE == 1) {
            leftPageURL = infoToImageURL(LIBRARY, TITLE, VOLUME, CHAPTER - 1, getChapterNumPage(CHAPTER - 1), TCONFIG.fileExtension);
          } else {
            leftPageURL = infoToImageURL(LIBRARY, TITLE, VOLUME, CHAPTER, PAGE - 1, TCONFIG.fileExtension);
          }
          rightPageURL = infoToImageURL(LIBRARY, TITLE, VOLUME, CHAPTER, PAGE, TCONFIG.fileExtension);
        }

        // If the current page is the last of a chapter that isn't the last chapter
        // then we should show the first page and the next chapter
        if (PAGE == getChapterNumPage() && CHAPTER < getNumChapters()) {
          rightPageURL = infoToImageURL(LIBRARY, TITLE, VOLUME, CHAPTER + 1, 1, TCONFIG.fileExtension);
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
      if (UCONFIG.sidePages && UCONFIG.doublePage) {
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

    if (UCONFIG.useDoublePage) {
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
      const newURL = infoToPageURL(LIBRARY, TITLE, VOLUME, CHAPTER, PAGE);
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
  bookChapter.innerHTML = LCONFIG.readPage.chapter + " " + CHAPTER;

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
    UCONFIG.themeSelection = themeSelection.selectedIndex;

    // Remove all other theme
    for (var themeName in LCONFIG.readPage.configMenu.themeSelection) {
      body.classList.remove(themeName);
    }

    // Add the new theme
    body.classList.add(themeSelection.options[UCONFIG.themeSelection].value);
    document.activeElement.blur(); // Remove focus
  }

  languageSelection.onchange = function() {
    // Save value to cookie
    UCONFIG.lang = languageSelection.options[languageSelection.selectedIndex].value;
    location.reload();
  }

  toggleHandlerElement("configButton", "configOpened", ["configMenu"], ["enabled"]);

  document.getElementById("closeMenu").onclick = function() {
    document.getElementById("configButton").click();
  };

  /* Populate the languageSelection menu with the languages from the lang/config.json */
  for (var key in LANGUAGES) {
    var option = document.createElement("option");
    option.text = LANGUAGES[key];
    option.value = key;
    languageSelection.appendChild(option);
  }

  const keys = Object.keys(LANGUAGES);
  for (var i in keys) {
    if (keys[i] == UCONFIG.lang) {
      languageSelection.selectedIndex = parseInt(i);
    }
  }

  /* Populate the chapterSelection menu with the chapter from this title */
  for (var i = 0; i < getNumChapters(); i++) {
    var option = document.createElement("option");
    option.text = LCONFIG.readPage.chapter + " " + (i + 1).toString();
    chapterSelection.add(option);
  }

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
  if (!BOOKTYPE.bookFoldButton)     document.getElementById("bookFoldButton").style.display     = "none";
  if (!BOOKTYPE.sidePagesButton)    document.getElementById("sidePagesButton").style.display    = "none";
  if (!BOOKTYPE.lightingButton)     document.getElementById("lightingButton").style.display     = "none";
  if (!BOOKTYPE.paperTextureButton) document.getElementById("paperTextureButton").style.display = "none";
  if (!BOOKTYPE.pageWidthContainer) document.getElementById("pageWidthContainer").style.display = "none";
  if (!BOOKTYPE.bookShadowButton)   document.getElementById("bookShadow").style.display         = "none";
  document.getElementsByTagName("body")[0].style.touchAction = BOOKTYPE.touchAction;

  // Change the title of the webpage
  document.title = CONSTANTS.websiteName() + ' - ' + TCONFIG.title;

  // Apply type of book on the body
  body.classList.add(TCONFIG.bookType);

  // Event when the user leave/close the page
  window.onbeforeunload = function(){
    // Save the current UCONFIG state as cookie
    for (let [key, value] of Object.entries(UCONFIG)) {
      if (value != undefined) {
        if (getCookie(key) != value.toString()) setCookie(key, value, 365);
      }
    }

    // Save current position in the volume in cookies
    var pos = getPosCookie(TITLE, true);
    pos[VOLUME] = {"chapter": CHAPTER, "page": PAGE};
    setPosCookie(pos, TITLE);
  };

}

function applyLanguage() {
  /* Localize all the options in the config menu */
  for (var key in LCONFIG.readPage.configMenu) {
    if (typeof LCONFIG.readPage.configMenu[key] === 'string') {
      document.getElementById(key).getElementsByTagName('p')[0].innerHTML = LCONFIG.readPage.configMenu[key];
    }
  }

  /* Populate the chapterSelection menu with the chapter from this title */
  for (var key in LCONFIG.readPage.configMenu.themeSelection) {
    var option = document.createElement("option");
    option.text = LCONFIG.readPage.configMenu.themeSelection[key];
    option.value = key;
    themeSelection.appendChild(option);
  }
}

function applyCookie() {

  themeSelection.selectedIndex = parseInt(('themeSelection') || 0);
  themeSelection.onchange();

  // If screen is in landscape mode, realistic options are true by default
  var defaultRealisticOption = window.innerHeight < window.innerWidth;

  if (BOOKTYPE.bookFoldButton) {
    UCONFIG.bookFold = !(stringToBoolean(getCookie('bookFold')) || defaultRealisticOption);
    bookFoldButton.click();
  }

  if (BOOKTYPE.lightingButton) {
    UCONFIG.lighting = !(stringToBoolean(getCookie('lighting')) || defaultRealisticOption);
    lightingButton.click();
  }

  if (BOOKTYPE.paperTextureButton) {
    UCONFIG.paperTexture = !(stringToBoolean(getCookie('paperTexture')) || defaultRealisticOption);
    paperTextureButton.click();
  }

  if (BOOKTYPE.sidePagesButton) {
    UCONFIG.sidePages = !(stringToBoolean(getCookie('sidePages')) || defaultRealisticOption);
    sidePagesButton.click();
  }

  if (BOOKTYPE.bookShadowButton) {
    UCONFIG.bookShadow = !(stringToBoolean(getCookie('bookShadow')) || defaultRealisticOption);
    bookShadowButton.click();
  }

  if (BOOKTYPE.useDoublePage) {
    UCONFIG.useDoublePage = !(stringToBoolean(getCookie('useDoublePage')) || defaultRealisticOption);
    doublePageButton.click();
  }

}

function getDOMElements() {
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
}

function setBookTypeConfig() {
  BOOKTYPE = {
    "useDoublePage": false,
    "bookFoldButton": false,
    "sidePagesButton": false,
    "lightingButton": false,
    "paperTextureButton": false,
    "pageWidthContainer": false,
    "bookShadowButton": false,
    "touchAction": "none"
  }

  switch (TCONFIG.bookType) {
    case "imageset":
      BOOKTYPE.bookShadowButton = true;
      break;
    case "webtoon":
      BOOKTYPE.pageWidthContainer = true;
      BOOKTYPE.bookShadowButton = true;
      BOOKTYPE.touchAction = "pan-y"
      break;
    case "manga":
    case "book":
      BOOKTYPE.useDoublePage = true;
      BOOKTYPE.bookFoldButton = true;
      BOOKTYPE.sidePagesButton = true;
      BOOKTYPE.lightingButton = true;
      BOOKTYPE.paperTextureButton = true;
      BOOKTYPE.bookShadowButton = true;
      break;
  }
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
const languageSelection = document.getElementById("languageSelection");
const chapterSelection = document.getElementById("chapterSelection");
const pageSlider = document.getElementById("pageSlider");


var LIBRARY = findGetParameter('library');
if (LIBRARY == null) LIBRARY = CONSTANTS.booksURL();

var TITLE = findGetParameter('title');

// Retrieve the VOLUME
var VOLUME = parseInt(findGetParameter('volume'));
if (Number.isNaN(VOLUME)) VOLUME = 1;

var CHAPTER;      // Stores the current chapter
var PAGE;         // Stores the current page

var UCONFIG = {}  // User CONFIG that will be saved as cookies
var LCONFIG;      // Language JSON config File
var TCONFIG;      // Title JSON config File
var VCONFIG;      // Volume JSON config File

var IS_BAR_VISIBLE = true;  // are the navbars visible
var ELEM_LOADING = 0;       // The number of element currently loading

var LANGUAGES;  // Stores the list of available languages

var BOOKTYPE; // Store the specific configuration for this type of document (book, manga, webtoon, imageset...)

fetchLanguages()
  .then(languages => LANGUAGES = languages.languages)
  .then(chooseLanguage)
  .then(language => UCONFIG.lang = language)
  .then(() => fetchLanguage(UCONFIG.lang))
  .then(languageData => LCONFIG = languageData)
  .then(applyLanguage)
  .then(() => fetchLibrary(LIBRARY))
  .then(libraryData => assertsTitleExists(libraryData.titles, TITLE))
  .then(() => fetchBook(LIBRARY, TITLE))
  .then(bookData => TCONFIG = bookData)
  .then(setBookTypeConfig)
  .then(getDOMElements)
  .then(() => fetchVolume(LIBRARY, TITLE, VOLUME))
  .then(volumeData => VCONFIG = volumeData)
  .then(changePage)
  .then(setHandlers)
  .then(applyCookie);
