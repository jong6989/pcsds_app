'use strict';

var map;
var trigerMapFunctions;
function initOpsMap() {
    mapboxgl.accessToken = "pk.eyJ1Ijoiam9uZzY5ODkiLCJhIjoiY2p5NjBkdnA5MDNneDNmcGt0eHVva2ZvZyJ9.jZwx_NUnKowJ4faIafJTew"
    var map = new mapboxgl.Map({
        // id: "hide"
        container: 'opsMap',
        style: 'mapbox://styles/jong6989/ck2u5e37k1phh1cs0nhhctx9c', 
        center: [118.74432172, 9.81847614],
        zoom: 50.7
      });
      
    // map = new google.maps.Map(document.getElementById('opsMap'), {
    //     center: {lat: 9.81847614, lng: 118.74432172},
    //     zoom: 10,
    //     mapTypeId : 'satellite',
    //     mapTypeControl : false
    // });
    // if(trigerMapFunctions) trigerMapFunctions();
}
myAppModule.controller('opsMap_controller', function ($scope, $filter, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.isLoading = false;
    
    var query;
    $scope.set_query = (q)=>{
        query = q;
    };

    trigerMapFunctions = ()=>{
        $scope.isLoading = false;
        query.where("time",">=",1573109962615).onSnapshot( qs => {
            if(!qs.empty){
                let linePoints = [];
                $scope.points_count = qs.size;
                qs.docs.map( d => {
                    let document = d.data();
                    linePoints.push({lat: document.latitude, lng: document.longitude});
                    // let marker = new google.maps.Marker({
                    //     position: {lat: document.latitude, lng: document.longitude} , 
                    //     map: map, 
                    //     title : "Speed : " + $filter('number')( document.speed * 3.6, 2) + " kph \n Accuracy : " + document.accuracy
                    // });
                } );
                let linePath = new google.maps.Polyline({
                    path: linePoints,
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 2
                });
                linePath.setMap(map);
                $scope.$apply();
            }
        } );
    };
    initOpsMap() ;

});


