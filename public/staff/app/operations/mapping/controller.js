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
                initRouteDrawing();
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

    // setTimeout(() => {
    //     $scope.loadRecordingsByUserAndDate('Nmkwr1hkEbUslFUUO11ZcNZxatN2', '2019-12-26')

    // }, 3000);


    function addLayer(layer) {
        $scope.addLayer(layer);
    }

    function removeLayers() {
        $scope.removeLayers();
    }

    $scope.users = [];


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
                $scope.toggleSidenav();
                $scope.$apply();
            })
    }


    $scope.setSelectedMenuItem = (menuItem) => {
        var templates = {
            'Track Records': 'trackrecords.html',
            'Operation Plans': 'operations.html'
        };
        $scope.template = templates[menuItem];
        $scope.selectedMenuItem = menuItem;
    }

    function loadRoutes(operationID) {
        return new Promise((resolve, reject) => {
            mappingService.getRoutes(operationID).
                then(routes => {
                    routes.forEach(route => {
                        var points = route.points.map(point => {
                            return [point.longitude, point.latitude];
                        })
                        $scope.addLineLayer(route.id, points, route.color, 4);
                        $scope.map.on('click', 'lines-' + route.id, (e) => {
                            new mapboxgl.Popup()
                                .setLngLat(points[0])
                                .setHTML(`<strong>${route.name}</strong><div>${route.description}</div>`)
                                .addTo($scope.map);
                        })

                        resolve(true);
                    });
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

                        addLayer({
                            id: 'area-' + area.id.toString(),
                            type: 'fill',
                            source: source,
                            paint: {
                                'fill-color': area.color,
                                'fill-opacity': 0.8
                            }
                        });

                        $scope.map.on('click', 'area-' + area.id.toString(), (e) => {
                            new mapboxgl.Popup()
                                .setLngLat([area.points[0].longitude, area.points[0].latitude])
                                .setHTML(`<strong>${area.name}</strong><div>${area.description}</div>`)
                                .addTo($scope.map);
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

        addLayer({
            id: `points-${currentPointAndLineLayerID}`,
            type: 'circle',
            source: currentPointAndLineLayerID,
            paint: {
                'circle-radius': 5,
                'circle-color': '#000'
            },
            filter: ['in', '$type', 'Point']
        })

        addLayer({
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
        })
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

        addLayer({
            id: `area-${currentPolygonLayerID}`,
            type: 'fill',
            source: currentPolygonLayerID,
            paint: {
                'fill-color': '#088',
                'fill-opacity': 0.8
            },
            'filter': ['==', '$type', 'Polygon']
        })
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

}).
    controller('track_recording_controller', function ($scope, $mdSidenav, track_recording_service, userAccountsService) {
        $scope.currentUser = JSON.parse(localData.get('STAFF_ACCOUNT'));
        $scope.dateNow = new Date();

        setTimeout(() => {
            $scope.loadRecordingsByUserAndDate('Nmkwr1hkEbUslFUUO11ZcNZxatN2',new Date('2019-12-23'), new Date('2019-12-30'))
        })
        $scope.loadRecordingsByUserAndDate = async (userID, from, to) => {
            try {
                $scope.isLoading = true
                $scope.recordings = await track_recording_service.getRecordingByUserAndDate(userID, new Date(from), new Date(to));
                $scope.toggleSidenav();
                $scope.$apply();
                // var promises = [];

                // for (var i = 0; i < $scope.recordings.length; i++) {
                //     var recording = $scope.recordings[i];
                //     var promise = track_recording_service.getCoordinates(recording);
                //     promises.push(promise);
                // }

                // Promise.all(promises).
                //     then(coordinates => {
                //         coordinates.forEach(coordinate => {
                //             var id = new Date().getTime();
                //             $scope.addLineLayer(id.toString(), coordinate, "#f00", 8);
                //         });
                //         if (coordinates.length)
                //             $scope.map.flyTo({ center: coordinates[0][0], zoom: 15 });

                //     }).finally(() => {

                //     })
            } catch (error) {
                Swal.fire({
                    type: 'error',
                    title: 'Oops...',
                    text: 'Operation failed, please try again.',
                    footer: ''
                }).then(() => {
                });
            } finally {
                $scope.isLoading = false
                $scope.$apply();
            }
        }

        $scope.loadRecordToMap = (record) => {
            $scope.isLoading = true;
            $scope.removeLayers();

            track_recording_service.
                getCoordinates(record).
                then(coordinates => {
                    var id = new Date().getTime().toString();
                    $scope.addLineLayer(id, coordinates, "#f00", 8);

                    if (coordinates.length)
                        $scope.map.flyTo({ center: coordinates[0], zoom: 15 });

                    $scope.map.on('click', 'lines-' + id, (e) => {
                        new mapboxgl.Popup()
                            .setLngLat(coordinates[0])
                            .setHTML(`<strong>${record.name}</strong><div>${record.description}</div>`)
                            .addTo($scope.map);
                    })
                    $scope.isLoading = false;
                }).catch(error => {
                    Swal.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Operation failed, please try again.',
                        footer: ''
                    }).then(() => {
                    });
                });

        }
        $scope.setCurrentUser = (user) => {
            $scope.currentUser = user;
        }

        $scope.currentTrackRecord = {};
        $scope.setCurrentTrackRecord = (record) => {
            $scope.currentTrackRecord = record;
        }
        $scope.loadUsers = async () => {
            $scope.users = await userAccountsService.getUsers();
            $scope.$apply();
        }
    }).
    service('track_recording_service', function () {
        var collection = db.collection("ecan_app_recordings");
        this.getRecordingByUserAndDate = (userID, from, to) => {
            var fromYear = from.getFullYear();
            var fromMonth = from.getMonth();
            var fromDay = from.getDate();
            var toYear = to.getFullYear();
            var toMonth = to.getMonth();
            var toDay = to.getDate();
            var dateStart = new Date(fromYear, fromMonth, fromDay, 0, 0, 0);
            var dateEnd = new Date(toYear, toMonth, toDay, 23, 59, 59);

            return new Promise((resolve, reject) => {
                var query = collection.
                    where('uid', '==', userID).
                    where('time', '>=', dateStart.getTime()).
                    where('time', '<=', dateEnd.getTime());

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
    }).
    service('mappingService', function () {
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

        this.getOperations = () => {
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
    }).
    service('userAccountsService', function () {
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