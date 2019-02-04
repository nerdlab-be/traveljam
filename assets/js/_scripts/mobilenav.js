/* ======================
   #MOBILE NAVIGATION
   https://inclusive-components.design/menus-menu-buttons/
   ====================== */

var html = $('html');
var nav = $('.js-nav');
var navButton = $('.js-nav-toggle');
var navLink = $('.js-nav a');

function toggleNav() {
  var expanded = navButton.attr('aria-expanded') === 'true';

  html.toggleClass('has-nav');
  nav.toggleClass('is-visible');
  navButton.attr('aria-expanded', !expanded);
}

navButton.on('click', toggleNav);
