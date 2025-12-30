(function () {
    'use strict';

    angular.module('RouteSpeed')
        .config(['$routeProvider', function config($routeProvider) {
            $routeProvider
             .when('/login',{
                controller: 'loginCtrl',
                templateUrl: 'core/login/login.tmpl.html'
            })           
            .when('/nextStop/:id',{
                controller: 'nextStopCtrl',
                templateUrl: 'core/nextStop/nextStop.tmpl.html'
            })
            .when('/orders',{
                controller: 'ordersCtrl',
                templateUrl: 'core/orders/orders.tmpl.html'
            })
            .when('/schedule',{
                controller: 'palletsOrderInTruckCtrl',
                templateUrl: 'core/palletsOrderInTruck/palletsOrderInTruck.tmpl.html'
            })
            .otherwise({
                redirectTo:'/orders'
            });
        }]);
})();