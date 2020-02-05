myAppModule.
    controller('live_tracking_controller', function ($scope, track_recording_service, userAccountsService, live_tracking_service) {
        var staffs = [];
        $scope.initializeTracks = () => {
            userAccountsService.
                getUsers().
                then(users => {
                    staffs = users;
                    loadTracking(staffs);
                })
        }

        function loadTracking(staffs) {
            staffs.forEach(staff => {
                var dateNow = new Date();
                var start = new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate(), 0, 0, 0).getTime();
                var msInAday = 8.64e+7;
                var end = start + msInAday;

                live_tracking_service.
                    getTracking(start, end, staff).
                    subscribe(recordings => {
                        loadToMap(recordings);
                    })
            })
        }

        var currentCoordinate = {};
        var recordingsDictionary = {};
        function loadToMap(recordings) {
            recordings.forEach(recording => {
                if (recordingsDictionary[recording.id]) {
                    return;
                }
                recordingsDictionary[recording.id] = recording;

                live_tracking_service.
                    getCoordinates(recording).
                    subscribe(coordinates => {
                        // resolve(coordinates);
                        var source = $scope.map.getSource(recording.id);
                        if (source) {
                            // var data = source._data;
                            // data.features[0].geometry.coordinates[0] = coordinates;
                            // source.setData(data);
                            var newCoordinates = coordinates.slice(currentCoordinate[recording.id].length);
                            updateRecording(recording, newCoordinates);
                        } else {
                            initializeRecording(recording);
                            updateRecording(recording, coordinates);
                        }
                        currentCoordinate[recording.id] = coordinates;
                        $scope.$apply();
                        // console.log(coordinates);
                    })
            });
        }

        function initializeRecording(recording) {
            var geojson = {
                'type': 'FeatureCollection',
                'features': []
            }

            $scope.map.addSource(recording.id, {
                'type': 'geojson',
                'data': geojson
            });

            var color = getColor();
            $scope.addLayer({
                id: `route-${recording.id}`,
                type: 'circle',
                source: recording.id,
                paint: {
                    'circle-radius': 5,
                    'circle-color': color
                },
                filter: ['in', '$type', 'Point']
            })

            $scope.addLayer({
                id: `lines-${recording.id}`,
                type: 'line',
                source: recording.id,
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round'
                },
                paint: {
                    'line-color': color,
                    'line-width': 2.5
                },
                filter: ['in', '$type', 'LineString']
            })
        }

        function updateRecording(recording, newCoordinates) {
            var geojson = $scope.map.getSource(recording.id)._data;

            newCoordinates.forEach(newCoordinate => {
                var point = {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': newCoordinate
                    },
                    'properties': {
                        'id': String(new Date().getTime())
                    }
                };

                geojson.features.push(point);
            })

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

            var source = $scope.map.getSource(recording.id);
            source.setData(geojson);
        }

        var currentColorIndex = 0;
        function getColor() {
            var colors = [
                "Aqua",
                "Black",
                "Blue",
                "BlueViolet",
                "Brown",
                "BurlyWood",
                "CadetBlue",
                "Chartreuse",
                "Chocolate",
                "Coral",
                "CornflowerBlue",
                "Crimson",
                "Cyan",
                "DarkBlue",
                "DarkCyan",
                "DarkGoldenRod",
                "DarkGreen",
                "DarkKhaki",
                "DarkMagenta",
                "DarkOliveGreen",
                "DarkOrange",
                "DarkOrchid",
                "DarkRed",
                "DarkSalmon",
                "DarkSlateBlue",
                "DarkSlateGray",
                "DarkSlateGrey",
                "DarkTurquoise",
                "DarkViolet",
                "DeepPink",
                "DeepSkyBlue",
                "DimGray",
                "DimGrey",
                "DodgerBlue",
                "FireBrick",
                "ForestGreen",
                "Fuchsia",
                "Gold",
                "GoldenRod",
                "Gray",
                "Grey",
                "Green",
                "GreenYellow",
                "HotPink",
                "IndianRed",
                "Indigo",
                "Khaki",
                "LawnGreen",
                "LemonChiffon",
                "LightBlue",
                "LightCoral",
                
                "LightGreen",
                "LightPink",
                "LightSalmon",
                "LightSeaGreen",
                "LightSkyBlue",
                "LightSlateGray",
                "LightSlateGrey",
                "LightSteelBlue",
                "Lime",
                "LimeGreen",
                "Magenta",
                "Maroon",
                "MediumAquaMarine",
                "MediumBlue",
                "MediumOrchid",
                "MediumPurple",
                "MediumSeaGreen",
                "MediumSlateBlue",
                "MediumSpringGreen",
                "MediumTurquoise",
                "MediumVioletRed",
                "MidnightBlue",
                "Navy",
                "Olive",
                "OliveDrab",
                "Orange",
                "OrangeRed",
                "Orchid",
                "PaleGoldenRod",
                "PaleGreen",
                "PaleTurquoise",
                "PaleVioletRed",
                "PapayaWhip",
                "PeachPuff",
                "Peru",
                "Pink",
                "Plum",
                "PowderBlue",
                "Purple",
                "RebeccaPurple",
                "Red",
                "RosyBrown",
                "RoyalBlue",
                "SaddleBrown",
                "Salmon",
                "SandyBrown",
                "SeaGreen",
                "SeaShell",
                "Sienna",
                "Silver",
                "SkyBlue",
                "SlateBlue",
                "SlateGray",
                "SlateGrey",
                "Snow",
                "SpringGreen",
                "SteelBlue",
                "Tan",
                "Teal",
                "Thistle",
                "Tomato",
                "Turquoise",
                "Violet",
                "Wheat",
                "White",
                "WhiteSmoke",
                "Yellow",
                "YellowGreen"

            ];
            var color = colors[currentColorIndex];
            currentColorIndex += 1;
            return color;
        }
        function startLiveTracking() {
            var timeInterval = 1000;
            var start = new Date();
            var end = new Date();
            setInterval(() => {
                end = new Date();
                staffs.forEach(staff => {
                    track_recording_service.
                        getTracking(start, end, staff).
                        then(recordings => {

                        })
                })
            }, timeInterval)
        }
    }).
    service('live_tracking_service', function () {
        var collection = db.collection('ecan_app_recordings');
        // const { Observable } = rxjs;
        this.getCoordinates = (recording) => {
            return new rxjs.Observable(subscriber => {
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

                    subscriber.next(coordinates);
                })
            })
        }

        this.getTracking = (startingTimeInMS, endingTimeInMS, staff) => {
            return new rxjs.Observable(subscriber => {
                // var dateNow = new Date();
                // var start = new Date(dateNow.getFullYear(), dateNow.getMonth(),  dateNow.getDate());
                collection.
                    where('time', '>=', startingTimeInMS).
                    // where('time', '<=', endingTimeInMS).
                    // where('staff_id', '==', staff.id).
                    orderBy('time', 'asc').
                    onSnapshot(snapshot => {
                        var recordings = snapshot.docs.map(document => {
                            var recording = document.data();
                            recording.id = document.id;
                            return recording;
                        })
                        subscriber.next(recordings);
                    })

            })
        }
    })
