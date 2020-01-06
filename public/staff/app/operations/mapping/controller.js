'use strict';
myAppModule.controller('operations_map_controller', function ($scope, mappingService, $timeout, Upload) {
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

    $scope.refreshOperations = () => {
        mappingService.getOperations().then(operations => { $scope.operations = operations; $scope.$apply(); })
    }
    $scope.searchOperations = (operationName) => {
        $scope.isLoading = true;
        mappingService.searchOperation(operationName).
            then(operations => {
                $scope.operations = operations;
                $scope.$apply();
            })
    }

    $scope.loadPage = (url) => {
        window.location.href = url;
    }
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


    $scope.loadOperation = async (operationID) => {
        removeLayers();
        await loadTexts(operationID);
        await loadAreas(operationID);
        await loadFlags(operationID);
        await loadRoutes(operationID);
        await loadImages(operationID);
    }

    $scope.setCurrentOperation = (operation) => {
        $scope.currentOperation = operation;
        $scope.time = moment($scope.millisecondsToDate(operation.time)).format('MM/DD/YYYY');
    }

    $scope.infiniteItems = {
        numLoaded_: 0,
        toLoad_: 0,

        // Required.
        getItemAtIndex: function (index) {
            if (index > this.numLoaded_) {
                this.fetchMoreItems_(index);
                return null;
            }

            return index;
        },

        // Required.
        // For infinite scroll behavior, we always return a slightly higher
        // number than the previously loaded items.
        getLength: function () {
            return this.numLoaded_ + 5;
        },

        fetchMoreItems_: function (index) {
            // For demo purposes, we simulate loading more items with a timed
            // promise. In real code, this function would likely contain an
            // $http request.

            if (this.toLoad_ < index) {
                this.toLoad_ += 20;
                $timeout(angular.noop, 300).then(angular.bind(this, function () {
                    this.numLoaded_ = this.toLoad_;
                }));
            }
        }
    };

    // $scope.operation = {
    //     itemsCount: 0,
    //     itemsToLoadNext: 0,
    //     getItemAtIndex: function (index) {
    //         if (index > this.itemsCount) {
    //             return null;
    //         }
    //         return index;
    //     },
    //     getLength: function () {
    //         return this.itemsCount + 5;
    //     },
    //     getNextItems: function () {

    //     }
    // }

    $scope.loadOperations = () => {
        mappingService.getOperations().
            then(operations => {
                $scope.operations = operations;
                $scope.toggleSidenav();
                $scope.$apply();
            })
    }

    $scope.getNextItems = () => {
        if ($scope.operations.length) {
            var lastItemIndex = $scope.operations.length - 1;
            var lastItem = $scope.operations[lastItemIndex];
            mappingService.getNextItems(lastItem.name).
                then(operations => {
                    if (operations.length) {
                        operations.forEach(operation => {
                            $scope.operations.push(operation);
                        })
                    }

                    $scope.$apply();
                });
        }
    }
    $scope.setSelectedMenuItem = (menuItem) => {
        var templates = {
            'Track Records': 'trackrecords.html',
            'Operation Plans': 'operations.html'
        };
        $scope.template = templates[menuItem];
        $scope.selectedMenuItem = menuItem;
    }

    async function loadRoutes(operationID) {
        return new Promise((resolve, reject) => {
            mappingService.getRoutes(operationID).
                then(routes => {
                    routes.forEach(route => {
                        var points = route.points.map(point => {
                            return [point.longitude, point.latitude];
                        })
                        var lineID = `${route.id}-${new Date().getTime()}`
                        $scope.addLineLayer(lineID, points, route.color, 4);
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
    async function loadAreas(operationID) {
        return new Promise((resolve, reject) => {
            mappingService.getAreas(operationID).
                then(areas => {
                    try{
                        areas.forEach((area, index) => {
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
                            
                            source.data.geometry.coordinates.push([]);
                            area.points.forEach((point) => {
                                source.data.geometry.coordinates[0].push([point.longitude, point.latitude]);
                            })
                            var sourceID = `${area.id}-${new Date().getTime()}`;
                            $scope.map.addSource(sourceID, source);
                            addLayer({
                                id: 'area-' + area.id.toString(),
                                type: 'fill',
                                source: sourceID,
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
                    }catch(error){
                        Swal.fire({
                            type: 'error',
                            title: 'Oops...',
                            text: 'Failed to load areas, please try again.',
                            footer: ''
                        }).then(() => {
                        });
                    }
                    
                    resolve(areas);
                });

        })
    }

    async function loadFlags(operationID) {
        return new Promise((resolve, reject) => {
            mappingService.getFlags(operationID).
                then(flags => {
                    flags.forEach(flag => {
                        $scope.map.loadImage('/images/icons/flag.png', (error, image) => {
                            var dateNow = new Date().getTime().toString();
                            var name = `${flag.id}-${dateNow}`;
                            $scope.map.addImage(name, image);
                            var layer = $scope.getPointLayer(
                                [flag.coordinate.longitude, flag.coordinate.latitude],
                                flag.name,
                                '',
                                flag.description);
                            layer.layout['icon-image'] = name;
                            layer['icon-size'] = 1;
                            $scope.addLayer(layer);
                        });
                    })
                    resolve(flags);
                })
        });
    }

    async function loadImages(operationID) {
        return new Promise((resolve, reject) => {
            mappingService.getImages(operationID).
                then(images => {
                    images.forEach(image => {
                        var sourceID = `${image.id}-${new Date().getTime()}`;
                        $scope.map.addSource(`${sourceID}`, {
                            'type': 'geojson',
                            'data': {
                                'type': 'Feature',
                                'properties': {},
                                'geometry': {
                                    'type': 'Polygon',
                                    'coordinates': [
                                        [
                                            [image.points[0].longitude, image.points[0].latitude],
                                            [image.points[1].longitude, image.points[1].latitude],
                                            [image.points[2].longitude, image.points[2].latitude],
                                            [image.points[3].longitude, image.points[3].latitude],
                                        ]
                                    ]
                                }
                            }
                        });
                        var splitPath = image.path.split('/');
                        var imageName = splitPath[splitPath.length - 1];
                        mappingService.
                        getImage(operationID, imageName).
                            then(url => {
                                $scope.map.loadImage(url, (error, image_) => {
                                    if (error) {
                                        Swal.fire({
                                            type: 'error',
                                            title: 'Oops...',
                                            text: 'Failed to load images, please try again.',
                                            footer: ''
                                        }).then(() => {
                                        });

                                        return;
                                    };
                                    $scope.map.addImage(`${sourceID}`, image_);
                                    $scope.addLayer({
                                        'id': `${sourceID}`,
                                        'type': 'fill',
                                        'source': `${sourceID}`,
                                        'paint': {
                                            'fill-pattern': `${sourceID}`
                                        }
                                    })
                                })
                            }).catch(error => {
                                Swal.fire({
                                    type: 'error',
                                    title: 'Oops...',
                                    text: 'Operation failed, please try again.',
                                    footer: ''
                                }).then(() => {
                                });
                            });
                    })
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
        })
    }

    async function loadTexts(operationID) {
        return new Promise((resolve, reject) => {
            mappingService.getTexts(operationID).
                then(texts => {
                    texts.forEach(text => {
                        var layer = $scope.getPointLayer(
                            [text.coordinate.longitude, text.coordinate.latitude],
                            text.name,
                            '',
                            text.description
                        );
                        $scope.addLayer(layer);
                        resolve(text);
                    })
                })
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

    function onMouseClickWhileDrawingImage(e) {
        var features = $scope.map.queryRenderedFeatures(e.point, {
            layers: [`image-${currentImageLayerID}`]
        });

        var geojson = $scope.map.getSource(currentImageLayerID)._data;

        if (features.length) {
            // var id = features[0].properties.id;
            // geojson.features = geojson.features[0].coordinates.filter(function (point) {
            //     return point.properties.id !== id;
            // });
        } else {
            geojson.features[0].geometry.coordinates[0].push([e.lngLat.lng, e.lngLat.lat]);
        }

        var source = $scope.map.getSource(currentImageLayerID);
        source.setData(geojson);
        if (geojson.features[0].geometry.coordinates[0].length == 4) {
            uploadImage(geojson.features[0].geometry.coordinates);
        }
    }

    function onMouseClickWhileDrawingFlag(e) {
        $scope.showPrerenderedDialog(e, 'windowAddText');
        $scope.saveAnnotation = (annotation) => {
            var layer = $scope.getPointLayer(
                [e.lngLat.lng, e.lngLat.lat],
                annotation.title,
                annotation.symbol,
                annotation.description);
            $scope.addLayer(layer);
            $scope.addIcon([e.lngLat.lng, e.lngLat.lat],
                annotation.title,
                '/images/icons/flag.png',
                annotation.description
            );
            $scope.close_dialog();
        }
    }

    function onMouseClickWhileDrawingText(e) {
        $scope.showPrerenderedDialog(e, 'windowAddText');
        $scope.saveAnnotation = (annotation) => {
            var layer = $scope.getPointLayer(
                [e.lngLat.lng, e.lngLat.lat],
                annotation.title,
                annotation.symbol,
                annotation.description);
            $scope.addLayer(layer);
            $scope.close_dialog();
        }
    }

    function uploadImage(coordinates) {
        $scope.addToImageArea = (file) => {
            Upload.
                base64DataUrl(file).
                then(url => {
                    $scope.map.loadImage(url, function (error, image) {
                        var dateNow = new Date().getTime().toString();
                        $scope.map.addImage(dateNow, image);
                        $scope.addLayer({
                            'id': dateNow,
                            'type': 'fill',
                            'source': currentImageLayerID,
                            'paint': {
                                'fill-pattern': dateNow
                            }
                        })
                    })
                })
        }
        document.getElementById('imageUploader').click();
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
        removeClickListeners();
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
        var geojson = getFeatureCollection('Polygon')

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
        // $scope.map.off('click', onMouseClickWhileDrawingRoute);
        removeClickListeners();
        $scope.map.on('click', onMouseClickWhileDrawingArea);
        $scope.drawArea = drawArea;
        setMouseCursorStyle('crosshair');
    }

    var currentImageLayerID = 0;
    function initImageDrawing() {
        currentImageLayerID = new Date().getTime().toString();
        var geojson = getFeatureCollection('Polygon')
        $scope.map.addSource(currentImageLayerID, {
            'type': 'geojson',
            'data': geojson
        });

        addLayer({
            id: `image-${currentImageLayerID}`,
            type: 'fill',
            source: currentImageLayerID,
            paint: {
                'fill-color': '#088',
                'fill-opacity': 0.8
            },
            'filter': ['==', '$type', 'Polygon']
        });
        removeClickListeners();
        $scope.map.on('click', onMouseClickWhileDrawingImage);
        $scope.drawImage = drawImage;
        setMouseCursorStyle('crosshair');
    }

    function initTextDrawing() {
        setMouseCursorStyle('crosshair');
        removeClickListeners();
        $scope.map.on('click', onMouseClickWhileDrawingText);
        $scope.windowAnnotationTitle = 'Annotation';
        $scope.drawText = () => {
            setMouseCursorStyle('default');
            removeClickListeners();
            $scope.drawText = initTextDrawing;
        }
    }

    function initFlagDrawing() {
        setMouseCursorStyle('crosshair');
        removeClickListeners();
        $scope.windowAnnotationTitle = 'Flag';

        $scope.map.on('click', onMouseClickWhileDrawingFlag);
        $scope.drawFlag = () => {
            setMouseCursorStyle('default');
            removeClickListeners();
            $scope.drawFlag = initFlagDrawing;
        }
    }

    function getFeatureCollection(geometryType) {
        return {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'geometry': {
                        'type': geometryType,
                        'coordinates': [
                            []
                        ]
                    }
                }
            ]
        }
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

    function drawImage() {
        setMouseCursorStyle('default');
        removeClickListeners();
        $scope.drawImage = () => {
            removeClickListeners();
            $scope.map.on('click', onMouseClickWhileDrawingImage);
            setMouseCursorStyle('pointer');
            currentLayerID = currentPolygonLayerID;
        }

    }
    function removeClickListeners() {
        $scope.map.off('click', onMouseClickWhileDrawingRoute);
        $scope.map.off('click', onMouseClickWhileDrawingArea);
        $scope.map.off('click', onMouseClickWhileDrawingImage);
        $scope.map.off('click', onMouseClickWhileDrawingText);
        $scope.map.off('click', onMouseClickWhileDrawingFlag);
    }

    $scope.drawRoute = initRouteDrawing;
    $scope.drawArea = initAreaDrawing;
    $scope.drawImage = initImageDrawing;
    $scope.drawText = initTextDrawing;
    $scope.drawFlag = initFlagDrawing;
    $scope.addNewOperation = () => {

    }
}).
    controller('track_recording_controller', function ($scope, $mdSidenav, track_recording_service, userAccountsService) {
        $scope.currentUser = JSON.parse(localData.get('STAFF_ACCOUNT'));
        $scope.dateNow = new Date();

        // setTimeout(() => {
        //     $scope.loadRecordingsByUserAndDate('Nmkwr1hkEbUslFUUO11ZcNZxatN2', new Date('2019-12-23'), new Date('2019-12-30'))
        // })
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

        // $scope.currentTrackRecord = {};
        $scope.setCurrentTrackRecord = (record) => {
            $scope.currentTrackRecord = record;
            $scope.time = $scope.format(new Date(record.time), 'MM/DD/YYYY');
            $scope.start_time = $scope.format(new Date(record.start_time), 'MM/DD/YYYY hh:mm:ss a');
            $scope.end_time = $scope.format(new Date(record.end_time), 'MM/DD/YYYY  hh:mm:ss a')
            $scope.distance_in_km = record.distance ? (record.distance / 1000).toFixed(2) : 'unknown';
        }

        $scope.format = (date, formatString) => {
            return moment(date).format(formatString);
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
                    orderBy('time', 'desc').
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
            return getDocument(operationID, 'routes');
        }

        this.getAreas = (operationID) => {
            return getDocument(operationID, 'areas');
        };

        this.getFlags = (operationID) => {
            return getDocument(operationID, 'flags');
        }

        this.getImages = (operationID) => {
            return getDocument(operationID, 'images')
        }

        this.getTexts = (operationID) => {
            return getDocument(operationID, 'texts');
        }

        var getDocument = (operationID, documentName) => {
            return new Promise((resolve, reject) => {
                db.collection('ecan_app_operation_plans').
                    doc(operationID).
                    collection(documentName).
                    onSnapshot(snapshot => {
                        var documents = snapshot.docs.map(document => {
                            var item = document.data();
                            item.id = document.id;
                            return item;
                        })
                        resolve(documents);
                    })
            })
        }

        this.getOperations = () => {
            return new Promise((resolve, reject) => {
                db.collection('ecan_app_operation_plans').
                    orderBy('time', 'desc').
                    limit(100).
                    onSnapshot(snapshot => {
                        var operations = snapshot.docs.map(document => {
                            var operation = document.data();
                            return operation;
                        })
                        resolve(operations);
                    })
            })
        }

        this.getNextItems = (startAt) => {
            return new Promise((resolve, reject) => {
                db.collection('ecan_app_operation_plans').
                    orderBy('name').
                    limit(10).
                    startAfter(startAt).
                    onSnapshot(snapshot => {
                        var operations = snapshot.docs.map(document => {
                            var operation = document.data();
                            return operation;
                        })
                        resolve(operations);
                    })
            })
        }

        this.getImage = (operationID, imageName) => {
            return new Promise((resolve, reject) => {
                storageRef.child('map_plan_images').
                    child(operationID).
                    child(imageName).
                    getDownloadURL().
                    then(url => {
                        resolve(url)
                    }).
                    catch(error => {
                        throw error;
                    })
            });
        }

        this.searchOperation = (operationName) => {
            return new Promise((resolve, reject) => {
                db.collection('ecan_app_operation_plans').
                    orderBy('name').
                    onSnapshot(snapshot => {
                        var documents = snapshot.docs.filter(document => {
                            var data = document.data();
                            return data.name.includes(operationName);
                        })

                        var operations = documents.map(document => {
                            var operation = document.data();
                            operation.id = document.id;
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