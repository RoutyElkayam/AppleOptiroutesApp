(function () {
  'use strict';
  angular.module('RouteSpeed.core')
  .run(function ($http, $templateCache) {
    $http.get('core/nextStop/nextStop.tmpl.html', { cache: $templateCache });
  });
})();
