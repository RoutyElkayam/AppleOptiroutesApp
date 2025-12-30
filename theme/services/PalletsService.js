(function(window, angular, undefined) {
	'use strict';

	angular.module('RouteSpeed.theme').factory('PalletsService', function($rootScope, $http, $filter,connectPOSTService) {
		var PalletsService = {};
		
		PalletsService.initOrderTrack = function(route){

			var truck_volume = Number($rootScope.current_user.estimated_amount_per_surface);
		
			var weight_limit = Number($rootScope.current_user.max_weight_per_surface);
			
			var amount_limit = !isNaN(Number($rootScope.current_user.max_units_per_surface)) ? Number($rootScope.current_user.max_units_per_surface) : 60;//Default 60
		
			var volume_limit = !isNaN(Number($rootScope.current_user.max_volume_per_surface)) ? Number($rootScope.current_user.max_volume_per_surface) : 1600;//Default 60
			
			var truck_order = $rootScope.current_user.truck_order;
		
			var truckOrder = [];
			
			var left = $rootScope.current_user.truck_order ==2 ? true : false;
			
			var ZFull = $rootScope.current_user.truck_order ==3 ? true : false;
		
			var surfacingNumToExportDifferenceNum = 0;
			
			var i = 0;

			function calculatePercentOfSurface(orders,j,max){
				var totalPercent = 0;
				for (var orderIdx = j; orderIdx >= 0; orderIdx--) {
					if(orders[orderIdx].customer_id == orders[j].customer_id)
					totalPercent += orders[orderIdx].amount/PalletsService.getAmountLimit(orders[orderIdx],max,i,left,ZFull,true)*100;
				}
				return totalPercent;
			}

			//RUTEL splitting is only about the amounts so when trying to manage without splitting the orders we check the amount value only
			function trySurfWithNoSplitting(orders,max){
				
				var surf_index = 0;
				
				for (var order_key = 0;order_key < orders.length; surf_index++) {
		
					var surfaces = 0, weight = 0, amount = 0;
		
					
						do{
							if(Number($rootScope.current_user.overloading_per_customer_in_surface)){
								if(!$rootScope.current_user.unloading_from_truck_terminal){
									if( surf_index < (max-Number($rootScope.current_user.surfaces_under_cooling_area)) )
										amount_limit = Number($rootScope.current_user.max_units_per_surface)+Number($rootScope.current_user.overloading_per_customer_in_surface);
									else
										amount_limit = Number($rootScope.current_user.max_units_per_surface);
								}else{
									if( surf_index >= Number($rootScope.current_user.surfaces_under_cooling_area) )
										amount_limit = Number($rootScope.current_user.max_units_per_surface)+Number($rootScope.current_user.overloading_per_customer_in_surface);
									else
										amount_limit = Number($rootScope.current_user.max_units_per_surface);
								}
							}
		
							orders[order_key].amount =Number(orders[order_key].amount);
							//RUTEL if an order is bigger there is no option without splitting-break with high number of surfaces in order to cause splitting in surfaceOrder func.;
							if((amount + orders[order_key].amount) > amount_limit){
								surf_index = max+1;
								break;
							}
																
							amount += orders[order_key].amount;								
							
							order_key++;
		
						}while(order_key < orders.length&&((amount+Number(orders[order_key].amount))<=amount_limit));
						
						if(surf_index >= max)
							break;
				};
				return surf_index;
			}
			
			function surfaceOrder(orders,max,lastSurf,isConsolidation){
				var isOverloading = false;			
				var isSeperateSurface = false;
				var customerSplittingOption = $rootScope.current_user.surf_to_next_surface==1 ? false : true;
				var splittedAmount=0;
				var splittedOrdersNum = 0;
				var specialSurface = orders[0] ? (orders[0].package_name ? orders[0].package_name : orders[0].special_surface) : undefined;
				amount_limit = !isNaN(Number($rootScope.current_user.max_units_per_surface)) ? Number($rootScope.current_user.max_units_per_surface) : 60;//Default 60
				var amountLimitForSingleCustomerSurface = !isNaN(Number($rootScope.current_user.max_units_per_single_customer_surface)) ? Number($rootScope.current_user.max_units_per_single_customer_surface) : 60;//Default 60;
				//Volume limitation
				volume_limit = !isNaN(Number($rootScope.current_user.max_volume_per_surface)) ? Number($rootScope.current_user.max_volume_per_surface) : 1600;//Default 60
				var volumeLimitForSingleCustomerSurface = !isNaN(Number($rootScope.current_user.max_volume_per_single_customer_surface)) ? Number($rootScope.current_user.max_volume_per_single_customer_surface) : 1600;//Default 60;
				//האם להעמיס מקסימום על משטח ולבצע פיצולים של הזמנות לפי כמויות (קרטונים)
				var surf_to_next_surface = Number($rootScope.current_user.surf_to_next_surface);
				//אם אפשר בלי לפצל כמויות והחלוקה תתאים למספר המשטחים במשאית אז לא לפצל הזמנות
				if(!$rootScope.current_user.division_surfaces_by_groups && surf_to_next_surface == 3 && trySurfWithNoSplitting(orders,max)<=max)
					surf_to_next_surface=0;
				
				var prevSurfaceLastCustomer = undefined;
				var customerSplittingsNum = 0;
				var consolidationSurfacesNum = 0;
				var fullPalletColumnName = $rootScope.current_user.titles['full_pallet'];
				var seperateSurfaceOrders = [];
				var firstConsolidationIndex;
				//מיון פריטים לפי כמות מהקטן לגדול
				// Sorting function
				orders.sort((a, b) => {
					// First, sort by stop_index
					if (a.stop_index !== b.stop_index) {
						return a.stop_index - b.stop_index;
					} else {
						// If stop_index is the same, sort by amount
						return a.amount - b.amount;
					}
				});
				//חלוקת ההזמנות במשטחים
				for (var j = orders.length-1; j >= 0; i++) {//i < max &&
		/*
					if(j >= 0&&(Number(orders[j].surfaces)>truck_volume||Number(orders[j].weight)>weight_limit)){
						var weight_pallets = Number(orders[j].weight)/weight_limit;
						var surfaces_pallets = Number(orders[j].surfaces)/truck_volume;
						var pallets_num = surfaces_pallets>weight_pallets?Math.ceil(surfaces_pallets):Math.ceil(weight_pallets);
						for (var p=0; p < pallets_num&&i<max-1; p++,i++) {
						  
						  truckOrder[left?(i%2?i-1:i+1):i] = [orders[j]];
		
							if(i%2&&(lastSurf&&i==max)){
			
								left = !left;
			
							}
						};
						j--;
					}*/
		
					var surfaces = 0, weight = 0, amount = 0, volume = 0, fillingPercent = 0;
		
					var arr = [];

					var nextOrderAmount;var nextOrderAmountLimit;var nextFillingPercent;var currentOrderAmount;
		
					var fullPallet = false;
		
					var fullPalletByItemAmount = false;
		
					var fullPalletCustomerId = undefined;

					var overloadingItemAmount = false;
					
					var currentIndex = left?(i%2?i-1:i+1):(ZFull&&i?(i%2?i+1:i-1):i);
		
					orders = PalletsService.numberOrdersForPallets(orders);
						
						//מלא משטח לפי הגבלות נפח, כמות וכו'
						do{
							if(!orders[j].total_amount && !orders[j].total_weight && !orders[j].total_volume){
								j--;
								continue;
							}
								
							specialSurface = orders[j] ? (orders[j].package_name ? orders[j].package_name : orders[j].special_surface) : undefined;
							//Calculate the precent of a surface for current customer 
							//RUT 26/11/23 הכמות מחושבת לפי אחוזון בעוף טוב החישוב הוא לפי כמות הזמנה חלקי כמות מקסימלית
							//כאשר יש אפשרות של כמות מקסימום שונה בהתאם לסוג אריזה
							var customerPercentOfSurface = calculatePercentOfSurface(orders,j,max);

							//RUT full pallet means a pallet with items of one customer(But it can be multiple orders)
							//FULL PALLET can get from the source orders file(Excell/csv etc.) either from max_volume_per_single_customer_surface definition						
							if(!isConsolidation && !fullPallet && fullPalletColumnName && PalletsService.getOrderDetail(orders[j].orders_details, fullPalletColumnName, orders[j]) != '--'){
								orders[j].seperate_surface = true;
								fullPallet = true;
								fullPalletCustomerId = orders[j].customer_id;
								var currentSurfaceCustomers = [];
								angular.forEach(arr,function(orderCustomer){
									if(!currentSurfaceCustomers.includes(orderCustomer.customer_id))
										currentSurfaceCustomers.push(orderCustomer.customer_id);
								});
								if(arr.length && (currentSurfaceCustomers.length > 1 || currentSurfaceCustomers[0] != orders[j].customer_id) )
									break;
							//לקוח במשטח נפרד בקונסולידציה יהיה מאחורי כל הקונסולידציה ולא תקוע באמצע הסדר
							}else if(isConsolidation && !orders[j].seperate_surface && fullPalletColumnName && PalletsService.getOrderDetail(orders[j].orders_details, fullPalletColumnName, orders[j]) != '--'){
								orders[j].seperate_surface = true;
								seperateSurfaceOrders.push(orders[j]);
								j--;
								continue;
							}
							//FULL PALLET defined by numpack/num wholes
							if(orders[j].order_item && orders[j].order_item.integers_on_surface){
								var estimatedNumOfFullPallets = orders[j].amount / (orders[j].order_item.integers_on_surface);
								// Calculate integer and remainder percentages
								var integerPallets = Math.floor(estimatedNumOfFullPallets);
								if(!integerPallets){
									var remainderPercentage = (estimatedNumOfFullPallets - integerPallets) * 100;
									estimatedNumOfFullPallets = integerPallets + (remainderPercentage >= $rootScope.current_user.percents_for_calculating_surface ? 1 : 0);
								}else{
									estimatedNumOfFullPallets = Math.ceil(estimatedNumOfFullPallets);
								}
								if(estimatedNumOfFullPallets>=1){
									if(!isConsolidation){
										orders[j].full_pallet_item = true;
										fullPalletByItemAmount = true;
		
										if(arr.length)
											break;
									}else if(!orders[j].full_pallet_item){
										orders[j].full_pallet_item = true;
										seperateSurfaceOrders.push(orders[j]);
										j--;
										continue;
									}
								}
								
							}
							//Checking if the surface is a single customer surface and set the amount-limit
							//Setting the amountLimitForSingleCustomerSurface by the special_surface+item_type properties values
							if(!fullPallet || orders[j].seperate_surface){
								amount_limit = PalletsService.getAmountLimit(orders[j],max,i,left,ZFull,false);
								//Setting the amount_limit if a single customer surface
								amountLimitForSingleCustomerSurface = PalletsService.getAmountLimit(orders[j],max,i,left,ZFull,true);
								if(isNaN(Number($rootScope.current_user.max_units_per_single_customer_surface))){
									if(customerPercentOfSurface >= $rootScope.current_user.percents_for_calculating_surface){// && customerPercentOfSurface <= 100
										amount_limit = amountLimitForSingleCustomerSurface;
										fullPallet = true;
										fullPalletCustomerId = orders[j].customer_id;
										var currentSurfaceCustomers = [];
										angular.forEach(arr,function(orderCustomer){
											if(!currentSurfaceCustomers.includes(orderCustomer.customer_id))
												currentSurfaceCustomers.push(orderCustomer.customer_id);
										});
										if(arr.length && (currentSurfaceCustomers.length > 1 || currentSurfaceCustomers[0] != orders[j].customer_id) )
											break;//Here and go to next pallet because of this customer get full pallet
									}
									// else if(customerPercentOfSurface > 100){
									// 	amount_limit = amountLimitForSingleCustomerSurface;
									// }
								}else{
									if(customerPercentOfSurface > 100){
										amount_limit = amountLimitForSingleCustomerSurface;
										fullPallet = true;
										fullPalletCustomerId = orders[j].customer_id;
										var currentSurfaceCustomers = [];
										angular.forEach(arr,function(orderCustomer){
											if(!currentSurfaceCustomers.includes(orderCustomer.customer_id))
												currentSurfaceCustomers.push(orderCustomer.customer_id);
										});
										if(arr.length && (currentSurfaceCustomers.length > 1 || currentSurfaceCustomers[0] != orders[j].customer_id) )
											break;//Here and go to next pallet because of this customer get full pallet
									}
								}
								//RUT volume limitation
								if(isNaN(Number($rootScope.current_user.max_volume_per_surface))){ 
									var specialSurfacVolumeLimitation = $rootScope.current_user.max_volume_per_surface.split(';').find(function(group){
										var typeOfPackage = group.split(',')[0];
										var itemType = group.split(',')[1];
										return typeOfPackage == specialSurface && (!Number(itemType)||itemType == (orders[j].order_item?orders[j].order_item.type:''));
									});
									if(specialSurfacVolumeLimitation)
										volume_limit = Number(specialSurfacVolumeLimitation.split(',')[2]);
								}
								//The first two surfaces get a smaller volume because of the lower cooling area in the truck
								if(Number($rootScope.current_user.surfaces_under_cooling_area)){
									if(!$rootScope.current_user.unloading_from_truck_terminal){
										if( currentIndex < (max-Number($rootScope.current_user.surfaces_under_cooling_area)) )
											volume_limit = volume_limit;
										else
											volume_limit = Number($rootScope.current_user.max_volume_in_cooled_area);
									}else{
										if( currentIndex >= Number($rootScope.current_user.surfaces_under_cooling_area) )
											volume_limit = volume_limit;
										else
											volume_limit = Number($rootScope.current_user.max_volume_in_cooled_area);
									}
								}
								//A volume value to determine the surface of a single customer
								if(isNaN(Number($rootScope.current_user.max_volume_per_single_customer_surface))){
									var specialSurfacVolumeLimitation = $rootScope.current_user.max_volume_per_single_customer_surface.split(';').find(function(group){
										var typeOfPackage = group.split(',')[0];
										var itemType = group.split(',')[1];
										return typeOfPackage == specialSurface && (!Number(itemType)||itemType == (orders[j].order_item?orders[j].order_item.type:''));
									});
									if(specialSurfacVolumeLimitation)
										volumeLimitForSingleCustomerSurface = Number(specialSurfacVolumeLimitation.split(',')[2]);
								}
								//Setting the volume_limit if a single customer surface
								//לקוח עם נפח גדול(לפי ההגדרה מהו נפח גדול לקביעת משטח נפרד עבור הלקוח)
								if((!orders[j].seperate_surface&&!orders[j].full_pallet_item)
								&&((Number(orders[j].total_volume))>=volumeLimitForSingleCustomerSurface)){
									if(!isConsolidation){
										fullPallet = true;
										orders[j].seperate_surface = true;
										fullPalletCustomerId = orders[j].customer_id;
										var currentSurfaceCustomers = [];
										angular.forEach(arr,function(orderCustomer){
											if(!currentSurfaceCustomers.includes(orderCustomer.customer_id))
												currentSurfaceCustomers.push(orderCustomer.customer_id);
										});
										if(arr.length && (currentSurfaceCustomers.length > 1 || currentSurfaceCustomers[0] != orders[j].customer_id) )
											break;//Here and go to next pallet because of this customer get full pallet
									}else if(!orders[j].full_pallet_order_by_full_volume){
										orders[j].full_pallet_order_by_full_volume = true;
										seperateSurfaceOrders.push(orders[j]);
										var customerId = orders[j].customer_id;
										j--;
										while(orders[j] && orders[j].parent_order_item == customerId){
											orders[j].full_pallet_order_by_full_volume = true;
											seperateSurfaceOrders.push(orders[j--]);
										}
										continue;
									}	
								} 
							}else if( fullPallet && (fullPalletCustomerId != orders[j].customer_id) ){
								volume_limit = !isNaN(Number($rootScope.current_user.max_volume_per_surface)) ? Number($rootScope.current_user.max_volume_per_surface) : 1600;//Default 60
								amount_limit = !isNaN(Number($rootScope.current_user.max_units_per_surface)) ? Number($rootScope.current_user.max_units_per_surface) : 60;//Default 60
								weight_limit = Number($rootScope.current_user.max_weight_per_surface);
								fullPallet = false;
								fullPalletCustomerId = undefined;
								break;
							}else if(fullPallet && fullPalletCustomerId == orders[j].customer_id && !fullPalletByItemAmount){
								orders[j].seperate_surface = true;
							}else if(fullPalletByItemAmount){
								fullPalletByItemAmount = false;
								break;
							}
		
							orders[j].is_consolidation = isConsolidation;
		
							orders[j].volume =Number(orders[j].volume);

							currentOrderAmount = surf_to_next_surface==3 || fullPallet || fullPalletByItemAmount || isSeperateSurface || customerSplittingOption ? orders[j].amount : (orders[j].is_parent_item ? orders[j].total_amount : 0);
							
							if(prevSurfaceLastCustomer && orders[j].customer_id != prevSurfaceLastCustomer.customer_id){
								customerSplittingsNum = 0;
							}else if(prevSurfaceLastCustomer){
								if(!arr.length)
									prevSurfaceLastCustomer.splittings_num = !prevSurfaceLastCustomer.splittings_num ? ++customerSplittingsNum : prevSurfaceLastCustomer.splittings_num;
								orders[j].splittings_num = prevSurfaceLastCustomer.splittings_num+1;
							}
		
							orders[j].weight =Number(orders[j].weight);
							
							orders[j].amount =Number(orders[j].amount);
							
							//surfacing_num
							//RUT 18/05/23 פריקה מסוף משאית עדיין אי אפשר לדעת את מספר המשטח רק לאחר משטוח כל ההזמנות יתבצע מספור משטחים
							orders[j].surfacing_num = i+1;//$rootScope.current_user.unloading_from_truck_terminal ? undefined : 
							//RUT לקוח במשטח נפרד לפי עמודה באקסל המגדירה אותו ככזה או לפי מספר שלמים לפריט השווים ליותר ממשטח אחד ברצף ימוספרו באותו מספר בקובץ הייצוא 							
							if($rootScope.current_user.orders_for_pallets){
								if(orders[j].full_pallet_item || orders[j].seperate_surface || orders[j].full_pallet_order_by_full_volume){
									if(prevSurfaceLastCustomer && orders[j].customer_id == prevSurfaceLastCustomer.customer_id){
										//כל משטח כזה יוצר הפרש בין המספר הרגיל למספור לפי לקוח למשטח 
										if(!arr.length)
											surfacingNumToExportDifferenceNum++;
										orders[j].surfacing_num_to_export = (orders[j].surfacing_num-customerSplittingsNum) - (surfacingNumToExportDifferenceNum-1);//פחות ההפרש שנוצר מהנוכחי	
									}else{
										orders[j].surfacing_num_to_export = orders[j].surfacing_num - surfacingNumToExportDifferenceNum;
									}
								}else if(orders[j].is_consolidation && firstConsolidationIndex){
									//כל אחד כזה יוצר הפרש בין המספר הרגיל למספור לפי לקוח למשטח 
									if(!arr.length)
										surfacingNumToExportDifferenceNum++;
									orders[j].surfacing_num_to_export = (orders[j].surfacing_num-consolidationSurfacesNum) - (surfacingNumToExportDifferenceNum-1);//..פחות ההפרש שנוצר מהנוכחי
								}else{
									orders[j].surfacing_num_to_export = orders[j].surfacing_num - surfacingNumToExportDifferenceNum;
								}
							}else{
								orders[j].surfacing_num_to_export = orders[j].surfacing_num;
							}

							//splittings
							overloadingItemAmount = orders[j].amount > amount_limit ? true : false;
							if( ( overloadingItemAmount || surf_to_next_surface==3 ) && ( ((amount+splittedAmount)>amount_limit) || (!splittedAmount && (amount+orders[j].amount)>amount_limit) ) )
							{
								if(amount_limit-amount>0)								
								{
									splittedAmount=!splittedAmount ? orders[j].amount-(amount_limit-amount) : splittedAmount-(amount_limit-amount);
									splittedOrdersNum++;
									orders[j].is_splitted_amount = true;
									arr.unshift({...orders[j]});
									arr[0].amount=amount_limit-amount;	
									arr[0].splittings_num = splittedOrdersNum;	
									arr[0].is_splitted_amount = true;			
									amount += amount_limit-amount;	
									fillingPercent += ((amount_limit-amount)/amount_limit)*100;							
								}
								//overloading
								if(i==(max-1))
									arr[0].is_overloaded = 1;
								
									break;
							}
									
							orders[j].surfaces =Number(orders[j].surfaces);
							
							if(splittedAmount)
							{
								splittedOrdersNum++;
								orders[j].is_splitted_amount = true;
								arr.unshift({...orders[j]});
								arr[0].amount=splittedAmount;
								arr[0].splittings_num = splittedOrdersNum;
								arr[0].is_splitted_amount = true;	
								amount += splittedAmount;
								fillingPercent += (splittedAmount/amount_limit)*100;
								splittedAmount=0;
								splittedOrdersNum=0;
								if(overloadingItemAmount)
									overloadingItemAmount = false;
							}
							else{
								arr.unshift(orders[j]);
								amount += currentOrderAmount;
								fillingPercent += (currentOrderAmount/amount_limit)*100;
							}
							//overloading
							if(i==(max-1) && amount > amount_limit){
								arr[0].is_overloaded = 1;
								isOverloading = true;
							}
								
							//			
							surfaces += orders[j].surfaces;
		
							weight += surf_to_next_surface==3 || fullPallet || fullPalletByItemAmount || isSeperateSurface || customerSplittingOption ? orders[j].weight : (orders[j].is_parent_item ? orders[j].total_weight : 0);
		
							volume += surf_to_next_surface==3 || fullPallet || fullPalletByItemAmount || isSeperateSurface || customerSplittingOption ? orders[j].volume : (orders[j].is_parent_item ? orders[j].total_volume : 0);	
									
							// fillingPercent += (currentOrderAmount/amount_limit)*100;
							
							j--;

							if(j>=0){
								nextOrderAmountLimit = PalletsService.getAmountLimit(orders[j],max,i,left,ZFull,customerPercentOfSurface>100);
								nextOrderAmount = fullPallet || fullPalletByItemAmount || isSeperateSurface || customerSplittingOption ? Number(orders[j].amount) : (orders[j].is_parent_item ? Number(orders[j].total_amount) : 0);
								nextFillingPercent = (nextOrderAmount/nextOrderAmountLimit)*100;
							}

						}while(j >= 0&&(surf_to_next_surface==3 
							|| ( ((surfaces+Number(orders[j].surfaces))<truck_volume)
							&&((fillingPercent+nextFillingPercent)<=100)
							&&((weight+(fullPallet || fullPalletByItemAmount || isSeperateSurface || customerSplittingOption ? Number(orders[j].weight) : (Number(orders[j].total_weight))))<weight_limit)
							&&((volume+(fullPallet || fullPalletByItemAmount || isSeperateSurface || customerSplittingOption ? Number(orders[j].volume) : (Number(orders[j].total_volume))))<volume_limit) )
							||i == (max-1)));
						//סגור משטח	
		
					//מיקום המשטח במשאית		
					if(arr.length){
						//initialize the lastCustomer
						prevSurfaceLastCustomer = arr[0];
						//surface order - heavy down
		
						if($rootScope.current_user.surface_order==2)
		
							arr.sort(function(a, b) { return  b.surfaces - a.surfaces; });
						
						//RUT 28/06/23 All customers are interested in this order inside the pallet - first order is first in the pallet and so on
						//arr = arr.reverse();
		
						//RUT ZFull = truck_order 3, means Z order without spaces so makeing sure here that will not be a space(space is caused by odd number of "max")
						if(ZFull && max%2 == 0)
							left = true;
						var currentIndex = left?(i%2?i-1:i+1):(ZFull&&i?(i%2?i+1:i-1):i);
						if((isConsolidation || arr[0].is_consolidation)){
							consolidationSurfacesNum++;
							if(!firstConsolidationIndex)
								firstConsolidationIndex = currentIndex;
						}
						//overloading warning
						if(i>=max){
							arr[0].is_overloaded = 1;
						}
						//במקרה של פריקה מסוף משאית שינוי סדר הריצה מהסוף להתחלה לכן השינוי הנוכחי
						//כיון שנוצרה בעיה במקרה של משטח נפרד לאחר קונסולידציה
						if(isSeperateSurface && firstConsolidationIndex){
							arr.surfacing_num = truckOrder[firstConsolidationIndex].length ? truckOrder[firstConsolidationIndex][0].surfacing_num : truckOrder[firstConsolidationIndex].surfacing_num;
							arr.surfacing_num_to_export = truckOrder[firstConsolidationIndex].length ? truckOrder[firstConsolidationIndex][0].surfacing_num_to_export : truckOrder[firstConsolidationIndex].surfacing_num_to_export;
							angular.forEach(arr,function(orderItem){
								orderItem.surfacing_num = arr.surfacing_num;
								orderItem.surfacing_num_to_export = arr.surfacing_num_to_export;
							});	
							for (var consolidationIndex = firstConsolidationIndex; consolidationIndex < truckOrder.length; consolidationIndex++) {
								if(truckOrder[consolidationIndex]){
									if(truckOrder[consolidationIndex].surfacing_num)
										truckOrder[consolidationIndex].surfacing_num = truckOrder[consolidationIndex].surfacing_num+1;
									if(truckOrder[consolidationIndex].surfacing_num_to_export)	
										truckOrder[consolidationIndex].surfacing_num_to_export = truckOrder[consolidationIndex].surfacing_num_to_export+1;
									angular.forEach(truckOrder[consolidationIndex],function(consolidationItem){
										if(consolidationItem.surfacing_num)
											consolidationItem.surfacing_num = consolidationItem.surfacing_num+1;
										if(consolidationItem.surfacing_num_to_export)
											consolidationItem.surfacing_num_to_export = consolidationItem.surfacing_num_to_export+1;
									});	
								} 
							}
							truckOrder = truckOrder.slice(0, firstConsolidationIndex).concat([arr]).concat(truckOrder.slice(firstConsolidationIndex));
						}else{
							truckOrder[currentIndex] = arr;
						}	
						//truckOrder[left?(i%2?i-1:i+1):i] = arr;
		
						if(i%2&&(lastSurf&&i==max)){
		
							left = !left;
		
						}
					}else{
						i--;
					}
					//בקונסולידציה משטחים נפרדים כמו רמי לוי וכו יהיומאחורי כל הקונסולידציה שחייבת להיות ממש בתחילת המשאית
					if(j == -1){
						if(seperateSurfaceOrders.length){
							isSeperateSurface = true;
							isConsolidation = false;
							orders = seperateSurfaceOrders;
							j = orders.length-1;
							seperateSurfaceOrders = [];
							// if(lastSurf&&(i==(max-1))){
							// 	i--;
							// }
						}
					}
		
				};
				// if(lastSurf&&(i==max)){
				// 	i--;
				// }
				
		
			}
			
			function specialSurfaceOrder(arr,max){
				
				var categories = arr.filter(a=>{return a.special_surface;});
				var isConsolidation  = false;
				var consolidationGroups = $rootScope.current_user.consolidation_group ? $rootScope.current_user.consolidation_group.split(',') : undefined;
				arr = arr.filter(a=>{return !a.special_surface;});
				
				if($rootScope.current_user.division_surfaces_by_groups){
					categories = categories.reduce(function(r, obj){
						//var k = PalletsService.getOrderDetail(obj.orders_details, 'משטח מיוחד');  
						//if (r[k] || (r[k]=[])) r[k].push(obj);
						//RUTEL special_surface is not in remarks and orders_details, it is an attribute of an order obj.
						var group = $rootScope.current_user.division_surfaces_by_groups.split(";").find(function(group){ return  group.includes(obj.special_surface.toString()) });		    
						if (r[group] || (r[group]=[])) r[group].push(obj);
						return r;
					}, []);
					var keysInOrder = $rootScope.current_user.division_surfaces_by_groups.split(";");
					if(!$rootScope.current_user.unloading_from_truck_terminal){
						keysInOrder = keysInOrder.reverse();
					}
					for(var i = 0; i < keysInOrder.length; i++){
						var key = keysInOrder[i];
						if(categories[key]){
							isConsolidation  = false;
							if(consolidationGroups){
								for(var indexGroup=0;indexGroup<consolidationGroups.length;indexGroup++){
									if(categories[key][0].special_surface == consolidationGroups[indexGroup])
										isConsolidation = true;
								}
							}
							surfaceOrder(categories[key],max,true,isConsolidation);
							if(i==max){
								i--;
							}
						}
					}
				}else{
					if(consolidationGroups){
						for(var indexGroup=0;indexGroup<consolidationGroups.length;indexGroup++){
							if(PalletsService.getOrderDetail(arr[0].orders_details, 'תאור קבוצה', arr[0]) == consolidationGroups[indexGroup])
								isConsolidation = true;
						}
					}
				}
		
				
				surfaceOrder(arr,max,false,isConsolidation);
				
			}
		
			var maxSurfaces = route.max_surfaces ? route.max_surfaces : 11;
			if(!$rootScope.current_user.division_surfaces_by_groups && route.order.filter(function(item) {return PalletsService.getOrderDetail(item.orders_details, 'תאור קבוצה', item)!='--'}).length){
				var cooled = route.order.filter(function(item) {
		
					return PalletsService.getOrderDetail(item.orders_details, 'תאור קבוצה', item).includes('מצונן')&&!PalletsService.getOrderDetail(item.orders_details, 'תאור קבוצה', item).includes('קפוא');
		
				});
		
				var frozen = route.order.filter(function(item) {
		
					return PalletsService.getOrderDetail(item.orders_details, 'תאור קבוצה', item).includes('קפוא');
		
				});
				
				
				if(!$rootScope.current_user.unloading_from_truck_terminal){//if defined Discharge from rear door - פריקה מדלת אחורית
					specialSurfaceOrder(cooled,11);
					
					specialSurfaceOrder(frozen,9);
				}
				else{
					specialSurfaceOrder(frozen,9);
				
					specialSurfaceOrder(cooled,11);
				}		
				
			}else{
				
				specialSurfaceOrder(route.order,maxSurfaces);
				
			}
			//RUT 03/09/23 spacing by customer and sort pallets by stop-indexes
			if(isNaN(Number($rootScope.current_user.max_units_per_surface))){
				//If there is space in the truck try spacing by customer per surface
				if(i<maxSurfaces-1)
					truckOrder = PalletsService.spacing(maxSurfaces,truckOrder,i);
				//RUT 10/03/24 sort by unloading order
				truckOrder.sort(function(a,b){
					if(a && a.length && b && b.length)
						return b[0].stop_index - a[0].stop_index;
					return -1;
				});
				var tmpTruckOrder = [];
				angular.forEach(truckOrder,function(pallet,keyPallet)  {
					if(ZFull && maxSurfaces%2 == 0)
						left = true;
					var currentIndex = left?(keyPallet%2?keyPallet-1:keyPallet+1):(ZFull&&keyPallet?(keyPallet%2?keyPallet+1:keyPallet-1):keyPallet);
					pallet.surfacing_num = keyPallet+1;
					pallet.surfacing_num_to_export = keyPallet+1;
					angular.forEach(pallet,function(orderInPallet){
						orderInPallet.surfacing_num = keyPallet+1;
						orderInPallet.surfacing_num_to_export = keyPallet+1;
					});
					tmpTruckOrder[currentIndex] = pallet;
				});
				truckOrder = tmpTruckOrder;
			}

			if($rootScope.current_user.truck_order ==3){//Z-full put undefined valus in spaces in truck
				for (var i=0; i < maxSurfaces; i++) {
				  if(truckOrder[i] == undefined)
					  truckOrder[i] = [];
				};
			}
			//unloading from truck-terminal(Jack)
			if(!$rootScope.current_user.unloading_from_truck_terminal){
				truckOrder = truckOrder.reverse();
				//var surfacing_num = 1;
				angular.forEach(truckOrder,function(suracedOrders,keyPallet){
					angular.forEach(suracedOrders,function(order,keyOrder){
						truckOrder[keyPallet][keyOrder].surfacing_num = order.surfacing_num = truckOrder.length-(order.surfacing_num)+1;
						truckOrder[keyPallet][keyOrder].surfacing_num_to_export = order.surfacing_num_to_export = truckOrder.length-(order.surfacing_num_to_export)+1;
					});
					//surfacing_num++;
				});
			}
		
			//type of cars - order of pallets
			if(route.car && route.car.type){
				switch (route.car.type) {	
				//two doors	
				case 'td':	
					var tmpSurface = truckOrder[maxSurfaces-1];
					truckOrder[maxSurfaces-1] = truckOrder[maxSurfaces-3];
					truckOrder[maxSurfaces-3] = tmpSurface;
					
					tmpSurface = truckOrder[maxSurfaces-4];
					truckOrder[maxSurfaces-4] = truckOrder[maxSurfaces-2];
					truckOrder[maxSurfaces-2] = tmpSurface;
					break;	
				//two sided unloading	
				case 'ts':
					var tmpSurface = truckOrder[maxSurfaces-1];
					truckOrder[maxSurfaces-1] = truckOrder[maxSurfaces-6];
					truckOrder[maxSurfaces-6] = tmpSurface;
													
					tmpSurface = truckOrder[maxSurfaces-4];
					truckOrder[maxSurfaces-4] = truckOrder[maxSurfaces-6];
					truckOrder[maxSurfaces-6] = tmpSurface;
					
					tmpSurface = truckOrder[maxSurfaces-2];
					truckOrder[maxSurfaces-2] = truckOrder[maxSurfaces-6];
					truckOrder[maxSurfaces-6] = tmpSurface;
					
					tmpSurface = truckOrder[maxSurfaces-3];
					truckOrder[maxSurfaces-3] = truckOrder[maxSurfaces-7];
					truckOrder[maxSurfaces-7] = tmpSurface;
					break;					
				}		
			}
			
			return truckOrder;
		
		}
		PalletsService.deleteSurface = function(index,truckOrder,draggingRef=false){
            var left = $rootScope.current_user.truck_order == 2;
            var ZFull = $rootScope.current_user.truck_order == 3;
            // Push the new value to the specified index
            var surfacingNum = truckOrder[index].surfacing_num ? truckOrder[index].surfacing_num 
                                : (truckOrder[index].length&&truckOrder[index][0]&&truckOrder[index][0].surfacing_num ? truckOrder[index][0].surfacing_num : undefined);
            //var requestedSurfacingNum = surfacingNum+1;
            var requestedSurfacingNumIndex = $filter('getBySurfacingNum')(truckOrder, surfacingNum);
            if(requestedSurfacingNumIndex > -1){
				truckOrder.splice(requestedSurfacingNumIndex, 1);
                var tmpTruckOrder = [];
                angular.forEach(truckOrder,function(list,key){
                    var curSurfacingNum = list&&list.length&&list[0]&&list[0].surfacing_num ? list[0].surfacing_num : (list&&list.surfacing_num ? list.surfacing_num : undefined);
                    if(curSurfacingNum && curSurfacingNum > surfacingNum){
                        if(list){
							if(draggingRef)//Putting surfacing_num on array in lists made bugs while spacing, so only while referenced from dragging
								list.surfacing_num = curSurfacingNum-1;
                            angular.forEach(list,function(order){
                                order.surfacing_num = curSurfacingNum-1;
								order.surfacing_num_to_export = order.surfacing_num;
                            });
                        }
                        if(left || ZFull){
                            var i = curSurfacingNum-2;//(-1-1)The initalization of surfacing_num is of i+1 so that sub the 1 now for getting the same below expression 
                            tmpTruckOrder[left?(i%2?i-1:i+1):(ZFull&&i?(i%2?i+1:i-1):i)] = list;				
                        }
                    }else if(left || ZFull){
                        var i = curSurfacingNum-1;//The initalization of surfacing_num is of i+1 so that sub the 1 now for getting the same below expression 
                        tmpTruckOrder[left?(i%2?i-1:i+1):(ZFull&&i?(i%2?i+1:i-1):i)] = list;	
                    }
                });				
                if(left || ZFull){
                    for (var i=0; i < tmpTruckOrder.length; i++) {
                        if(tmpTruckOrder[i] == undefined)
                        tmpTruckOrder[i] = [];
                    };
                    truckOrder = tmpTruckOrder;
                }
            }
            return truckOrder;
        }
        PalletsService.addSurfaceBelow = function(currentSurface,truckOrder,orders,draggingRef=false){
            var left = $rootScope.current_user.truck_order == 2;
            var ZFull = $rootScope.current_user.truck_order == 3;
            // Push the new value to the specified index
			var surfacingNum = truckOrder[currentSurface] && ((truckOrder[currentSurface][0] && truckOrder[currentSurface][0].surfacing_num) || (draggingRef && truckOrder[currentSurface].surfacing_num));
            if(!surfacingNum)
				return truckOrder;
			var requestedSurfacingNum = surfacingNum+1;
            var requestedSurfacingNumIndex = $filter('getBySurfacingNum')(truckOrder, requestedSurfacingNum);
            if(requestedSurfacingNumIndex == -1){
				var i = requestedSurfacingNum-1;//The initalization of surfacing_num is of i+1 so that sub the 1 now for getting the same below expression 
				requestedSurfacingNumIndex = left?(i%2?i-1:i+1):(ZFull&&i?(i%2?i+1:i-1):i);
				// if(left)
				// 	requestedSurfacingNum = !requestedSurfacingNumIndex%2 ? requestedSurfacingNumIndex+2 : requestedSurfacingNumIndex;
			}
			if(requestedSurfacingNumIndex > -1){
                var constKeys = [];
                if(left || ZFull){
                    angular.forEach(truckOrder,function(list,key){
                        var curSurfacingNum =  list && ((list[0]&&list[0].surfacing_num) || list.surfacing_num);
                        if(curSurfacingNum < requestedSurfacingNum){
                            truckOrder[key].old_key = key;
                            constKeys.push(key);
                        }else if(list){
							list.old_key = undefined;
						}
                            
                    });
                }
                var curSurfaceOrders = [];
				curSurfaceOrders.surfacing_num = requestedSurfacingNum;
                angular.forEach(orders,function(order){
					if(order){
						order.surfacing_num = requestedSurfacingNum;
						order.surfacing_num_to_export = requestedSurfacingNum;
						curSurfaceOrders.push(order);
					}else{
						console.log(order);
					}
                    
                });
				//Ruth 30/04/24 splice push to  the last sequencly index possible if the requested one is bigger and we want exactly one
				if(Math.max.apply(null,Object.keys(truckOrder))+1 < requestedSurfacingNumIndex)
					truckOrder[requestedSurfacingNumIndex] = curSurfaceOrders;
				else
					truckOrder.splice(requestedSurfacingNumIndex, 0, curSurfaceOrders);

                constKeys.push(requestedSurfacingNumIndex);
                
                var tmpTruckOrder = [];
                angular.forEach(truckOrder,function(list,key){
                    var curSurfacingNum =  list && ((list[0]&&list[0].surfacing_num) || list.surfacing_num);
                    if(curSurfacingNum){
						if(key != requestedSurfacingNumIndex && curSurfacingNum && curSurfacingNum >= requestedSurfacingNum){
							if(draggingRef)//Put surfacing_num on array in lists made bugs while spacing, so only while referenced from dragging
								list.surfacing_num = curSurfacingNum+1;
							if(!list.length){
								
							}else{
								angular.forEach(list,function(order){
									order.surfacing_num = curSurfacingNum+1;
									order.surfacing_num_to_export = order.surfacing_num;
								});
							}
							if(left || ZFull){
								if(list&&!list.old_key){
									var i = curSurfacingNum;//The initalization of surfacing_num is of i+1 so that sub the 1 now for getting the same below expression 
									var tmpIndex = left?(i%2?i-1:i+1):(ZFull&&i?(i%2?i+1:i-1):i);
									var constkeysDiff = 0;
									while(constKeys.indexOf(tmpIndex) !== -1 && (tmpIndex+constkeysDiff)<truckOrder.length){
										constkeysDiff++;
										tmpIndex = tmpIndex+constkeysDiff;
									}
									tmpTruckOrder[tmpIndex] = list;	
								}else if(list){
									tmpTruckOrder[list.old_key] = list;
								}				
							}
						}else if(left || ZFull){
							if(list&&!list.old_key){
								tmpTruckOrder[key] = list;	
							}else if(list){
								tmpTruckOrder[list.old_key] = list;
							}	
						}
					}
                });				
                if(left || ZFull){
                    for (var i=0; i < tmpTruckOrder.length; i++) {
                        if(tmpTruckOrder[i] == undefined)
                        tmpTruckOrder[i] = [];
                    };
                    truckOrder = tmpTruckOrder;
                }
            }
            return truckOrder;
    
        }
        //While manual pallet arrangement referrence, should create truckOrder array by orders saved data like surfacing_indexqsurfacing_num etc.
        PalletsService.numberOrdersForPallets = function  (orders) {
			if(!orders.length)
	
				return orders;
	
			var customers_ids = [];
	
			var groups = [];
	
			var j=0;
	
			var prevOrderGroup = null;
	
			var groupIndex;
	
			var splittings_num;
	
			angular.forEach(orders, function(order, key) {
				if(!customers_ids.includes(order.customer_id)||!order.customer_id){
						splittings_num = 0;
	
						if(order.customer_id){
						 	splittings_num = order.splittings_num ? order.splittings_num : 0;
						
						if($rootScope.current_user.split_order_by_group){
							var sub_orders = orders.filter(function(item) {return item.customer_id == order.customer_id&&item.original_address == order.original_address;});
							groups = [];
							var sumAmount = Number(order.amount);
							var sumWeight = Number(order.weight);
							var sumVolume = Number(order.volume);
							var sumItems = 1;
							angular.forEach(sub_orders, function(sub_order, key_sub) {
								if(!groups.includes(sub_order.group)){
									var sub_orders_this_group = orders.filter(function(item) {return item.customer_id == sub_order.customer_id&&item.original_address == sub_order.original_address&&item.id != sub_order.id&&item.group == sub_order.group;});
	
									angular.forEach(sub_orders_this_group, function(sub_order_this_group, key_sub) {
		
										if(sub_order_this_group.is_parent_item)
											sub_order_this_group.is_parent_item = false;
										sub_order_this_group.parent_order_item = sub_order.customer_id;
		
										//sub_order_this_group.stop_index = j;
		
										sub_order_this_group.display = sub_order.open;
										splittings_num = !splittings_num && sub_order_this_group.surfacing_num == order.surfacing_num && sub_order_this_group.splittings_num ? sub_order_this_group.splittings_num : splittings_num; 
										sumAmount += sub_order_this_group.amount;
										sumWeight += sub_order_this_group.weight;
										sumVolume += sub_order_this_group.volume;
										sumItems ++;
		
									});
		
									sub_order.is_parent_item = true;
									sub_order.splittings_num = splittings_num;
									sub_order.total_amount = sumAmount;
									sub_order.total_weight = sumWeight;
									sub_order.total_volume = sumVolume;
									sub_order.total_items = sumItems;
									//RUT 08/11/23 update total amount/weight/volume of this customer for all sub orders for limitations calc.
									angular.forEach(sub_orders_this_group, function(sub_order_this_group, key_sub) {
										sub_order_this_group.total_amount = sumAmount;
										sub_order_this_group.total_weight = sumWeight;
										sub_order_this_group.total_volume = sumVolume;
									});
									//Rut In order to display the address details also if is_parent_item and also if not but is the only order for this customer in current route.
									if(sub_order.parent_order_item)
										sub_order.parent_order_item = undefined;
								}
	
								groups.push(sub_order.group);
	
							});
						}else{
							var sub_orders = orders.filter(function(item) {return item.customer_id == order.customer_id&&item.original_address == order.original_address&&item.id != order.id;});
	
							var sumAmount = Number(order.amount);
							var sumWeight = Number(order.weight);
							var sumVolume = Number(order.volume);
							var sumItems = 1;
							angular.forEach(sub_orders, function(sub_order, key_sub) {
	
								if(sub_order.is_parent_item)
									sub_order.is_parent_item = false;
								sub_order.parent_order_item = order.customer_id;
	
								//sub_order.stop_index = j;
	
								sub_order.display = order.open;
								splittings_num = !splittings_num && sub_order.surfacing_num == order.surfacing_num && sub_order.splittings_num ? sub_order.splittings_num : splittings_num;
								sumAmount += sub_order.amount;
								sumWeight += sub_order.weight;
								sumVolume += sub_order.volume;
								sumItems ++;
	
							});
	
							order.is_parent_item = true;
							order.splittings_num = splittings_num;
							order.total_amount = sumAmount;
							order.total_weight = sumWeight;
							order.total_volume = sumVolume;
							order.total_items = sumItems;
							//RUT 08/11/23 update total amount/weight/volume of this customer for all sub orders for limitations calc.
							angular.forEach(sub_orders, function(sub_order, key_sub) {
								sub_order.total_amount = sumAmount;
								sub_order.total_weight = sumWeight;
								sub_order.total_volume = sumVolume;
							});
							//Rut In order to display the address details also if is_parent_item and also if not but is the only order for this customer in current route.
							if(order.parent_order_item)
								order.parent_order_item = undefined;
						}
						}
	
	
					//order.stop_index = j++;
	
					customers_ids.push(order.customer_id);
	
				}
	
			});	
	
			return orders;
	
		}
        
        PalletsService.getSavedTruckOrder = function(route){
			var truckOrder = [];
			var maxSurface = 0;
			var curOrder = {};
			angular.forEach(route.order,function(order,key){
				if(!order.is_splitted_amount){
					if(!truckOrder[order.surfacing_index]){
						truckOrder[order.surfacing_index] = [];
					}
					truckOrder[order.surfacing_index].push({...order});
	
					if(order.surfacing_index>maxSurface){
						maxSurface = order.surfacing_index;
					}
				}else{
					angular.forEach(order.orders_splits,function(order_split){
						if(!truckOrder[order_split.surfacing_index]){
							truckOrder[order_split.surfacing_index] = [];
						}
						curOrder = route[key];
						curOrder.amount = order_split.amount;
						curOrder.surfacing_num = order_split.surfacing_num;
						curOrder.surfacing_num_to_export = curOrder.surfacing_num;
						curOrder.order_split_id = order_split.id;
						curOrder.splittings_num = order.orders_splits.length;
						truckOrder[order_split.surfacing_index].push({...curOrder});
		
						if(order_split.surfacing_index>maxSurface){
							maxSurface = order_split.surfacing_index;
						}
					});
				}
				
			});
			for (var i=0; i < maxSurface; i++) {
				if(truckOrder[i] == undefined)
					truckOrder[i] = [];
					//truckOrder[i] = undefined;
			};

			return truckOrder;

		}
        
        PalletsService.getAmountLimit = function(order,max,currentIndex,left,ZFull,singleCustomer=false){
			var amount_limit=Number.MAX_SAFE_INTEGER;
			var specialSurface = order ? (order.package_name ? order.package_name : order.special_surface) : undefined;
			if(singleCustomer){
				if(isNaN(Number($rootScope.current_user.max_units_per_single_customer_surface))){
					var specialSurfacUnitLimitation = $rootScope.current_user.max_units_per_single_customer_surface.split(';').find(function(group){
						var typeOfPackage = group.split(',')[0];
						var itemType = group.split(',')[1];
						return typeOfPackage == specialSurface && (!Number(itemType)||itemType == (order.order_item?order.order_item.type:''));
					});
					if(specialSurfacUnitLimitation){
						var maxUnitLimitation = Number(specialSurfacUnitLimitation.split(',')[2]);
						if(order.total_amount > maxUnitLimitation)
							amount_limit = Number(specialSurfacUnitLimitation.split(',')[3]);//without an additional floor in the surface 
						else
							amount_limit = maxUnitLimitation;//an additional floor in pallet
					}
							
				}else if(Number($rootScope.current_user.overloading_per_customer_in_surface)){
					if(!$rootScope.current_user.unloading_from_truck_terminal){
						var currentsurface = left?(currentIndex%2?currentIndex-1:currentIndex+1):(ZFull&&currentIndex?(currentIndex%2?currentIndex+1:currentIndex-1):currentIndex);
						if( currentsurface < (max-Number($rootScope.current_user.surfaces_under_cooling_area)) )
							amount_limit = Number($rootScope.current_user.max_units_per_single_customer_surface)+Number($rootScope.current_user.overloading_per_customer_in_surface);
						else
							amount_limit = Number($rootScope.current_user.max_units_per_single_customer_surface);
					}else{
						if( currentsurface >= Number($rootScope.current_user.surfaces_under_cooling_area) )
							amount_limit = Number($rootScope.current_user.max_units_per_single_customer_surface)+Number($rootScope.current_user.overloading_per_customer_in_surface);
						else
							amount_limit = Number($rootScope.current_user.max_units_per_single_customer_surface);
					}
				}
			}else{
				if(isNaN(Number($rootScope.current_user.max_units_per_surface))){
					var specialSurfacUnitLimitation = $rootScope.current_user.max_units_per_surface.split(';').find(function(group){
						var typeOfPackage = group.split(',')[0];
						var itemType = group.split(',')[1];
						return typeOfPackage == specialSurface && (!Number(itemType)||itemType == (order.order_item?order.order_item.type:''));
					});
					if(specialSurfacUnitLimitation)
						amount_limit = Number(specialSurfacUnitLimitation.split(',')[2]);
				}else{
					amount_limit = Number($rootScope.current_user.max_units_per_surface);
					var currentsurface = left?(currentIndex%2?currentIndex-1:currentIndex+1):(ZFull&&currentIndex?(currentIndex%2?currentIndex+1:currentIndex-1):currentIndex);
					if(Number($rootScope.current_user.overloading_per_customer_in_surface)){
						if(!$rootScope.current_user.unloading_from_truck_terminal){
							if( currentsurface < (max-Number($rootScope.current_user.surfaces_under_cooling_area)) )
								amount_limit = Number($rootScope.current_user.max_units_per_surface)+Number($rootScope.current_user.overloading_per_customer_in_surface);
							else
								amount_limit = Number($rootScope.current_user.max_units_per_surface);
						}else{
							if( currentsurface >= Number($rootScope.current_user.surfaces_under_cooling_area) )
								amount_limit = Number($rootScope.current_user.max_units_per_surface)+Number($rootScope.current_user.overloading_per_customer_in_surface);
							else
								amount_limit = Number($rootScope.current_user.max_units_per_surface);
						}
					}
				}
			}
			return amount_limit;
		}
		  
		PalletsService.spacing = function(max,truckOrder,surfacesNumber){
            var left = $rootScope.current_user.truck_order == 2;
            var ZFull = $rootScope.current_user.truck_order == 3;
			var space = true;
			//	איחוד הזמנה שפוצלה ל2 משטחים והוצאתה למשטח חדש משני המשטחים.
			var deletedSurfaces = 0;
            var newTruckOrder = angular.copy(truckOrder);
			angular.forEach(newTruckOrder,function(list,key){
				if(list)
					list.original_key = key;
			});
			var curSurfaceKey2 = 0;
			angular.forEach(truckOrder,function(curSurfaceOrders,curSurfaceKey){
				curSurfaceKey2 = curSurfaceKey;
				angular.forEach(newTruckOrder,function(list,keyList){ 
					if(list && list.original_key == curSurfaceKey)
					curSurfaceKey2 = keyList;
				});
				angular.forEach(curSurfaceOrders,function(order){
					//תמיד צריך לבדוק אם יש יותר מלקוח אחד במשטח אחרת זה כבר סודר בסדר
					if(order.splittings_num==1  && newTruckOrder[curSurfaceKey2] && newTruckOrder[curSurfaceKey2].length && groupBy(newTruckOrder[curSurfaceKey2],'customer_id').length>1){
						if(space && surfacesNumber < max){
							//יש אפשרות של כמות ככ גדולה של יותר ממשטח אחד צריך לבדוק שיש ספייס לכך אחרת יתבצע רק עבור משטח אחד שזה וודאי יש
                            var amount_limit = PalletsService.getAmountLimit(order,max,curSurfaceKey,left,ZFull,true);
                            
							var orders = [];
							var innerSurfaceKey2 = 0;
							angular.forEach(truckOrder,function(innerSurfaceOrders,innerSurfaceKey){
								innerSurfaceKey2 = innerSurfaceKey;
								angular.forEach(newTruckOrder,function(list,keyList){ 
									if(list && list.original_key == innerSurfaceKey)
										innerSurfaceKey2 = keyList;
								});
								
								angular.forEach(innerSurfaceOrders,function(order2){
									if(order2.customer_id == order.customer_id && order2.special_surface == order.special_surface  && newTruckOrder[innerSurfaceKey2] && newTruckOrder[innerSurfaceKey2].length && (groupBy(newTruckOrder[innerSurfaceKey2],'customer_id').length>1 || order2.amount+order.amount<=amount_limit) ){
										order2.splittings_num = 0;
										orders.push(order2);
										var indexToRemove = $filter('getByIdFilter')(newTruckOrder[innerSurfaceKey2], order2.id);
										if(indexToRemove>-1){
											newTruckOrder[innerSurfaceKey2].surfacing_num = newTruckOrder[innerSurfaceKey2][indexToRemove].surfacing_num;
											newTruckOrder[innerSurfaceKey2].splice(indexToRemove, 1);
										}
									}	
								});
								if(newTruckOrder[innerSurfaceKey2] && !newTruckOrder[innerSurfaceKey2].length){
										newTruckOrder = PalletsService.deleteSurface(innerSurfaceKey2,newTruckOrder);
										surfacesNumber--;
								}
							});

							var customerSurfaces = Math.ceil(order.total_amount/amount_limit);
							if(customerSurfaces > 1 && customerSurfaces <= (max-surfacesNumber) && orders.length){
								var amount = 0; var j = 0; var customerCurrentSurfaceOrders;
								for (var index = 0; index < customerSurfaces; index++) {
									customerCurrentSurfaceOrders = [];
									if(orders[j]){
										do {
											amount += orders[j].amount;
											customerCurrentSurfaceOrders.push(orders[j++]);
										} while (orders[j] && amount+orders[j].amount < amount_limit);
										amount = 0;
										newTruckOrder = PalletsService.addSurfaceBelow(curSurfaceKey2,newTruckOrder,customerCurrentSurfaceOrders);
										surfacesNumber++;
									}
																		
								}
							}else{
								//להוסיף אופציה שהמשטח הבא מכיל את splittings_num 2 ואם כן רק לקחת מפה ולהעביר לשם..
                                newTruckOrder = PalletsService.addSurfaceBelow(curSurfaceKey2,newTruckOrder,orders)
								surfacesNumber++;
							}	
						}else{
							space = false;
							return;
						}
					}
				});
				if(!space)
					return;
			});
			if(!space || surfacesNumber == max){
				return newTruckOrder;
			}
			//2. אם נאלצנו לעלות ל55 קר' במקום המקסימום 50 קר' וגם אם על אותו משטח יש יותר מלקוח אחד. לפצל את המשטח - להוריד מהמשטח את ההזמנה עם הכמות הגדולה ביותר.
			var minAmount ;
			var specialSurface;
			var specialSurfacUnitMinLimitation = undefined;
			var curSurfaceKey2 = 0;
			truckOrder = angular.copy(newTruckOrder);
			angular.forEach(newTruckOrder,function(list,key){
				if(list){
					list.original_key = key;
					list.surfacing_num = undefined;
				}
					
			});
			angular.forEach(truckOrder,function(curSurfaceOrders,curSurfaceKey){
				curSurfaceKey2 = curSurfaceKey;
				angular.forEach(newTruckOrder,function(list,keyList){ 
					if(list && list.original_key == curSurfaceKey)
					curSurfaceKey2 = keyList;
				});

				specialSurface = curSurfaceOrders&&curSurfaceOrders.length ? (curSurfaceOrders[0].package_name ? curSurfaceOrders[0].package_name : curSurfaceOrders[0].special_surface) : undefined;
				minAmount = undefined

				if(curSurfaceOrders && curSurfaceOrders.length 
					&& newTruckOrder[curSurfaceKey2] && newTruckOrder[curSurfaceKey2].length && groupBy(newTruckOrder[curSurfaceKey2],'customer_id').length>1 
					&& specialSurface && isNaN(Number($rootScope.current_user.max_units_per_surface)) && $rootScope.current_user.max_units_per_surface.includes(';')){
						specialSurfacUnitMinLimitation = $rootScope.current_user.max_units_per_surface.split(';').find(function(group){
							var typeOfPackage = group.split(',')[0];
							var itemType = group.split(',')[1];
							return typeOfPackage == specialSurface && (!Number(itemType)||itemType == (curSurfaceOrders[0].order_item?curSurfaceOrders[0].order_item.type:''));
						});
						if(specialSurfacUnitMinLimitation && specialSurfacUnitMinLimitation.includes(',') && Number(specialSurfacUnitMinLimitation.split(',')[3]))
							minAmount = Number(specialSurfacUnitMinLimitation.split(',')[3]);
				}
 
				if(minAmount && getSumByCustomProperty(curSurfaceOrders,'amount') > minAmount){// נוסף לעיל ממילא אם לא אז לא יגיע לכאן-להוסיף וגם אם יש יותרק מלקוח אחד במשטח
					if(space && surfacesNumber < max){
						//לחפש את ההזמנה עם הכמות הגדולה ביותר
						var maxOrderAmount = 0;
						var maxCustomer;
						var curSurfaceOrdersGroupByCustomer = groupBy(curSurfaceOrders,'customer_id');
						angular.forEach(curSurfaceOrdersGroupByCustomer,function(customer){
							if(customer.amount > maxOrderAmount){
								maxOrderAmount = customer.amount;
								maxCustomer = customer.customer_id;
							}
						});
						var orders = curSurfaceOrders.filter(function(order){
							if(order.customer_id == maxCustomer){
								var indexToRemove = $filter('getByIdFilter')(newTruckOrder[curSurfaceKey2], order.id);
								if(indexToRemove>-1){
									newTruckOrder[curSurfaceKey2].surfacing_num = newTruckOrder[curSurfaceKey2][indexToRemove].surfacing_num;
									newTruckOrder[curSurfaceKey2].splice(indexToRemove, 1);
								}
								if(newTruckOrder[curSurfaceKey2] && !newTruckOrder[curSurfaceKey2].length){
									newTruckOrder = PalletsService.deleteSurface(curSurfaceKey2,newTruckOrder);
									surfacesNumber--;
								}
									
								return true;
							}
							return false;
						});
						newTruckOrder = PalletsService.addSurfaceBelow(curSurfaceKey2,newTruckOrder,orders);
						surfacesNumber++;
					}else{
						space = false;
						return;
					}
				}
			});
			if(!space)
				return newTruckOrder;
			//3. אם נשאר מקום. לעבור בלולאה על כל המשטחים, לחפש את המשטח שיש בו הכי הרבה כמות, להוציא ממנו את ההזמנה עם הכי הרבה כמות. ושוב לבצע פעולה זו עד למילוי כל מקומות המשטחים הפנויים.
			//יצירת מערך ממוין לפי כמות קרטונים
			//לעבור על המערך הממוין וכל עוד יש משטחים פנויים להוציא ממנו את ההזמנה הכבדה ביותר 
			var curSurfaceKey2 = 0;
			angular.forEach(newTruckOrder,function(list,key){
				if(list){
					list.original_key = key;
					list.surfacing_num = undefined;
				}
					
			});
			truckOrder = angular.copy(newTruckOrder);
			angular.forEach(truckOrder,function(list,key){
				if(list){
					list.original_key = key;
					list.surfacing_num = undefined;
				}
					
			});
			truckOrder.sort((a,b)=>{
				if (a && b) {
					return getSumByCustomProperty(b, 'amount') - getSumByCustomProperty(a, 'amount');
				} else {
					return 0;
				}
			});
			angular.forEach(truckOrder,function(curSurfaceOrders,curSurfaceKey){
				curSurfaceKey2 = curSurfaceKey;
				angular.forEach(newTruckOrder,function(list,keyList){ 
					if(list && curSurfaceOrders && list.original_key == curSurfaceOrders.original_key)
						curSurfaceKey2 = keyList;
				});
				if(curSurfaceOrders && curSurfaceOrders.length && newTruckOrder[curSurfaceKey2] && newTruckOrder[curSurfaceKey2].length && groupBy(newTruckOrder[curSurfaceKey2],'customer_id').length>1) {
					if(space && surfacesNumber < max){
						//לחפש את ההזמנה עם הכמות הגדולה ביותר
						var maxOrderAmount = 0;
						var maxCustomer;
						var curSurfaceOrdersGroupByCustomer = groupBy(curSurfaceOrders,'customer_id');
						angular.forEach(curSurfaceOrdersGroupByCustomer,function(customer){
							if(customer.amount > maxOrderAmount){
								maxOrderAmount = customer.amount;
								maxCustomer = customer.customer_id;
							}
						});
						var orders = curSurfaceOrders.filter(function(order){
							if(order.customer_id == maxCustomer){
								var indexToRemove = $filter('getByIdFilter')(newTruckOrder[curSurfaceKey2], order.id);
								if(indexToRemove>-1){
									newTruckOrder[curSurfaceKey2].surfacing_num = newTruckOrder[curSurfaceKey2][indexToRemove].surfacing_num;
									newTruckOrder[curSurfaceKey2].splice(indexToRemove, 1);
								}
								if(newTruckOrder[curSurfaceKey2] && !newTruckOrder[curSurfaceKey2].length){
									newTruckOrder = PalletsService.deleteSurface(curSurfaceKey2,newTruckOrder);
									surfacesNumber--;
								}
									
								return true;
							}
							return false;
						});
						newTruckOrder = PalletsService.addSurfaceBelow(curSurfaceKey2,newTruckOrder,orders);
						surfacesNumber++;
					}else{
						space = false;
						return;
					}
				}

			});
			if(!space)
				return newTruckOrder;
			return newTruckOrder;
		}
		
		//Helper functions
		function groupBy(array, key, sumKey='amount') {
			return Object.values(array.reduce((result, item) => {
			  const groupKey = item[key];
			  result[groupKey] = result[groupKey] || { items: [], sum: 0 };
			  result[groupKey].items.push(item);
			  result[groupKey][key] = item[key];
			  if(!result[groupKey][sumKey])
			  	result[groupKey][sumKey] = 0;
			  result[groupKey][sumKey] += item[sumKey] || 0;
			  return result;
			}, {}));
		  }

		function getOrderDetail(obj, attr, order) {
			//RUT set תאור קבוצה as order field so new users upload it not as orders-details then as an order object attribute itself
			if(attr == 'תאור קבוצה' && order.group)
			return order.group;
	
			var tmp = $filter('filter')(obj, {
				attr : attr
			});
			if (tmp && tmp[0])
				return tmp[0].value;
			return '--';
		}

		function getSumByCustomProperty(arr, attr) {
			var sum = 0;
			angular.forEach(arr, function(value, key) {
				if(attr == 'amount')
					sum += parseInt(value.amount | 0);
				else if(attr == 'volume')
					sum += parseFloat(value.volume);
				else if(attr)
					sum += parseInt(getOrderDetail(value.orders_details, attr) | 0);
			});
			if(attr == 'volume')
				return sum.toFixed(1);
			return sum;
		}
		PalletsService.getOrderDetail = function(obj, attr, order) {
			//RUT set תאור קבוצה as order field so new users upload it not as orders-details then as an order object attribute itself
			if(attr == 'תאור קבוצה' && order.group)
			return order.group;

			var tmp = $filter('filter')(obj, {

				attr : attr

			});

			if (tmp && tmp[0])

				return tmp[0].value;

			return '--';

		}
		
		
		return PalletsService;
	});
})(window, window.angular);