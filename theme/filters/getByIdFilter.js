(function () {
  'use strict';

  angular.module('RouteSpeed.theme')
  .filter('getByIdFilter', function() {
  return function(arr, id) {
      var obj =   arr.filter(function(item){
							return (item.id === id);
                   })[0]; 
      return arr.indexOf(obj);  			   
			  
  }
}).filter('getByNumOrderFilter', function() {
  return function(arr, id) {
      var obj =   arr.filter(function(item){
							return (item.num_order === id);
                   })[0]; 
      return arr.indexOf(obj);  			   
			  
  }
})
.filter('getByOrderToPalletFilter', function() {
  return function(arr, id) {
      var obj =   arr.filter(function(item){
							return (item.orderToPallet === id);
                   })[0]; 
      return arr.indexOf(obj);  			   
			  
  }
}).filter('getBySurfacingNum', function() {
  return function(lists, surfacing_num) {
      var obj =   lists.filter(function(list){
							return (list&&list.surfacing_num === surfacing_num);
                   })[0];
      if(!obj || lists.indexOf(obj) == -1){
        var index = -1;
        angular.forEach(lists,function(list,key){
          if(list && list[0] && list[0].surfacing_num == surfacing_num){
            index = key;
          }
        });
        //if(index > -1)
          return index;
      }
      return lists.indexOf(obj);  			   
			  
  }
});
})();