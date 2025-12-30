angular.module("RouteSpeed.orders").controller("ordersCtrl", [
  "$scope",
  "$rootScope",
  "$http",
  "$location",
  "$sce",
  "$window",
  "$filter",
  "$q",
  "connectPOSTService",
  "connectGETService",
  "StopService",

  function ordersCtrl(
    $scope,
    $rootScope,
    $http,
    $location,
    $sce,
    $window,
    $filter,
    $q,
    connectPOSTService,
    connectGETService,
    StopService
  ) {
    var customer_group;

    var customer_group_index;

    $scope.selfReOrder = 0;

    $scope.track_date = new Date();

    $scope.stops_num = 0;

    $scope.getArrTime = StopService.getArrTime;

    // el 27.12.21
    $scope.requier_photo =
      localStorage.getItem("requier_photo") == 1 ? true : false;
    $scope.requier_sign =
      localStorage.getItem("requier_sign") == 1 ? true : false;
    $scope.requier_surface =
      localStorage.getItem("requier_surface") == 1 ? true : false;

    $scope.pod_option =
      localStorage.getItem("pod_option") == "true" ? true : false;

    $scope.thumbtack_option =
      localStorage.getItem("thumbtack_option") == "true" ? true : false;
    $scope.v_option = localStorage.getItem("v_option") == "true" ? true : false;
    $scope.x_option = localStorage.getItem("x_option") == "true" ? true : false;
    $scope.amount_option =
      localStorage.getItem("amount_option") == "true" ? true : false;
    $scope.hide_dayes_arror =
      localStorage.getItem("hide_dayes_arror") == "true" ? true : false;
    $scope.show_cash =
      localStorage.getItem("show_cash") == "true" ? true : false;
    console.log($scope.hide_dayes_arror);
    $scope.isIOS = function () {
        // iOS detection including newer iPads
        return (
          /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
        );
      };
      console.log("User Agent: ", navigator.userAgent);
      console.log("isIOS: ", $scope.isIOS());
    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
    if (isAndroid) {
      // Do something!
      // Redirect to Android-site?
      //alert("Android");
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia ||
        navigator.mediaDevices.getUserMedia;

      navigator.getUserMedia(
        // constraints
        {
          video: true,
        },

        // successCallback
        function (localMediaStream) {
          console.log("access success");
          
          var otherStreams = localMediaStream.getTracks();
          angular.forEach(otherStreams,function(stream) { stream.stop() });

          var video = document.querySelector("video");
          //video.src = window.URL.createObjectURL(localMediaStream);
          // video.onloadedmetadata = function (e) {
          //   // Do something with the video here.
          // };
        },

        // errorCallback
        function (err) {
          if (
            err.message === "Permission denied" &&
            localStorage.getItem("access_permission_required") == "true"
          ) {
            console.log("access blocked");
            access_required_dialog(
              $rootScope.arraylang["camera_required_message"][
                $rootScope.selectedlang
              ],
              $rootScope.arraylang["camera_required_help_url"][
                $rootScope.selectedlang
              ]
            );
            //   document.getElementById("access_required").style.display = "flex";
            //   document.getElementById("resource_allow_access").innerHTML =
            //     "על מנת להשתמש באפליקציה יש לאפשר גישה למצלמה";
            //   document.getElementById("howToAllow").href =
            //     "https://support.google.com/chrome/answer/2693767?hl=iw&co=GENIE.Platform%3DAndroid";
          }
        }
      );
      if(navigator.permissions){
        navigator.permissions
        .query({ name: "camera" })
        .then((permissionStatus) => {
          console.log(
            `geolocation permission state is ${permissionStatus.state}`
          );
          permissionStatus.onchange = () => {
            if (localStorage.getItem("access_permission_required") == "true") {
              if (permissionStatus.state == "denied") {
                console.log("denied");
                //access_required_dialog("none");
                access_required_dialog(
                  $rootScope.arraylang["camera_required_message"][
                    $rootScope.selectedlang
                  ],
                  $rootScope.arraylang["camera_required_help_url"][
                    $rootScope.selectedlang
                  ]
                );
              } else {
                console.log(permissionStatus.state);

                if (
                  document.getElementById("access_required").style.display !==
                  ""
                ) {
                  document.getElementById("access_required").style.display =
                    "none";
                }
                console.log("granted");
              }
            }
          };
        });

      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          console.log(
            `geolocation permission state is ${permissionStatus.state}`
          );
          permissionStatus.onchange = () => {
            if (localStorage.getItem("access_permission_required") == "true") {
              if (permissionStatus.state == "denied") {
                console.log("denied");
                //access_required_dialog("none");
                access_required_dialog(
                  $rootScope.arraylang["location_required_message"][
                    $rootScope.selectedlang
                  ],
                  $rootScope.arraylang["location_required_help_url"][
                    $rootScope.selectedlang
                  ]
                );
              } else {
                if (
                  document.getElementById("access_required").style.display !==
                  ""
                ) {
                  document.getElementById("access_required").style.display =
                    "none";
                }
                console.log("granted");
              }
            }
          };
        });
      }
    } else {
      console.log("not Android");
    }

    // efrat 15.09.22 : disabel zoom in on
    $viewport = $('head meta[name="viewport"]');
    $viewport.attr(
      "content",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0, minimal-ui"
    );

    $scope.startRoute = function () {
      document.getElementById('loader').style.display = 'block';
      document.getElementById("nonloader").style.display = "none";

      connectPOSTService
        .fn("track/driver_start&id=" + $scope.route.id, {
          current_lat: $rootScope.currentPosition
            ? $rootScope.currentPosition.lat
            : null,
          current_lng: $rootScope.currentPosition
            ? $rootScope.currentPosition.lng
            : null,
        })
        .then(
          function (data) {
            //RUT 20/08/23 cancel calling again while starting to getRoute func if wanting to refresh should press on the refresh button
            //$scope.getRoute(true);
            $scope.route.start_time = data.data.start_time;

            $scope.date = new Date(
              new Date().toLocaleString("en-US", {
                timeZone: "Asia/Jerusalem",
              })
            );
            // var tomorrow = new Date(new Date().toLocaleString("en-US", {timeZone:'Asia/Jerusalem',}));
            // tomorrow.setDate(tomorrow.getDate() + 1);
            if (
              $scope.route.date &&
              $scope.route.date.getDate() != $scope.date.getDate() &&
              !($scope.date.getHours() >= 22)
            ) {
              if($scope.route.checked == 3)
                $scope.setSelfReOrder();
              $scope.disableRoute = true;
            } else {
              $scope.selfReOrderTime = false;
            } 
            document.getElementById('loader').style.display = 'none';
            document.getElementById("nonloader").style.display = "block";           
          },
          function (err) {
            document.getElementById('loader').style.display = 'none';
            document.getElementById("nonloader").style.display = "block";

            alert("אירעה שגיאה, אנא נסה שוב.");
          }
        );
    };

    $scope.getAllCustomers = function () {
      $http
        .get(
          $rootScope.getBaseUrl() +
            "customeraddress/get_customers_autocomplete",
          {
            headers: {
              "x-csrf-token-app": $rootScope.identify,
              "user-token-app": localStorage.getItem("user_id"),
            },
          }
        )
        .then(
          function (data) {
            $scope.customers = data.data;
          },
          function (err) {
            if (err.status == 401) $location.path("/login");
            else throw err;
          }
        );
    };

    /******autocompleate**********/

    $scope.selectedCustomer;
    $scope.searchText = {};
    // ******************************
    // Internal methods
    // ******************************

    /**
     * Search for states... use $timeout to simulate
     * remote dataservice call.
     */
    function suggest_customer(term) {
      var q = term.toLowerCase().trim();
      var results = [];

      // Find first 10 states that start with `term`.
      for (var i = 0; i < $scope.customers.length && results.length < 10; i++) {
        var cstmr = $scope.customers[i];
        if (cstmr.value.includes(q))
          results.push({
            label: cstmr.value,
            value: cstmr.value,
            objId: cstmr.id,
          });
      }

      return results;
    }

    $scope.autocomplete_options = {
      suggest: suggest_customer,
      on_select: function (selected) {
        $scope.selectedCustomer = selected.objId;
        console.log($scope.selectedCustomer);
      },
    };
    $scope.addToRoute = function () {
      document.getElementById('loader').style.display = 'block';
      document.getElementById("nonloader").style.display = "none";

      connectPOSTService
        .fn("messengers/addordertoroute", {
          customer: $scope.selectedCustomer,
          route: $scope.route ? $scope.route.id : null,
        })
        .then(function (data) {
          angular.element("#autocomplete_customers").modal("hide");

          $scope.searchText.value = undefined;
          $scope.getRoute();
        });
    };
    /******autocompleate**********/

      $scope.navigate = function (current_stop,maps_system=2) {
        var urlScheme;
        var url;
        var appleMapsUrl ;
        var isIOS = function () {
            // iOS detection including newer iPads
            return (
              /iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
            );
          };
        //var url='http://waze.to/?ll='+current_stop.lat+','+current_stop.lng+'&navigate=yes';
          if (!$rootScope.current_user.navigation_by_location){
              appleMapsUrl = "http://maps.apple.com/?daddr=" + encodeURIComponent(current_stop.address);
              url =
              "http://waze.to/?q=" +
              current_stop.address.replace(/ /g, "%20") +
              ";&navigate=yes";
          }else{
              appleMapsUrl = "http://maps.apple.com/?daddr=" + current_stop.lat + "," + current_stop.lng;
              url =
              "http://waze.to/?ll=" +
              current_stop.lat +
              "," +
              current_stop.lng +
              "&navigate=yes";
         }
          if (isIOS()) {
              // iOS: Provide Apple Maps and Waze options
              if (maps_system == 1) {
                  window.open(appleMapsUrl, "_blank");
              } else {
                  urlScheme = "waze://?"+url.split('?')[1];
                  
                  // Attempt to launch Waze app or fallback to website
                  var newTab = window.open(urlScheme, '_blank');
                  newTab.focus(); // Focus on the newly opened tab
                  
                  // Check if the app is installed by falling back to the Waze website
                  setTimeout(function () {
                      // If the new tab is still open, fallback to Waze's web version
                      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
                          window.open("https://www.waze.com/ul?" + url.split('?')[1], "_blank");
                      }
                  }, 1000); // Timeout for checking app response
              }
          }else{
              
              // Waze option
              let urlScheme = "waze://?" + url.split('?')[1];

              // Try opening the Waze app
              let newTab = window.open(urlScheme, '_blank');
              newTab.focus();

              // Check if the app is installed by falling back to the Waze website
              setTimeout(function () {
                  // If the new tab is still open, fallback to Waze's web version
                  if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
                      window.open("https://www.waze.com/ul?" + url.split('?')[1], "_blank");
                  }
              }, 1000); // Timeout for checking app response
          }
        

      };

    $scope.openModal = function (id, stop) {
      if (id == "get" && $rootScope.current_user.arrival_reporting_app) {
        checkStop(stop, true);
        return;
      }
      $scope.checked_stop = stop;
      angular.element("#" + id).modal("show");
    };

    $scope.checkStop = function (stop, status) {
      //red-x in the main screen means the driver had not arrived the stop
      if (!status) {
        status = 3;
        angular.element("#no-get").modal("hide");
      } else {
        angular.element("#get").modal("hide");
      }

      if ($rootScope.current_user.arrival_reporting_app && status == true) {
        StopService.startDocumentation(stop, false, $scope.remarks).then(
          function (data) {
            if (data.data.status == "SUCCESS") {
              if (data.data.documentation) {
                $rootScope.documentation = data.data.documentation;

                $location.path("/nextStop/" + stop.id);
              }
            }
          },
          function fail(data) {
            if (err.status == 401) $location.path("/login");
            else throw err;
          }
        );
      } else {
        //RUTEL send the next stop details in order to send message to the next address-
        var index = $rootScope.activeRoutes.findIndex((s) => s.id == stop.id);
        var nextStop = $rootScope.activeRoutes[index + 1]
          ? $rootScope.activeRoutes[index + 1]
          : null;
        StopService.markComplete(stop, status, nextStop, $scope.remarks).then(
          function (response) {
            // if($rootScope.current_user.arrival_reporting_app&&status){

            // $location.path('/stop/'+stop.id);

            // }else{

            $scope.getRoute();
            $scope.remarks = "";
            //}
          },
          function fail(data) {
            if (err.status == 401) $location.path("/login");
            else throw err;
          }
        );

        StopService.startDocumentation(stop, true, $scope.remarks);
      }
    };

    //open page with the order in truck

    $scope.printTruckTemplate = function () {
      var elementPage = '<html lang="en" ><head>';

      elementPage +=
        '<style type="text/css">body { direction:rtl;margin: 0; padding: 0; background-color: #FAFAFA; font: 12pt "Tahoma"; } * { box-sizing: border-box; -moz-box-sizing: border-box; } .page { width: 21cm; min-height: 29.7cm; padding: 2cm; margin: 1cm auto; border: 1px #D3D3D3 solid; border-radius: 5px; background: white; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); } .subpage { /*height: 256mm; padding: 1cm; border: 5px red solid; outline: 2cm #FFEAEA solid;*/ } @page { size: A4; margin: 0; } @media print { .page { margin: 0; border: initial; border-radius: initial; width: initial; min-height: initial; box-shadow: initial; background: initial; page-break-after: always; }    table { page-break-inside:auto }tr    { page-break-inside:avoid; page-break-after:auto } }@media print {tr {page-break-before: auto;}}table{width:100%}tr{text-align:center}.track-col{width:50%;height: 20%;float: left;border: solid black 3px;} </style>';

      elementPage +=
        '</head><body onload="window.print()"><div class="book"> <div class="page"> <div class="subpage"><table style="border: 1px solid black;border-collapse: collapse;">';

      elementPage +=
        "<h3>סידור משאית לנהג " + $rootScope.current_user
          ? $rootScope.current_user.name
          : "" + "</h3>";

      var cooled = $scope.current_route.filter(function (item) {
        return (
          $scope
            .getOrderDetail(item.orders_details, "תאור קבוצה", item)
            .includes("מצונן") &&
          !$scope
            .getOrderDetail(item.orders_details, "תאור קבוצה", item)
            .includes("קפוא")
        );
      });

      var frozen = $scope.current_route.filter(function (item) {
        return $scope
          .getOrderDetail(item.orders_details, "תאור קבוצה", item)
          .includes("קפוא");
      });

      for (var i = 0, j = frozen.length - 1; i < 9 || j >= 0; i++) {
        if (!(i % 2)) {
          elementPage += '<tr style="border: 1px solid black;height:15vh;">';
        }

        var volume = 0;

        var order_numbers = "";

        if (j >= 0) {
          order_numbers +=
            "<table><tr><th>שם לקוח</th><th>עיר</th><th>מספר יחידות</th><th>מספר הזמנה</th><th>מספר תחנה</th></tr>";

          do {
            order_numbers +=
              "<tr><td>" +
              frozen[j].customer_name.substring(0, 15) +
              "</td><td>" +
              frozen[j].city +
              "</td><td>" +
              $scope.getOrderDetail(frozen[j].orders_details, "מספר יחידות") +
              "</td><td>" +
              frozen[j].num_order +
              "</td><td>" +
              frozen[j].stop_index +
              "</td></tr>";

            volume += parseInt(
              $scope.getOrderDetail(frozen[j].orders_details, "מספר יחידות")
            );

            j--;
          } while (
            j >= 0 &&
            (volume +
              parseInt(
                $scope.getOrderDetail(frozen[j].orders_details, "מספר יחידות")
              ) <
              60 ||
              i == 8)
          );

          order_numbers += "</table>";
        }

        //elementPage += '<div class="track-col">'+order_numbers+'</div>';

        elementPage +=
          '<td style="border: 1px solid black;">' + order_numbers + "</td>";

        if (i % 2) {
          elementPage += "</tr>";
        }
      }

      for (var j = cooled.length - 1; i < 11; i++) {
        if (!(i % 2)) {
          elementPage += '<tr style="border: 1px solid black;height:15vh;">';
        }

        var volume = 0;

        var order_numbers = "";

        if (j >= 0) {
          order_numbers +=
            "<table><tr><th>שם לקוח</th><th>עיר</th><th>מספר יחידות</th><th>מספר הזמנה</th><th>מספר תחנה</th></tr>";

          do {
            order_numbers +=
              "<tr><td>" +
              cooled[j].customer_name.substring(0, 15) +
              "</td><td>" +
              cooled[j].city +
              "</td><td>" +
              $scope.getOrderDetail(cooled[j].orders_details, "מספר יחידות") +
              "</td><td>" +
              cooled[j].num_order +
              "</td><td>" +
              cooled[j].stop_index +
              "</td></tr>";

            volume += parseInt(
              $scope.getOrderDetail(cooled[j].orders_details, "מספר יחידות")
            );

            j--;
          } while (
            j >= 0 &&
            (volume +
              parseInt(
                $scope.getOrderDetail(cooled[j].orders_details, "מספר יחידות")
              ) <
              60 ||
              i == 10)
          );

          order_numbers += "</table>";
        }

        //elementPage += '<div class="track-col">'+order_numbers+'</div>';

        elementPage +=
          '<td style="border: 1px solid black;background-color: lightblue;">' +
          order_numbers +
          "</td>";

        if (i % 2) {
          elementPage += "</tr>";
        }
      }

      elementPage +=
        '<td style="border: 1px solid black;   background-color: black;color:white;">' +
        "ג'ק" +
        "</td></tr>";

      //elementPage += '</div></div></div></body></html>';

      elementPage += "</table></div></div></div></body></html>";

      var popupWin = window.open("Track", "_blank");

      popupWin.document.open();

      popupWin.document.write(elementPage);

      popupWin.document.close();
    };

    $scope.getOrderDetail = function (obj, attr, order) {
      //RUT set תאור קבוצה as order field so new users upload it not as orders-details then as an order object attribute itself
      if(attr == 'תאור קבוצה' && order.group)
        return order.group;

      var tmp = $filter("filter")(obj, {
        attr: attr,
      });

      if (tmp && tmp[0]) return tmp[0].value;

      return "--";
    };

    //#191112.1

    $scope.createStopsUnit = function (order) {
      if (order.customer.group_id) {
        //אם לחצו על הפלוס הראשון מבטל את כל הקבוצה

        if (order.customer.group_index == 1) {
          var group_id = order.customer.group_id;

          $scope.current_route.map(function (value) {
            if (group_id == value.customer.group_id) {
              value.customer.group_id = null;

              value.customer.group_index = null;
            }
          });
        }

        order.customer.group_id = null;

        order.customer.group_index = null;

        //return;
      } else {
        //אם זו קבוצה חדשה

        if (!customer_group) {
          customer_group = order.id;

          customer_group_index = 1;
        }

        order.customer.group_id = customer_group;

        order.customer.group_index = customer_group_index++;

        angular.element("#closeStopsUnit").trigger("click");
      }

      $scope.current_route.map(function (value) {
        if (order.customer_id == value.customer_id) {
          value.customer.group_id = order.customer.group_id;

          value.customer.group_index = order.customer.group_index;
        }
      });

      //שמירת הקבוצה של התחנה בDB

      $http({
        url:
          $rootScope.getBaseUrl() +
          "customeraddress/group_customer&id=" +
          order.customer_id,

        method: "POST",

        data: { stops: $scope.current_route },

        headers: {
          "x-csrf-token-app": $rootScope.identify,
          "user-token-app": localStorage.getItem("user_id"),
        },
      }).then(
        function (data) {
          if (data.data.status == "SUCCESS") {
            $scope.current_route = data.data.data;

            setActiveRoute();
          }
        },
        function (error) {
          console.log(error);
        }
      );
    };

    $scope.closeStopsUnit = function () {
      customer_group = undefined;

      reorderRoute();
    };

    $scope.thumbtackStop = function (stop) {
      var data = {
        stops: $scope.current_route,
      };

      $http({
        url:
          $rootScope.getBaseUrl() +
          "customeraddress/thumbtack_stop&id=" +
          stop.customer_id,

        method: "POST",

        data: data,

        headers: {
          "x-csrf-token-app": $rootScope.identify,
          "user-token-app": localStorage.getItem("user_id"),
        },
      }).then(
        function suc(data) {
          if (data.data.status == "SUCCESS") {
            $scope.current_route = data.data.data;

            setActiveRoute();

            reorderRoute();
          }
        },
        function (error) {
          console.log(error);
        }
      );
    };

    var reorderRoute = function (route) {
      var cars = [
        { name: "defult", volume: 0, weight: 0, num_cars: 1, id: null },
      ];

      var data = {
        stops: $rootScope.activeRoutes,

        drivers: 1,

        cars: cars,

        save_orders: true,

        merge: true,
      };

      $http({
        url: $rootScope.getBaseUrl() + "track/optimizebytime",

        method: "POST",

        data: data,

        headers: {
          "x-csrf-token-app": $rootScope.identify,
          "user-token-app": localStorage.getItem("user_id"),
        },
      }).then(
        function suc(data) {
          if (data.data.status == "ok") {
            $rootScope.activeRoutes = data.data.data.stops;
          }
        },
        function (error) {
          console.log(error);
        }
      );
    };

    $scope.getTime = function (datetime, time_set, urgency_level) {
      document.getElementById('loader').style.display = 'block';

      document.getElementById("nonloader").style.display = "none";

      //return time_set;

      var result;

      $scope.loading = true;

      if (!time_set || time_set == 0) {
        $scope.time_set = false;

        if (uraucy_level) {
          result = urgency_level;
        } else {
          result = "---";
        }
      } else {
        var d = new Date(datetime);

        var h = d.getHours();

        if (h < 10) {
          h = "0" + h;
        }

        var m = d.getMinutes();

        if (m < 10) {
          m = "0" + m;
        }

        result = "" + h + ":" + m;
      }

      return result;
    };

    $scope.stopClick = function (id) {
      $location.path("/nextStop/" + id);
    };
    
    $scope.refresh = function () {
      var identify_number = localStorage.getItem('identify_number');
      var username = localStorage.getItem('username');
      var password = localStorage.getItem('password');
      var user_id = localStorage.getItem('user_id');
      var env_num = localStorage.getItem('env_num');
      var optVrsn = localStorage.getItem('optVrsn');

      localStorage.clear();  // This will remove all keys and values stored in localStorage
      
      localStorage.setItem('identify_number',identify_number);
      localStorage.setItem('username',username);
      localStorage.setItem('password',password);
      localStorage.setItem('user_id',user_id);
      localStorage.setItem('env_num',env_num);
      localStorage.setItem('optVrsn',optVrsn);
      if ($rootScope.loginFlag) {
        $rootScope.login(
          username,
          password,
          identify_number
        );
        $scope.getRoute();
      } else {
        $location.path("/login");
      }
    };

    //get route
    $scope.setNextDate = function (nextOrPrevious) {
      if (nextOrPrevious) {
        $scope.track_date.setDate($scope.track_date.getDate() + 1);
        $scope.getRoute();
      } else {
        $scope.track_date.setDate($scope.track_date.getDate() - 1);
        $scope.getRoute();
      }
    };

    $scope.getRoute = function (is_started=false) {
      
      
      //$rootScope.checkVersion();

      var data = {
        data: {
          messenger: localStorage.getItem("user_id"),
          has_pod_files:is_started ? 0 : (!$rootScope.pod_files ? 0 :1)
        },
      };

      $scope.current_route = [];
      $scope.endOfRoute = false;
      
      document.getElementById('loader').style.display = 'block';
      document.getElementById("nonloader").style.display = "none";
      connectPOSTService.fn("track/getroute&date="+$filter("date")($scope.track_date, "yyyy-MM-dd").toString(),data).then(
        function (response) {

      // $.ajax({
      //   url:
      //     $rootScope.getBaseUrl() +
      //     "track/getroute&date=" +
      //     $filter("date")($scope.track_date, "yyyy-MM-dd").toString(),

      //   data: data,

      //   type: "post",

      //   beforeSend: function () {
      //     document.getElementById('loader').style.display = 'block';
      //     document.getElementById("nonloader").style.display = "none";
      //   },

      //   headers: {
      //     device: "webPage",
      //     "x-csrf-token-app": $rootScope.identify,
      //     "user-token-app": localStorage.getItem("user_id"),
      //   },
      // }).then(
      //   function suc(response) {

          document.getElementById('loader').style.display = 'block';
          document.getElementById("nonloader").style.display = "none";
          if (response) {
            $scope.is_on_route = true;

            try {
              //response = JSON.parse(response);
              response = response.data;

              $scope.route = response.route;

              if(!$scope.route){
                document.getElementById('no_route_message').innerHTML = 'לא עודכנו מסלולים ליום זה';
              }
              else{
                document.getElementById('no_route_message').style.display = 'none';
              }
              $scope.route.date = new Date(
                $scope.route.track_date.replace(/\s/, "T")
              );

              $scope.current_route = response.stops;

              //RUT 02/07/23 create a global array of the pod files(ArrayBuffer type) of the orders
              if(!$rootScope.wait_for_pod_files && (is_started || !$rootScope.pod_files)){
                 $rootScope.getPodFiles($scope.route.id);
              }

              //RUTEl 20/10/2021 add a global variable for pallets-arranging that includes the duplicate orders for one customer
              $rootScope.crnt_route = response.orders;
              numberOrders($rootScope.crnt_route);

              $scope.disableRoute = false;
              //cannot reorder for today-
              $scope.date = new Date(
                new Date().toLocaleString("en-US", {
                  timeZone: "Asia/Jerusalem",
                })
              );
              // var tomorrow = new Date(new Date().toLocaleString("en-US", {timeZone:'Asia/Jerusalem',}));
              // tomorrow.setDate(tomorrow.getDate() + 1);
              //RUT CHECK IF THE ROUTE IS DISABLED AND IF DRAGGING IS AVAILABLE
              if (
                $scope.route.date &&
                $scope.route.date.getDate() != $scope.date.getDate() &&
                !($scope.date.getHours() >= 22)
              ) {
                if($scope.route.checked == 3)
                  $scope.setSelfReOrder();
                $scope.disableRoute = true;
              } else {
                $scope.selfReOrderTime = false;
              }
            } catch (error) {
              console.log(error);
            }

            //$scope.current_route = $filter('orderBy')($scope.current_route, ['-time_set','time_order']);

            if ($scope.current_route.length && $scope.current_route[0]) {
              $rootScope.track_id = $scope.current_route[0].track_id;
            } else {
              console.log("error occured in returned data(route)");
            }

            setActiveRoute();
            
            if (
              !$rootScope.activeRoutes.filter(stop => !stop.parent_order).length &&
              $scope.current_route.length &&
              $http.pendingRequests.length === 0
            ){
              var unfinishedTrack;
              // unfinishedTrack = $rootScope.activeRoutes.filter(stop => stop.status == 4).length > 0;
              // if(($rootScope.nextStopRef && unfinishedTrack) || !unfinishedTrack){
              //   $rootScope.nextStopRef = false;
              //post for end of route
              var data = {
                data: {
                  track_id: $rootScope.track_id,
                },
              };

              $.ajax({
                url: $rootScope.getBaseUrl() + "track/checkfinishtrack",

                data: data,

                type: "post",

                headers: {
                  "x-csrf-token-app": $scope.identify,
                  "user-token-app": localStorage.getItem("user_id"),
                },
              }).then(
                function (response) {
                  if (
                    !unfinishedTrack &&
                    response &&
                    response != "null" &&
                    response != null &&
                    response != "error"
                  ) {
                    $scope.getRoute();
                  } else if (response == "error") {
                    //alert("error occured while finishing route");
                  }
                },
                function (data) {
                  alert("(סוף מסלול) אירעה שגיאה בניסיון ליצור קשר עם השרת");
                }
              );
              //}
            }

            if (navigator.geolocation !== null) {
              //get current location

              navigator.geolocation.getCurrentPosition(
                function(){},
                positionFail,
                {
                  timeout: 20000,

                  enableHighAccuracy: true,

                  maximumAge: 90000,
                }

                // efrat 16.11
                // function (error) {
                //   toastr.error("Please turn on location for this feature");
                //   setTimeout(function () {
                //     window.location.href = "/";
                //   }, 2000);
                // },
                // []
              );
            } else {
              alert("המיקום הגיאוגרפי נכשל");
            }
            document.getElementById('loader').style.display = 'none';

            document.getElementById("nonloader").style.display = "block";

            if (!$scope.$$phase) $scope.$apply();
          } else if (response == "null") {
            document.getElementById('loader').style.display = 'none';

            document.getElementById("nonloader").style.display = "block";

            $scope.is_on_route = false;

            if (!$scope.$$phase) $scope.$apply();

            //map1.setOptions({draggable: false});

            if ($scope.finished) {
              alert("סימת מסלול, אין מסלול נוכחי");
            } else {
              //alert('אין מסלול נוכחי');
            }

            $scope.is_on_route = false;

            //findGeolocation();
          } else {
            

            document.getElementById('loader').style.display = 'none';

            document.getElementById("nonloader").style.display = "block";
          }
        },
        function fail(e) {
          alert("(מסלול) שגיאה בעת ניסיון לחבר שרת");

          document.getElementById('loader').style.display = 'none';

          document.getElementById("nonloader").style.display = "block";
        }
      );
    };

    function setActiveRoute() {
      setSubOrders($scope.current_route);
      
      // eluria 02.15.22
      $rootScope.activeRoutes = [];

      $scope.nonactiveRoutes = [];

      for (var j = 0; j < $scope.current_route.length; j++) {
        if($scope.current_route[j].customer.time_windows.length){
          var splittedEarliest = $scope.current_route[j].customer.time_windows[0].earliest.split(':');
          $scope.current_route[j].customer.time_windows[0].earliest = splittedEarliest[0]+':'+splittedEarliest[1];
          var splittedLatest = $scope.current_route[j].customer.time_windows[0].latest.split(':');
          $scope.current_route[j].customer.time_windows[0].latest = splittedLatest[0]+':'+splittedLatest[1];
        }
        if ($scope.current_route[j].status != 0 && $scope.current_route[j].status != 4) {
          $scope.nonactiveRoutes.push($scope.current_route[j]);
        } else {
          $rootScope.activeRoutes.push($scope.current_route[j]);
        }
      }

      $rootScope.activeRoutes.sort(function(a, b) {
				return parseInt(b.status) - parseInt(a.status);
			});

      $scope.sum_amount = $rootScope.activeRoutes.reduce(
        (a, value) => a + Number(value.amount),
        0
      );
    }
    //RUTEL reorder-route optimally:
    $scope.reorderRoute = function (
      gh_calc = true,
      include_rejected = false,
      merge = true
    ) {
      document.getElementById('loader').style.display = 'block';

      document.getElementById("nonloader").style.display = "none";

      if (!$rootScope.activeRoutes.length) {
        return;
      }

      angular.forEach($rootScope.activeRoutes, function (order) {
        if (order.opening_time) {
          order.opening_time = $filter("date")(
            new Date(order.customer.opening_time),
            "HH:mm:ss"
          );
        }

        if (order.closing_time) {
          order.closing_time = $filter("date")(
            new Date(order.customer.closing_time),
            "HH:mm:ss"
          );
        }

        // if(order.time_windows){
        //
        // order.closing_time = $filter('date')(new Date(order.customer.closing_time), "HH:mm:ss");
        //
        // }
      });

      var data = {
        data: {
          stops: $rootScope.activeRoutes,

          merge: merge,

          cars: [],

          route_id: $scope.route.id,

          start_time: $filter("date")($scope.route.start_time, "HH:mm:ss"),

          gh_calc: gh_calc,

          save_orders: true,
        },
      };

      connectPOSTService.fn("track/optimizebytime", data.data).then(
        function (data) {
          if (data.data.status == "ok") {
            //var i = $filter('getByIdFilter')($scope.tracks, route.id);

            var stops = data.data.data.stops;

            $rootScope.activeRoutes = stops.filter(function (item) {
              return item.rejected == "0" || item.rejected == "1";
            });

            $scope.route.distance = data.data.data.distance;

            $scope.route.time = data.data.data.duration;

            if (!$scope.$$phase) $scope.$apply();

            //ADD BY YONI To QUAL THE RESULTS
            //$scope.resetTimeDistance(route);
            document.getElementById('loader').style.display = 'none';

            document.getElementById("nonloader").style.display = "block";

            //$scope.save();
          } else {
            //NOT OK
            document.getElementById('loader').style.display = 'none';

            document.getElementById("nonloader").style.display = "block";
          }
        },
        function (e) {
          document.getElementById('loader').style.display = 'none';

          document.getElementById("nonloader").style.display = "block";
        }
      );
    };
    var setSubOrders = function(arr){
      
      if (!arr.length) return arr;
      
      var customers_ids = [];

      var stop_index = 0;

      for (var i = 0; i < arr.length; i++) {
        if(arr[i].customer_id && !customers_ids.includes(arr[i].customer_id)){

          var group = $scope.getOrderDetail(arr[i].orders_details, 'תאור קבוצה', arr[i]);

          var sub_orders = arr.filter(function(item) {return item.customer_id == arr[i].customer_id&&item.original_address == arr[i].original_address&&item.id != arr[i].id;});
  
          angular.forEach(sub_orders, function(sub_order, key_sub) {
            if($scope.getOrderDetail(sub_order.orders_details,'תאור קבוצה',sub_order) != group)
              arr[i].has_multi_groups = true;
            sub_order.parent_order = arr[i].customer_id;
            sub_order.stop_index = stop_index;
  
          });
  
          if(sub_orders.length){
            arr[i].is_parent = true;
          }
          //Rut In order to display the address details also if is_parent and also if not but is the only order for this customer in current route.
          if(arr[i].parent_order)
            arr[i].parent_order = undefined;
          
          arr[i].stop_index = stop_index++;

          customers_ids.push(arr[i].customer_id);
        }
      }
      $scope.stops_num = customers_ids.length;
      return arr;

    }
    var numberOrders = function (arr) {
      if (!arr.length) return arr;

      var prevOrderCustomer = arr[0].customer_id;

      var prevOrderGroup = arr[0].group_id;

      var groupIndex = 1;

      for (var i = 0, j = 0; i < arr.length; i++) {
        if (!arr[i].customer_id || prevOrderCustomer != arr[i].customer_id) {
          prevOrderCustomer = arr[i].customer_id;

          j++;

          //#191124.1

          groupIndex++;

          //###
        }

        if (arr[i].customer.group_id) {
          if (prevOrderGroup != arr[i].customer.group_id) {
            prevOrderGroup = arr[i].customer.group_id;

            groupIndex = 1;
          }

          arr[i].customer.group_index = groupIndex;
        }
        //RUT while group by customers and sign all pod files inside stop details the stop index is not changed
        //arr[i].stop_index = j;

      }

      return arr;
    }

    function stopDuration(googleRes) {
      var duration = 0;

      for (var i = 0; i < $scope.current_route.length && i < 24; i++) {
        duration += googleRes.routes[0].legs[i].duration.value / 60;

        if (duration)
          $scope.current_route[i].estimatedTime =
            Math.floor(duration / 60) + ":" + Math.floor(duration % 60);

        //duration = Math.round(duration * 100) / 100;

        //$scope.current_route[i].duration = duration;

        //$scope.current_route[i]['estimatedTime'] = duration;
      }

      if (!$scope.$$phase) $scope.$apply();

      document.getElementById('loader').style.display = 'none';

      document.getElementById("nonloader").style.display = "block";
    }

    function positionFail(error) {
      if (
        error.code == 1 &&
        localStorage.getItem("access_permission_required") == "true"
      ) {
        // let showMessage = "על מנת להשתמש באפליקציה יש לאפשר גישה למיקום";
        // let helpUrl =
        //   "https://support.google.com/chrome/answer/142065?hl=iw&co=GENIE.Platform%3DAndroid&oco=1";
        access_required_dialog(
          $rootScope.arraylang["location_required_message"][
            $rootScope.selectedlang
          ],
          $rootScope.arraylang["location_required_help_url"][
            $rootScope.selectedlang
          ]
        );
        // document.getElementById("access_required").style.display = "flex";
      }
      document.getElementById('loader').style.display = 'none';
      document.getElementById("nonloader").style.display = "block";
      //alert('כשלון בנסיון לקבל מיקום נוכחי');
    }

    function access_required_dialog(showMessage, helpUrl) {
      document.getElementById("access_required").style.display = "flex";
      document.getElementById("resource_allow_access").innerHTML = showMessage;
      document.getElementById("howToAllow").href = helpUrl;
    }
    //RUT 10/09/24 NOT_IN_USE cancelled because found it is unnecessary
    function getStopsDuration(position) {
      var route = $scope.current_route;

      if (!route.length) {
        return;
      }

      var latlng = [];

      for (var j = 0; j < route.length - 1 && j < 23; j++) {
        if (route[j].lng && route[j].lat) {
          latlng.push({
            location: {
              lat: Number(route[j].lat),

              lng: Number(route[j].lng),
            },
          });
        }
      }

      var origin = new google.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude
      );

      var destination = new google.maps.LatLng(
        Number(route[j].lat),
        Number(route[j].lng)
      );

      directionsService = new google.maps.DirectionsService();

      directionsService.route(
        {
          origin: origin,

          destination: destination,

          waypoints: latlng,

          travelMode: "DRIVING",
        },
        function (response, status) {
          if (status === "OK") {
            stopDuration(response);
          }
        }
      );
    }
    $scope.setSelfReOrder = function () {
      //current date
      var date = $scope.date;
      //cannot reorder if not declared time to -
      var user = JSON.parse(localStorage.getItem("user"));
      if (!user.start_self_order) return;
      //set time to reorder if it's now-
      $scope.selfReOrderTime = false;
      var limit1 = new Date(
        date.toLocaleString("en", { month: "long" }) +
          " " +
          date.getDate().toString() +
          ", " +
          date.getFullYear() +
          " " +
          user.start_self_order.toString()
      );
      $scope.limit2 = new Date(limit1.getTime() + 45 * 60000);
      if (date > limit1 && date < $scope.limit2) {
        $scope.btn_text =
          $rootScope.arraylang["reorder_all_routes"][$rootScope.selectedlang];
        $scope.selfReOrderTime = true;
      }
    };
    $scope.startReorder = function (element) {
      if (!$scope.selfReOrder) {
        $scope.btn_text = $rootScope.arraylang["save"][$rootScope.selectedlang];
        //enable scroll while dragging
        angular.element('#activeStopsList')[0].classList.add('scroll-dragged-stops');
        angular.forEach(angular.element('.dnd-scroll-area'),function(element){
          element.style.display = 'block';
        });
        $scope.selfReOrder = true;
      } else {
        $scope.saveDragnDrop();
      }
    };
    $scope.drag = function (ev) {
      ev.preventDefault();
      ev.currentTarget.style.background = "#46b687";
    };
    $scope.onDrop = function (list, items, index) {
      //ev.preventDefault();
      var customer_ids = [];
      if ($scope.selfReOrder) {
        var index = 0;

        angular.forEach(list, function (item) {
          if(!item.parent_order){
            item.stop_index = index++;
            angular.forEach(list,function(sub_order){
              if(sub_order.parent_order == item.customer_id)
                sub_order.stop_index = item.stop_index;
            });
          }    
        });
      }
    };
    //RUTEL on drop option to reorder the route:
    $scope.saveDragnDrop = function () {
      document.getElementById('loader').style.display = 'block';
      document.getElementById("nonloader").style.display = "none";
      $http({
        url: $rootScope.getBaseUrl() + "order/updatestopsindex",

        method: "POST",

        data: $rootScope.activeRoutes,

        headers: {
          "x-csrf-token-app": $rootScope.identify,
          "user-token-app": localStorage.getItem("user_id"),
        },
      }).then(function suc(data) {
        //disable scroll while finish dragging
        angular.element('#activeStopsList')[0].classList.remove('scroll-dragged-stops');
        angular.forEach(angular.element('.dnd-scroll-area'),function(element){
          element.style.display = 'none';
        });
        $scope.selfReOrderTime = false;
        $scope.selfReOrder = false;
        document.getElementById('loader').style.display = 'none';
        document.getElementById("nonloader").style.display = "block";
        if($rootScope.current_user.manual_pallets_arrangment_from_app)
          $scope.driverSelfSchedule();
        if (data.status == 200) {
          console.log(data.statusText);
        }
      });

      if (!$scope.$$phase) $scope.$apply();
    };
    $scope.driverSelfSchedule = function () {
      if($rootScope.crnt_route && $rootScope.crnt_route.length)
        $location.path("/schedule");
    };

    var init = function () {
      if(localStorage.getItem('signing_error') == 'true'){
          $location.path("/nextStop/" + localStorage.getItem('signing_error_order_id'));
      }
      $scope.getRoute();
      var user = JSON.parse(localStorage.getItem("user"));
      if (user.add_order_from_app)
        $scope.getAllCustomers();
      //until the user clicks the reorder button it's not available to drag and drop:

      // $scope.setSelfReOrder();
    };

    init();
  },
]);
