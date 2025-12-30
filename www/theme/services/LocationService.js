(function(window, angular, undefined) {
	'use strict';

	angular.module('RouteSpeed.theme').factory('LocationService', function($rootScope,$filter,$compile) {
		var LocationService = {};
		
		LocationService.getLocation = function(){
		  if (navigator.geolocation) {
		  	var options = {enableHighAccuracy: true,timeout: 5000,maximumAge: 0,desiredAccuracy: 0, frequency: 1 };
        	navigator.geolocation.watchPosition(onGeolocationSuccess, onGeolocationError, options);
		    //navigator.geolocation.watchPosition(showPosition);
		  } else { 
		    alert("אין אפשרות לקבל מיקום נוכחי במכשיר זה.");
		  }
		}
		function onGeolocationError(position) {
			$rootScope.locationFailure = true;
			if (!$rootScope.$$phase)
				$rootScope.$apply();
		}
	    
		function onGeolocationSuccess(position) {
			$rootScope.locationFailure = false;
			if (!$rootScope.$$phase)
				$rootScope.$apply();
			var formattedAddress;
			//4/1/2024 RUT CANCELED!!!!!! dont rechange-this was a big long problem because of big costs in google c;oud
			//was geocoding by google in order to get address it was every second as long as the application is opened big costs means 10000 more per month!!
			$rootScope.currentPosition = {
				lat : position.coords.latitude,
				lng : position.coords.longitude,
				address : formattedAddress
			}; 
			if($rootScope.track_id){
				var data = {
					data : {
						messenger_id : localStorage.getItem('user_id'),
						lat : $rootScope.currentPosition.lat,
						lng : $rootScope.currentPosition.lng,
						delivery : $rootScope.track_id,
					}
				}
	
				$.ajax({
					url : $rootScope.getBaseUrl() + 'messengers/savelatlng',
					type : 'post',
					data : data,
					headers : {
						'x-csrf-token-app' : localStorage.getItem('identify_number'),
						'user-token-app' : localStorage.getItem("user_id")
					}
				}).then(function(response) {
					if (response != "ok") {
						console.log("error: " + response);
					}
				}, function fail(data) {
					//console.log('(geolocation) Error occured while trying to contact server');
				});
			}
	    	
				
		}

		
		return LocationService;
	});
})(window, window.angular);

