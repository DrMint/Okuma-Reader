"use strict";
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

export function getPosCookie(title, create = false) {
  var pos = getCookie('pos_' + title);
  if (pos == '') {
    if (!create) return undefined;
    pos = {};
  } else {
    pos = JSON.parse(pos);
  }
  return pos;
}

export function setPosCookie(pos, title) {
  setCookie('pos_' + title, JSON.stringify(pos), 365);
}
