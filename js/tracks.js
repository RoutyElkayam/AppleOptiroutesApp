var destin = {lat:55.549830,lng:37.974274};
var waypointsArr = [
    {lat:55.549802, lng:37.974375},
             {lat:55.549870, lng:37.974953},
             {lat:55.559855, lng:37.976236},
     
            ];
var zoomedIn = true;
//function smoothZoom (map, max, cnt) {
//    if (cnt >= max) {
//        var temp = cnt;
//        cnt = max;
//        max = temp;
//        //return;
//    }
//        z = google.maps.event.addListener(map, 'zoom_changed', function(event){
//            google.maps.event.removeListener(z);
//            smoothZoom(map, max, cnt + 1);
//        });
//        setTimeout(function(){map.setZoom(cnt)}, 80); // 80ms is what I found to work well on my system -- it might not work well on all systems
//   
//}  

/*function animateMapZoomTo(map, targetZoom) {
    var currentZoom = map.getZoom();
    if (currentZoom != targetZoom) {
        google.maps.event.addListenerOnce(map, 'zoom_changed', function (event) {
            animateMapZoomTo(map, targetZoom, currentZoom + (targetZoom > currentZoom ? 1 : -1));
        });
        setTimeout(function(){ map.setZoom(currentZoom) }, 80);
    }
}*/
  
    var y;
 function smoothZoom (map, level, cnt, mode) {
		//alert('Count: ' + cnt + 'and Max: ' + level);

		// If mode is zoom in
		if(mode == true) {

			if (cnt >= level) {
                
				return;
			}
			else {
				var z = google.maps.event.addListener(map, 'zoom_changed', function(event){
					google.maps.event.removeListener(z);
					smoothZoom(map, level, cnt + 1, true);
				});
				setTimeout(function(){map.setZoom(cnt)}, 80);
			}
		} else {
			if (cnt <= level) {
				return;
			}
			else {
				var z = google.maps.event.addListener(map, 'zoom_changed', function(event) {
					google.maps.event.removeListener(z);
					smoothZoom(map, level, cnt - 1, false);
				});
				setTimeout(function(){map.setZoom(cnt)}, 80);
			}
		}
	}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}    
/*
function smoothZoom (map, max, cnt) {
    if(cnt == max){
          y= google.maps.event.addListener(map,'zoom_changed', changeListener);
        return;
    }
    if (cnt > max) {
        var tmp = max;
        max = cnt;
        cnt = tmp;
    }
    else {
        z = google.maps.event.addListener(map, 'zoom_changed', function(event){
            google.maps.event.removeListener(z);
            smoothZoom(map, max, cnt + 1);
        });
        setTimeout(function(){map.setZoom(cnt)}, 80); // 80ms is what I found to work well on my system -- it might not work well on all systems
    }
}  */
function changeListener(event){
                    //map = marker.getMap();    
                    //map.setCenter(overlay.getPosition()); // set map center to marker position
     google.maps.event.removeListener(y);
        smoothZoom(map, 12, map.getZoom()); // call smoothZoom, parameters map, final zoomLevel, and starting zoom level
                     
                    }
function initialize(){
    $(document).ready(function(){
            var center1;
       var ways = [];
          //get current location
      
            navigator.geolocation.getCurrentPosition(function(position){
                    center1 = {
                      lat: 55.549678,
                      lng: 37.974678
                    };
                 for(var i = 0; i < waypointsArr.length;i++){
           ways.push({location:{lat:waypointsArr[i].lat,lng: waypointsArr[i].lng}});
       }
                    var directionsService = new google.maps.DirectionsService;
                    var directionsDisplay = new google.maps.DirectionsRenderer({preserveViewport: true});
                    var map =new google.maps.Map(document.getElementById('mymap'), {
                    zoom: 11,
                    center:center1,
                    mapTypeControlOptions: {
                        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                        mapTypeIds: ['roadmap', 'terrain'],
                        position: google.maps.ControlPosition.BOTTOM_CENTER 
                    }
                    });
                
            directionsDisplay.setMap(map);
                // add the double-click event listener
                /*google.maps.event.addListener(map,'zoom_changed',async function zoomListener(){
                      var cnt;
                      var level;
                               if(!zoomedIn) {
                                   //smoothZoom(map, 20, map.getZoom(), true);
                                   level = 20;
                                   cnt = map.getZoom();
                                   mode = true;
                                   zoomedIn = true;
                                  
                               } else {
                                  // smoothZoom(map, 9, map.getZoom(), false);
                                    level = 9;
                                   cnt = map.getZoom();
                                   mode = false;
                                   zoomedIn = false;
                                  
                               } 
                       for(var i = 0;mode == true &&  cnt >= level;i++){
                           if(mode == true) {

                               if (cnt >= level) {
                
                                   return;
                               }
                               else {
                                   //var z = google.maps.event.addListener(map, 'zoom_changed', function(event){
                                       //google.maps.event.removeListener(z);
                                      cnt += 1;
                                   //setTimeout(function(){map.setZoom(cnt)}, 80);
                               }
                               if (cnt <= level) {
                                   return;
                               }
                               else {
                                   //var z = google.maps.event.addListener(map, 'zoom_changed', function(event) {
                                      // google.maps.event.removeListener(z);
                                      // smoothZoom(map, level, cnt - 1, false);
                                    cnt -= 1;
                                  // });
                                  // setTimeout(function(){map.setZoom(cnt)}, 80);
                               }
                           }
                           await sleep(80);
                       }
                   });
               */
            directionsService.route({
                origin:center1,
                destination: new google.maps.LatLng(destin.lat,destin.lng),
                waypoints:ways,
                travelMode: 'DRIVING',
                
        }, function(response, status) {
                console.log(response);
            if (status === 'OK') {
                directionsDisplay.setDirections(response);
               /* var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(response.routes[0].legs.lat(), response.routes[0].overview_path[1].lng()));
                //bounds.extend(new google.maps.LatLng(response.routes[0].overview_path[0].lat(), response.routes[0].overview_path[0].lng()));
                map.fitBounds(bounds);*/
                var geocoder = new google.maps.Geocoder;
               geocoder.geocode({'placeId': response.geocoded_waypoints[2].place_id}, function(results, status) {
                   console.log(results);
          if (status === 'OK') {
              
            if (results[0]) {
                var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(results[0].geometry.location.lat()+0.0009, results[0].geometry.location.lng()));
                 map.fitBounds(bounds);
                console.log(map.getZoom());
              map.setZoom(17);
                 console.log(map.getZoom());
             // map.setCenter(results[0].geometry.location);
             
            } else {
              window.alert('No results found');
            }
          } else {
            window.alert('Geocoder failed due to: ' + status);
          }
        });
            } else {
                window.alert('Directions request failed due to ' + status);
                }
         });
      });
    });
    };

$(document).ready(function(e){
    //showRout(destin,array);
    initialize();
}
);
/*
function initMap() {
        var map = new google.maps.Map(document.getElementById('mymap'), {
          center: {lat: -34.397, lng: 150.644},
          zoom: 6
        });
 }
initMap();
*/
