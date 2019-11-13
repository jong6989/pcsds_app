'use strict';

var map;
var trigerMapFunctions;
var kmlLayer;

function initOpsMap() {
    let ppc_center = {lat: 9.81847614, lng: 118.74432172};
    // let testcenter = { lat : 123.61, lng : -22.14};
    map = new google.maps.Map(document.getElementById('opsMap'), {
        center: ppc_center,
        zoom: 10,
        mapTypeId : 'satellite',
        mapTypeControl : false
    });
    map.data.loadGeoJson('/geojson/ppc.geojson');
    // map.data.loadGeoJson(
    //     'http://localhost:5000/geojson/test.geojson');
    // kmlLayer = new google.maps.KmlLayer('http://localhost:5000/kml/ppckmlold.kml', {
    //     suppressInfoWindows: true,
    //     preserveViewport: true,
    //     map: map
    // });
    // kmlLayer.addListener('click', function(event) {
    //     var content = event.featureData.infoWindowHtml;
    //     var dataDiv = document.getElementById('capture');
    //     dataDiv.innerHTML = content;
    // });
    if(trigerMapFunctions) trigerMapFunctions();
}

myAppModule.controller('opsMap_controller', function ($scope, $filter, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.isLoading = true;
    
    var query;
    $scope.set_query = (q)=>{
        query = q;
    };

    $scope.load_kml = (url)=> {
        // if(kmlLayer) kmlLayer = undefined;
        // if(map){
            
        //     $scope.$apply();
        // }else {
        //     $scope.toast("map failed to load!");
        // }
    };

    trigerMapFunctions = ()=>{
        $scope.isLoading = false;
        $scope.load_kml('http://localhost:5000/kml/ppckmlold.kml');
        query.where("time",">=",1573207904000).onSnapshot( qs => {
            if(!qs.empty){
                let linePoints = [];
                $scope.points_count = qs.size;
                qs.docs.map( d => {
                    let document = d.data();
                    linePoints.push({lat: document.latitude, lng: document.longitude});
                    let marker = new google.maps.Marker({
                        position: {lat: document.latitude, lng: document.longitude} , 
                        map: map, 
                        title : "Speed : " + $filter('number')( document.speed * 3.6, 2) + 
                        " kph, or " + document.speed + " m/s" +
                        " \n Accuracy : " + document.accuracy +
                        " \n Mils : " + document.time
                    });
                } );
                // let linePath = new google.maps.Polyline({
                //     path: linePoints,
                //     geodesic: true,
                //     strokeColor: '#FF0000',
                //     strokeOpacity: 1.0,
                //     strokeWeight: 2
                // });
                // linePath.setMap(map);
                $scope.$apply();
            }
        } );
    };

});


