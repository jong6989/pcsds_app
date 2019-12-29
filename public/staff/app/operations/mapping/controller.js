'use strict';
myAppModule.controller('operations_map_controller', function ($scope, mappingService, userAccountsService) {
    $scope.currentUser = JSON.parse(localData.get('STAFF_ACCOUNT'));
    $scope.currentDate = new Date();
    $scope.init_enforcer_map = () => {
        $scope.gpsItems = [];
        $scope.get_gps_query().onSnapshot(qs => {
            if (!qs.empty) {
                let results = qs.docs.map(d => {
                    return d.data();
                });
                $scope.gpsItems = results;
                $scope.$apply();
            }
        });
        // if($scope.url.has('ID')){
        //     //$scope.url.get('ID')

        // }else {
        //     $scope.set_path('/');
        // }


    };

    $scope.setCurrentUser = (user) => {
        $scope.currentUser = user;
    }

    function addRoutePlan() {
        var currentUser = JSON.parse(localData.get('STAFF_ACCOUNT'));
        var timeNow = new Date().getTime();
        $scope.routePlan.created_by = {
            email: currentUser.email || '',
            name: currentUser.name,
            phone: currentUser.phone,
            uid: currentUser.uid
        };
        $scope.routePlan.editors = [currentUser.phone || ''];
        $scope.routePlan.id = timeNow.toString();
        $scope.routePlan.last_edited_time = 0;
        $scope.routePlan.time = timeNow;
        $scope.routePlan.viewers = [currentUser.phone || '']
        $scope.isLoading = true;
        mappingService.
            addRoutePlan($scope.routePlan).
            then(result => {
                $scope.close_dialog();
                removeLayers();
                initAreaDrawing();
            }).
            catch(error => {
                Swal.fire({
                    type: 'error',
                    title: 'Oops...',
                    text: 'Operation failed, please try again.',
                    footer: ''
                }).then(() => {
                });
            }).finally(() => {
                // createRoutePlan();
                $scope.isLoading = false;
            });
    }

    function addRoutes(routePlan, route) {
        var source = $scope.map.getSource('geojson' + sourceID);
        var data = source._data;
        routes.points = [];
        var timeNow = new Date().getTime().toString();
        route.id = timeNow;

        for (var i = 0; i < data.features.length - 1; i++) {
            routes.points.push({
                longitude: data.features[i].geometry.coordinates[0],
                latitude: data.features[i].geometry.coordinates[1]
            })
        }

        mappingService.
            addRoutes(routePlan, route).
            then(result => {

            }).
            catch(error => {
                Swal.fire({
                    type: 'error',
                    title: 'Oops...',
                    text: 'Operation failed, please try again.',
                    footer: ''
                }).then(() => {
                });
            })
    }

    $scope.saveRoute = addRoutes;

    function updateLayerColor(layerID, propertyName, color) {
        var layer = $scope.map.getLayer(layerID);
        layer[propertyName] = color;
    }

    $scope.saveRoutePlan = addRoutePlan;
    function getRoutes() {

    }

    $scope.createRoutePlan = (event) => {
        $scope.showPrerenderedDialog(event, 'windowOperationPlan')
    }

    $scope.discardRoute = () => {

    }

    $scope.get_gps_query = () => {
        return db.collection("staffs").doc("+639123456789").collection("gps").orderBy("time");
    };

    $scope.loadRecordingsByUserAndDate = async (userID, dateOfRecord) => {
        removeLayers();
        try {
            $scope.isLoading = true
            $scope.recordings = await mappingService.getRecordingByUserAndDate(userID, new Date(dateOfRecord));
            var promises = [];

            for (var i = 0; i < $scope.recordings.length; i++) {
                var recording = $scope.recordings[i];
                var promise = mappingService.getCoordinates(recording);
                promises.push(promise);
            }

            Promise.all(promises).then(coordinates => {
                coordinates.forEach(coordinate => {
                    var id = new Date().getTime();
                    $scope.addLineLayer(id.toString(), coordinate, "#f00", 8);
                    mapLayers.push(id);
                });
                $scope.map.flyTo({ center: coordinates[0][0], zoom: 15 });
            }).finally(() => {
                $scope.isLoading = false
                $scope.$apply();
            })


        } catch (error) {
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: 'Operation failed, please try again.',
                footer: ''
            }).then(() => {
            });
        } finally {
        }
    }

    var mapLayers = [];
    function removeLayers() {
        mapLayers.forEach(layer => {
            $scope.map.removeLayer(layer);
        });
        mapLayers = [];
    
    }
    $scope.users = [];
    $scope.loadUsers = async () => {
        $scope.users = await userAccountsService.getUsers();
        $scope.$apply();
    }

    $scope.loadOperation = (operationID) => {
        removeLayers();
        loadRoutes(operationID).
        then(result => {
            loadAreas(operationID);
        })
    }

    $scope.setCurrentOperation = (operation) => {
        $scope.currentOperation = operation;
    }

    $scope.loadOperations = () => {
        mappingService.getOperations().
        then(operations => {
            $scope.operations = operations;
            $scope.$apply();
        })
    }



    function loadRoutes(operationID){
        return new Promise((resolve, reject) => {
            mappingService.getRoutes(operationID).
            then(routes => {
                routes.forEach(route => {
                    var geojson = {
                        'type': 'FeatureCollection',
                        'features': []
                    }

                    route.points.forEach(point => {
                        var coordinate = {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Point',
                                'coordinates': [point.longitude, point.latitude]
                            },
                            'properties': {
                                'id': String(new Date().getTime())
                            }
                        }
                        geojson.features.push(coordinate);
                    });

                    $scope.map.addSource(route.id, {
                        'type': 'geojson',
                        'data': geojson
                    });

                    $scope.map.addLayer({
                        id: `points-${route.id}`,
                        type: 'circle',
                        source: route.id,
                        paint: {
                            'circle-radius': 5,
                            'circle-color': route.color
                        },
                        filter: ['in', '$type', 'Point']
                    });

                    $scope.map.addLayer({
                        id: `lines-${route.id}`,
                        type: 'line',
                        source: route.id,
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': route.color,
                            'line-width': 2.5
                        },
                        filter: ['in', '$type', 'LineString']
                    });
                    mapLayers.push(`points-${route.id}`);
                    mapLayers.push(`lines-${route.id}`);

                    var linestring = {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': []
                        }
                    }

                    if (geojson.features.length > 1) {
                        linestring.geometry.coordinates = geojson.features.map(function (point) {
                            return point.geometry.coordinates;
                        });

                        geojson.features.push(linestring);
                    }
                    var source = $scope.map.getSource(route.id);
                    source.setData(geojson);
                    resolve(true)
                })
            })
        })
    }
    function loadAreas(operationID) {
        return new Promise((resolve, reject) => {
            mappingService.getAreas(operationID).
                then(areas => {
                    var source = {
                        'type': 'geojson',
                        'data': {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Polygon',
                                'coordinates': []
                            }
                        }
                    }
                    areas.forEach((area, index) => {
                        source.data.geometry.coordinates.push([]);
                        area.points.forEach((point) => {
                            source.data.geometry.coordinates[index].push([point.longitude, point.latitude]);
                        })

                        $scope.map.addLayer({
                            id: area.id.toString(),
                            type: 'fill',
                            source: source,
                            paint:{
                                'fill-color': area.color,
                                'fill-opacity': 0.8
                            }
                        })
                    });
                    resolve(true);
                });
                
        })
    }
    // setTimeout(() => {
    //     $scope.loadOperation('1577512518312');
    // }, 5000)
    var sourceID = 1;
    var layerIDs = [];
    var currentLayerID = 0;
    var createRoutePlan = () => {
    }

    function onMouseClickWhileDrawingRoute(e) {
        var features = $scope.map.queryRenderedFeatures(e.point, {
            layers: [`points-${currentPointAndLineLayerID}`]
        });

        var geojson = $scope.map.getSource(currentPointAndLineLayerID)._data;

        if (geojson.features.length > 1) geojson.features.pop();

        if (features.length) {
            var id = features[0].properties.id;
            geojson.features = geojson.features.filter(function (point) {
                return point.properties.id !== id;
            });
        } else {
            var point = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [e.lngLat.lng, e.lngLat.lat]
                },
                'properties': {
                    'id': String(new Date().getTime())
                }
            };

            geojson.features.push(point);
        }

        var linestring = {
            'type': 'Feature',
            'geometry': {
                'type': 'LineString',
                'coordinates': []
            }
        }

        if (geojson.features.length > 1) {
            linestring.geometry.coordinates = geojson.features.map(function (point) {
                return point.geometry.coordinates;
            });

            geojson.features.push(linestring);
        }

        var source = $scope.map.getSource(currentPointAndLineLayerID);
        // var layer = $scope.map.getLayer('lines-'+currentLayerID);
        source.setData(geojson);
    }

    function onMouseClickWhileDrawingArea(e) {
        var features = $scope.map.queryRenderedFeatures(e.point, {
            layers: [`area-${currentPolygonLayerID}`]
        });

        var geojson = $scope.map.getSource(currentPolygonLayerID)._data;

        if (features.length) {
            // var id = features[0].properties.id;
            // geojson.features = geojson.features[0].coordinates.filter(function (point) {
            //     return point.properties.id !== id;
            // });
        } else {
            geojson.features[0].geometry.coordinates[0].push([e.lngLat.lng, e.lngLat.lat]);
        }

        var source = $scope.map.getSource(currentPolygonLayerID);
        source.setData(geojson);
    }

    var currentPointAndLineLayerID = 0;
    function initRouteDrawing() {
        currentPointAndLineLayerID = new Date().getTime().toString();
        layerIDs.push(currentPointAndLineLayerID);
        currentLayerID = currentPointAndLineLayerID;

        var geojson = {
            'type': 'FeatureCollection',
            'features': []
        }

        $scope.map.addSource(currentPointAndLineLayerID, {
            'type': 'geojson',
            'data': geojson
        });

        $scope.map.addLayer({
            id: `points-${currentPointAndLineLayerID}`,
            type: 'circle',
            source: currentPointAndLineLayerID,
            paint: {
                'circle-radius': 5,
                'circle-color': '#000'
            },
            filter: ['in', '$type', 'Point']
        });

        $scope.map.addLayer({
            id: `lines-${currentPointAndLineLayerID}`,
            type: 'line',
            source: currentPointAndLineLayerID,
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            },
            paint: {
                'line-color': '#000',
                'line-width': 2.5
            },
            filter: ['in', '$type', 'LineString']
        });

        $scope.map.on('click', onMouseClickWhileDrawingRoute);

        // $scope.map.on('mousemove', function (e) {
        //     var features = $scope.map.queryRenderedFeatures(e.point, {
        //         layers: [`points-${currentLayerID}`]
        //     });

        //     // $scope.map.getCanvas().style.cursor = features.length
        //     //     ? 'pointer'
        //     //     : 'crosshair';
        // });
        setMouseCursorStyle('crosshair');
        $scope.drawRoute = drawRoute;
    }

    var currentPolygonLayerID = 0;
    function initAreaDrawing() {
        currentPolygonLayerID = new Date().getTime().toString();
        var geojson = {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [
                            []
                        ]
                    }
                }
            ]
        }

        $scope.map.addSource(currentPolygonLayerID, {
            'type': 'geojson',
            'data': geojson
        });

        $scope.map.addLayer({
            id: `area-${currentPolygonLayerID}`,
            type: 'fill',
            source: currentPolygonLayerID,
            paint: {
                'fill-color': '#088',
                'fill-opacity': 0.8
            },
            'filter': ['==', '$type', 'Polygon']
        });

        $scope.map.off('click', onMouseClickWhileDrawingRoute);
        $scope.map.on('click', onMouseClickWhileDrawingArea);
        $scope.drawArea = drawArea;
        setMouseCursorStyle('crosshair');

        // var draw = new MapboxDraw({
        //     displayControlsDefault: false,
        //     controls: {
        //         polygon: true,
        //         trash: true
        //     }
        // });

        // $scope.map.addControl(draw);
        // $scope.drawArea = () => { }
    }

    function setMouseCursorStyle(cursor) {
        $scope.map.getCanvas().style.cursor = cursor;
    }

    function drawRoute() {
        setMouseCursorStyle('hand');
        $scope.map.off('click', onMouseClickWhileDrawingRoute);
        $scope.map.off('click', onMouseClickWhileDrawingArea);

        $scope.drawRoute = () => {
            $scope.map.on('click', onMouseClickWhileDrawingRoute);
            $scope.map.off('click', onMouseClickWhileDrawingArea);
            setMouseCursorStyle('crosshair');
            currentLayerID = currentPointAndLineLayerID;
            $scope.drawRoute = drawRoute;
        }
    }

    function drawArea() {
        setMouseCursorStyle('hand');
        $scope.map.off('click', onMouseClickWhileDrawingRoute);
        $scope.map.off('click', onMouseClickWhileDrawingArea);
        $scope.drawRoute = () => {
            $scope.map.on('click', onMouseClickWhileDrawingArea)
            $scope.map.off('click', onMouseClickWhileDrawingRoute);
            setMouseCursorStyle('pointer');
            currentLayerID = currentPolygonLayerID;
        }
    }

    $scope.drawRoute = initRouteDrawing;
    $scope.drawArea = initAreaDrawing;

}).service('mappingService', function () {
    var collection = db.collection("ecan_app_recordings");

    this.getRecordingByUserAndDate = (userID, dateOfRecord) => {
        var year = dateOfRecord.getFullYear();
        var monthIndex = dateOfRecord.getMonth();
        var day = dateOfRecord.getDate();
        var from = new Date(year, monthIndex, day, 0, 0, 0);
        var to = new Date(year, monthIndex, day, 23, 59, 59);

        return new Promise((resolve, reject) => {
            var query = collection.
                where('uid', '==', userID).
                where('time', '>=', from.getTime()).
                where('time', '<=', to.getTime());

            query.onSnapshot(snapshot => {
                var recordings = snapshot.docs.map(document => {
                    var recording = document.data();
                    recording.id = document.id;
                    return recording;
                });
                resolve(recordings);
            });
        })
    }

    this.addRoutePlan = (routePlan) => {
        return new Promise((resolve, reject) => {
            db.
                collection('ecan_app_operation_plans').
                doc(routePlan.time.toString()).
                set(routePlan).
                then(result => {
                    resolve(routePlan);
                });
        })
    }

    this.getCoordinates = (recording) => {
        return new Promise((resolve, reject) => {
            collection.doc(recording.id).collection('Points').onSnapshot(snapshot => {
                var coordinates = [];
                snapshot.docs.forEach(document => {
                    var points = document.data();
                    if (points) {
                        points.points.forEach(point => {
                            coordinates.push([point.longitude, point.latitude]);
                        })
                    }
                })

                resolve(coordinates);
            })
        })
    }

    this.addRoutes = (routePlan, route) => {
        return new Promise((resolve, reject) => {
            db.
                collection('ecan_app_operation_plans').
                doc(routePlan.id).
                collection('routes').
                doc(route.id).
                set(route).
                then(result => {
                    resolve(route);
                })
        })
    }

    this.addAreas = (routePlan, points) => {
        return new Promise((resolve, reject) => {
            db.
                collection('ecan_app_operation_plans').
                doc(routePlan.id).
                collection('areas').
                doc(route.id).
                set(points).
                then(result => {
                    resolve(points);
                })
        })
    }

    this.getRoutes = (operationID) => {
        return new Promise((resolve, reject) => {
            db.collection('ecan_app_operation_plans').
                doc(operationID).
                collection('routes').
                onSnapshot(snapshot => {
                    var routes = snapshot.docs.map(document => {
                        var route = document.data();
                        route.id = document.id;
                        return route;
                    })
                    resolve(routes);
                })
        })
    }

    this.getAreas = (operationID) => {
        return new Promise((resolve, reject) => {
            db.collection('ecan_app_operation_plans').
                doc(operationID).
                collection('areas').
                onSnapshot(snapshot => {
                    var areas = snapshot.docs.map(document => {
                        var area = document.data();
                        area.id = document.id;
                        return area;
                    })
                    resolve(areas);
                })
        })
    };

    this.getOperations = () =>{
        return new Promise((resolve, reject) => {
            db.collection('ecan_app_operation_plans').
                onSnapshot(snapshot => {
                    var operations = snapshot.docs.map(document => {
                        var operation = document.data();
                        return operation;
                    })
                    resolve(operations);
                })
        })
    }
}).service('userAccountsService', function () {
    var collection = db.collection("staffs");

    this.getUsers = async () => {
        return new Promise((resolve, reject) => {
            collection.
                onSnapshot(snapshot => {
                    var users = snapshot.docs.map(doc => {
                        var user = doc.data();
                        user.id = doc.id;
                        return user;
                    });
                    resolve(users);
                })
        })
    }
});

document.write(`<script src='app/operations/mapping/map/controller.js'></script>`);