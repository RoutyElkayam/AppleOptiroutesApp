(function(window, angular, undefined) {
	'use strict';

	angular.module('RouteSpeed.theme').factory('StopService', function($rootScope, $http, $filter,connectPOSTService) {
		var StopService = {};
		//RUTEL get the next stop in order to send it msg
		StopService.markComplete = function(stop,done = true,nextStop=null,remarks='') {
			if($rootScope.currentPosition&&$rootScope.current_user.saving_coordinates_for_customer_address){
				var latlng = new google.maps.LatLng($rootScope.currentPosition.lat,$rootScope.currentPosition.lng);
				StopService.address = {};
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode({
					'latLng' : latlng
				}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						if (results[0]) {						
							StopService.address.name = results[0].formatted_address;
							var components = [];
							for (var i = 0; i < results[0].address_components.length; i++) {
								components[results[0].address_components[i].types.join('_')] = results[0].address_components[i].long_name;
							};
							StopService.address.lat = $rootScope.currentPosition.lat;
							StopService.address.lng = $rootScope.currentPosition.lng;
							StopService.address.country = components['country_political'];
							StopService.address.city = components['locality_political'];
							StopService.address.street = components['route'];
							StopService.address.street_number = components['street_number'];
							StopService.address.stop_id = stop.id;
							StopService.address.customer_name=stop.customer.customer_name;
							$rootScope.modal.message = $rootScope.arraylang['update_formatted_address'][$rootScope.selectedlang]+StopService.address.name;
							$rootScope.modal.func = 'saveAddress';
							angular.element('#message-trigger').trigger('click');
							// setTimeout(function() {
								// angular.element('#message-modal').trigger('click');
							// }, 3000);
							
						}
					}
				});
			}
				
				
		
			
		
			var data = {
				data : {
					messenger : localStorage.getItem('user_id'),
					delivery : stop.id,
					status : done,
					current_lat : $rootScope.currentPosition?$rootScope.currentPosition.lat:null,
					current_lng : $rootScope.currentPosition?$rootScope.currentPosition.lng:null,
					next_stop: nextStop,
					message  : remarks
					
				}
			}
			
	
			return $.ajax({
				url : $rootScope.getBaseUrl() + 'order/finishstation',
				data : data,
				type : 'post',
				headers : {
					'x-csrf-token-app' : localStorage.getItem('identify_number'),
					'user-token-app' : localStorage.getItem("user_id")
				}
			});
			
			
		}
		
		StopService.updateAddressLocation = function(stop){
			if($rootScope.currentPosition)
			{
				var latlng = new google.maps.LatLng($rootScope.currentPosition.lat,$rootScope.currentPosition.lng);
				StopService.address = {};
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode({
					'latLng' : latlng
				}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						if (results[0]) {						
							StopService.address.name = results[0].formatted_address;
							var components = [];
							for (var i = 0; i < results[0].address_components.length; i++) {
								components[results[0].address_components[i].types.join('_')] = results[0].address_components[i].long_name;
							};
							StopService.address.lat = $rootScope.currentPosition.lat;
							StopService.address.lng = $rootScope.currentPosition.lng;
							StopService.address.country = components['country_political'];
							StopService.address.city = components['locality_political'];
							StopService.address.street = components['route'];
							StopService.address.street_number = components['street_number'];
							StopService.address.stop_id = stop.id;
							StopService.address.customer_name=stop.customer.customer_name;
							$rootScope.modal.message = $rootScope.arraylang['update_formatted_address'][$rootScope.selectedlang]+StopService.address.name;
							$rootScope.modal.func = 'saveAddress';
							angular.element('#message-trigger').trigger('click');
							// setTimeout(function() {
								// angular.element('#message-modal').trigger('click');
							// }, 3000);
							
						}
					}
				});
			}
			else
			{
				$rootScope.modal.message = "לא נמצא מיקום";
				angular.element('#message-trigger').trigger('click');
			}
		}
		
		StopService.saveAddress = function(){
			connectPOSTService.fn('order/save_order_address&id='+StopService.address.stop_id,StopService.address).then(function(data) {
				console.log(data);
			}, function(err) {
				
			});
		}
		
		StopService.startDocumentation = function(stop,end = false,remarks,returns,created_by_draft) {

			var data = {
				user_id:localStorage.getItem('user_id'),
				stop_id:stop.id,
				customer_id:stop.customer_id,
				location : $rootScope.currentPosition,
				end:end,
				remarks:remarks!=undefined ? remarks :'',
				returns:returns!=undefined ? returns :null,
				small_pallets : stop.small_pallets ? stop.small_pallets  : 0 ,//משטחים  נאספו
				big_pallets   : stop.big_pallets   ? stop.big_pallets    : 0,//משטחים  נמסרו כעת ללקוח
				collected_plastons : stop.collected_plastons ? stop.collected_plastons  : 0 ,//משטחים פלסטיק/פלסטונים נאספו
				delivered_plastons   : stop.delivered_plastons   ? stop.delivered_plastons    : 0,//משטחים פלסטיק/פלחסטונים נמסרו כעת ללקוח
				pod : stop.pod ? stop.pod : 0,
				requires_confirmation : stop.requires_confirmation,
				status : 1,//visit type:1-visit place 2- call visit
				role:2,//user role 1- agent,2- driver
				created_by_draft:created_by_draft ? 1 : 0
			}
			return $http.post($rootScope.getBaseUrl() + 'documentation/create', data ,{
				headers : {
					'x-csrf-token-app' : localStorage.getItem('identify_number'),
					'user-token-app' : localStorage.getItem("user_id")
				}
			})
			
	
		}
		
		StopService.endDocumentation = function(stop,documentation,remarks,returns,created_by_draft) {
			
			var data = {
				user_id:localStorage.getItem('user_id'),
				stop_id:stop.id,
				customer_id:stop.customer_id,
				location : $rootScope.currentPosition,
				status : 1,
				sale : documentation.sale,
				remarks : remarks!=undefined ? remarks : '',
				returns : returns!=undefined ? returns : null,
				small_pallets : stop.small_pallets ? stop.small_pallets  : 0 ,//משטחים קטנים
				big_pallets   : stop.big_pallets   ? stop.big_pallets    : 0,//משטחים גדולים
				collected_plastons : stop.collected_plastons ? stop.collected_plastons  : 0 ,//משטחים פלסטיק/פלסטונים נאספו
				delivered_plastons   : stop.delivered_plastons   ? stop.delivered_plastons    : 0,//משטחים פלסטיק/פלחסטונים נמסרו כעת ללקוח
				pod : stop.pod ? stop.pod : 0,
				collection : documentation.collection,
				created_by_draft:created_by_draft ? 1 : 0
			}
			return $http.post($rootScope.getBaseUrl() + 'documentation/update&id='+documentation.id, data ,{
				headers : {
					'x-csrf-token-app' : localStorage.getItem('identify_number'),
					'user-token-app' : localStorage.getItem("user_id")
				}
			});
	
		}
		
		StopService.getArrTime = function(arr_time){
			var date=new Date(arr_time*1000);
			//var newDateObj = new Date(date.getTime() + arr_time*60000);
			return (date.getUTCHours()).toString().padStart(2, '0')+':'+date.getUTCMinutes().toString().padStart(2, '0');
		}
		
		

		return StopService;
	});
})(window, window.angular);

