"use strict";
import * as CONSTANTS from './constants.js';

/* Returns the value of a given GET parameter name */
export function findGetParameter(parameterName) {
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

export function stringToBoolean(string) {
  return string == 'true' || 'True';
}

export function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + "; path=/; SameSite=None; Secure";
}

export function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// If the title isn't valid, go back to home page
export function assertsTitleExists(titles, title) {
  if (titles.indexOf(title) == -1) {
    window.location.href = CONSTANTS.homeURL();
  }
}

export function applyTheme() {
  const body = document.getElementsByTagName("body")[0];
  var themeSelection = parseInt(getCookie('themeSelection'));
  if (isNaN(themeSelection)) themeSelection = 0;
  const themeNames = ['darkTheme', 'lightTheme'];
  for (var i = 0; i < themeNames.length; i++) {
    body.classList.remove(themeNames[i]);
  }
  body.classList.add(themeNames[themeSelection]);
}

export function writeBookInfo(bookInfo, languageData, bookInfoDiv) {
  if (bookInfo.status && languageData.titlePage.status[bookInfo.status]) {
    var status = document.createElement("p");
    status.innerHTML = languageData.titlePage.status[bookInfo.status];
    status.id = "status";
    bookInfoDiv.appendChild(status);
  }

  if (bookInfo.genres) {
    var genres = document.createElement("div");
    genres.id = "genres";
    bookInfo.genres.forEach((genre, index) => {
      var line = document.createElement("p");
      line.innerHTML = genre;
      genres.appendChild(line);
    });
    bookInfoDiv.appendChild(genres);
  }

  if (bookInfo.language) {
    var status = document.createElement("p");
    status.innerHTML = languageData.titlePage.language + languageData.ps + ": " + bookInfo.language;
    status.id = "status";
    bookInfoDiv.appendChild(status);
  }

  if (bookInfo.authors) {
    var authors = document.createElement("div");
    authors.id = "authors";
    bookInfo.authors.forEach((author, index) => {
      if (languageData.titlePage.authors[author[0]]) {
        var line = document.createElement("p");
        line.innerHTML = languageData.titlePage.authors[author[0]] + languageData.ps + ': ' + author[1];
        authors.appendChild(line);
      }
    });
    bookInfoDiv.appendChild(authors);
  }

  if (bookInfo.serialization) {
    var serialization = document.createElement("p");
    serialization.innerHTML = languageData.titlePage.publication + languageData.ps + ": " + bookInfo.serialization;
    serialization.id = "serialization";
    bookInfoDiv.appendChild(serialization);
  }

  if (bookInfo.synopsis) {
    var synopsis = document.createElement("p");
    synopsis.innerHTML = bookInfo.synopsis;
    synopsis.id = "synopsis";
    bookInfoDiv.appendChild(synopsis);
  }
}

// Get retrieve a language
// languages must be the fetch result of lang/config.json
export function chooseLanguage() {
  return fetchLanguages()
    .then(languages => {

      // Priorities are:
      // Language selected by the user
      // Language given in parameters
      // Browser language
      var result;
      if (getCookie('lang') != '') {
        result = getCookie('lang');
      } else if (findGetParameter('lang') != null) {
        result = findGetParameter('lang')
      } else {
        result = navigator.language || navigator.userLanguage;
        result = result.substring(0, 2)
      }
      // Then if that language isn't valid, select the default one from constants
      if (!Object.keys(languages.languages).includes(result)) {
        result = CONSTANTS.defaultLanguage();
      }
      return result;
    });
}

export function chooseAndFetchLanguage() {
  return chooseLanguage()
    .then(languageName => fetchLanguage(languageName))
}

export function fetchLanguages() {
  return fetch('../lang/config.json')
    .then(response => response.json())
}

export function fetchLanguage(languageName) {
  return fetch('../lang/' + languageName + '.json')
    .then(response => response.json())
}

export function fetchLibrary(libraryURL) {
  return fetch(libraryURL + 'config.json')
    .then(response => response.json());
}

export function fetchBook(libraryURL, title) {
  return fetch(libraryURL + title + '/' + 'config.json')
    .then(response => response.json())
}

export function fetchVolume(libraryURL, title, volume) {
  return fetch(libraryURL + title + '/' + volume + '/' + 'config.json')
    .then(response => response.json())
}

export function fetchBookInfo(libraryURL, title) {
  return fetch(libraryURL + title + '/' + 'info.json')
    .then(response => response.json())
}
