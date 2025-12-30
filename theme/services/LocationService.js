(function(window, angular, undefined) {
	'use strict';

	angular.module('RouteSpeed.theme').factory('LocationService', function($rootScope,$filter,$compile) {
		var LocationService = {};
		
	LocationService.getLocation = function(){
	  if (navigator.geolocation) {
	  	// Check permissions first if in Cordova environment
	  	if (window.cordova && cordova.plugins && cordova.plugins.permissions) {
	  		var permissions = cordova.plugins.permissions;
	  		permissions.checkPermission(
	  			permissions.ACCESS_FINE_LOCATION,
	  			function(status) {
	  				if (status.hasPermission) {
	  					// Permission granted, start location tracking
	  					startLocationTracking();
	  				} else {
	  					console.warn('Location permission not granted, cannot start location tracking');
	  					$rootScope.locationFailure = true;
	  					if (!$rootScope.$$phase) {
	  						$rootScope.$apply();
	  					}
	  				}
	  			},
	  			function(error) {
	  				// If check fails, try anyway (might work in browser or if already granted)
	  				console.warn('Error checking location permission, attempting anyway:', error);
	  				startLocationTracking();
	  			}
	  		);
	  	} else {
	  		// Not in Cordova or permissions plugin not available, try anyway
	  		startLocationTracking();
	  	}
	  } else { 
	    alert("אין אפשרות לקבל מיקום נוכחי במכשיר זה.");
	  }
	  
	  function startLocationTracking() {
	  	// Valid options for geolocation API:
	  	// enableHighAccuracy: true = use GPS (slower but more accurate), false = use network (faster)
	  	// timeout: maximum time to wait for position (in milliseconds)
	  	// maximumAge: how old a cached position can be (0 = always get fresh position)
	  	var options = {
	  		enableHighAccuracy: true,  // Use GPS for better accuracy
	  		timeout: 60000,            // Increased to 60 seconds for Android GPS fix
	  		maximumAge: 60000          // Accept cached position up to 60 seconds old (helps avoid timeouts)
	  	};
	  	
	  	// First, try to get current position immediately (faster, uses cached if available)
	  	// This ensures we have a position right away if one is available
	  	navigator.geolocation.getCurrentPosition(
	  		function(position) {
	  			// Got immediate position, update scope
	  			onGeolocationSuccess(position);
	  			// Now start watching for continuous updates
	  			navigator.geolocation.watchPosition(onGeolocationSuccess, onGeolocationError, options);
	  		},
	  		function(error) {
	  			// If getCurrentPosition fails, still start watchPosition (it will try to get position)
	  			console.log('getCurrentPosition failed, starting watchPosition:', error);
	  			navigator.geolocation.watchPosition(onGeolocationSuccess, onGeolocationError, options);
	  		},
	  		{
	  			enableHighAccuracy: false,  // Use faster method for immediate position
	  			timeout: 10000,             // Shorter timeout for immediate position
	  			maximumAge: 60000           // Accept cached position
	  		}
	  	);
	  }
	}
		function onGeolocationError(position) {
			$rootScope.locationFailure = true;
			if (!$rootScope.$$phase)
				$rootScope.$apply();
		}
	    
		function onGeolocationSuccess(position) {
			$rootScope.locationFailure = false;
			var formattedAddress;
			//4/1/2024 RUT CANCELED!!!!!! dont rechange-this was a big long problem because of big costs in google c;oud
			//was geocoding by google in order to get address it was every second as long as the application is opened big costs means 10000 more per month!!
			$rootScope.currentPosition = {
				lat : position.coords.latitude,
				lng : position.coords.longitude,
				address : formattedAddress
			};
			// Apply scope changes to ensure Angular is aware of the update
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			} 
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

