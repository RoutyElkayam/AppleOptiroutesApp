(function() {
	'use strict';

	angular.module('RouteSpeed.theme').service('connectPUTService', function($rootScope, $http, $location) {
		var dataStorage;
		//storage for cache

		return {
			fn : function(url, data) {

				return dataStorage = $http.put($rootScope.getBaseUrl() + url, data, {
					headers : {
						'Authorization' : 'Bearer ' + $rootScope.getToken()
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