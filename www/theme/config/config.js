(function () {
  'use strict';
  
		var baseUrl;
		// if(window.location.hostname.includes('web.'))
		// 	baseUrl = "https://web.optiroutes.com/dev";
		// else if(window.location.hostname.includes('frk.'))
		// 	baseUrl = "https://frk.optiroutes.com/dev";
		// else if(window.location.hostname.includes('192.168.8.100'))
		// 	baseUrl = "http://192.168.8.100/or-env-php8/dev";
		// else if(window.location.hostname.includes('localhost'))
		// 	baseUrl = "http://localhost/or-env-php8/dev";
		// else if(window.location.hostname.includes('prod.'))
		// 	baseUrl = "https://prod.optiroutes.com/dev";
		// else if(window.location.hostname.includes("p2."))
		// 	baseUrl = "https://prod.optiroutes.com/dev";
		// else if(window.location.hostname.includes("test."))
		// 	baseUrl = "https://test.optiroutes.com/dev";
		// else if(window.location.hostname.includes("check."))
		// 	baseUrl = "https://check.optiroutes.com/dev";
		// else
			baseUrl = "https://check.optiroutes.com/dev";
		
	angular.module('RouteSpeed').config(function ($httpProvider) {
		$httpProvider.interceptors.push('httpInterceptor');
	});
	angular.module('RouteSpeed')
	
	.constant('config', {
		baseUrl: baseUrl
	});


})();

