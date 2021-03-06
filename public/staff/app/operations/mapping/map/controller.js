'use strict';

myAppModule.controller('opsMap_controller',
    function ($scope, $mdSidenav, $mdMenu, map_layer_service) {
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
        $scope.$on('$mdMenuClose', function(event, menu) { 
            $scope.otherSubMenuIsOpen = false;
        });

        $scope.noop = function (event) {
            event.stopImmediatePropagation();
        };

        $scope.closeSubMenu = function (event) {
            $mdMenu.hide();
        }

        $scope.otherSubMenuIsOpen = false;

        $scope.closeOtherSubMenu = ($event) => {
            if ($scope.otherSubMenuIsOpen) {
                $scope.closeSubMenu($event);
            } else {
                $scope.otherSubMenuIsOpen = true;
            }
        }

        $scope.flyTo = (coordinate) => {
            $scope.map.flyTo(coordinate);
        }

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

        $scope.menuLayers = [];
        $scope.loadLayerMenuItems = () => {
            map_layer_service.
                getLayers().
                then(layers => {
                    Promise.all(layers).
                        then(layers => {
                            $scope.menuLayers = layers;
                            $scope.$apply();
                        })
                })
        }

        $scope.toggleLayer = (layer) => {
            var toggle = layer.isVisible ? $scope.hideLayer : $scope.showLayer;
            layer.isVisible = !layer.isVisible;
            toggle(layer.id);
        }

        $scope.getMapInstance = (onLoadCallback) => {
            mapboxgl.accessToken = "pk.eyJ1Ijoiam9uZzY5ODkiLCJhIjoiY2p5NjBkdnA5MDNneDNmcGt0eHVva2ZvZyJ9.jZwx_NUnKowJ4faIafJTew";
            let map = new mapboxgl.Map({
                container: 'opsMap',
                style: 'mapbox://styles/jong6989/ck2u5e37k1phh1cs0nhhctx9c',
                center: [118.74432172, 9.81847614],
                zoom: 10
            });

            map.on('styledata', function (e) {
                if ($scope.map.getLayoutProperty('public-land', 'visibility') != 'none') {
                    $scope.hideLayer('public-land');
                }
            });

            if (onLoadCallback) {
                map.on('load', onLoadCallback);
            }

            return map;
        }

        $scope.initMapBoxMap = (onLoadCallback) => {
            //timer for letting angularjs load first before the map
            setTimeout(() => {
                $scope.map = $scope.getMapInstance(onLoadCallback);
            }, 200);
        };

        $scope.getTime = (dateInMilliseconds) => {
            var date = new Date(dateInMilliseconds);
            return moment(date).format('hh:mm:ss a')
        }
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

        $scope.getPointLayer = (coordinate, title, symbol, description) => {
            var id = new Date().getTime().toString();

            var layer = {
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
                    'icon-image': ['concat', ['get', 'icon'], '-15'],
                    'text-field': ['get', 'title'],
                    'text-size': 20,
                    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                    'text-offset': [0, 0.6],
                    'text-anchor': 'top',
                    'icon-allow-overlap': true
                },
                'paint': {}
            }
            return layer;
        }

        $scope.addIcon = (coordinate, iconName, iconPath, iconDescription) => {
            $scope.map.loadImage(iconPath, (error, image) => {
                var dateNow = new Date().getTime().toString();
                var iconName_ = `${iconName}-${dateNow}`;
                $scope.map.addImage(iconName_, image);
                var layer = $scope.getPointLayer(
                    coordinate,
                    iconName,
                    '',
                    iconDescription);
                layer.layout['icon-image'] = iconName_;
                layer['icon-size'] = 1;
                $scope.addLayer(layer);
            });
        }
        $scope.addMarker = (coordinate, title, symbol, description) => {
            // var marker = new mapboxgl.Marker({});
            // marker.setLngLat(coordinate).addTo($scope.map);

            var layer = $scope.getPointLayer(coordinate, title, symbol, description);
            $scope.addLayer(layer);
            return layer;
        }
        let mapLayers = [];
        $scope.addLayer = (layer) => {
            mapLayers.push(layer.id);
            $scope.map.addLayer(layer);
        }

        $scope.getMapLayers = () => mapLayers;

        $scope.removeLayers = () => {
            mapLayers.forEach(layer => {
                try {
                    $scope.map.removeLayer(layer);
                } catch (error) {

                }
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
                'id': `route-points-${id}`,
                'type': 'circle',
                'source': id,
                'paint': {
                    'circle-radius': 5,
                    'circle-color': color
                }
            });

            $scope.addLayer({
                "id": `route-lines-${id}`,
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
            $scope.addIcon(lineCoordinates[0], 'START', '/images/icons/jogging.png', '')
            $scope.addIcon(lineCoordinates[lineCoordinates.length - 1], 'END', '/images/icons/target.png', '')
        };

        $scope.toggleSidenav = buildToggler('closeEventsDisabled');

        function buildToggler(componentId) {
            return function () {
                $mdSidenav(componentId).toggle();
            };
        }

        $('#searchResultsShower').on('mouseover', () => {
            $scope.toggleSidenav();
        })

        function CommonLayer(layerModel) {
            this.layerModel = layerModel;
            this.isVisible = true;
            this.toggle = () => {
                var toggle = this.isVisible ? $scope.hideLayer : $scope.showLayer;
                this.isVisible = !this.isVisible;
                toggle(layerModel.id);
            }
        }

        function ProtectedLayer(layerModel) {
            this.layerModel = layerModel;
            this.isVisible = false;
            this.toggle = () => {
                map_layer_service.getProtectedAreaCoordinates(layerModel)
                    .then(coordinates => {
                        $scope.flyTo({ center: coordinates[0][0], zoome: 15});
                        $scope.$apply();
                    });
            }
        }

        function ProtectedLayerWithMultiPolygon(layerModel){
            this.layerModel = layerModel;
            this.isVisible = false;
            this.toggle = () => {
                map_layer_service.getProtectedAreaCoordinates(layerModel)
                    .then(coordinates => {
                        $scope.flyTo({ center: coordinates[0][0][0], zoome: 15});
                        $scope.$apply();
                    });
            }
        }

        $scope.getLayerViewModel = (layer) => {
            var viewModel = null;
            if (layer.type == 'Polygon') {
                viewModel = new ProtectedLayer(layer);
            }else if(layer.type == 'MultiPolygon'){
                viewModel = new ProtectedLayerWithMultiPolygon(layer);
            } else {
                viewModel = new CommonLayer(layer);
                if(layer.id == 'mapbox-satellite')
                    viewModel.isVisible = false;
            }

            return viewModel;
        }
    }).service('map_layer_service', function () {
        var layerCollection = db.collection('ecan_app_layers');
        this.getLayers = async () => {
            return new Promise((resolve, reject) => {
                layerCollection.
                    onSnapshot(snapshot => {
                        var layers = snapshot.docs.map(async (document) => {
                            var layer = document.data();
                            layer.id = document.id;
                            layer.subLayers = await this.getSublayers(layer);
                            return layer;
                        });
                        resolve(layers);
                    });
            })

        }

        this.getSublayers = async (layer) => {
            return new Promise((resolve, reject) => {
                layerCollection.
                    doc(layer.id).
                    collection('layers').
                    onSnapshot(snapshot => {
                        var sublayers = snapshot.docs.map(document => {
                            var sublayer = document.data();
                            sublayer.id = document.id;
                            return sublayer;
                        });
                        resolve(sublayers);
                    })
            })
        }

        this.getProtectedAreaCoordinates = (protectedArea) => {
            return new Promise((resolve, reject) => {
                layerCollection.
                    doc('protected-areas').
                    collection('layers').
                    doc(protectedArea.id).
                    collection('geojson').
                    doc('1').
                    onSnapshot(snapshot => {
                        var data = snapshot.data();
                        var object = JSON.parse(data.data);
                        var coordinates = object.coordinates
                        resolve(coordinates);
                    })
            })
        }
    });


