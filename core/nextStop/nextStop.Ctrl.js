angular.module("RouteSpeed.nextStop").controller("nextStopCtrl", [
  "$scope",
  "$rootScope",
  "$http",
  "$window",
  "$location",
  "$filter",
  "$routeParams",
  "$sce",
  "StopService",
  "connectPOSTService",

  function nextStopCtr(
    $scope,
    $rootScope,
    $http,
    $window,
    $location,
    $filter,
    $routeParams,
    $sce,
    StopService,
    connectPOSTService
  ) {
    // el 27.12.21
    $scope.requier_sign =
      localStorage.getItem("requier_sign") == 1 ? true : false;
    $scope.requier_photo =
      localStorage.getItem("requier_photo") == 1 ? true : false;
    $scope.require_sign_name =
      localStorage.getItem("require_sign_name") == 1 ? true : false;
    $scope.requier_surface =
      localStorage.getItem("requier_surface") == 1 ? true : false;
    //$scope.invalid_reporting=$scope.requier_surface==false?0:1;
    
    // efrat 14.11.22 close dialog model on back to the previous page event
    $(window).on("popstate", function () {
      //console.log("back");
      angular.element("#disgitalSignatureModal").modal("hide");
      $(".modal-backdrop").remove();
    });

    // if (
    //   "mediaDevices" in navigator &&
    //   "getUserMedia" in navigator.mediaDevices
    // ) {
    //   console.log("Let's get this party started");
    // }

    // efrat 15.09.22 : enabel zoom in on stop page (In order to be able to read the pdf )
    $viewport = $('head meta[name="viewport"]');
    $viewport.attr(
      "content",
      "width=device-width, initial-scale=1.0,minimum-scale=0.1,maximum-scale=10,user-scalable=1, minimal-ui"
    );

    $scope.boundingBox = {
      width: 700,
      height: 300,
    };

    $scope.has_reported_pallets = false;
    $scope.has_signed_pod = false;
    $scope.attachedImages = [];
    $scope.returns = "";
    $scope.validReturnsLength=true;
    $scope.double_documentaion = false;


    function loadPdf(url,isPreview=false) {
      // If absolute URL from the remote server is provided, configure the CORS
      // header on that server.
      //var url = '../optwaysSrv/web/template.pdf';
      var pdfContainerId = isPreview ? "pdf_preview_container" : "pdf_container";
      // Loaded via <script> tag, create shortcut to access PDF.js exports.
      var pdfjsLib = window["pdfjs-dist/build/pdf"];

      // The workerSrc property shall be specified.
      pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      // Asynchronous download of PDF
      var loadingTask = pdfjsLib.getDocument(url);
      loadingTask.promise.then(
        function (pdf) {
          console.log("PDF loaded");
          var div = document.getElementById(pdfContainerId);
          //remove last order pod file if exists(customer_sub_orders issue RUT 13/08/23)
          while (div.firstChild) {
              div.removeChild(div.firstChild);
          }
          //RUTEL display all the PDF file pages:
          for (var num = 1; num <= pdf.numPages; num++) {
            // Fetch the first page
            var pageNumber = num;
            pdf.getPage(pageNumber).then(function (page) {
              console.log("Page loaded");

              // var viewport = page.getViewport({scale:1});
              //var scale = document.getElementById(pdfContainerId).clientWidth / (viewport.width * (96/72));
              var scale = 1.5;
              viewport = page.getViewport({ scale: scale });
              // Prepare canvas using PDF page dimensions
              var canvas = document.createElement("canvas");
              canvas.classList.add("col-xs-12");
              canvas.classList.add("no-padding");
              var div = document.getElementById(pdfContainerId);
              
              div.appendChild(canvas);
              //var canvas = document.getElementById('the-canvas');
              var context = canvas.getContext("2d");
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              // Render PDF page into canvas context
              var renderContext = {
                canvasContext: context,
                viewport: viewport,
              };
              var renderTask = page.render(renderContext);
              renderTask.promise.then(function () {
                console.log("Page rendered");
              });
            });
          }
        },
        function (reason) {
          // PDF loading error
          console.error(reason);
          alert(reason.message);
        }
      );
    }

    // SHOW THE SNAPSHOT.
    $scope.takeAddressSnapShot = function (type='parking') {
      if ($("#updateAddressCamera")[0].style.display == "none")
        $("#updateAddressCamera")[0].style.display = "block";
      else {
        Webcam.set({
          video: { facingMode: "environment" },
        });

        Webcam.snap(function (data_uri) {
          if(type == 'parking'){
            $scope.current_stop.parking_area_img = data_uri;
            angular.element('#updateAddressSubmitBtn')[0].style.marginTop = '70px';
          }else{
            $scope.current_stop.unloading_area_img = data_uri;
            angular.element('#parking_area_img')[0].style.marginTop = '70px';
          }
            
          alert("התמונה צולמה");
          $("#updateAddressCamera")[0].style.display = "none";
        });
      }
    };
    // Cordova success and error callbacks
    function onSuccess(imageData) {
      $scope.$apply(function () {
          $scope.attachedImages.push("data:image/jpeg;base64," + imageData);
      });
      alert("התמונה צולמה");
    }

    function onFail(message) {
      alert("Failed because: " + message);
    }
    //Take snapshot
    $scope.takeSnapShot = function () {
      if (window.cordova) {
        // Cordova environment: Use cordova-plugin-camera
        navigator.camera.getPicture(onSuccess, onFail, {
            quality: 100,
            destinationType: Camera.DestinationType.DATA_URL, // For base64 string
            saveToPhotoAlbum: false,
            correctOrientation: true,
            cameraDirection: Camera.Direction.BACK
        });
      } else {
        if ($("#camera")[0].style.display == "none")
          $("#camera")[0].style.display = "block";
        else {
          Webcam.set({
            video: { facingMode: "environment" },
          });

          Webcam.snap(function (data_uri) {

            $scope.attachedImages.push(data_uri);
            alert("התמונה צולמה");

            $("#camera")[0].style.display = "none";

          });
        }
      }
    };
    //Upload image from devicve
    $scope.uploadAddressImage = function(e){
      if (e.target.files && e.target.files[0]) {
        var reader = new FileReader();

        if(e.target.id == 'addressParkingImgUpload')
          reader.onload = $scope.addressParkingImageIsLoaded;
        else
          reader.onload = $scope.addressUnloadingImageIsLoaded;
        reader.readAsDataURL(e.target.files[0]);;
      }
    }
    $scope.uploadImage = function(e){
      if (e.target.files && e.target.files[0]) {
        var reader = new FileReader();

        reader.onload = $scope.imageIsLoaded;
        reader.readAsDataURL(e.target.files[0]);;
      }
    }
    $scope.addressParkingImageIsLoaded = function(e){
      $scope.$apply(function() {
          $scope.current_stop.parking_area_img = e.target.result;
          angular.element('#updateAddressSubmitBtn')[0].style.marginTop = '70px';
      });
    }
    $scope.addressUnloadingImageIsLoaded = function(e){
      $scope.$apply(function() {
          $scope.current_stop.unloading_area_img = e.target.result;
          angular.element('#parking_area_img')[0].style.marginTop = '70px';
      });
    }
    $scope.imageIsLoaded = function(e){
      $scope.$apply(function() {
          $scope.attachedImages.push(e.target.result);
      });
    }

    $scope.resetSnapShot = function () {
      Webcam.reset();
    };

    function stopVideoOnly(stream) {
      stream.getTracks().forEach(function (track) {
        if (track.readyState == "live" && track.kind === "video") {
          track.stop();
        }
      });
    }
    $scope.deleteAddressImage = function(url,type='parking'){
      if(type == 'parking')
        $scope.current_stop.parking_area_img = undefined;
      else
      $scope.current_stop.unloading_area_img = undefined;
    }
    $scope.deleteImage = function (url) {
      //var index = $scope.array.indexOf(url);
      $scope.attachedImages.splice(url, 1);
      //alert($scope.attachedImages);
    };

    function dataURItoBlob(dataURI) {
      // convert base64/URLEncoded data component to raw binary data held in a string

      var byteString;

      if (dataURI.split(",")[0].indexOf("base64") >= 0)
        byteString = atob(dataURI.split(",")[1]);
      else byteString = unescape(dataURI.split(",")[1]);

      // separate out the mime component

      var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

      // write the bytes of the string to a typed array

      var ia = new Uint8Array(byteString.length);

      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      return new Blob([ia], { type: mimeString });
    }

    
    //$scope.signatureff=accept()
    $scope.signForm = function (status = $scope.delivery_status) {
      var signature = $scope.accept();
      if ($scope.requier_photo && $scope.attachedImages.length == 0) {
        document.getElementById("requier_photo_label").style.display = "block";
        $scope.delivery_status = status;
      } else if (
        $scope.requier_sign &&
        (signature.dataUrl == undefined || signature.isEmpty == true)
      ) {
        document.getElementById("requier_sign_label").style.display = "block";
      } else {
        document.getElementById("loading").style.display = "block";
        var cropedImage =
          typeof signature.dataUrl !== "undefined"
            ? dataURItoBlob(signature.dataUrl)
            : null;
        var fileData = new FormData();

        for (var i = 0; i < $scope.attachedImages.length; i++) {
          var blobedUri = dataURItoBlob($scope.attachedImages[i]);
          fileData.append(
            "img" + i.toString(),
            blobedUri,
            "img" + i.toString() + ".jpeg"
          );
        }
        if (cropedImage) {
          fileData.append("file", cropedImage, "signature.png");
        }
        fileData.append("sign_file", $scope.sign_file);
        fileData.append("remarks", $scope.delivered_remarks);
        fileData.append("returns", $scope.returns);
        fileData.append("receiver_name", $scope.receiverName);
        fileData.append("receiver_phone_number", $scope.receiverPhoneNumber);
        fileData.append("collected_pallets", ($scope.current_stop.small_pallets ? $scope.current_stop.small_pallets : 0));
        if($scope.current_stop.big_pallets)
          fileData.append("delivered_pallets", ($scope.current_stop.big_pallets));
        if($scope.current_stop.collected_plastons)
          fileData.append("collected_plastons", ($scope.current_stop.collected_plastons));
        if($scope.current_stop.delivered_plastons)
          fileData.append("delivered_plastons", ($scope.current_stop.delivered_plastons));
        fileData.append(
          "lat",
          $rootScope.currentPosition ? $rootScope.currentPosition.lat : null
        );
        fileData.append(
          "lng",
          $rootScope.currentPosition ? $rootScope.currentPosition.lng : null
        );
        if($rootScope.currentPosition && $rootScope.currentPosition.address){
          fileData.append("formattedAddress",$rootScope.currentPosition.address);
        }
        
        $rootScope.signing_error = false;
        localStorage.setItem('signing_error','false');
        if(!$rootScope.current_user.async_signing)
          angular.element("#disgitalSignatureModal").modal("hide");
        var postReq = $http
          .post(
            $rootScope.getBaseUrl() +
              "order/set_signature&id=" +
              $scope.current_stop.id +
              "&images=" +
              $scope.attachedImages.length,
            fileData,
            {
              headers: {
                "Content-Type": undefined,
                "x-csrf-token-app": $scope.identify,
                "user-token-app": localStorage.getItem("user_id"),
              },
            }
          );
          if(!$rootScope.current_user.async_signing){
            postReq.then(
              function (response) {
                $scope.finishSigning();
              },
              function (err) {
                document.getElementById("loading").style.display = "none";
                $scope.errorMessage = $rootScope.arraylang['error_message'][$rootScope.selectedlang];
                $('#errorModal').modal('show');
              }
            );
          }else{
            $scope.finishSigning();
          }

      }
    };
    $scope.finishSigning = function(){
      // el 27.12.21
      $scope.current_stop.pod = 1;
      angular.forEach($scope.sub_customer_orders,function(sub_order){
        if(sub_order.id == $scope.current_stop.id)
          sub_order.pod = 1;
      })
      angular.element("#disgitalSignatureModal").modal("hide");
      var customer_id = $scope.current_stop.customer_id;
      var current_id = $scope.current_stop.id;
      if($rootScope.current_user.pod_option && $scope.sub_customer_orders.length && $scope.sub_customer_orders.filter(function(sub_order){
        return !sub_order.pod && !sub_order.pod_file_exists;
      }).length){
        //there are else pod's
        $scope.has_signed_pod = false;
        document.getElementById("loading").style.display = "none";
        angular.element("#sameCustomerMessageModal").modal("show");
        setTimeout(function(){
          angular.element("#sameCustomerMessageModal").modal("hide");
        },1000);
      }else
        $scope.has_signed_pod = true;

      $scope.beforeDone(true);
    }
    $scope.hasSigned = function () {
      var signature = $scope.accept();
      return (
        $scope.requier_sign &&
        (signature.dataUrl == undefined || signature.isEmpty == true)
      );
    };
    function openDigitalSignatureModal(modalid,lastModalId) {
      if(Array.isArray(lastModalId)){
        var isVisibleModal = false;
        angular.forEach(lastModalId,function(id){
          if($('#' + id).is(':visible')){
            isVisibleModal = true;
            //Attaches a function to the closing event
            $('#' + id).on('hidden.bs.modal', function () {
              //Opens the new model when the closing completes
              $('#' + modalid).modal('show');
              //Unbinds the callback
              $('#' + id).off('hidden.bs.modal');
            });
            //Hides the current modal
            $('#' + id).modal('hide');
          }
        });
        if(!isVisibleModal){
          $('#' + modalid).modal('show');
        }
      }else{
        if($('#' + lastModalId).is(':visible')){
          //Attaches a function to the closing event
          $('#' + lastModalId).on('hidden.bs.modal', function () {
            //Opens the new model when the closing completes
            $('#' + modalid).modal('show');
            //Unbinds the callback
            $('#' + lastModalId).off('hidden.bs.modal');
          });
          //Hides the current modal
          $('#' + lastModalId).modal('hide');
        }else{
          $('#' + modalid).modal('show');
        }
      }          
    }
    $scope.openPodFilePreview = function(){
      if($rootScope.current_user.pod_option){
          if(!$rootScope.pod_files){
            document.getElementById("loading").style.display = "none";
            $scope.errorMessage = $rootScope.arraylang['files_have_not_loaded_yet'][$rootScope.selectedlang];
            $('#errorModal').modal('show');
            return;
          }
          var orderIndexInGlobalRoute = $filter('getByIdFilter')($rootScope.pod_files, $scope.current_stop.id);
          if(orderIndexInGlobalRoute>-1 && $rootScope.pod_files[orderIndexInGlobalRoute].pod_file){
            document.getElementById("loading").style.display = "none";
            $scope.sign_file = $rootScope.pod_files[orderIndexInGlobalRoute].url;//url
            //Because here its syncronous check if there is another modal in order to close it before
            if ($rootScope.pod_files[orderIndexInGlobalRoute].pod_file != "no_file") {
              openDigitalSignatureModal('podFilePreviewModal',['completingMissionModal','collectingPalletsModal']);
              var currentPdf = angular.copy($rootScope.pod_files[orderIndexInGlobalRoute]);
              loadPdf(currentPdf.pod_file,true);
            } 
        }
      }
    }
    $scope.openSignFile = function () {
      if ($rootScope.current_user.pod_display_fields)
        $scope.initPodDisplayFields();
      if(!$rootScope.pod_files && !$rootScope.timeoutStatus){
        if(!$rootScope.wait_for_pod_files){
          $rootScope.getPodFiles($scope.current_stop.track_id);
        }
        document.getElementById("loading").style.display = "none";
        $scope.errorMessage = $rootScope.arraylang['files_have_not_loaded_yet'][$rootScope.selectedlang];
        $('#errorModal').modal('show');
        return;
      }else if($rootScope.pod_files){
        var orderIndexInGlobalRoute = $filter('getByIdFilter')($rootScope.pod_files, $scope.current_stop.id);
        if(orderIndexInGlobalRoute == -1){
          orderIndexInGlobalRoute = $filter('getByNumOrderFilter')($rootScope.pod_files, $scope.current_stop.num_order);
        }
        if(orderIndexInGlobalRoute>-1 && $rootScope.pod_files[orderIndexInGlobalRoute].pod_file){
          document.getElementById("loading").style.display = "none";
          $scope.sign_file = $rootScope.pod_files[orderIndexInGlobalRoute].url;//url
          //Because here its syncronous check if there is another modal in order to close it before
          openDigitalSignatureModal('disgitalSignatureModal',['completingMissionModal','collectingPalletsModal']);
          if ($rootScope.pod_files[orderIndexInGlobalRoute].pod_file != "no_file") {
            var currentPdf = angular.copy($rootScope.pod_files[orderIndexInGlobalRoute]);
            loadPdf(currentPdf.pod_file);
          } 
        }
      }else{
        $http
        .get(
          $rootScope.getBaseUrl() +
            "order/get_order_pod_file&id=" +
            $scope.current_stop.id,
          {
            headers: {
              "x-csrf-token-app": $scope.identify,
              "user-token-app": localStorage.getItem("user_id"),
            },
          }
        )
        .then(
          function (data) {
            if (data.data.status == "error") {
              document.getElementById("loading").style.display = "none";
              angular.element("#disgitalSignatureModal").modal("show");
              $scope.sign_file = data.data.data;
              // loadPdf($scope.sign_file);
              //$scope.beforeDone(true);
            } else {
              document.getElementById("loading").style.display = "none";
              angular.element("#disgitalSignatureModal").modal("show");
              $scope.sign_file = data.data.data;
              // efrat 18.09.22 put next line in comment - pdf will not open
              //$window.open($scope.sign_file, '_blank');
              var currentPdf = angular.copy($scope.sign_file);
              loadPdf(currentPdf);
            }
          },
          function (err) {
            document.getElementById("loading").style.display = "none";
            if (err.status == 401) $location.path("/login");
            else throw err;
          }
        );
      }
    };

    $scope.initPodDisplayFields = function () {
      $scope.podDisplayFields = [];

      //set pod_display_fields as defined

      var fields = $rootScope.current_user.pod_display_fields.split(",");
      angular.forEach(fields, function (fieldValue) {
        if ($scope.current_stop.remarks.includes(fieldValue)) {
          var startIndex = $scope.current_stop.remarks.indexOf(fieldValue);
          var fieldRange = $scope.current_stop.remarks.slice(startIndex);
          var endIndex = fieldRange.indexOf(",");
          fieldRange = fieldRange.slice(0, endIndex);
          var displayField = {};
          displayField.key = fieldValue;
          displayField.value = fieldRange.split(":")[1];
          $scope.podDisplayFields.push(displayField);
        } else if ($rootScope.current_user.titles[fieldValue]) {
          if ($scope.current_stop[$rootScope.current_user.titles[fieldValue]]) {
            var displayField = {};
            displayField.key = fieldValue;
            displayField.value =
              $scope.current_stop[$rootScope.current_user.titles[fieldValue]];
            $scope.podDisplayFields.push(displayField);
          }
        }
      });
    };

    var currentPosition = null;

    $scope.documentation = {};

    $scope.identify = localStorage.getItem("identify_number");

    $scope.current_expense;

    $scope.delivered_remarks = "";

    $scope.isDone;

    $scope.goBack = function () {
      $viewport = $('head meta[name="viewport"]');
      $viewport.attr(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0, minimal-ui"
      );

      if ($scope.documentation.start_hour || $rootScope.signing_error || localStorage.getItem('signing_error') == 'true') {
        //alert("יש ללחוץ על הכפתור מסרתי או על הכפתור לא מסרתי - על מנת לצאת ממסך זה");
        angular.element("#arrivalReportingAppModal").modal("show");
      } else if ($rootScope.current_user.pod_option && $scope.sub_customer_orders.filter(function(sub_order){
        return sub_order.pod;
      }).length && !$scope.has_signed_pod) {//אם יש מספר תעודות חלק נחתמו וחלק עדיין לא
        angular.element("#sameCustomerMessageModal").modal("show");
        setTimeout(function(){
          angular.element("#sameCustomerMessageModal").modal("hide");
        },1000);
      } else {
        //if(!customerHasMoreOrders())
        //{
        $location.path("/orders");
        //}
      }
    };

    $scope.getArrTime = StopService.getArrTime;
    $scope.isIOS = function () {
          // iOS detection including newer iPads
          return (
            /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
          );
    };
    
    $scope.navigate = function (current_stop) {
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
            if (confirm($rootScope.arraylang['confirm_apple_maps'][$rootScope.selectedlang])) {
                window.open(appleMapsUrl, "_blank");
            } else {
                urlScheme = "waze://?"+url.split('?')[1];
                
                // Attempt to launch Waze app or fallback to website
                var newTab = window.open(urlScheme, '_blank');
                newTab.focus(); // Focus on the newly opened tab
            }
        }else{
            
            urlScheme = url; // Fallback to website URL
            
            // Attempt to launch Waze app or fallback to website
            var newTab = window.open(urlScheme, '_blank');
            newTab.focus(); // Focus on the newly opened tab
        }
      

    };

    $scope.pinMap = function () {
      var map;

      var marker;

      var geocoder = new google.maps.Geocoder();

      var infowindow = new google.maps.InfoWindow();

      var myLatlng = new google.maps.LatLng(
        $scope.current_stop.lat,
        $scope.current_stop.lng
      );

      //currentPosition&&currentPosition.lat&&currentPosition.lng?new google.maps.LatLng(currentPosition.lat,currentPosition.lng):new google.maps.LatLng($scope.current_stop.lat,$scope.current_stop.lng);

      var mapOptions = {
        zoom: 18,

        center: myLatlng,

        mapTypeId: google.maps.MapTypeId.ROADMAP,
      };

      $scope.address.opening_time =
        $scope.current_stop.customer &&
        $scope.current_stop.customer.opening_time
          ? new Date($scope.current_stop.customer.opening_time)
          : null;

      $scope.address.closing_time =
        $scope.current_stop.customer &&
        $scope.current_stop.customer.closing_time
          ? new Date($scope.current_stop.customer.closing_time)
          : null;

      $scope.address.customer_name = $scope.current_stop.customer_name;

      //$scope.tempAddress = {};

      map = new google.maps.Map(document.getElementById("pinMap"), mapOptions);

      marker = new google.maps.Marker({
        map: map,

        position: myLatlng,

        draggable: true,
      });

      marker.addListener("click", function () {
        infowindow.open(map, marker);
      });

      var infowindow = new google.maps.InfoWindow({
        content: "",
      });

      geocoder.geocode(
        {
          latLng: myLatlng,
        },
        function (results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
              $scope.address.address = results[0].formatted_address;

              $scope.address.lat = marker.getPosition().lat();

              $scope.address.lng = marker.getPosition().lng();

              if (!$scope.$$phase) $scope.$apply();

              infowindow.setContent(results[0].formatted_address);

              infowindow.open(map, marker);
            }
          }
        }
      );

      google.maps.event.addListener(marker, "dragend", function () {
        geocoder.geocode(
          {
            latLng: marker.getPosition(),
          },
          function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              if (results[0]) {
                console.log(results);

                console.log(marker.getPosition().lat());

                console.log(marker.getPosition().lng());

                $scope.address.address = results[0].formatted_address;

                var components = [];

                for (var i = 0; i < results[0].address_components.length; i++) {
                  components[results[0].address_components[i].types.join(" ")] =
                    results[0].address_components[i].long_name;
                }

                $scope.address.lat = marker.getPosition().lat();

                $scope.address.lng = marker.getPosition().lng();

                $scope.address.country = components["country political"];

                $scope.address.city = components["locality political"];

                $scope.address.street = components["route"];

                $scope.address.street_number = components["street_number"];

                infowindow.setContent($scope.address.address);

                infowindow.open(map, marker);
              }
            }

            if (!$scope.$$phase) $scope.$apply();
          }
        );
      });
    };
    $scope.updateLocation = function () {
      StopService.updateAddressLocation($scope.current_stop);
    };

    $scope.updateAddresss = function () {
      $scope.address.opening_time = $scope.address.opening_time
        ? $filter("date")(new Date($scope.address.opening_time), "HH:mm:ss")
        : null;

      $scope.address.closing_time = $scope.address.opening_time
        ? $filter("date")(new Date($scope.address.closing_time), "HH:mm:ss")
        : null;

      $scope.current_stop.lat = $scope.address.lat;

      $scope.current_stop.lng = $scope.address.lng;

      $scope.current_stop.country = $scope.address.country;

      $scope.current_stop.city = $scope.address.city;

      $scope.current_stop.street = $scope.address.street;

      $scope.current_stop.number = $scope.address.number;

      $scope.current_stop.customer_name = $scope.address.customer_name;

      //upload parking and unloading area images
      var formData = new FormData();
      if($scope.current_stop.parking_area_img){
        var blobedUri = dataURItoBlob($scope.current_stop.parking_area_img);
        formData.append('parking_area_img', blobedUri , 'parking_area_img.jpeg');
      }
      if($scope.current_stop.unloading_area_img){
        var blobedUri = dataURItoBlob($scope.current_stop.unloading_area_img);
        formData.append('unloading_area_img', blobedUri , 'unloading_area_img.jpeg');
      }
      formData.append('address', JSON.stringify($scope.address));
      formData.append('order', JSON.stringify($scope.current_stop));
      $http
        .post(
          $rootScope.getBaseUrl() +
            "customeraddress/update_from_app" +
            ($scope.address.id ? "&id=" + $scope.address.id : ""),
            formData,
          {
            headers: {
              "Content-Type": undefined,
              "x-csrf-token-app": $scope.identify,
              "user-token-app": localStorage.getItem("user_id"),
            },
          }
        )
        .then(
          function (response) {
            return response;
          },
          function (err) {}
        );
    };

    $scope.sendSms = function () {
      var data = {
        data: {
          next_sms_name: $scope.current_stop.customer_name,

          next_sms_phone: $scope.current_stop.phone,

          next_sms_id: $scope.current_stop.id,
        },
      };

      $.ajax({
        url: $rootScope.getBaseUrl() + "order/sms",

        data: data,

        type: "post",

        headers: {
          "x-csrf-token-app": $scope.identify,
          "user-token-app": localStorage.getItem("user_id"),
        },
      }).then(
        function suc(response) {
          var data = JSON.parse(response);

          debugger;

          if (data.status && data.status !== "ok") {
            if (data.data) {
              alert(data.data);
            }
          } else {
            alert("SMS נשלח בהצלחה");
          }
        },
        function fail(data) {}
      );
    };

    $scope.sendSmsBtn = function () {
      var res = $scope.sendSms();

      if (res) alert(res);
    };

    $scope.markComplete = function (order) {
      document.getElementById("loading").style.display = "block";
      
      if(order.status != 0 && order.status != 4){
        $scope.double_documentaion = true;
      }

      $scope.current_stop = order;

      if($scope.current_stop.address_note && $scope.has_reported_mission == false){
        $scope.reportCompletingMission(false,true,order);
      }else if($rootScope.current_user.report_pallets_collection && (!$rootScope.current_user.pod_option || 
        ($scope.sub_customer_orders.length && $scope.sub_customer_orders.filter(function(sub_order){
        return !sub_order.pod;
      }).length == 1))){
        $scope.reportCollectingPallets(true);
      }else if ($rootScope.current_user.pod_option) {
        $scope.openSignFile();
      } else {
        document.getElementById("loading").style.display = "none";
        angular.element("#delivery").modal("show");
        //$scope.beforeDone(true);
      }
    };

    $scope.setCurrentPallets = function(plastons=false) {
      if (!$scope.current_user.two_kinds_of_pallets || $scope.current_user.two_kinds_of_pallets_regular_or_plastons) {
          if(plastons){
            $scope.plaston_pallets = 1;
            $scope.regular_pallets = 0;
          }else{
            $scope.plaston_pallets = 0;
            $scope.regular_pallets = 1;
          }
          }
    };
  
    $scope.reportCollectingPallets = function (
      status = $scope.delivery_status
    ) {
      
      if ($scope.has_reported_pallets == false) {
        //pallets-KafuZan
        if($rootScope.current_user.two_kinds_of_pallets){
          $scope.current_stop.small_pallets = 0;//collected
          $scope.current_stop.big_pallets = 0;//given now
        }
        $scope.has_reported_pallets = true;
        $scope.delivery_status = status;
        document.getElementById("loading").style.display = "none";
        angular.element("#collectingPalletsModal").modal("show");
      } else {
        //&& $scope.current_stop.big_pallets != undefined עקב ביטול משטחי עץ
        document.getElementById("loading").style.display = "block";
        if (
          ($scope.requier_surface &&
            $scope.current_stop.small_pallets != undefined)  ||
          !$scope.requier_surface
        ) {
          angular.element("#collectingPalletsModal").modal("hide");
          //$scope.beforeDone(status);
          if ($rootScope.current_user.pod_option) {
            $scope.openSignFile();
          } else {
            document.getElementById("loading").style.display = "none";
            angular.element("#delivery").modal("show");
            //$scope.beforeDone(true);
          }
        } else {
          document.getElementById("loading").style.display = "none";
          $scope.invalid_reporting = 1;
        }
      }
    };

    $scope.reportCompletingMission = function (
      confirmMission,status = $scope.delivery_status,order=$scope.current_stop
    ) {
      if ($scope.has_reported_mission == false) {
        $scope.has_reported_mission = true;
        $scope.delivery_status = status;
        document.getElementById("loading").style.display = "none";
        angular.element("#completingMissionModal").modal("show");
      } else {
        if (confirmMission) 
          $scope.current_stop.requires_confirmation = 2;//RUT requires_confirmation posible values 0-false,1-true,2-confirmed
        angular.element("#completingMissionModal").modal("hide");
        if(status)
          $scope.markComplete(order);
        else  
          $scope.beforeDone(status);
      }
    };
    $scope.deleteExistDocumentaion = function(status){
      connectPOSTService.fn('documentation/delete_unsigned_doc&stopid='+$scope.current_stop.id).then(function(data) {
        $scope.double_documentaion = false;  
        $scope.current_stop.status = 0;
        $scope.beforeDone(status);
      }, function(err) {
        
      });
    }
    $scope.beforeDone = function (status) {

      if($scope.double_documentaion || ($scope.current_stop.status != 0 && $scope.current_stop.status != 4)){
        $scope.deleteExistDocumentaion(status);
        return 0;
      }

      if (status) angular.element("#delivery").modal("hide");
      else angular.element("#no-get").modal("hide");
      if (
        $scope.current_stop.address_note &&
        $scope.has_reported_mission == false
      ) {
        $scope.reportCompletingMission(false,status);
        return 0;
      }
      if (
        $rootScope.current_user.report_pallets_collection &&
        $scope.has_reported_pallets == false &&
        (!$rootScope.current_user.pod_option || $scope.has_signed_pod)
      ) {       
          $scope.reportCollectingPallets(status);
          return 0; 
      }

      var podSigned = $scope.has_signed_pod;
      
      setTimeout(function () {
        StopService.markComplete(
          $scope.current_stop,
          status,
          $scope.next_stop,
          $scope.delivered_remarks
        );

        if (
          $scope.documentation.start_hour &&
          ($rootScope.current_user.arrival_reporting_app || status || !status)
        ) {
          $scope.endDocumentation();
        } else {
          StopService.startDocumentation(
            $scope.current_stop,
            true,
            $scope.delivered_remarks,
            $scope.returns
          ).then(
            function (response) {
              var customer_id = $scope.current_stop.customer_id;
              var current_id = $scope.current_stop.id;
              if(!status || (podSigned && !$rootScope.signing_error && localStorage.getItem('signing_error') == 'false') || !$rootScope.current_user.pod_option){
                $rootScope.nextStopRef = true;
                $location.path("/orders");
                document.getElementById("loading").style.display = "none";
              }else{
                if($rootScope.signing_error || localStorage.getItem('signing_error') == 'true'){
                  $scope.current_stop.status = 0;
                  $scope.has_signed_pod = false;
                }
                document.getElementById("loading").style.display = "none";
              }
            },
            function fail(data) {
              document.getElementById("loading").style.display = "none";

              console.log(
                "(done) Error occured while trying to contact server"
              );
            }
          );
        }
      }, 500);
    };

    //save expense

    $scope.expense = function () {
      var data = {
        data: {
          messenger: localStorage.getItem("user_id"),

          track_id: localStorage.getItem("track_id"),

          expense: $scope.current_expense,
        },
      };

      $.ajax({
        url: $rootScope.getBaseUrl() + "expenses/savexpenses",

        data: data,

        type: "post",

        headers: {
          "x-csrf-token-app": $scope.identify,
          "user-token-app": localStorage.getItem("user_id"),
        },
      }).then(
        function (response) {
          if (response == "ok") {
          } else {
            alert("error occured while saving expense");
          }
        },
        function (data) {
          alert("(save expense) error while trying connect server");
        }
      );
    };

    $scope.startDocumentation = function (end = false) {
      if ($scope.documentation.start_hour) {
        alert("ביצעת כבר כניסה ללקוח זה.");

        return;
      }

      StopService.startDocumentation(
        $scope.current_stop,
        end,
        $scope.delivered_remarks,
        $scope.returns
      ).then(
        function (response) {
          $scope.documentation = response.data.documentation;

          $scope.documentation.start_hour = $scope.documentation.start_hour
            ? new Date($scope.documentation.start_hour)
            : undefined;
        },
        function (err) {
          if (err.status == 401) $location.path("/login");
          else throw err;
        }
      );
    };

    function customerHasMoreOrders() {
      var customer_more_orders = false;
      for (i = 0; i < $rootScope.activeRoutes.length; i++) {
        if (
          $scope.activeRoutes[i].customer_id ==
            $scope.current_stop.customer_id &&
          $scope.activeRoutes[i].id != $scope.current_stop.id
        ) {
          $location.path("/nextStop/" + $scope.activeRoutes[i].id);
          customer_more_orders = true;
          break;
        }
      }
      return customer_more_orders;
    }

    $scope.endDocumentation = function (end = false) {
      document.getElementById("loading").style.display = "block";

      if ($scope.documentation && !$scope.documentation.start_hour) {
        alert("עליך לבצע כניסה תחילה.");

        return;
      }

      StopService.endDocumentation(
        $scope.current_stop,
        $scope.documentation,
        $scope.delivered_remarks,
        $scope.returns
      ).then(
        function (response) {
          if (response.data.status == "SUCCESS" && !$rootScope.signing_error && localStorage.getItem('signing_error') == 'false') {
            // eluria changed 02.15.22 | before: route to $location.path('/orders'); withot cheack
            // var customer_more_orders = false;
            // for(i=0;i<$rootScope.activeRoutes.length; i++) {
            // if($scope.activeRoutes[i].customer_id==$scope.current_stop.customer_id&&
            // $scope.activeRoutes[i].id!=$scope.current_stop.id){
            // $location.path('/nextStop/'+$scope.activeRoutes[i].id);
            // customer_more_orders =true;
            // break;
            // }
            // }

            //if(!customerHasMoreOrders())
            //{
            $rootScope.nextStopRef = true;
            $location.path("/orders");
            //}
          } else {
            alert("ארעה שגיאה בעת שמירת הנתונים.");
          }
          document.getElementById("loading").style.display = "none";
        },
        function (err) {
          document.getElementById("loading").style.display = "none";

          if (err.status == 401) $location.path("/login");
          else throw err;
        }
      );
    };
    //RUTEL PROPLUS item-management
    $scope.editItem = function (item, index) {
      if (!item.isEditingItem) {
        item.isEditingItem = true;
        setTimeout(function () {
          $("#item-amount-" + index).focus();
        }, 500);
      } else {
        $http
          .put(
            $rootScope.getBaseUrl() + "orderitems/update_item&id=" + item.id,
            item,
            {
              headers: {
                "x-csrf-token-app": $scope.identify,
                "user-token-app": localStorage.getItem("user_id"),
              },
            }
          )
          .then(function (data) {
            item.isEditingItem = false;
          });
      }
    };
    //RUTEL CBC marked_column
    $scope.getRemarks = function () {
      $scope.marked_columns = [];
      var remarks = $scope.current_stop.remarks.split(",");
      $scope.current_stop.remarks = "";
      angular.forEach(remarks, function (remark) {
        var title = remark.split(":");
        if (title.length > 1 && title[0].includes("*")) {
          $scope.marked_columns.push(title);
        } else {
          $scope.current_stop.remarks += remark + ","; //+","
        }
      });
    };
    $scope.urlExists = function(url,order,withRemarks=false) {
      $http.get(url+(withRemarks ? "_ERR.pdf" : ".pdf"))
          .then(function(response) {
              if (response.status === 200) {
                order.pod_file_exists = true;
                $scope.has_signed_pod = !($scope.sub_customer_orders.filter(function(sub_order){
                  return  !sub_order.pod_file_exists || !sub_order.status;
                }).length);
                // URL exists, do something here
              } else {
                  if(!withRemarks)
                    $scope.urlExists(url,order,true);
                  else
                    order.pod_file_exists = false;
                  // URL does not exist, handle it accordingly
              }
          })
          .catch(function(error) {
            if(!withRemarks)
              $scope.urlExists(url,order,true);
            else
            order.pod_file_exists = false;
              // Handle error (e.g., network error)
          });
    };
    function getStop(id) {
      $http
        .get($rootScope.getBaseUrl() + "order/get_order&id=" + id, {
          headers: {
            "x-csrf-token-app": $scope.identify,
            "user-token-app": localStorage.getItem("user_id"),
          },
        })
        .then(
          function (data) {
            if (data.data.status == "SUCCESS") {
              if (data.data.data && data.data.data.id) {
                $scope.current_stop = data.data.data;
                if($rootScope.signing_error || localStorage.getItem('signing_error') == 'true'){
                  $scope.current_stop.status = 0;
                  $scope.errorMessage = $rootScope.arraylang['error_message'][$rootScope.selectedlang];
                  $('#errorModal').modal('show');
                }else if($scope.current_stop.address_note || $scope.current_stop.customer.address_note){
                  $('#remarksModal').modal('show');
                }

                //sub orders issue
                var customer_id = $scope.current_stop.customer_id;
                $scope.sub_customer_orders = [];
                if(!$rootScope.crnt_route || !$rootScope.crnt_route.length){
                  $scope.sub_customer_orders.push($scope.current_stop);
                  if(!$rootScope.pod_files && !$rootScope.wait_for_pod_files){
                    $rootScope.getPodFiles($scope.current_stop.track_id);
                  }
                }else{
                  var numOrders = [];
                  // $scope.sub_customer_orders = $rootScope.crnt_route.filter(function(item){
                  //   return (item.customer_id === customer_id && item.original_address == $scope.current_stop.original_address);//item.status == 0 && 
                  // });
                  var date = new Date($scope.current_stop.time_order);
                  var day = date.getDate();
                  var paddedDay = (day < 10) ? '0' + day : day;
                  var month = (date.getMonth())+1;
                  var paddedMonth = (month < 10) ? '0' + month : month;

                  angular.forEach($rootScope.crnt_route,function(sub_order,key){
                    if(sub_order.customer_id === customer_id && sub_order.original_address == $scope.current_stop.original_address && !numOrders.includes(sub_order.num_order)){
                      if(sub_order.id == $scope.current_stop.id){
                        sub_order.status = $scope.current_stop.status;                       
                      }
                      if($rootScope.current_user.pod_option){
                        $scope.urlExists("https://opti-cstmr-files.s3.us-east-2.amazonaws.com/"+$rootScope.current_user.user_name + "/pod/"+date.getFullYear()+"/"+(paddedMonth)+"/"+paddedDay+"/"+sub_order.num_order+"_sign_"+$filter('date')(new Date(sub_order.time_order), 'yyyy_MM_dd').toString(),sub_order,false);
                      }
                      $scope.sub_customer_orders.push(sub_order);
                      numOrders.push(sub_order.num_order);
                    }
                  });
                }

                $scope.has_reported_mission = false;
                $scope.next_stop = data.data.next_stop;
                $scope.address = $scope.current_stop.customer
                  ? $scope.current_stop.customer
                  : {};
                $scope.getRemarks();
                
              } else {
                $location.path("/orders");
              }
            }
          },
          function (err) {
            if (err.status == 401) $location.path("/login");
            else throw err;
          }
        );
    }
    //Exit from digital signature modal
    $scope.confirmClosingDigitalSignatureModal = function(){
      $scope.dynamicMessage = $rootScope.arraylang['confirm_close_sign_modal'][$rootScope.selectedlang];
      $scope.dynamicFunction = $scope.closeDigitalSignatureModal;
      angular.element('#dynamicMessageModal').modal('show');
    }
    $scope.closeDigitalSignatureModal = function(){
      angular.element('#dynamicMessageModal').modal('hide');
      angular.element('#disgitalSignatureModal').modal('hide');
    }
    $scope.closepodFilePreviewModal = function(){
      angular.element('#podFilePreviewModal').modal('hide');
    }
    //Cleaning the signature
    $scope.confirmcleaningSignature = function(){
      $scope.dynamicMessage = $rootScope.arraylang['confirm_cleaning_signature'][$rootScope.selectedlang];
      $scope.dynamicFunction = $scope.cleaningSignature;
      angular.element('#dynamicMessageModal').modal('show');
    }
    $scope.cleaningSignature = function(){
      $scope.closeDynamicModal();
      setTimeout(function(){
        $scope.$apply();
        angular.element('#clearBtn').trigger('click');
      },500);
    }
    //Sending the signature
    $scope.confirmSendingSignature = function(){
      if($scope.has_signed_pod)
        $scope.double_documentaion = true;
      if(!$window.navigator.onLine){
        $scope.dynamicMessage = $rootScope.arraylang['no_wifi_connection'][$rootScope.selectedlang];
        $scope.dynamicFunction = undefined;
        angular.element('#dynamicMessageModal').modal('show');
      }else if($scope.delivered_remarks.length){
        $scope.init_sign=false;
        $scope.signForm();
      }else{
        $scope.dynamicMessage = $rootScope.arraylang['confirm_send_sign_without_remarks'][$rootScope.selectedlang];
        $scope.dynamicFunction = $scope.sendingSignature;
        angular.element('#dynamicMessageModal').modal('show');
      } 
    }
    $scope.sendingSignature = function(){
      $scope.closeDynamicModal();
      $scope.init_sign=false;
      $scope.signForm();
    }
    //Close dynamic modal
    $scope.closeDynamicModal = function(){
      //Attaches a function to the closing event
      $('#dynamicMessageModal').on('hidden.bs.modal', function () {
        //Opens the new model when the closing completes
        $('body').addClass('modal-open');
        //Unbinds the callback
        $('#dynamicMessageModal').off('hidden.bs.modal');
      });
      angular.element('#dynamicMessageModal').modal('hide');
    }
    //
    $scope.checkValidReturns = function(){
      $scope.validReturnsLength = $scope.returns.length < 120;
    }
    //
    function initializeWebcam() {
      Webcam.set({
          width: 330,
          height: 500,
          image_format: "jpeg",
          jpeg_quality: 100,
          params: {
              dest_width: 200,
              dest_height: 160,
          },
          constraints: {
              facingMode: { ideal: "environment" } // Adjust if needed
          }
      });
  
      // Attach webcam to the elements when loaded
      Webcam.on('load', function() {
          Webcam.attach('#camera');
          Webcam.attach('#updateAddressCamera');
      });
  
      Webcam.on('error', function(err) {
          console.error("Webcam failed to load: ", err);
      });
    }
  
    function init() {

      var id = parseInt($routeParams.id);

      if ($rootScope.documentation) {
        $scope.documentation = $rootScope.documentation;

        $scope.documentation.start_hour = new Date(
          $scope.documentation.start_hour
        );

        if ($rootScope.documentation.goBackToStopPage)
          angular.element("#arrivalReportingAppModal").modal("show");

        $rootScope.documentation = undefined;
      } else {
        $scope.documentation = {};
      }
      //Webcam.set('constraints',{ facingMode:'environment' });

      // Webcam.set({
      //   width: 330,
      //   height: 500,
      //   image_format: "jpeg",
      //   jpeg_quality: 100,

      //   params: {
      //     dest_width: 200,
      //     dest_height: 160,
      //   },
      //   constraints: {
      //     facingMode: { ideal: "environment" }
      //   },
      //   // video: { facingMode: { exact: "environment" } }
      // });
      // // Webcam.set('constraints',{
      // // facingMode: "environment"
      // // });

      // //noa Try to fix problem with camera in android app
      // Webcam.on('load', function() {
      //   setTimeout(() => {
      //       Webcam.attach('#camera');
      //       Webcam.attach('#updateAddressCamera');
      //   }, 500); // Delay to ensure the elements are fully ready
      // });

      document.addEventListener('deviceready', function() {
          console.log("User Agent: ", navigator.userAgent);
          console.log("isIOSNexxtStop: ", $scope.isIOS());
          // Check if Cordova and permissions are available
        if (window.cordova && cordova.plugins && cordova.plugins.permissions) {
            // Check if the app already has camera permission
            cordova.plugins.permissions.checkPermission(
                cordova.plugins.permissions.CAMERA,
                function(status) {
                    if (status.hasPermission) {
                        // Permission already granted, initialize the webcam
                        setTimeout(() => {
                          initializeWebcam();
                        }, 1000); // Delay to ensure WebView and components are ready
                    } else {
                        // Request permission only if it hasn't been granted yet
                        cordova.plugins.permissions.requestPermission(
                            cordova.plugins.permissions.CAMERA,
                            function(status) {
                                if (status.hasPermission) {
                                    // Permission granted, initialize the webcam
                                    setTimeout(() => {
                                      initializeWebcam();
                                    }, 1000); // Delay to ensure WebView and components are ready
                                } else {
                                    console.error("Camera permission denied");
                                }
                            },
                            function() {
                                console.error("Camera permission request failed");
                            }
                        );
                    }
                },
                function() {
                    console.error("Permission check failed");
                }
            );
        } else {
            // If not on a Cordova device, initialize the webcam directly for browser use
            setTimeout(() => {
              initializeWebcam();
            }, 1000); // Delay to ensure WebView and components are ready
        }
      });
    
    
      getStop(id);
    }
    init();
  },
]);
