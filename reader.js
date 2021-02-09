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
  {
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
        newChapter++;
        newPage = 1;
      } else {
         newPage = getChapterNumPage();
      }
    }

    TITLE = newTitle;
    CHAPTER = newChapter
    PAGE = newPage;
  }

  // To use double page, the user should have asked for double page
  doublePage = useDoublePage

  // If the CONFIG file asked for the fist page to be single, doublePage should
  // only be enable for pages other than the first one
  doublePage = doublePage && (PAGE != 1 || !CONFIG.fistPageSingle);

  // Lastly double page should be disable if the last page is left alone.
  doublePage = doublePage && (PAGE + 1 <= getChapterNumPage());

  // If the first page is set to be single, the page number should be event
  if (doublePage && (CONFIG.fistPageSingle && PAGE % 2 == 1)) PAGE--;

  if (doublePage) {
    imgPageRight.style.display = "inherit";
    document.getElementById("navImage").classList.add("doublePage");
  } else {
    imgPageRight.style.display = "none";
    document.getElementById("navImage").classList.remove("doublePage");
  }

  /*  Replace the current URL without reloading the page.
      Furthermore, if the use use to go back button, it will not go to the
      previous image but the actual previous page */
  if (window.history.replaceState) {
    //prevents browser from storing history with each change:
    let newURL = READER_URL + '?title=' + TITLE + '&chapter=' + CHAPTER + '&page=' + PAGE;
    window.history.replaceState(null, '', newURL);
  }

  /* Load the current page*/
  getImage(infoToImageURL(TITLE, CHAPTER, PAGE)).then(function(successUrl) {
    imgPageLeft.style.backgroundImage = "url(" + infoToImageURL(TITLE, CHAPTER, PAGE) + ")";
    imgFinishedLoading();
  });

  if (doublePage) {
    getImage(infoToImageURL(TITLE, CHAPTER, PAGE + 1)).then(function(successUrl) {
      imgPageRight.style.backgroundImage = "url(" + infoToImageURL(TITLE, CHAPTER, PAGE + 1) + ")";
    });
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

  /* Show or hide buttons */
  {
    // Showing or hiding the previous page button
    if (PAGE > 1 || CHAPTER > 1) {
      previousPageButton.style.display = "inherit";
    } else {
      previousPageButton.style.display = "none";
    }

    // Showing or hiding the next page button
    if (PAGE < getChapterNumPage() || CHAPTER < getNumChapters()) {
      nextPageButton.style.display = "inherit";
    } else {
      nextPageButton.style.display = "none";
    }

    // Showing or hiding the previous chapter button$
    if (CHAPTER > 1) {
      previousChapterButton.style.display = "inherit";
    } else {
      previousChapterButton.style.display = "none";
    }

    // Showing or hiding the next chapter button
    if (CHAPTER < getNumChapters()) {
      nextChapterButton.style.display = "inherit";
    } else {
      nextChapterButton.style.display = "none";
    }
  }

}

// -----------------------------------------------------------------------------


function setHandlers() {
  /* EVENTS HANDLERS */
  document.onkeydown = function() {
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

  };

  imgPageLeft.onload = imgFinishedLoading();

  pageSlider.oninput = function() {
    changePage(TITLE, CHAPTER, parseInt(pageSlider.value));
    document.activeElement.blur(); // Remove focus
  }

  previousPageButton.onclick = function() {
    if (doublePage && PAGE != 2) {
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

  previousChapterButton.onclick = function() {
    changePage(TITLE, CHAPTER - 1, 1);
  }

  nextChapterButton.onclick = function() {
    changePage(TITLE, CHAPTER + 1, 1);
  }

  var isFullScreen = false;
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

  doublePageButton.onclick = function() {
      useDoublePage = !useDoublePage;
      if (useDoublePage) {
        doublePageButton.classList.add("enabled");
      } else {
        doublePageButton.classList.remove("enabled");
      }
      changePage(TITLE, CHAPTER, PAGE);
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
      previousChapterButton.innerHTML = 'Previous<br>chapter<br>▶';
      nextChapterButton.innerHTML = 'Next<br>chapter<br>◀';

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
      previousChapterButton.innerHTML = 'Previous<br>chapter<br>◀';
      nextChapterButton.innerHTML = 'Next<br>chapter<br>▶';
    }

    /* Populate the chapterSelection menu with the chapter from this title */
    for (var i = 0; i < getNumChapters(); i++) {
      var option = document.createElement("option");
      option.text = "Chapter " + (i + 1).toString();
      chapterSelection.add(option);
    }

    changePage(TITLE, CHAPTER, PAGE);
    setHandlers();

    if (!CONFIG.allowDoublePage) doublePageButton.style.display = "none";

    if (CONFIG.preferDoublePage) {
      doublePageButton.click();
    }

  });
