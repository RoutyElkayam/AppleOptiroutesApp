angular
    .module('RouteSpeed')
    .controller('palletsOrderInTruckCtrl', ['$scope','$rootScope', '$http', '$location','$filter','$compile','connectPOSTService','connectGETService','PalletsService',
    function palletsOrderInTruckCtrl($scope,$rootScope, $http, $location,$filter,$compile ,connectPOSTService,connectGETService,PalletsService) {
		
		var driver_id=$rootScope.current_user ? Number($rootScope.current_user.company_id) : null;
	    $scope.attachedOrders = [];
	    $scope.rowWithOrders=[];
		//$scope.rowAdded=[];
		$scope.goBack = function(){
				$location.path('/orders');
		}
		
		$scope.isCooled = function(pallet){
			var cooledPallet = false;
			angular.forEach($rootScope.crnt_route, function(order, key) {
				if(order.pallet!=undefined && Number(order.pallet) == pallet && PalletsService.getOrderDetail(order.orders_details, 'תאור קבוצה',order)=='מצונן')
					cooledPallet = true;
			});
			return cooledPallet;	
		}
		
		$scope.getOrderDetail = function(order){
			return PalletsService.getOrderDetail(order.orders_details, 'תאור קבוצה', order);
		}

		$scope.getPalletIndex = function(id){
			var index = $filter('getByIdFilter')($rootScope.crnt_route, id);
			var palletIndex =  driver_id?(driver_id + (Number($rootScope.crnt_route[index].stop_index+1))):Number($rootScope.crnt_route[index].stop_index+1);
			$rootScope.crnt_route[index].orderToPallet = palletIndex;
			return palletIndex; 
		}

		
		$scope.updatePallet = function(order){
			connectPOSTService.fn('order/updatepallet',order).then(function(data) {
				
			});
		}

		$scope.drag = function (ev) {
			ev.preventDefault();
			ev.currentTarget.style.background = "#46b687";
		};
		$scope.onDrag = function(key){
			$scope.prevTruckOrder = angular.copy($scope.truckOrder);
			angular.forEach($scope.prevTruckOrder,function(pallet,key){
				if($scope.prevTruckOrder[key])
					$scope.prevTruckOrder[key].surfacing_num = $scope.truckOrder[key].surfacing_num;
			});
			$scope.prevTruckOrder = PalletsService.deleteSurface(key,$scope.prevTruckOrder,true);
		}
		$scope.onDrop = function (list, items, index) {
			var requestedKey = -1;
			angular.forEach(list,function(pallet,key){
				if(pallet && items && pallet.length && items.length && pallet[0].id == items[0].id && key != index)
					requestedKey = key;
			});
			$scope.prevTruckOrder = PalletsService.addSurfaceBelow(requestedKey,$scope.prevTruckOrder,items,true);
			$scope.truckOrder = $scope.prevTruckOrder;
			$scope.prevTruckOrder = undefined;

			console.log($scope.truckOrder);
		};
		$scope.saveTrackTemplate = function(){
			document.getElementById("loading").style.display = "block";
			document.getElementById("nonloading").style.display = "none";
			// angular.forEach($scope.truckOrder,function(palletOrders,keyPallet){
			// 	if(!palletOrders.length){
			// 		PalletsService.deleteSurface(keyPallet,$scope.truckOrder);
			// 	}
			// });
			angular.forEach($scope.truckOrder,function(palletOrders,keyPallet){
				angular.forEach(palletOrders,function(orderInPallet,keyOrder){
					var orderInRouteIndex = $filter('getByIdFilter')($scope.route.order, orderInPallet.id);
					if(orderInRouteIndex>-1){
						$scope.route.order[orderInRouteIndex].surfacing_index = orderInPallet.surfacing_index = keyPallet;
						$scope.route.order[orderInRouteIndex].surfacing_num = orderInPallet.surfacing_num;
						$scope.route.order[orderInRouteIndex].surfacing_num_to_export = orderInPallet.surfacing_num_to_export;

						if(orderInPallet.is_splitted_amount){
							$scope.route.order[orderInRouteIndex].is_splitted_amount = 1;
	
							//If will be added an option of refresh to auto initOrderTrack the orders_splits obj. and order_split_id prop. should be removed after such an action					
	
							if(orderInPallet.order_split_id){
								var ordersSplitsIndex = $filter('getByIdFilter')($scope.route.order[orderInRouteIndex].orders_splits, orderInPallet.order_split_id);
								if(ordersSplitsIndex>-1){
									$scope.route.order[orderInRouteIndex].orders_splits[ordersSplitsIndex].surfacing_num = orderInPallet.surfacing_num;
									$scope.route.order[orderInRouteIndex].orders_splits[ordersSplitsIndex].surfacing_num_to_export = orderInPallet.surfacing_num_to_export;
									$scope.route.order[orderInRouteIndex].orders_splits[ordersSplitsIndex].surfacing_index = orderInPallet.surfacing_index;
								}
							}else{            
								if(!$scope.route.order[orderInRouteIndex].orders_splits)
									$scope.route.order[orderInRouteIndex].orders_splits = [];
	
								$scope.route.order[orderInRouteIndex].orders_splits.push({
									surfacing_num:orderInPallet.surfacing_num,
									surfacing_num_to_export:orderInPallet.surfacing_num_to_export,
									surfacing_index:orderInPallet.surfacing_index,
									amount:orderInPallet.amount
								});
							}
						}
					}	
				});
			});
			connectPOSTService.fn('order/updatemanualpalletsarrangment&id=' + $scope.route.id,$scope.route.order).then(function(data) {
				if(data.data.status){
					init();
					
				}
				
			}, function(e) {
				document.getElementById("loading").style.display = "none";
				document.getElementById("nonloading").style.display = "block";
			});
		}
		function init(){
			document.getElementById("loading").style.display = "block";
			document.getElementById("nonloading").style.display = "none";
			connectGETService.fn('track/get_route&id=' + $rootScope.crnt_route[0].track_id).then(function(data) {
				if(data.data.status){
					$scope.route = data.data.data;
					
					if(!$scope.route.manual_pallet_arrangement_ref){
						$scope.truckOrder = PalletsService.initOrderTrack($scope.route);
						
					}else{
						$scope.models = {
							selected: null,
							lists: []
						};
						$scope.truckOrder = PalletsService.getSavedTruckOrder($scope.route);
						
					}
					angular.forEach($scope.truckOrder,function(orders,key){
						$scope.truckOrder[key] = PalletsService.numberOrdersForPallets(orders);
						$scope.truckOrder[key].original_surfacing_index = key;
					});	
				}
				document.getElementById("loading").style.display = "none";
				document.getElementById("nonloading").style.display = "block";
			}, function(e) {
				document.getElementById("loading").style.display = "none";
				document.getElementById("nonloading").style.display = "block";
			});			
		}
		init();
    }
]);