(function(window, angular, undefined) {
	'use strict';

	angular.module('RouteSpeed.theme').factory('httpInterceptor', function ($q, $rootScope) {
        
            function isSetSignature(config) {
              return config && config.url && config.url.indexOf('order/set_signature') !== -1;
            }

            return {
                response: function (response) {
                    // Catch ONLY set_signature OK responses
                    if (isSetSignature(response.config)) {
                      // adjust this condition to your real API (examples: "SUCCESS", "ok", ok:true)
                      var ok = response.status === 200;
              
                      if (ok) {
                        $rootScope.$broadcast('setSignatureOk', response);
                      }
                    }
                    return response;
                },
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

