/* Returns the value of a given GET parameter name */
function findGetParameter(parameterName) {
  let result = null,
      tmp = [];
  location.search
      .substr(1)
      .split("&")
      .forEach(function (item) {
        tmp = item.split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
      });
  return result;
}

function infoToImageURL(TITLE, CHAPTER, PAGE) {
  return IMAGES_URL + TITLE + '/' + CHAPTER + '/' + PAGE + CONFIG.fileExtension;
}

function getChapterNumPage(chapter = CHAPTER) {
  return CONFIG.numPages[chapter - 1];
}

function getNumChapters() {
  return CONFIG.numPages.length;
}

function getNumPagesBefore() {
  let result = 0;
  for (var i = 0; i < CHAPTER - 1; i++) {
    result += CONFIG.numPages[i];
  }
  result += PAGE;
  return result;
}

function getTotalPages() {
  let result = 0;
  for (var i = 0; i < CONFIG.numPages.length; i++) {
    result += CONFIG.numPages[i];
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
        pagesToCache.push(infoToImageURL(TITLE, CHAPTER, PAGE + i));
      } else if (CHAPTER < getNumChapters()) {
        pagesToCache.push(infoToImageURL(TITLE, CHAPTER + 1, PAGE + i - getChapterNumPage()));
      }
    }
    for (var i = 1; i < numOfPreviousPagesToCache + 1; i++) {
      if (PAGE - i > 0) {
        pagesToCache.push(infoToImageURL(TITLE, CHAPTER, PAGE - i));
      } else if (CHAPTER > 1) {
        pagesToCache.push(infoToImageURL(TITLE, CHAPTER - 1, getChapterNumPage(CHAPTER - 1) - (i - 1)));
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

function changePage(newTitle, newChapter, newPage) {

  /* Sanitize the parameters before actually changing the actual values */
  if (newChapter < 1) newChapter = 1;

  if (newChapter > getNumChapters()) newChapter = getNumChapters();

  if (newPage < 1) {
    // Go the previous chapter last page if tring to go previous page on the
    // first page on current chapter.
    if (newChapter > 1) {
      newChapter--;
      newPage = getChapterNumPage(newChapter);
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
      if (PAGE == getChapterNumPage() && doublePage) {
        newPage = 2;
      } else {
        newPage = 1;
      }
      newChapter++;

    } else {

      // If we are currently on the second last page of the book and in double
      // page mode, the last page is also shown. No need to change pages.
      if (PAGE == getChapterNumPage() - 1 && doublePage) {
        newPage = PAGE;
      } else {
        newPage = getChapterNumPage();
      }
    }
  }

  let hasAnythingChanged = newTitle != TITLE || newChapter != CHAPTER || newPage != PAGE;
  let hasChapterChanged = newChapter != CHAPTER;

  TITLE = newTitle;
  CHAPTER = newChapter
  PAGE = newPage;

  if (CONFIG.continuousScrolling) {
    document.getElementById('continuousScrollingPages').innerHTML = "";
    for (var i = 1; i <= getChapterNumPage(); i++) {
      var img = document.createElement('img');
      img.src = infoToImageURL(TITLE, CHAPTER, i);
      img.loading = "lazy";
      document.getElementById('continuousScrollingPages').appendChild(img);
    }
  }

  if (hasAnythingChanged) {
    refreshDipslayPages();
  }

}


function refreshDipslayPages() {

  if (CONFIG.continuousScrolling) {

    window.scrollTo(0, 0);
    document.getElementsByTagName('body')[0].classList.add("continuousScrolling");
    imgPageLeft.style.display = "none";
    imgPageRight.style.display = "none";
    rightPageButton.style.display = "none";
    leftPageButton.style.display = "none";
    sliderContainer.style.display = "none";


  } else {

    document.getElementsByTagName('body')[0].classList.remove("continuousScrolling");
    imgPageLeft.style.display = null;
    imgPageRight.style.display = null;
    rightPageButton.style.display = null;
    leftPageButton.style.display = null;
    sliderContainer.style.display = null;


    // To use double page, the user should have asked for double page
    doublePage = useDoublePage

    // If the CONFIG file asked for the fist page to be single, doublePage should
    // only be enable for pages other than the first one
    doublePage = doublePage && (PAGE != 1 || !CONFIG.fistPageSingle);

    // Lastly double page should be disable if the last page is left alone.
    doublePage = doublePage && (PAGE + 1 <= getChapterNumPage() || CHAPTER < getNumChapters());

    // If the first page is set to be single, the page number should be event
    if (doublePage && (CONFIG.fistPageSingle && PAGE % 2 == 1)) PAGE--;

    if (doublePage) {
      imgPageRight.style.display = null;
      navImage.classList.add("doublePage");
    } else {
      imgPageRight.style.display = "none";
      navImage.classList.remove("doublePage");
    }

    /* Load the current page*/
    {
      getImage(infoToImageURL(TITLE, CHAPTER, PAGE)).then(function(successUrl) {
        imgPageLeft.src = infoToImageURL(TITLE, CHAPTER, PAGE);
      });

      if (doublePage) {
        if (PAGE < getChapterNumPage()) {
          getImage(infoToImageURL(TITLE, CHAPTER, PAGE + 1)).then(function(successUrl) {
            imgPageRight.src = infoToImageURL(TITLE, CHAPTER, PAGE + 1);
          });
        } else {
          getImage(infoToImageURL(TITLE, CHAPTER + 1, 1)).then(function(successUrl) {
            imgPageRight.src = infoToImageURL(TITLE, CHAPTER + 1, 1);
          });
        }

      }
    }


    /* Show or hide buttons */
    {
      // Showing or hiding the previous page button
      if (PAGE > 1 || CHAPTER > 1) {
        previousPageButton.style.display = null;
      } else {
        previousPageButton.style.display = "none";
      }

      // Showing or hiding the next page button
      if (PAGE < getChapterNumPage() || CHAPTER < getNumChapters()) {
        nextPageButton.style.display = null;
      } else {
        nextPageButton.style.display = "none";
      }
    }


    /* Move the side page to simulate the fact that you place the next page on the side */
    {

      let sidePageMaxValue = Math.min(getTotalPages() / 150 * 4, 6);
      let progress = getNumPagesBefore() / getTotalPages();
      let viewedPagesWidth = (progress * sidePageMaxValue).toString() + "vmin";
      let toBeViewedPagesWidth = ((1 - progress) * sidePageMaxValue).toString() + "vmin";
      if (sidePages && doublePage) {
        if (CONFIG.japaneseOrder) {
          navImage.style.paddingLeft = toBeViewedPagesWidth;
          navImage.style.paddingRight = viewedPagesWidth;
        } else {
          navImage.style.paddingLeft = viewedPagesWidth;
          navImage.style.paddingRight = toBeViewedPagesWidth;
        }

        if (CONFIG.japaneseOrder) {
          document.getElementById("lighting").style.backgroundSize = "calc(100% + " + (toBeViewedPagesWidth).toString() + " - " + (viewedPagesWidth).toString() + ") 100%";
          document.getElementById("specular").style.backgroundSize = "calc(100% + " + (toBeViewedPagesWidth).toString() + " - " + (viewedPagesWidth).toString() + ") 100%";
          document.getElementById("bookFold").style.backgroundSize = "calc(100% + " + (toBeViewedPagesWidth).toString() + " - " + (viewedPagesWidth).toString() + ") 100%";
        } else {
          document.getElementById("lighting").style.backgroundSize = "calc(100% + " + (viewedPagesWidth).toString() + " - " + (toBeViewedPagesWidth).toString() + ") 100%";
          document.getElementById("specular").style.backgroundSize = "calc(100% + " + (viewedPagesWidth).toString() + " - " + (toBeViewedPagesWidth).toString() + ") 100%";
          document.getElementById("bookFold").style.backgroundSize = "calc(100% + " + (viewedPagesWidth).toString() + " - " + (toBeViewedPagesWidth).toString() + ") 100%";
        }




      } else {

        navImage.style.paddingLeft = "unset";
        navImage.style.paddingRight = "unset";
        document.getElementById("lighting").style.backgroundSize = null;
        document.getElementById("specular").style.backgroundSize = null;
        document.getElementById("bookFold").style.backgroundSize = null;

      }
    }


  }


  // Hide config options when not suited
  {
    if (CONFIG.continuousScrolling) {
      document.getElementById("pageWidthContainer").style.display = null;
      document.getElementById("bookFoldButton").style.display = "none";
      document.getElementById("sidePagesButton").style.display = "none";
      document.getElementById("lightingButton").style.display = "none";
    } else {
      document.getElementById("pageWidthContainer").style.display = "none";
      document.getElementById("bookFoldButton").style.display = null;
      document.getElementById("sidePagesButton").style.display = null;
      document.getElementById("lightingButton").style.display = null;
    }
    
    if (doublePage) {
      document.getElementById("bookFoldButton").style.display = null;
      document.getElementById("sidePagesButton").style.display = null;
    } else {
      document.getElementById("bookFoldButton").style.display = "none";
      document.getElementById("sidePagesButton").style.display = "none";
    }

  }




  /*  Replace the current URL without reloading the page.
      Furthermore, if the use use to go back button, it will not go to the
      previous image but the actual previous page */
  {
    if (window.history.replaceState) {
      //prevents browser from storing history with each change:
      let newURL = READER_URL + '?title=' + TITLE + '&chapter=' + CHAPTER + '&page=' + PAGE;
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

  // Change currently selected chapter in chapterSelection
  chapterSelection.selectedIndex = CHAPTER - 1;

  {
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
  bookTitle.innerHTML = CONFIG.title;
  bookChapter.innerHTML = "Chapter " + CHAPTER;

  // Hide the select chapter menu if there is just one chapter
  if (getNumChapters() < 2) {
    document.getElementById("chapterSelectionContainer").style.display = "none";
  } else {
    document.getElementById("chapterSelectionContainer").style.display = null;
  }


}


// -----------------------------------------------------------------------------


function setHandlers() {
  /* EVENTS HANDLERS */

  document.onkeydown = function() {
    if (!CONFIG.continuousScrolling) {
      if (CONFIG.japaneseOrder) {
        switch (window.event.keyCode) {
          case 39: previousPageButton.click(); break;
          case 37: nextPageButton.click(); break;
        }
      } else {
        switch (window.event.keyCode) {
          case 37: previousPageButton.click(); break;
          case 39: nextPageButton.click(); break;
        }
      }
    }
  };

  pageSlider.oninput = function() {
    changePage(TITLE, CHAPTER, parseInt(pageSlider.value));
  }

  pageSlider.onmouseup = function() {
    document.activeElement.blur(); // Remove focus
  }

  previousPageButton.onclick = function() {
    if (doublePage) {
      changePage(TITLE, CHAPTER, PAGE - 2);
    } else {
      changePage(TITLE, CHAPTER, PAGE - 1);
    }
  }

  nextPageButton.onclick = function() {
    if (doublePage) {
      changePage(TITLE, CHAPTER, PAGE + 2);
    } else {
      changePage(TITLE, CHAPTER, PAGE + 1);
    }
  }


  let isMenuVisible = true;
  middlePageButton.onclick = function() {
    if (isMenuVisible) {
      document.getElementById("topMenu").classList.add("hidden");
      document.getElementById("bottomMenu").classList.add("hidden");
    } else {
      document.getElementById("topMenu").classList.remove("hidden");
      document.getElementById("bottomMenu").classList.remove("hidden");
    }
    isMenuVisible = !isMenuVisible
  }

  imgPageLeft.onload = imgFinishedLoading();

  previousChapterButton.onclick = function() {
    changePage(TITLE, CHAPTER - 1, 1);
  }

  nextChapterButton.onclick = function() {
    changePage(TITLE, CHAPTER + 1, 1);
  }

  let isFullScreen = false;
  fullScreenButton.onclick = function() {
    if (isFullScreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
      }
      fullScreenButton.classList.remove("enabled");

    } else {

      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) { /* Safari */
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) { /* IE11 */
        document.documentElement.msRequestFullscreen();
      }
      fullScreenButton.classList.add("enabled");
    }

    isFullScreen = !isFullScreen;
  }

  chapterSelection.onchange = function() {
    changePage(TITLE, chapterSelection.selectedIndex + 1, 1);
    document.activeElement.blur(); // Remove focus
  }

  chapterSelection.onselect = function() {
    alert("salut");
  }

  doublePageButton.onclick = function() {
      useDoublePage = !useDoublePage;
      if (useDoublePage) {
        doublePageButton.classList.add("enabled");
      } else {
        doublePageButton.classList.remove("enabled");
      }
      refreshDipslayPages();
  }

  toggleElement("configButton", false, ["configMenu"]);
  toggleElement("paperTextureButton", false, ["paperTextureButton", "paperTexture"]);
  toggleElement("bookFoldButton", false, ["bookFoldButton", "bookFold"]);
  toggleElement("lightingButton", false, ["lightingButton", "lighting", "specular"]);


  document.getElementById("sidePagesButton").onclick = function() {
    sidePages = !sidePages;
    if (sidePages) {
      document.getElementById("sidePagesButton").classList.add("enabled");
    } else {
      document.getElementById("sidePagesButton").classList.remove("enabled");
    }
    refreshDipslayPages();
  };

  let bookShadow = false;
  document.getElementById("bookShadowButton").onclick = function() {
    bookShadow = !bookShadow;
    if (bookShadow) {
      document.getElementById("bookShadowButton").classList.add("enabled");
      navImage.classList.add("bookShadow");
    } else {
      document.getElementById("bookShadowButton").classList.remove("enabled");
      navImage.classList.remove("bookShadow");
    }
  };



  document.getElementById("closeMenu").onclick = function() {
    document.getElementById("configButton").click();
  };

  document.getElementById("pageWidthSlider").oninput = function() {
    document.getElementById("continuousScrollingPages").style.width = document.getElementById("pageWidthSlider").value + "vw";
  }

  document.getElementById("pageWidthSlider").onmouseup = function() {
    document.activeElement.blur(); // Remove focus
  }

}

function toggleElement(button, varState, targets, className = "enabled") {
  document.getElementById(button).onclick = function() {
    varState = !varState;

    targets.forEach((target) => {
      if (varState) {
        document.getElementById(target).classList.add(className);
      } else {
        document.getElementById(target).classList.remove(className);
      }
    });

  }

}


// -----------------------------------------------------------------------------

/* CONFIGURATION */
const READER_URL =  "https://r-entries.com/reader/index.html";
const IMAGES_URL =  "https://r-entries.com/reader/";

var previousPageButton;
var nextPageButton;
var imgPageLeft;
var imgPageRight;

const navImage = document.getElementById("navImage");
const bookTitle = document.getElementById("bookTitle");
const bookChapter = document.getElementById("bookChapter");
const middlePageButton = document.getElementById("middlePageButton");

const fullScreenButton = document.getElementById("fullScreenButton");
const doublePageButton = document.getElementById("doublePageButton");
var previousChapterButton = document.getElementById("previousChapter");
var nextChapterButton = document.getElementById("nextChapter");

const chapterSelection = document.getElementById("chapterSelection");
const pageSlider = document.getElementById("pageSlider");
var pageSliderCurrent;
var pageSliderTotal;

var useDoublePage = false;
var doublePage = useDoublePage;
var sidePages = false;

/* END CONFIGURATION */

// Loads values from the GET
var TITLE = findGetParameter('title');
var PAGE = parseInt(findGetParameter('page'));
var CHAPTER = parseInt(findGetParameter('chapter'));
if (Number.isNaN(PAGE)) PAGE = 1;
if (Number.isNaN(CHAPTER)) CHAPTER = 1;

// Load the CONFIG file from the specific gallery
var CONFIG;
fetch(IMAGES_URL + TITLE + '/' + 'config.json')
  .then(response => response.json())
  .then(data => {
    CONFIG = data;

    if (CONFIG.japaneseOrder) {
      previousPageButton = document.getElementById("rightPageButton");
      nextPageButton = document.getElementById("leftPageButton");

      imgPageLeft = document.getElementById("imgPageRight");
      imgPageRight = document.getElementById("imgPageLeft");

      pageSliderCurrent = document.getElementById("pageSliderRight");
      pageSliderTotal = document.getElementById("pageSliderLeft");

      previousChapterButton = document.getElementById("rightChapterButton");
      nextChapterButton = document.getElementById("leftChapterButton");

      pageSlider.style.transform = "rotateZ(180deg)";

    } else {

      previousPageButton = document.getElementById("leftPageButton");
      nextPageButton = document.getElementById("rightPageButton");

      imgPageLeft = document.getElementById("imgPageLeft");
      imgPageRight = document.getElementById("imgPageRight");

      pageSliderCurrent = document.getElementById("pageSliderLeft");
      pageSliderTotal = document.getElementById("pageSliderRight");

      previousChapterButton = document.getElementById("leftChapterButton");
      nextChapterButton = document.getElementById("rightChapterButton");
    }

    /* Populate the chapterSelection menu with the chapter from this title */
    for (var i = 0; i < getNumChapters(); i++) {
      var option = document.createElement("option");
      option.text = "Chapter " + (i + 1).toString();
      chapterSelection.add(option);
    }

    pageSlider.min = 1;

    changePage(TITLE, CHAPTER, PAGE);
    refreshDipslayPages();

    setHandlers();

    if (!CONFIG.allowDoublePage) doublePageButton.style.display = "none";

    if (CONFIG.preferDoublePage) {
      doublePageButton.click();
    }

    // Set default value for the width of the continuous pages
    {
      if (CONFIG.continuousScrolling) {
        if(window.innerHeight > window.innerWidth) {
          document.getElementById("pageWidthSlider").value = "100"
        } else {
          document.getElementById("pageWidthSlider").value = "40"
        }
        document.getElementById("continuousScrollingPages").style.width = document.getElementById("pageWidthSlider").value + "vw";
      }
    }

    document.getElementsByTagName("body")[0].classList.add(CONFIG.bookType);

    // Default values for the filters
    {
      if (CONFIG.continuousScrolling) {
        document.getElementById("bookShadowButton").click();
      } else {
        document.getElementById("paperTextureButton").click();
        document.getElementById("bookFoldButton").click();
        document.getElementById("lightingButton").click();
        document.getElementById("sidePagesButton").click();
        document.getElementById("bookShadowButton").click();
      }

    }


  });
