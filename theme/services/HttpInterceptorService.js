(function(window, angular, undefined) {
	'use strict';

	angular.module('RouteSpeed.theme').factory('httpInterceptor', function ($q, $rootScope) {
        
            return {
                'responseError': function (rejection) {
                    // Handle HTTP errors here
                    console.error('HTTP error', rejection);
        
                    // You can perform global error handling here
                    $rootScope.$broadcast('httpError', rejection);
        
                    // Reject the promise to propagate the error further
                    return $q.reject(rejection);
                }
            };
        });        
})(window, window.angular);

