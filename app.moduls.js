(function () {
  "use strict";

  angular.module("RouteSpeed.nextStop", []);

  angular.module("RouteSpeed.orders", []);

  angular
    .module("RouteSpeed", [
      // Angular modules

      "ngAnimate",

      "ngRoute",

      "vsGoogleAutocomplete",

      "signature",

      "dndLists",

      // Custom modules

      "RouteSpeed.nextStop",

      "RouteSpeed.orders",

      "RouteSpeed.theme",

      "ngMaterial",

      "MassAutoComplete",

      "ngSanitize",

      // 3rd Party Modules
    ])

    .run([
      "$rootScope",
      "$location",
      "$http",
      "config",
      "LocationService",
      "StopService",
      "connectPOSTService",
      "$window",
      "$filter",
      function (
        $rootScope,
        $location,
        $http,
        config,
        LocationService,
        StopService,
        connectPOSTService,
        $window,
        $filter
      ) {
        $rootScope.getBaseUrl = function () {
          var envNum = localStorage.getItem("env_num");
          return (
            ($rootScope.baseUrl ? $rootScope.baseUrl : config.baseUrl) +
            (envNum ? envNum : 4) +
            "/optwaysSrv/web/index.php?r="
          );
        };

        $rootScope.$on("$routeChangeStart", function (event, next, current) {
          $rootScope.zoomLevel = 1.0;
          if ($location.path() == "/orders") {
            getOpenDocumentation();
          }
        });
        $rootScope.manageErrorSigningPOD = function(order){
          let order_id = order.id;
          var orderIndex = $filter('getByIdFilter')($rootScope.activeRoutes, parseInt(order_id));
          if(orderIndex>-1 && $rootScope.activeRoutes[orderIndex]){
            $rootScope.activeRoutes[orderIndex].status = 4;
          }
          connectPOSTService.fn('documentation/delete_unsigned_doc&stopid='+order_id+'&status=4').then(function(data) {
            //refresh
            // var timestamp = new Date().getTime();
            // var mainUrlIndex = window.location.href.indexOf('optwaysApp');
            // var mainUrl = window.location.href.slice(0,mainUrlIndex+11);
            // var lastUrl = window.location.href.slice(mainUrlIndex+11);
            // window.location.href = mainUrl+"?ts=" + timestamp + lastUrl;
          }, function(err) {
            var orderIndex = $filter('getByIdFilter')($rootScope.crnt_route, parseInt(order_id));
            if(orderIndex>-1 && $rootScope.crnt_route[orderIndex]){
              var num_order = $rootScope.crnt_route[orderIndex].num_order;
              var customer_name = $rootScope.crnt_route[orderIndex].customer_name;
            }
            let messages = {
              en: `An error occurred while signing the order number ${num_order} of the customer ${customer_name}.`,
              he: `אירעה שגיאה בעת חתימת הזמנה מספר ${num_order} של הלקוח ${customer_name}.`
            };
            $rootScope.errorMessage = messages[$rootScope.selectedlang];
            $('#errorModal').modal('show');
          });
        }
        $rootScope.urlExists = function(url,order,withRemarks=false) {
          $http.get(url+(withRemarks ? "_ERR.pdf" : ".pdf"))
            .then(function(response) {
                if (response.status != 200) {
                  if(!withRemarks)
                    $rootScope.urlExists(url,order,true);
                  else
                    $rootScope.manageErrorSigningPOD(order);
                }
            })
            .catch(function(error) {
              if(!withRemarks)
                $rootScope.urlExists(url,order,true);
              else
                $rootScope.manageErrorSigningPOD(order);
            });
        };
        $rootScope.$on('httpError', function (event, rejection) {
          // Handle the HTTP error globally or perform additional actions
          if(rejection.config.url.includes('set_sign')){
            var order_id = (rejection.config.url.split('&'))[1].slice(3);
            var orderIndex = $filter('getByIdFilter')($rootScope.crnt_route, parseInt(order_id));
            if(orderIndex>-1 && $rootScope.crnt_route[orderIndex]){
              var order = $rootScope.crnt_route[orderIndex];
              var num_order = order.num_order;
              var date = new Date();
              var day = date.getDate();
              var paddedDay = (day < 10) ? '0' + day : day;
              var month = (date.getMonth())+1;
              var paddedMonth = (month < 10) ? '0' + month : month;
              $rootScope.urlExists("https://opti-cstmr-files.s3.us-east-2.amazonaws.com/"+$rootScope.current_user.user_name + "/pod/"+date.getFullYear()+"/"+(paddedMonth)+"/"+paddedDay+"/"+num_order+"_sign_"+$filter('date')(new Date(), 'yyyy_MM_dd').toString(),order,false);
            }
            // $rootScope.signing_error = true;
            // localStorage.setItem('signing_error','true');
            // localStorage.setItem('signing_error_order_id',order_id);
            // if(!$window.navigator.onLine){
            //   if($location.path() == "/orders" || $location.path() != "/nextStop/" + order_id)
            //     $location.path("/nextStop/" + order_id);
            //   console.log('No Wifi connection');

            // }else{
              
            //}
          }
        });
        $rootScope.clearCacheSigningError = function(){
          localStorage.removeItem('signing_error');
          localStorage.removeItem('signing_error_order_id');
          $rootScope.signing_error = false;
        }

        function getOpenDocumentation() {
          var id = localStorage.getItem("user_id");

          if (id && id != "undefined") {
            $http
              .get(
                $rootScope.getBaseUrl() +
                  "documentation/get_open_documentation&id=" +
                  id +
                  "&role=2",
                {
                  headers: {
                    "x-csrf-token-app": $rootScope.identify,
                    "user-token-app": localStorage.getItem("user_id"),
                  },
                }
              )
              .then(
                function (data) {
                  if (data.data.status == "SUCCESS") {
                    if (data.data.documentation) {
                      $rootScope.documentation = data.data.documentation;
                      $rootScope.documentation.goBackToStopPage = true;

                      $location.path(
                        "/nextStop/" + $rootScope.documentation.stop_id
                      );
                    }
                  }
                },
                function (err) {
                  if (err.status == 401) $location.path("/login");
                  else throw err;
                }
              );
          }
        }

        $rootScope.selectedlang = "he";

        $rootScope.arraylang = {
          stops: {
            he: "תחנות",

            en: "Stops",
          },
          amount: {
            he: "כמות",

            en: "Amount",
          },
          short_amount: {
            he: "כ",

            en: "A",
          },

          hello: {
            he: "שלום",

            en: "Hello",
          },

          car: {
            he: "רכב",

            en: "Car",
          },

          hour: {
            he: "שעה",

            en: "Hour",
          },

          date: {
            he: "תאריך",

            en: "Date",
          },

          your_destinations_list_today: {
            he: "רשימת היעדים שלך להיום",

            en: "Your Destinations list today",
          },

          sign_out: {
            he: "התנתק",

            en: "Sign Out",
          },

          customer_address: {
            he: "כתובת לקוח",

            en: "Customer address",
          },

          estimated_time: {
            he: "זמן משוער",

            en: "Estimated time",
          },

          sure_want_sign_out: {
            he: "האם אתה בטוח שברצונך להתנתק",

            en: "Are you sure you want to sign out",
          },

          merge_stops: {
            he: "איחוד תחנות",

            en: "Merge stops",
          },

          want_to_add_stops_to_group: {
            he: "האם ברצונך להוסיף עוד תחנות לקבוצה זו",

            en: "Do you want to add more stops to this group",
          },

          yes: {
            he: "כן",

            en: "Yes",
          },

          no: {
            he: "לא",

            en: "No",
          },

          username: {
            he: "שם משתמש",

            en: "User Name",
          },

          password: {
            he: "סיסמא",

            en: "Password",
          },

          company_id: {
            he: "מזהה חברה",

            en: "Company ID",
          },

          all_fields_must_be_filled: {
            he: "יש למלא את כל השדות",

            en: "All fields must be filled",
          },

          sign_in: {
            he: "התחבר",

            en: "Sign in",
          },

          loading: {
            he: "טוען",

            en: "Loading",
          },

          could_not_identify_your_location: {
            he: "אוופס...לא הצלחנו לזהות את המיקום שלך",

            en: "Oops ... we couldn't identify your location",
          },

          customer_name: {
            he: "שם הלקוח",

            en: "Customer Name",
          },

          phone: {
            he: "טלפון",

            en: "Phone",
          },

          order_number: {
            he: "מספר הזמנה",

            en: "Order Number",
          },

          order_time: {
            he: "שעת הזמנה",

            en: "Order Time",
          },

          remarks: {
            he: "הערות",

            en: "Remarks",
          },

          update_customer: {
            he: "עדכן לקוח",

            en: "Update customer",
          },

          send_message: {
            he: "שלח הודעה",

            en: "Send a message",
          },

          call_the_customer: {
            he: "חייג ללקוח",

            en: "Call the customer",
          },

          arrived_customer: {
            he: "הגעת ללקוח",

            en: "You have reached the customer",
          },

          arrived: {
            he: "כן,הגעתי",

            en: "Yes, I arrived",
          },

          not_arrive: {
            he: "לא הגעתי",

            en: "I did not arrive",
          },

          successfully_delivered: {
            he: "מסרת בהצלחה",

            en: "You have successfully delivered",
          },

          deliver: {
            he: "מסרתי",

            en: "I did",
          },

          not_deliver: {
            he: "לא מסרתי",

            en: "No,I didn't",
          },

          place_customer_address_on_map: {
            he: "דייק/מקם כתובת לקוח במפה",

            en: "Precise / place customer address on map",
          },

          phone_for_SMS: {
            he: "מספר טלפון לקבלת SMS",

            en: "Phone number for SMS",
          },
          email_address: {
            he: "אימייל לקבלת הודעות ומסמכים",

            en: "Email for recieving messages and documents",
          },

          stay_time: {
            he: "זמן מתוכנן לשהיה במקום",

            en: "Planned time to stay",
          },

          opening_time: {
            he: "השעה הכי מוקדמת שאפשר להגיע",

            en: "The earliest possible hour",
          },

          closing_time: {
            he: "השעה הכי מאוחרת שאפשר להגיע",

            en: "The last time you can arrive",
          },

          update: {
            he: "עדכן",

            en: "Update",
          },

          sure_skip_this_station: {
            he: "אתה בטוח מדלג על תחנה זו",

            en: "You're sure to skip this station",
          },

          skip: {
            he: "דלג",

            en: "Skip",
          },

          cancel: {
            he: "ביטול",

            en: "Cancel",
          },

          confirm: {
            he: "אישור",

            en: "Confirm",
          },

          well_done: {
            he: "כל הכבוד",

            en: "Well done",
          },

          great_work: {
            he: "אתה עושה אחלה עבודה",

            en: "You're doing great work",
          },

          thanks: {
            he: "תודה! תן לי להמשיך הלאה",

            en: "Thanks! Let me move on",
          },

          why_dont: {
            he: "הוסף הערה",

            en: "Insert here a note",
          },
          getting_started: {
            he: "התחלת עבודה",

            en: "Getting started",
          },
          reorder_all_routes: {
            he: "סדר מחדש",

            en: "Reorder",
          },
          save: {
            he: "שמור",

            en: "Save",
          },
          self_reorder_stops: {
            he: "באפשרותך לסדר את התחנות עד השעה ",

            en: "You can reorder the stops until: ",
          },
          short_cool: {
            he: "מ",

            en: "C",
          },
          short_frozen: {
            he: "ק",

            en: "F",
          },
          short_multi_groups: {
            he: "ק+מ",

            en: "F+C",
          },
          reorder_route: {
            he: "סדר",

            en: "Reorder",
          },
          refresh: {
            he: "רענן",

            en: "Refresh",
          },
          report_delivery: {
            he: "אתה מדווח כעת על מסירה בתחנה",

            en: "You are now reporting a delivery at the station ",
          },
          report_no_delivery: {
            he: "אתה מדווח כעת על אי מסירה בתחנה",

            en: "You are now reporting a non-delivery at the station ",
          },
          required_field: {
            he: "לפי הגדרות הארגון שדה זה חובה",

            en: "This field is required ",
          },
          update_location: {
            he: "עדכן מיקום",

            en: "Update location ",
          },
          report_pallet_collection: {
            he: "דווח כאן על איסוף משטחים",

            en: "Report here about pallets collection",
          },
          total_pallets: {
            he: ' סה"כ משטחים ',

            en: "Total pallets ",
          },
          total_plastons: {
            he: ' סה"כ פלסטונים ',

            en: "Total plastons ",
          },
          big: {
            he: "גדולים",
            en: "",
          },
          small: {
            he: "קטנים",
            en: "",
          },
          choose_pallet: {
            he: "בחר סוג משטח",
            en: "Select a pallet type",
          },
          report_not_valid: {
            he: "דיווח לא תקין",
            en: "Invalid reporting",
          },
          signature_required: {
            he: "יש לצרף חתימה",
            en: "Signature is required",
          },
          photo_required: {
            he: "יש לצרף תמונה",
            en: "Photo is required",
          },
          update_address: {
            he: "הכתובת תתעדכן לפי מיקומך הנוכחי",
            en: "The address will be updated according to your current location",
          },
          pallet_self_order: {
            he: " סידור עבודה לנהג",
            en: "Daily schedule for the driver ",
          },
          cooled: {
            he: "מצוננים",
            en: "cooled",
          },
          jack: {
            he: "ג'ק",
            en: "Jack",
          },
          units: {
            he: "יח",
            en: "units",
          },
          weight: {
            he: "משקל",
            en: "weight",
          },
          space: {
            he: "  ",
            en: "  ",
          },
          add_to_route: {
            he: "הוסף למסלול",
            en: "Add to route",
          },
          add_to_route_header: {
            he: "בחר לקוח כדי להכניסו למסלול",
            en: "Select a customer in order to insert him to the route",
          },
          update_formatted_address: {
            he: "הכתובת תתעדכן ל-",
            en: "The address will be updated to-",
          },
          wooden: {
            he: "משטח עץ",
            en: "wooden",
          },
          plaston:{
            he: "פלסטון",
            en: "plaston",
          },
          plastic: {
            he: "פלסטיק",
            en: "plastic",
          },
          given: {
            he: "נמסרו ללקוח",
            en: "Delivered",
          },
          collected: {
            he: "נאספו מהלקוח",
            en: "Collected",
          },
          items_management: {
            he: "עדכון פריטים",
            en: "Items management",
          },
          item_name: {
            he: "שם הפריט",
            en: "Item name",
          },
          force_delivery_msg: {
            he: "יש ללחוץ על הכפתור מסרתי או על הכפתור לא מסרתי - על מנת לצאת ממסך זה",
            en: "Click on the Submit button or the Undeliver button - to exit this screen",
          },
          location_required_message: {
            he: "על מנת להשתמש באפליקציה יש לאפשר גישה למיקום",
            en: "",
          },
          camera_required_message: {
            he: "על מנת להשתמש באפליקציה יש לאפשר גישה למצלמה",
            en: "",
          },
          location_required_help_url: {
            he: "https://support.google.com/chrome/answer/142065?hl=iw&co=GENIE.Platform%3DAndroid&oco=1",
            en: "",
          },
          camera_required_help_url: {
            he: "https://support.google.com/chrome/answer/2693767?hl=iw&co=GENIE.Platform%3DAndroid",
            en: "",
          },
          same_customer_else_orders1: {
            he: " שים לב ללקוח זה יש",
            en: "Note this customer has",
          },
          same_customer_else_orders2: {
            he: "תעודות שלא נחתמו",
            en: "additional certificates",
          },
          opening_time: {
            he: "זמן פתיחה",
            en: "Opening time",
          },
          closing_time: {
            he: "זמן סגירה",
            en: "Closing time",
          },
          confirm_close_sign_modal: {
            he: "בטוח? לסגור בלי לחתום?",
            en: "Are you sure that you confirm close without signing?",
          },
          confirm_cleaning_signature: {
            he: "בטוח? למחוק את החתימה?",
            en: "Are you sure that you confirm cleaning the signature?",
          },
          confirm_send_sign_without_remarks: {
            he: "אין הערות? לאשר ולשלוח?",
            en: "No remarks? Confirm and send?",
          },
          try_again: {
            he: "נסה שוב",
            en: "try again",
          },
          try_again2: {
            he: "קבלתי, אנסה שוב",
            en: "Got it, I'll try again",
          },
          error_message: {
            he: "מצטערים, נוצרה שגיאה",
            en: "Sorry, an error occurred",
          },
          go_back: {
            he: "חזור אחורה",
            en: "Go back",
          },
          delivery_shipments:{
            he:'משלוחים למסירה',
            en:'Shipments for delivery'
          },
          files_have_not_loaded_yet:{
            he:'טרם הושלמה טעינת הקבצים להחתמה, נא המתן',
            en:'The files have not yet been loaded, please waity'
          },
          mission_header:{
            he:'משימה לביצוע בכתובת זו',
            en:'Task to be performed at this address'
          },
          confirm_and_continue:{
            he:'אישור והמשך',
            en:'OK and continue'
          },
          continue_without_confirmation:{
            he:'המשך ללא אישור',
            en:'Continue without permission'
          },
          requires_confirmation:{
            he:'דרוש אישור',
            en:'Confirmation required'
          },
          short_delivery:{
            he:"מש'",
            en:'dv.'
          },
          address_notes:{
            he:"הערות לכתובת",
            en:'Comments to this address'
          },
          customer_note:{
            he:"הערה ללקוח",
            en:'note'
          },
          mission:{
            he:"משימה",
            en:'mission'
          },
          parking_area_img_btn:{
            he:'צלם מקום חניה',
            en:'Take a parking space picture'
          },
          unloading_area_img_btn:{
            he:'צלם מקום פריקה',
            en:'Take a unloading space picture'
          },
          no_wifi_connection:{
            he:'לא ניתן לשלוח חתימה במצב אופליין, בדוק את החיבור לרשת ונסה שנית',
            en:'Unable to send signature in offline mode, check network connection and try again'
          },
          maxlength_returns:{
            he:'טקסט זה לא יכול להכיל יותר מ-120 תווים.',
            en:'This text cannot contain more than 120 characters'
          },
        navigate:{
            he:'ניווט',
            en:'Navigate'
        },
        confirm_apple_maps:{
            he:'לפתוח ב-Apple Maps? לחץ על ביטול כדי לפתוח ב-Waze.',
            en:'Open in Apple Maps? Click Cancel to open in Waze.'
        }
        };
        $rootScope.zoomLevel = 1.0;
        var currentPosition;

        $rootScope.logout = function () {
          $rootScope.user_name = null;

          $rootScope.password = null;

          $rootScope.identify = null;

          localStorage.clear();

          angular.element(".modal").trigger("click");

          $location.path("/login");
        };

        $rootScope.login = function (username, password, identify, routeToChange=0) {
          
          var data = {
            data: {
              name: username,

              password: password,

              route_to_change: routeToChange
            },
          };

          $.ajax({
            url: $rootScope.getBaseUrl() + "messengers/loginuser",

            data: data,

            type: "post",

            headers: {
              "x-csrf-token-app": identify,
            },
          }).then(
            function (response) {
              //console.log(response);

              if (response && response != "null" && response != null) {
                //console.log(response);

                try {
                  var data = JSON.parse(response);
                  $rootScope.loginFlag = true;
                } catch (error) {
                  alert(error);
                }

                if (!data || data == "undefined") {
                  alert("ארעה שגיאה בנתונים (data)");

                  return;
                }

                if (data.default_env) {
                  // $window.location.href =
                  //   "https://" +
                  //   data.default_env +
                  //   ".optiroutes.com/dev4/optwaysApp/#/orders";
                  $rootScope.baseUrl =
                    "https://" +
                    data.default_env +
                    ".optiroutes.com/dev";
                }

                if (data.id && data.id != "undefined") {
                  localStorage.setItem("user_id", data.id);
                } else {
                  alert("ארעה שגיאה בנתונים (data)");

                  return;
                }

                if (data.authKey && data.authKey != "undefined") {
                  localStorage.setItem("auth", data.authKey);
                } else {
                  alert("error in returned data");

                  return;
                }

                if (data.name && data.name != "undefined") {
                  localStorage.setItem("username", data.name);
                } else {
                  alert("error in returned data");
                }

                if (data.password && data.password != "undefined") {
                  localStorage.setItem("password", data.password);
                } else {
                  alert("error in returned data");

                  return;
                }

                if (
                  data.lng_office &&
                  data.lng_office != "undefined" &&
                  data.lat_office &&
                  data.lat_office != "undefined"
                ) {
                  localStorage.setItem("lat_office", data.lat_office);

                  localStorage.setItem("lng_office", data.lng_office);
                }

                $rootScope.selectedlang = data.lang ? data.lang : "he";

                if ($rootScope.selectedlang != "he") {
                  document
                    .getElementById("bootstrap")
                    .setAttribute("href", "css/bootstrap.min.css");

                  document
                    .getElementById("app_style")
                    .setAttribute("href", "css/style-ltr.css");
                }
                data.workday_start = new Date(data.workday_start);

                localStorage.setItem("identify_number", identify);

                localStorage.setItem("city", data.city);

                //el 27.12.21
                localStorage.setItem("requier_sign", data.requier_sign);
                localStorage.setItem("requier_photo", data.requier_photo);
                localStorage.setItem("require_sign_name", data.require_sign_name);
                localStorage.setItem("requier_surface", data.requier_surface);

                localStorage.setItem("pod_option", data.pod_option);

                localStorage.setItem("thumbtack_option", data.thumbtack_option);
                localStorage.setItem("v_option", data.v_option);
                localStorage.setItem("x_option", data.x_option);
                localStorage.setItem("amount_option", data.amount_option);
                localStorage.setItem(
                  "hide_dayes_arror",
                  data.app_hide_dayes_arror
                );
                localStorage.setItem(
                  "access_permission_required",
                  data.access_permission_required
                );
                localStorage.setItem("show_cash", data.show_cash);

                $rootScope.current_user = data;

                $rootScope.identify = identify;

                localStorage.setItem("user", JSON.stringify(data));

                //console.log(localStorage.getItem('user'));

                $location.path("/orders");

                $rootScope.$apply();

                LocationService.getLocation();
              } else {
                alert("שם משתמש או סיסמא אינם נכונים");

                $location.path("/login");
              }
            },
            function fail(data) {
              alert("שגיאה בניסיון כניסה למערכת");
              //alert(data);

              $location.path("/login");
            }
          );
        };
        $rootScope.wait_for_pod_files = false;
        $rootScope.getPodFiles = function(id){
          $rootScope.wait_for_pod_files = true;
          connectPOSTService.fn("track/getpodfiles&id="+id).then(function (data) {
            var orders = data.data.pod_files;
            for (let i = 0; i < orders.length; i++) {
              //RUT 27/06/23 Get all POD files while getting the whole route
              //In order that during the route also in offline status driver will get the pod
              if(orders[i].pod_file && orders[i].pod_file != 'no_file'){
                try {
                  var binary_string = window.atob(orders[i].pod_file);
                  var len = binary_string.length;
                  var bytes = new Uint8Array(len);
                  for (var byt = 0; byt < len; byt++) {
                      bytes[byt] = binary_string.charCodeAt(byt);
                  }
                  orders[i].pod_file = bytes.buffer;
                } catch(e) {
                  
                }
              }
            }  
            $rootScope.pod_files = orders;
            $rootScope.wait_for_pod_files = false;
          },
          function (e) {
            $rootScope.wait_for_pod_files = false;
            if(e.status == 504 || e.status == 500){
              $rootScope.timeoutStatus = true;
            }
            document.getElementById('loader').style.display = 'none';
    
            document.getElementById("nonloader").style.display = "block";
          });
    
        }

        $rootScope.parseDate = function (str) {
          var parts = str.split(" ");
          var dateparts = parts[0].split("-");
          var timeparts = (parts[1] || "").split(":");
          var year = +dateparts[0];
          var month = +dateparts[1];
          var day = +dateparts[2];
          var hours = timeparts[0] ? +timeparts[0] : 0;
          var minutes = timeparts[1] ? +timeparts[1] : 0;
          var seconds = timeparts[2] ? +timeparts[2] : 0;
          // Treats the string as UTC, but you can remove the `Date.UTC` part and use
          // `new Date` directly to treat the string as local time
          return new Date(
            Date.UTC(year, month - 1, day, hours, minutes, seconds)
          );
        };
        function setViewportScale(scale = $rootScope.zoomLevel) {
          var viewportMeta = document.getElementById('viewportMeta');
          if (viewportMeta) {
              viewportMeta.setAttribute('content', "width=device-width, initial-scale=1.0, maximum-scale="+scale+", minimum-scale="+scale+", user-scalable=0, minimal-ui");
          }
        }
        $rootScope.zoomIn = function(plus = true){
          if(plus && $rootScope.zoomLevel <= 1.2){
            $rootScope.zoomLevel += 0.2;
          }else if(!plus && $rootScope.zoomLevel >= 0.8){
            $rootScope.zoomLevel -= 0.2;
          }
          setViewportScale(); // Adjust the values as needed
        }
        $rootScope.manageVersions = function(){
          window.open("https://optiroutes.com/a/",'_blank');
        }
        $rootScope.checkVersion = function () {//For browser only
          $.ajax({
            url: $rootScope.getBaseUrl() + "site/version",

            type: "get",

            headers: {
              device: "webPage",
              "x-csrf-token-app": $rootScope.identify,
              "user-token-app": localStorage.getItem("user_id"),
            },
          }).then(function suc(response) {
            //RUT if no version number as after logout dont hard-refresh only update version number
				    if(localStorage.getItem('optVrsn')){
              if (response != localStorage.getItem("optVrsn")) {
                localStorage.setItem("optVrsn", response);
                var timestamp = new Date().getTime();
                var mainUrlIndex = window.location.href.indexOf('optwaysApp');
                var mainUrl = window.location.href.slice(0,mainUrlIndex+11);
                var lastUrl = window.location.href.slice(mainUrlIndex+11);
                window.location.href = mainUrl+"?ts=" + timestamp + lastUrl;
              }
            }else{
              localStorage.setItem("optVrsn", response);
            }
          });
        };

        $rootScope.modal = {};

        $rootScope.saveAddress = StopService.saveAddress;

        function init() {
          var username = localStorage.getItem("username");

          var password = localStorage.getItem("password");

          var identifyNumber = localStorage.getItem("identify_number");

          if (
            username &&
            username != "undefined" &&
            password &&
            password != "undefined" &&
            identifyNumber &&
            identifyNumber != "undefined"
          ) {
            $rootScope.user_name = username;

            $rootScope.password = password;

            $rootScope.identify = identifyNumber;

            $rootScope.loginFlag = true;

            $rootScope.login(
              $rootScope.user_name,
              $rootScope.password,
              $rootScope.identify
            );
          } else {
            $location.path("/login");
          }
        }

        init();
      },
    ]);
})();
