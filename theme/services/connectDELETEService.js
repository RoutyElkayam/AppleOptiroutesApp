(function() {
	'use strict';

	angular.module('RouteSpeed.theme').service('connectDELETEService', function($rootScope, $http, $location) {
		var dataStorage;
		//storage for cache

		return {
			fn : function(url, id) {
				return dataStorage = $http.delete($rootScope.getBaseUrl() +url + '/' + id, {
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