"use strict";
import * as CONSTANTS from './constants.js';
import { findGetParameter } from './tools.js';
import { getCookie } from './cookie.js';

var OCONFIG;
var TCONFIG;
var LCONFIG;

var LIBRARY = findGetParameter('library');
if (LIBRARY == null) LIBRARY = CONSTANTS.booksURL();

var lang;
if (getCookie('lang') != '') {
  lang = getCookie('lang');
} else if (findGetParameter('lang') != null) {
  lang = findGetParameter('lang')
} else {
  lang = CONSTANTS.defaultLanguage();
}


{
  const body = document.getElementsByTagName("body")[0];
  const themeSelection = parseInt(getCookie('themeSelection'));
  const themeNames = ['darkTheme', 'lightTheme'];
  for (var i = 0; i < themeNames.length; i++) {
    body.classList.remove(themeNames[i]);
  }
  body.classList.add(themeNames[themeSelection]);
}



fetch('../lang/' + lang + '.json')
  .then(response => response.json())
  .then(data => {
    LCONFIG = data;

    // Change the title of the webpage
    document.title = CONSTANTS.websiteName() + ' - ' + LCONFIG.homePage.home;

    document.getElementById("availableBooks").innerHTML = LCONFIG.homePage.availableBooks;

    fetch(LIBRARY + 'config.json')
      .then(response => response.json())
      .then(data => {
        OCONFIG = data;

        OCONFIG.titles.forEach((title, index) => {


          fetch(LIBRARY + title + '/'+ 'config.json')
            .then(response => response.json())
            .then(data => {
              TCONFIG = data;
                var link = document.createElement("a");
                var p = document.createElement("p");
                var cover = document.createElement("img");

                link.href = './title.html' + '?library=' + LIBRARY + '&title=' + title;
                p.innerHTML = TCONFIG.title;
                cover.src = LIBRARY + title + '/1/1/1' + TCONFIG.fileExtension;

                link.appendChild(p);
                link.appendChild(cover);
                document.getElementById("books").appendChild(link);

            });

          });

      });


  });
