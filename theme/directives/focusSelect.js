(function () {
    'use strict';
  
  angular.module("RouteSpeed.theme")
    .directive("focusSelect", focusSelect);
  
  
    focusSelect.$inject = ['$document', '$interval'];
    /* @ngInject */
    function focusSelect($document, $interval) {
		return {
			restrict: 'A',
			link: function(scope, element) {
				

				// Focus the element when it's added to the DOM
				scope.$watch(function() {
					return element[0].offsetHeight > 0;
				}, function(newVal) {
					if (newVal) {
						setTimeout(() => {
							element[0].focus();
							setTimeout(function() {
								element[0].select();
							}, 0);
						}, 0);
					}
				});
			}
		}
    }
  })();
  