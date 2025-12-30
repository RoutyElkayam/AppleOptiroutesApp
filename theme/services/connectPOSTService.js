(function() {
	'use strict';

	angular.module('RouteSpeed.theme').service('connectPOSTService', function($rootScope, $http, $location) {
		var dataStorage;
		//storage for cache
		return {
			fn : function(url, data) {
				return dataStorage = $http.post($rootScope.getBaseUrl() + url, data, {
					headers : {
						device: "webPage",
						'x-csrf-token-app' : localStorage.getItem('identify_number'),
						'user-token-app' : localStorage.getItem("user_id")
					}
				}).then(function(response) {
					return response;
				}, function(err) {
					if (err.status == 401) {
						localStorage.removeItem('access_token');
						$location.path('/login');
					} else
						throw err;
				});

			}
		}

	});

	/** @ngInject */

})(); 