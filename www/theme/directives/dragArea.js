(function () {
  'use strict';

angular.module("RouteSpeed.theme")
  .directive("dndScrollArea", dndScrollArea);


dndScrollArea.$inject = ['$document', '$interval'];
/* @ngInject */
function dndScrollArea($document, $interval) {
  //  <div class="dnd-scroll-area" dnd-scroll-area dnd-region="top" dnd-scroll-container="collectionList"></div>
  return {
    link: link
  };

  function link(scope, element, attributes) {
    var inc = attributes.dndRegion === 'top' ? 5: ( attributes.dndRegion === 'bottom' ? -5 : 0);
    var container = $document[0].getElementById(attributes.dndScrollContainer);
    if(container) {
      registerEvents(element,container,inc,20);
    }
  }

  function registerEvents(bar, container, inc, speed) {
    if (!speed) {
      speed = 20;
    }
    var timer;
    angular.element(bar).on('dragenter', function() {
      container.scrollTop += inc;
      timer = $interval(function moveScroll() {
        container.scrollTop += inc;
        console.log("scrool ", container.scrollTop)
      }, speed);
    });
    angular.element(bar).on('dragleave', function() {
      $interval.cancel(timer);
    });
  }
}
})();
