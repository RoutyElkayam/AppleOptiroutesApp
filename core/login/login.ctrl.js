angular
    .module('RouteSpeed')
    .controller('loginCtrl', ['$scope','$rootScope', '$http', '$location','$filter',
    function loginCtrl($scope,$rootScope, $http, $location,$filter) {
       //$scope.user_name = 'דן';
       //$scope.password = '123123';
        $scope.user_name;
        $scope.password;
        $scope.route;
        $scope.error = false;
        $scope.webOrFrk = "";
        $scope.geHref = "";
        $scope.usHref = "";
        $rootScope.loginFlag = false;
        var identityNo = localStorage.getItem('identify_number');
        $scope.identify = (identityNo && identityNo != 'undefined' && identityNo != null)?identityNo : null;
        $scope.envNum = 4;
        $scope.routeId = 4;
        $scope.office ={lat:0,lng:0};
        $scope.login = function(){
            if(!$scope.password || $scope.password == 'undefined' || !$scope.user_name || $scope.user_name == 'undefined' || !$scope.identify || $scope.identify == 'undefined'){
                $scope.error = true;
                document.getElementsByClassName('login')[0].style.height  = "384px";
                return;
            }
            localStorage.setItem("env_num",($scope.envNum?$scope.envNum:4));
            $rootScope.login($scope.user_name,$scope.password,$scope.identify,$scope.routeId);
            
        }
        $scope.checkRouteId = function(e){
            if(e.target.value.length > 3){
                var elements = document.getElementsByName("routeId");
                elements[0].parentElement.classList.remove('col-xs-4');
                elements[0].parentElement.classList.add('col-xs-8');
                var loginCard = document.getElementById("login");
                loginCard.style.height = '393px';
            }
        }
      
        function init(){
            $scope.webOrFrk = window.location.hostname.includes('web') ? 'Web' : (window.location.hostname.includes('frk') ? 'Frk' : (window.location.hostname.includes('prod') ? 'Prod' : (window.location.hostname.includes('p2') ? 'S3' : 'Local')));
            if(window.location.hostname.includes('test'))
                $scope.webOrFrk = 'Test';
            if(window.location.hostname.includes('check'))
                $scope.webOrFrk = 'Check';
            var xhr = new XMLHttpRequest();
            if($scope.webOrFrk=="Local" || $scope.webOrFrk=="S3")
				var url = './ver.html';
			else
				var url='../../ver.html';
                xhr.open('GET', url, true);
                xhr.responseType = 'text';
                xhr.onload = function() {
                var status = xhr.status;
                if (status === 200) {
                   $scope.us2Href =  "https://prod.optiroutes.com/dev4/optwaysApp/#/login";
                   $scope.us1Href = "https://web.optiroutes.com/dev4/optwaysApp/#/login";
                   $scope.geHref = "https://frk.optiroutes.com/dev4/optwaysApp/#/login";
                   $scope.versionText = $scope.webOrFrk+" 4.0"+xhr.response;
                   document.getElementById('version').innerHTML = $scope.versionText;
                   document.getElementById('Web').href = $scope.us1Href;
                   document.getElementById('Prod').href = $scope.us2Href;
                   document.getElementById('Frk').href = $scope.geHref;
                   document.getElementById(($scope.webOrFrk!='Local' ? $scope.webOrFrk : 'Prod')).classList.add('current-version');
                } else {
                    console.log(status);
                    return;
                }
                };
                xhr.send();  
                //    var username = localStorage.getItem('username');
                //    var password = localStorage.getItem('password');
                //    var identifyNumber = localStorage.getItem('identify_number');
                //    if(username && username != 'undefined' && password && password != 'undefined' && identifyNumber && identifyNumber != 'undefined'){
                //        $scope.user_name = username;
                //        $scope.password = password;
                //        $scope.identify = identifyNumber;
                //        $scope.login();
                //    }
           
        }
        init();
        $scope.cacheUpdate = function() {	
			window.location.href = window.location.href + "t?" + Date.now();
			location.reload(true);
		}
     
        
    }
  ]);
