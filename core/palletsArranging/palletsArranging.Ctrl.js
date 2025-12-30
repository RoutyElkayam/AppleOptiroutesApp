angular
    .module('RouteSpeed')
    .controller('palletsArrangingCtrl', ['$scope','$rootScope', '$http', '$location','$filter','$compile','connectPOSTService','PalletsService',
    function palletsArrangingCtrl($scope,$rootScope, $http, $location,$filter,$compile ,connectPOSTService, PalletsService) {
		
		var driver_id=$rootScope.current_user ? Number($rootScope.current_user.company_id) : null;
	    $scope.attachedOrders = [];
	    $scope.rowWithOrders=[];
		//$scope.rowAdded=[];
		$scope.goBack = function(){
				$location.path('/orders');
		}
		$scope.addExistingSelctns = function(allRowsLength){
			angular.forEach($rootScope.crnt_route, function(order, key) {
				if(order.pallet != undefined)
				{
					if(allRowsLength == undefined || allRowsLength && order.pallet>((allRowsLength-1)*2))
					{
						var index = $filter('getByIdFilter')($rootScope.crnt_route, order.id);
				        var palletIndex =  driver_id?(driver_id + (Number($rootScope.crnt_route[index].stop_index+1))):Number($rootScope.crnt_route[index].stop_index+1);
						
						var html = "<div class='chosen-pallet' id='"+(order.id)+"' >"+palletIndex+" "+order.customer_name.substring(0, 14)
						   +"<span class='btn btn-default cancel-pallet-belonging' ng-click='cancelAttachOrder($event,"
						   +(order.id)+")'>×</span></div>";
						var compiledElement = $compile(html)($scope);
						var select = document.getElementById($rootScope.crnt_route[index].pallet);
						if(select) 
							select.parentNode.append(compiledElement[0]);
					}
				}
			});
		}
		$scope.isCooled = function(pallet){
			var cooledPallet = false;
			angular.forEach($rootScope.crnt_route, function(order, key) {
				if(order.pallet!=undefined && Number(order.pallet) == pallet && PalletsService.getOrderDetail(order.orders_details, 'תאור קבוצה',order)=='מצונן')
					cooledPallet = true;
			});
			return cooledPallet;	
		}
		
		$scope.getOrderDet = function(order){
			return PalletsService.getOrderDetail(order.orders_details, 'תאור קבוצה', order);
		}
		$scope.addTrow = function(){
	    	var lastRows = angular.element(".last2Rows");
	    	var repeatedRows = angular.element(".repeatedRows");
	    	var elseRows = angular.element(".rowsElse");
	    	var allRowsLength = document.getElementsByTagName("tr").length;
	    	if(allRowsLength < 7)
	    	{
	    		//$scope.rowAdded[4-(allRowsLength-2)]=true;
	    		$scope.rowWithOrders[4-(allRowsLength-2)]=true;
	    		setTimeout(function() {
		    		$('.js-example-basic-multiple').each(function() {
			    		$(this).select2({
			    			templateResult: function (data, container) {
							    if (data.element && $scope.isBelongsToPallet(data.element.value)) {
							      $(container).addClass("select2-results__selected_yet");
							    }
							    return data.text;
							  }
			    		});
			    		$(this).on('select2:select', $scope.attachOrder);
			    		$(this).on('select2:unselect', $scope.cancelAttachOrder);
					});
				    $('.select2-container-active').removeClass('select2-container-active');
		                $(':focus').blur();
	                $scope.addExistingSelctns(allRowsLength);
              },100);
	    		return 0;
    		}
			var html = '<tr class="rowsElse" >'
	    	+'<td class="col-xs-6 pallet-order" style="text-align: center;">'
	    	+'<p>'	
			+'<select class="js-example-basic-multiple form-control" name="states[]" multiple="multiple" id="'+((allRowsLength-1)*2+2)+'" >'	
			+'<option ng-repeat="order in crnt_route"  value="{{order.id}}"  >'		    
			+'{{getPalletIndex(order.id)}}&nbsp;&nbsp;&nbsp;'			 
			+'{{arraylang["units"][selectedlang]}}:{{order.amount}} &nbsp;&nbsp;&nbsp;'
			+'{{arraylang["weight"][selectedlang]}}:{{order.weight}}&nbsp;&nbsp;&nbsp; {{getOrderDet(order)}}&nbsp;&nbsp;&nbsp;'
			+'{{order.city}} &nbsp;&nbsp;&nbsp;' 
			+'{{order.customer_name | limitTo: 15}}'
			+'</option>'			
			+'</select>'	
			+'</p>'
			+'<span ng-if="isCooled('+((allRowsLength-1)*2+2)+')" style="color:#999;">{{arraylang["cooled"][selectedlang]}}</span>'	
			+'</td>'
	    	+'<td class="col-xs-6 pallet-order" style="text-align: center;">'
    		+'<p>'	
			+'<select class="js-example-basic-multiple form-control" name="states[]" multiple="multiple" id="'+((allRowsLength-1)*2+1)+'" >'		
			+'<option ng-repeat="order in crnt_route"  value="{{order.id}}" >'			    
			+'{{getPalletIndex(order.id)}}&nbsp;&nbsp;&nbsp;'			 
			+'{{arraylang["units"][selectedlang]}}:{{order.amount}} &nbsp;&nbsp;&nbsp;'
			+'{{arraylang["weight"][selectedlang]}}:{{order.weight}}&nbsp;&nbsp;&nbsp; {{getOrderDet(order)}}&nbsp;&nbsp;&nbsp;'
			+'{{order.city}} &nbsp;&nbsp;&nbsp;' 
			+'{{order.customer_name | limitTo: 15}}'
			+'</option>'				
			+'</select>'
			+'</p>'
			+'<span ng-if="isCooled('+((allRowsLength-1)*2+1)+')" style="color:#999;">{{arraylang["cooled"][selectedlang]}}</span>'
	    	+'</td>'
	    	+'</tr>';
	    	var compiledElement = $compile(html)($scope);
	    	var table = angular.element(".table");
			lastRows[0].remove();
	    	lastRows[1].remove();
	    	for (var i=0; i < repeatedRows.length; i++) {
			  repeatedRows[i].remove();
			};
			
			for (var i=0; i < elseRows.length; i++) {
			  elseRows[i].remove();
			};
	    	table.append(compiledElement);
	    	for (var i=0; i < elseRows.length; i++) {
			  table.append(elseRows[i]);
			};
	    	for (var i=0; i < repeatedRows.length; i++) {
			  table.append(repeatedRows[i]);
			};
	    	table.append(lastRows[0]);
	    	table.append(lastRows[1]);
	    	$('.js-example-basic-multiple').each(function() {
	    		$(this).select2({
	    			templateResult: function (data, container) {
					    if (data.element && $scope.isBelongsToPallet(data.element.value)) {
					      $(container).addClass("select2-results__selected_yet");
					    }
					    return data.text;
					  }
	    		});
	    		$(this).on('select2:select', $scope.attachOrder);
	    		$(this).on('select2:unselect', $scope.cancelAttachOrder);
			});
		    $('.select2-container-active').removeClass('select2-container-active');
                $(':focus').blur();
            $scope.addExistingSelctns(allRowsLength);
						
	
		}
		$scope.getPalletIndex = function(id){
			var index = $filter('getByIdFilter')($rootScope.crnt_route, id);
			var palletIndex =  driver_id?(driver_id + (Number($rootScope.crnt_route[index].stop_index+1))):Number($rootScope.crnt_route[index].stop_index+1);
			$rootScope.crnt_route[index].orderToPallet = palletIndex;
			return palletIndex; 
		}
		$scope.attachOrder = function(e){
			
			//var orderToPallet = e.params.data.id.replace(/(\t\n|\n|\t)/gm, "").substring(0, 4);
			var id = e.params.data.element.value;
			var i=$filter('getByIdFilter')($rootScope.crnt_route, id);
			$rootScope.crnt_route[i].pallet=Number(e.target.id);
			$scope.updatePallet($rootScope.crnt_route[i]);
			var rowIndexForThisPallet = Number($rootScope.crnt_route[i].pallet)%2 ? (5-(Number($rootScope.crnt_route[i].pallet)-1)/2) : (5-(Number($rootScope.crnt_route[i].pallet)-2)/2);
		 	$scope.rowWithOrders[rowIndexForThisPallet]=true;
		}
		$scope.cancelAttachOrder = function(e , id='undefined'){
			if(id == 'undefined')
			{
				id = e.params.data.element.value;
				var i=$filter('getByIdFilter')($rootScope.crnt_route, id);
			}
			else
			{
				var elementToRmv = angular.element('#'+id);
				var i=$filter('getByIdFilter')($rootScope.crnt_route, id);
			}
			
			$rootScope.crnt_route[i].pallet=null;

			connectPOSTService.fn('order/updatepallet',$rootScope.crnt_route[i]).then(function(data) {
				if(elementToRmv)
	     			elementToRmv.remove();
			});
    
		}
		$scope.updatePallet = function(order){
			connectPOSTService.fn('order/updatepallet',order).then(function(data) {
				
			});
		}
		$scope.getId = function(index,location){
			//RUTEL since the third row each select-in-td get an id as the pallet num besides the td with the JACK
			//!location means the right td in row starting from 4 the else result the left td starting from 3 
			return !location ? (2+(4-index))*2 : (2+(4-index))*2-1;
		}
		$scope.isBelongsToPallet = function(orderId){
			var i=$filter('getByIdFilter')($rootScope.crnt_route, orderId);
			return $rootScope.crnt_route[i].pallet != undefined;
		}
		function init(){
			setTimeout(function() {
				$(document).ready(function() {
					$('.js-example-basic-multiple').each(function() {
			    		$(this).select2({
			    			templateResult: function (data, container) {
							    if (data.element && $scope.isBelongsToPallet(data.element.value)) {
							      $(container).addClass("select2-results__selected_yet");
							    }
							    return data.text;
							  }
			    		});
			    		$(this).on('select2:select', $scope.attachOrder);
			    		$(this).on('select2:unselect', $scope.cancelAttachOrder);
					});
					
		
				});
		
		 		$('.select2-container-active').removeClass('select2-container-active');
                $(':focus').blur();
                
				$scope.addExistingSelctns(undefined);
			}, 100); 
			var minRow = 5;
			var truckOrder = PalletsService.initOrderTrack($rootScope.crnt_route);
			for (var i=0; i < truckOrder.length; i++) {
				angular.forEach(truckOrder[i], function(order, key) {
					var index = $filter('getByIdFilter')($rootScope.crnt_route, order.id);
					//RUTEL do not override any pallet-value from the past..
					if($rootScope.crnt_route[index].pallet == undefined)
					{
						//RUTEL we order the truck from the end so if there is a odd-number the table will be full 
						//but in case of even number there is an empty place and it will be in the begining not in the end
						$rootScope.crnt_route[index].pallet = truckOrder.length%2 ? (truckOrder.length-1) - i : (truckOrder.length) - i;
						$scope.updatePallet($rootScope.crnt_route[index]);
					}
					//initialize an indexer boolean array for the repeated rows in order to know if there are orders in this row or rows up or not.
					var rowIndexForThisPallet = Number($rootScope.crnt_route[index].pallet)%2 ? (5-(Number($rootScope.crnt_route[index].pallet)-1)/2) : (5-(Number($rootScope.crnt_route[index].pallet)-2)/2);
					if(rowIndexForThisPallet < 5 && rowIndexForThisPallet >=0 )
					{
						$scope.rowWithOrders[rowIndexForThisPallet]=true;
						if(rowIndexForThisPallet<minRow)
							minRow = rowIndexForThisPallet;
					}	
					$rootScope.crnt_route[index].stop_index = Number($rootScope.crnt_route[index].stop_index);
				});
				$scope.minRow = minRow;	
			}
			
		}
		init();
    }
]);