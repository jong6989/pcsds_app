myAppModule.
    service('$crudService', function () {
        this.getItems = (collection, objectConverter) => {
            // var items = []
            if (!objectConverter)
                objectConverter = defaultObjectConverter;

            let promise = new Promise((resolve, reject) => {
                collection.onSnapshot(snapShot => {
                    let items = snapShot.docs.map(documentSnapshot => {
                        let item = objectConverter(documentSnapshot);

                        return item;
                    });

                    resolve(items);
                });
            });

            return promise;
        }

        this.getItemsLimitBy = (collection, countLimit, startAt, objectConverter) => {
            if (!objectConverter)
                objectConverter = defaultObjectConverter;

            let promise = new Promise((resolve, reject) => {
                var query = collection.
                    orderBy('control_number').
                    limit(countLimit);

                if (startAt)
                    query = query.startAfter(startAt);

                query.onSnapshot(snapShot => {
                    let items = snapShot.docs.map(documentSnapshot => {
                        let item = objectConverter(documentSnapshot);

                        return item;
                    });

                    resolve(items);
                });
            });

            return promise;
        }

        this.getPreviousItems = (collection, endAt, countLimit, objectConverter) => {
            if (!objectConverter)
                objectConverter = defaultObjectConverter;

            let promise = new Promise((resolve, reject) => {
                var query = collection.
                    orderBy('control_number').
                    limit(countLimit);

                if (endAt)
                    query = query.endBefore(endAt);

                query.onSnapshot(snapShot => {
                    let items = snapShot.docs.map(documentSnapshot => {
                        let item = objectConverter(documentSnapshot);

                        return item;
                    });

                    resolve(items);
                });
            });

            return promise;
        }
        this.getItemsEnteredBy = (staffID, collection, objectConverter) => {
            // var items = []
            if (!objectConverter)
                objectConverter = defaultObjectConverter;

            let promise = new Promise((resolve, reject) => {
                collection.where('entered_by', '==', staffID).onSnapshot(snapShot => {
                    let items = snapShot.docs.map(documentSnapshot => {
                        let item = objectConverter(documentSnapshot);

                        return item;
                    });

                    resolve(items);
                });
            });

            return promise;
        }

        this.getItem = (id, collection, objectConverter) => {
            if (!objectConverter)
                objectConverter = defaultObjectConverter;

            let promise = new Promise((resolve, reject) => {
                collection.doc(id).onSnapshot(documentSnapshot => {
                    let item = objectConverter(documentSnapshot);
                    resolve(item);
                });
            },
                error => {
                    reject(error);
                });

            return promise;
        }

        function defaultObjectConverter(documentSnapshot) {
            let item = documentSnapshot.data();
            item.id = documentSnapshot.id;

            return item;
        }

        this.addItem = (itemToAdd, collection) => {
            let promise = new Promise((resolve, reject) => {
                collection.
                add(itemToAdd).
                then(result => {
                    itemToAdd.id = result.id;
                    resolve(itemToAdd);
                },
                    error => {
                        reject(error);
                    });
            })
            return promise;
        }

        this.updateItem = (item, collection) => {
            let promise = new Promise((resolve, reject) => {
                collection.doc(item.id).update(item).then(result => {
                    resolve();
                },
                    error => { reject(error); });
            })

            return promise;
        }

        this.updateCounterFor = (item, document) => {
            let promise = new Promise((resolve, reject) => {

                var counter = {};
                document.set(counter, { merge: true });
                if (item.Year && item.Month) {
                    counter["yearlyCount.total"] = firebase.firestore.FieldValue.increment(1);
                    counter[`yearlyCount.${item.Year}.total`] = firebase.firestore.FieldValue.increment(1);
                    counter[`yearlyCount.${item.Year}.${item.Month}`] = firebase.firestore.FieldValue.increment(1);
                }

                if (item.Municipality) {
                    counter[`municipalityCount.${item.Municipality}`] = firebase.firestore.FieldValue.increment(1);
                }

                if (Object.keys(counter).length) {
                    document.update(counter).
                        then(result => {

                        },
                            error => {
                                console.log(error);
                            });
                }

            });

            return promise;
        }

        this.getCountByYear = (collection, documentName) => {
            return new Promise((resolve, reject) => {
                collection.when(documentName, (document) => {
                    resolve(document.yearlyCount);
                })
            })

        }

        this.getCountByMunicipality = (collection, documentName) => {
            return new Promise((resolve, reject) => {
                collection.when(documentName, (document) => {
                    resolve(document.municipalityCount);
                })
            })

        }
    })