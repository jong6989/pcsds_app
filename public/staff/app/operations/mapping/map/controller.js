'use strict';

myAppModule.controller('opsMap_controller', function ($scope, $filter, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.isLoading = false;
    $scope.map = undefined
    $scope.recordingList = [];
    var recordingsRef = db.collection("ecan_app_recordings");
    var lastRecordLayerAdded = "";
    var lineSnapshot;

    var recordSnapshot = recordingsRef.onSnapshot(qs => {
        //listen to created recordings
        if(!qs.empty){
            let results = qs.docs.map( d => {
                var item = d.data();
                item.id = d.id
                return item;
            } );
            $scope.recordingList = results;
            $scope.$apply();
        }
    } );

    $scope.showLine = (id)=>{
        $scope.isLoading = true
        lineSnapshot = recordingsRef.doc(id).collection("gps").onSnapshot(qs => {
            if(!qs.empty){
                let results = qs.docs.map( d => {
                    var item = d.data();
                    return [item.longitude,item.latitude];
                } );
                //add layer if not yet drawn on map
                if($scope.map.getLayer(id) == undefined){
                    //remove last layer if existing
                    if ($scope.map.getLayer(lastRecordLayerAdded)) $scope.map.removeLayer(lastRecordLayerAdded);
                    $scope.addLineLayer(id,results,"#f00",8);
                    lastRecordLayerAdded = id;
                }
                $scope.map.flyTo({center: results[0], zoom: 15});
            }
            $scope.isLoading = false;
            $scope.$apply();
        } );
    };
    
    $scope.initMapBoxMap = ()=>{
        //timer for letting angularjs load first before the map
        setTimeout(()=>{
            mapboxgl.accessToken = "pk.eyJ1Ijoiam9uZzY5ODkiLCJhIjoiY2p5NjBkdnA5MDNneDNmcGt0eHVva2ZvZyJ9.jZwx_NUnKowJ4faIafJTew";
            $scope.map = new mapboxgl.Map({
                container: 'opsMap',
                style: 'mapbox://styles/jong6989/ck2u5e37k1phh1cs0nhhctx9c', 
                center: [118.74432172, 9.81847614],
                zoom: 10,
            });
            $scope.map.on('styledata', function(e) {
                console.log('hello');
            })
            initLayers()
        },200);
    };

    function initLayers(){
        setTimeout(()=>{
            $scope.hideLayer("public-land")
        },1500);
    };

    $scope.hideLayer = (id)=>{
        $scope.map.setLayoutProperty(id, 'visibility', 'none');
    };

    $scope.showLayer = (id)=>{
        $scope.map.setLayoutProperty(id, 'visibility', 'visible');
    };

    $scope.addLineLayer = (id,lineCoordinates,color,line)=>{
        $scope.map.addLayer({
            "id": id,
            "type": "line",
            "source": {
            "type": "geojson",
            "data": {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "LineString",
                    "coordinates": lineCoordinates
                    }
                }
            },
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-color": color,
                "line-width": line
            }
        });
    };

});


