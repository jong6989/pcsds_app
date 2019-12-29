'use strict';

myAppModule.controller('opsMap_controller',
    function ($scope) {
        $scope.isLoading = false;
        $scope.map = undefined
        $scope.recordingList = [];
        var recordingsRef = db.collection("ecan_app_recordings");
        var lastRecordLayerAdded = "";
        var lineSnapshot;

        var recordSnapshot = recordingsRef.onSnapshot(qs => {
            //listen to created recordings
            if (!qs.empty) {
                let results = qs.docs.map(d => {
                    var item = d.data();
                    item.id = d.id
                    return item;
                });
                $scope.recordingList = results;
                $scope.$apply();
            }
        });

        $scope.showLine = async (id) => {
            $scope.isLoading = true
            recordingsRef.doc(id).collection("gps").onSnapshot(qs => {
                if (!qs.empty) {
                    let results = qs.docs.map(d => {
                        var item = d.data();
                        return [item.longitude, item.latitude];
                    });
                    //add layer if not yet drawn on map
                    if ($scope.map.getLayer(id) == undefined) {
                        //remove last layer if existing
                        if ($scope.map.getLayer(lastRecordLayerAdded))
                            $scope.map.removeLayer(lastRecordLayerAdded);
                        $scope.addLineLayer(id, results, "#f00", 8);
                        lastRecordLayerAdded = id;
                    }
                    $scope.map.flyTo({ center: results[0], zoom: 15 });
                }
                $scope.isLoading = false;
                $scope.$apply();
            });
        };

        $scope.getMapInstance = (onLoadCallback) =>{
            mapboxgl.accessToken = "pk.eyJ1Ijoiam9uZzY5ODkiLCJhIjoiY2p5NjBkdnA5MDNneDNmcGt0eHVva2ZvZyJ9.jZwx_NUnKowJ4faIafJTew";
             let map = new mapboxgl.Map({
                container: 'opsMap',
                style: 'mapbox://styles/jong6989/ck2u5e37k1phh1cs0nhhctx9c',
                center: [118.74432172, 9.81847614],
                zoom: 10,
            });

            map.on('styledata', function (e) {
                if ($scope.map.getLayoutProperty('public-land', 'visibility') != 'none') {
                    $scope.hideLayer('public-land');
                }
            });

            if(onLoadCallback){
                map.on('load', onLoadCallback);
            }

            return map;
        }

        $scope.initMapBoxMap = () => {
            //timer for letting angularjs load first before the map
            setTimeout(() => {
               $scope.map = $scope.getMapInstance();
            }, 200);
        };

        // $scope.filterByUserAndDates 

        function initLayers() {
            setTimeout(() => {
                $scope.hideLayer("public-land")
            }, 1500);
        };

        $scope.hideLayer = (id) => {
            $scope.map.setLayoutProperty(id, 'visibility', 'none');
        };

        $scope.showLayer = (id) => {
            $scope.map.setLayoutProperty(id, 'visibility', 'visible');
        };

        $scope.addMarker = (coordinate, title, symbol, description) => {
            // var marker = new mapboxgl.Marker({});
            // marker.setLngLat(coordinate).addTo($scope.map);
            var id = new Date().getTime().toString();
            $scope.addLayer({
                'id': 'points' + id,
                'type': 'symbol',
                'source': {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': [
                            {
                                // feature for Mapbox DC
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': coordinate
                                },
                                'properties': {
                                    'title': title,
                                    'icon': symbol, 
                                    'description': description
                                }
                            }
                        ]
                    }
                },
                'layout': {
                    // get the icon name from the source's "icon" property
                    // concatenate the name to get an icon from the style's sprite sheet
                    'icon-image': ['concat', ['get', 'icon'], '-15'],
                    // get the title name from the source's "title" property
                    'text-field': ['get', 'title'],
                    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                    'text-offset': [0, 0.6],
                    'text-anchor': 'top'
                }
            })
        }
        let mapLayers = [];
        $scope.addLayer = (layer) => {
            mapLayers.push(layer.id);
            $scope.map.addLayer(layer);
        }

        $scope.removeLayers = () => {
            mapLayers.forEach(layer => {
                $scope.map.removeLayer(layer);
            });
            mapLayers = [];
        }
        $scope.addLineLayer = (id, lineCoordinates, color, line) => {
            var geojson = {
                'type': 'FeatureCollection',
                'features': []
            }
            lineCoordinates.forEach(point => {
                var coordinate = {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': point
                    },
                    'properties': {
                        'id': String(new Date().getTime()),
                        'title': '',
                        'icon': 'monument'
                    }
                }
                geojson.features.push(coordinate);
            });

            $scope.map.addSource(id, {
                'type': 'geojson',
                'data': geojson
            });

            $scope.addLayer({
                'id': `points-${id}`,
                'type': 'circle',
                'source': id,
                'paint': {
                    'circle-radius': 5,
                    'circle-color': color
                }
            });

            $scope.addLayer({
                "id": `lines-${id}`,
                "type": "line",
                "source": {
                    "type": "geojson",
                    "data": {
                        "type": "Feature",
                        "properties": {
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": lineCoordinates
                        }
                    }
                },
                "layout": {
                    "line-join": "round",
                    "line-cap": "round",
                },
                "paint": {
                    "line-color": color,
                    "line-width": line,
                    'line-dasharray': [1.0, 2.0, 1.0]

                }
            })
            $scope.addMarker(lineCoordinates[0], 'START', 'monument');
            $scope.addMarker(lineCoordinates[lineCoordinates.length - 1], 'END' ,'monument');
        };
    });


