// import { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } from "constants";

myAppModule.
    controller('incoming_query_controller',
        function ($scope,
            $incoming_query_service,
            $location,
            $timeout,
            Upload) {
            $scope.query = {};
            $scope.currentController = {
                receipients: []
            }
            $scope.updateIncomingQuery = (incomingQuery) => {
                incomingQuery.agency = $scope.global.ops;

                $incoming_query_service.updateIncomingQuery(incomingQuery).
                    then(success => {
                        Swal.fire(
                            'Success!',
                            '',
                            'success'
                        ).then(() => {

                        });
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
            var addIncomingQuery = (incomingQuery) => {
                var account_id = localData.get('BRAIN_STAFF_ID');
                var now = new Date();

                $scope.is_loading = true;
                incomingQuery.date_entered = $scope.to_date(now);
                incomingQuery.created_time = now.getTime();
                incomingQuery.publisher = account_id;
                incomingQuery.status = 'published';
                incomingQuery.meta = { 'published_date': $scope.date_now('YYYY-MM-DD'), 'published_time': Date.now() };
                incomingQuery.agency = $scope.global.ops;
                incomingQuery.template = {
                    'view': './app/records/queries/incoming/view/view.html',
                    'create': './app/records/queries/incoming/create/view.html',
                    'edit': './app/records/queries/incoming/update/view.html',
                    'print': './app/records/queries/incoming/print/view.html',
                    'type': 'communication'
                };
                incomingQuery.keywords = incomingQuery.keywords.filter((value) => {
                    return value != undefined && value.trim() != '';
                });

                incomingQuery.agency = $scope.global.ops;
                $incoming_query_service.
                    addIncomingQuery(incomingQuery).
                    then(addedItem => {
                        Swal.fire(
                            'Success!',
                            '',
                            'success'
                        ).then((result) => {
                            localData.set('incomingQuery', setJson(addedItem));
                            $location.path('/records/queries/incoming/update');
                            $scope.$apply();
                        });
                    }).
                    catch(error => {
                        Swal.fire({
                            type: 'error',
                            title: 'Oops...',
                            text: 'Operation failed, please try again.',
                            footer: ''
                        }).then(() => {
                        });
                    });
            }
            $scope.saveIncomingQuery = addIncomingQuery;

            $scope.incomingQueries = [];
            $scope.queriesTable = $scope.ngTable([]);

            $scope.loadIncomingQueries = () => {
                $incoming_query_service.
                    getIncomingQueries().
                    then(items => {
                        $scope.incomingQueries = items;
                        disableNextButton();

                        $scope.queriesTable = $scope.ngTable($scope.incomingQueries);
                        // $scope.$apply();
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

            $scope.loadIncomingQueriesEnteredByCurrentStaff = () => {
                $incoming_query_service.
                    getIncomingQueriesEnteredBy(localData.get('BRAIN_STAFF_ID')).
                    then(items => {
                        $scope.incomingQueries = items;
                        $scope.queriesTable = $scope.ngTable($scope.incomingQueries);
                        // $scope.$apply();
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

            $scope.update = (query) => {
                localData.set('incomingQuery', setJson(query));
                $location.path('/records/queries/incoming/update');
            }

            $scope.loadQuery = () => {
                $scope.query = JSON.parse(localData.get('incomingQuery'));
                if (!$scope.query.images)
                    $scope.query.images = [];

                imageID = $scope.query.images.length;
                loadRelatedDocuments();
                let currentUser = JSON.parse(localData.get('STAFF_ACCOUNT'));
                loadReceipients($scope.query, 'pcsd_' + currentUser.id);
            }

            async function loadRelatedDocuments() {
                $scope.relatedDocuments = await $incoming_query_service.getRelatedDocuments($scope.query.id);
            }

            function loadReceipients(query, currentUserID){
                $incoming_query_service.
                getReceipients(query.id, currentUserID).
                then(receipients => {
                    $scope.currentReceipients = receipients;
                    $scope.$apply();
                })
            }

            $scope.setCurrentItem = (query) => {
                $scope.currentItem = query;
                // $scope.$apply();
            }

            $scope.export = (incomingQueries) => {
                remove(['id', 'entered_by'], incomingQueries);
                var ws = XLSX.utils.json_to_sheet(incomingQueries);
                fixedHeader(ws);
                var wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
                XLSX.writeFile(wb, "communications.xlsx");
            }

            var limit = 1;
            var currenPage = 1;
            $scope.isFirstPage = true;

            $scope.getNextItems = () => {
                $scope.isLastPage = true;
                $incoming_query_service.getNextItems($scope.incomingQueries[$scope.incomingQueries.length - 1].control_number,
                    localData.get('BRAIN_STAFF_ID')).
                    then(result => {
                        $scope.incomingQueries = result;
                        currenPage = currenPage + 1;
                        disableNextButton();
                        $scope.isFirstPage = false;

                        $scope.$apply();
                    });
            }


            $scope.getPreviousItems = () => {
                $incoming_query_service.getPreviousItems($scope.incomingQueries[0].control_number).
                    then(result => {
                        $scope.incomingQueries = result;
                        currenPage = currenPage - 1;
                        $scope.isLastPage = false;

                        if (currenPage == 1) {
                            $scope.isFirstPage = true;
                        }
                        $scope.$apply();
                    });
            }

            var imageID = 0;
            $scope.query.images = [];
            $scope.addToGallery = (files) => {
                Upload.
                    base64DataUrl(files).
                    then(urls => {
                        urls.forEach(url => {
                            var image = {
                                id: imageID,
                                url: url,
                                deletable: true
                            }

                            $scope.query.images.push(image);
                            imageID++;
                        })
                    })
            }

            $scope.removeFromGallery = (imageToRemove, onDelete) => {
                var index = $scope.query.images.findIndex(image => image.id == imageToRemove.id);
                if (index > -1) {
                    $scope.query.images.splice(index, 0);
                    onDelete();
                }
            }

            $scope.loadLastControlNumber = async () => {
                var lastQuery = await $incoming_query_service.getLastQuery();
                $scope.lastControlNumber = lastQuery.control_number;
                $scope.$apply();
            }

            $scope.print = () => {
                $timeout(() => {
                    window.print();
                    window.close();
                }, 2000);
            }

            $scope.createReceipt = () => {
                localData.set('reference', JSON.stringify($scope.query));
                localData.set('previous_view', '/records/queries/incoming/update');
                $location.path('/receipt/create');
            }

            $scope.loadDocument = (document) => {
                localData.set(document.type, JSON.stringify(document));
                $location.path(document.template.view);
            }

            $scope.query.uploadedFiles = [];
            var fileID = 0;
            $scope.addFiles = (files) => {
                files.forEach((value) => {
                    Upload.
                        dataUrl(value, true).
                        then(url => {
                            var file = {
                                id: fileID,
                                url: url,
                                deletable: true,
                                name: value.name
                            }

                            $scope.query.uploadedFiles.push(file);
                            fileID++;
                        })
                })
            }

            $scope.removeFile = (file) => {
                Swal.fire({
                    title: 'Are you sure you want to delete this item?',
                    text: "You won't be able to revert this!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, delete it!'
                }).then((response) => {
                    if (response.value) {
                        var index = $scope.query.uploadedFiles.findIndex(uploadedFile => uploadedFile.id == file.id);
                        $scope.query.uploadedFiles.splice(index, 1);
                        $scope.$apply();
                    }
                })

            }

            
            $scope.accounts = [];
            $scope.loadAccounts = () => {
                $incoming_query_service.getAccounts($scope.global.ops.id).
                then(accounts => {
                    $scope.accounts = accounts;
                    $scope.$apply();
                });
            }

            $scope.loadCurrentUser = () => {
                let currentUser = JSON.parse(localData.get('STAFF_ACCOUNT'));
                $incoming_query_service.
                getCurrentUser('pcsd_' + currentUser.id).
                then(user => {
                    $scope.doc_user = user;
                })
            }
            function disableNextButton() {
                $incoming_query_service.
                    getNextItems($scope.incomingQueries[$scope.incomingQueries.length - 1].control_number,
                        localData.get('BRAIN_STAFF_ID')).
                    then(secondResult => {
                        $scope.isLastPage = secondResult.length < limit;
                        $scope.$apply();
                    });
            }

            function fixedHeader(workSheet) {
                var columnTexts = [
                    'Communication Status',
                    'Contents',
                    "Control Number",
                    "Correspondence Description",
                    "Date Entered",
                    "Date of Correspondence",
                    "Date Received",
                    "OED Actions",
                    "Referral Date",
                    "Source of Origin",
                    "Outgoing Date",
                    "Status of Action"
                ]

                var currentColumn = 'A';
                columnTexts.forEach((value) => {
                    var currentCell = `${currentColumn}1`;
                    if (workSheet[currentCell] == undefined)
                        workSheet[currentCell] = { t: "s" };
                    workSheet[currentCell].v = value;
                    currentColumn = String.fromCharCode(currentColumn.charCodeAt(0) + 1);
                })
            }

            function remove(keysToRemove, arrayOfObjects) {
                arrayOfObjects.forEach((arrayItem) => {
                    keysToRemove.forEach((key) => {
                        delete arrayItem[key];
                    })
                });
            }


        }).
    service('$incoming_query_service', function ($crudService) {
        var collection = db.collection('documents');
        var countLimit = 10;

        this.addIncomingQuery = (incomingQuery) => {
            return $crudService.addItem(incomingQuery, collection);
        }

        this.getIncomingQueries = () => {
            return new Promise((resolve, reject) => {
                collection.
                    where('template.type', '==', 'communication').
                    onSnapshot(snapshot => {
                        var items = snapshot.docs.map(document => {
                            var query = document.data();
                            query.id = document.id;
                            return query;
                        });
                        resolve(items);
                    })
            })

            // return $crudService.getItemsLimitBy(collection, countLimit);
        }

        this.getIncomingQueriesEnteredBy = (staffID) => {
            return new Promise((resolve, reject) => {
                collection.
                    where('publisher', '==', staffID).
                    where('template.type', '==', 'communication').
                    onSnapshot(snapshot => {
                        var items = snapshot.docs.map(document => {
                            var query = document.data();
                            query.id = document.id;
                            return query;
                        });
                        resolve(items);
                    })
            })
            // return $crudService.getItemsEnteredBy(staffID, collection);
        }

        this.updateIncomingQuery = (incomingQuery) => {
            return $crudService.updateItem(incomingQuery, collection);
        }

        this.getNextItems = (startAt, staffID) => {
            let promise = new Promise((resolve, reject) => {
                var query = collection;

                if (staffID)
                    query = query.where('publisher', '==', staffID);

                query = query.
                    where('template.type', '==', 'communication').
                    orderBy('created_time').
                    limit(countLimit);

                if (startAt)
                    query = query.startAfter(startAt);

                query.onSnapshot(snapShot => {
                    let items = snapShot.docs.map(documentSnapshot => {
                        let item = documentSnapshot.data();
                        item.id = documentSnapshot.id;
                        return item;
                    });

                    resolve(items);
                });
            });

            return promise;
            // return $crudService.getItemsLimitBy(collection, countLimit, startAt);
        }

        this.getPreviousItems = (endAt, staffID) => {
            let promise = new Promise((resolve, reject) => {
                var query = collection;

                if (staffID)
                    query = query.where('publisher', '==', staffID);

                query = query.
                    where('template.type', '==', 'communication').
                    orderBy('created_time').
                    limit(countLimit);

                if (endAt)
                    query = query.endBefore(endAt);

                query.onSnapshot(snapShot => {
                    let items = snapShot.docs.map(documentSnapshot => {
                        let item = documentSnapshot.data();
                        item.id = documentSnapshot.id;
                        return item;
                    });

                    resolve(items);
                });
            });

            return promise;
            // return $crudService.getPreviousItems(collection, endAt, countLimit);
        }

        this.getLastQuery = () => {
            return new Promise((resolve, reject) => {
                collection.
                    where('template.type', '==', 'communication').
                    orderBy('created_time', 'desc').
                    limit(1).
                    onSnapshot(snapShot => {
                        let query = snapShot.docs.length > 0 ? snapShot.docs[0].data() : {};

                        resolve(query);
                    })
            })
        }

        this.getRelatedDocuments = (queryID) => {
            var relatedCollections = ['receipt'];
            var relatedDocuments = [];

            relatedCollections.forEach((value, index) => {
                var promise = new Promise((resolve, reject) => {
                    db.collection(value).
                        where('reference.id', '==', queryID).
                        onSnapshot(snapShot => {
                            resolve(snapShot.docs);
                        })
                })
                relatedDocuments.push(promise);
            });


            return new Promise((resolve, reject) => {
                Promise.all(relatedDocuments).
                    then(result => {
                        var documents = result.flat().map(value => {
                            var document = value.data();
                            document.id = value.id;
                            return document;
                        });
                        resolve(documents);
                    })
            });
        }

        this.getAccounts = (agencyID) => {
            return new Promise((resolve, reject) => {
                db.collection('accounts').
                    where(`${agencyID}.active`, '==', true).
                    onSnapshot(snapshot => {
                        var accounts = snapshot.docs.map(item => {
                            let account = item.data();
                            account.id = item.id;
                            return account;
                        });
                        resolve(accounts);
                    })
            });
        }

        this.getCurrentUser = (userID) => {
            return new Promise((resolve, reject) => {
                db.collection('accounts').
                doc(userID).
                onSnapshot(snapshot => {
                    var user = snapshot.data();
                    user.id = snapshot.id;
                    resolve(user);
                })
            })
        }

        this.getReceipients = (documentID, senderID) => {
            return new Promise((resolve, reject) => {
                db.collection('doc_transactions').
                where('document.id', '==', documentID).
                where('sender.id', '==', senderID).
                onSnapshot(snapshot => {
                    var receipients = snapshot.docs.map(document => {
                        let receipient = document.data();
                        receipient.id = document.id;
                        return receipient;
                    });
                    resolve(receipients);
                })
            })
        }
    })