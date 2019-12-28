'use strict';

// import { resolveContent } from "nodemailer/lib/shared";

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
        var routePlan = {
            created_by: {
                email: currentUser.email,
                name: currentUser.name,
                phone: currentUser.phone,
                uid: currentUser.uid
            },
            editors: [],
            id: timeNow.toString(),
            last_edited_time: 0,
            name: $scope.routePlan.name,
            operation_no: $scope.routePlan.operation_no,
            time: timeNow
        }

        mappingService.
            addRoutePlan(routePlan).
            then(result => {

            });
    }

    function getRoutes() {

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

    var createRoutePlan = () => {
        var geojson = {
            'type': 'FeatureCollection',
            'features': []
        }
        var linestring = {
            'type': 'Feature',
            'geometry': {
                'type': 'LineString',
                'coordinates': []
            }
        }
        $scope.map.addSource('geojson', {
            'type': 'geojson',
            'data': geojson
        });

        var timeNow = new Date().getTime();
        $scope.map.addLayer({
            id: `points-${timeNow}`,
            type: 'circle',
            source: 'geojson',
            paint: {
                'circle-radius': 5,
                'circle-color': '#000'
            },
            filter: ['in', '$type', 'Point']
        });

        $scope.map.addLayer({
            id: `lines-${timeNow}`,
            type: 'line',
            source: 'geojson',
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

        $scope.map.on('click', function (e) {
            var features = $scope.map.queryRenderedFeatures(e.point, {
                layers: ['measure-points']
            });

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

            if (geojson.features.length > 1) {
                linestring.geometry.coordinates = geojson.features.map(function (
                    point
                ) {
                    return point.geometry.coordinates;
                });

                geojson.features.push(linestring);
            }

            $scope.map.getSource('geojson').setData(geojson);
        });

        $scope.map.on('mousemove', function (e) {
            var features = $scope.map.queryRenderedFeatures(e.point, {
                layers: ['measure-points']
            });
            $scope.map.getCanvas().style.cursor = features.length
                ? 'pointer'
                : 'crosshair';
        });
    }

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
                doc(routePlan.dateCreated.getTime()).
                set(routePlan).
                then(result => {
                    // db.
                    // collection('ecan_app_operation_plans').
                    // doc(routePlan.dateCreated.getTime()).
                    // collection('areas').
                    // doc(new Date().getTime()).
                    // set(areas).
                    // then(result2 => {
                    //     resolve(routePlan);
                    // })
                });
        })
    }

    this.getCoordinates = (recording) => {
        return new Promise((resolve, reject) => {
            collection.doc(recording.id).collection('Points').onSnapshot(snapshot => {
                var coordinates = [];
                snapshot.docs.forEach(document => {
                    var points = document.data();
                    if (points){
                        points.points.forEach(point => {
                            coordinates.push([point.longitude, point.latitude]);
                        })
                    }
                })

                resolve(coordinates);
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