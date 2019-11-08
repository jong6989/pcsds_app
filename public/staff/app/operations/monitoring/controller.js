'use strict';
myAppModule.
    controller('monitoring_controller',
        function ($scope, $localStorage, uuid) {
            $scope.is_loading = false;
            $scope.last_control_number = '';
            $scope.last_control_number_id = '';
            $scope.monitoring_date = $scope.date_now('YYYY-MM-DD');

            $scope.load_last_number = (meta_key) => {
                db.collection('meta').where('key', '==', meta_key).onSnapshot(qs => {
                    let results = qs.docs.map(d => {
                        let item = d.data();
                        item.id = d.id;
                        return item;
                    });
                    if (results.length > 0) {
                        $scope.last_control_number = results[0].value;
                        $scope.last_control_number_id = results[0].id;
                    } else {
                        db.collection('meta').add({ key: meta_key, value: '' }).then(ref => {
                            $scope.last_control_number_id = ref.id;
                        });
                    }
                    $scope.$apply();
                });

                //initialize data from other document
                if ($localStorage.soi_data) {
                    let soi = $localStorage.soi_data;
                    $scope.n.references = "Summary of Information";
                    $scope.n.reference_number = soi.control_number;
                    delete ($localStorage.soi_data);
                }
                if ($localStorage.survrep_data) {
                    let survrep = $localStorage.survrep_data;
                    $scope.n.references = "Surveillance Report";
                    $scope.n.reference_number = survrep.control_number;
                    delete ($localStorage.survrep_data);
                }
            };

            $scope.n = {
                created: $scope.date_now('YYYY-MM-DD'),
                published: $scope.date_now('YYYY-MM-DD'),
                monitoring_date: $scope.date_now('YYYY-MM-DD'),
                keywords: []
            };

            $scope.setCategory = (category) => {
                $scope.n.category = category;
            }
            $scope.setSubject = (subject) => {
                $scope.n.subject = subject;
            }
            $scope.setTemplate = (template) => {
                $scope.n.template = template;
            }

            var viewPath = "";
            $scope.setViewPath = (path) => {
                viewPath = path;
            }

            var listPath = "";
            $scope.setListPath = (path) => {
                listPath = path;
            }

            var createPath = "";
            $scope.setCreatePath = (path) => {
                createPath = path;
            }

            $scope.create = (user_id) => {
                if (user_id !== undefined) {
                    $scope.is_loading = true;
                    $scope.n.publisher = user_id;
                    $scope.n.created_time = Date.now();
                    $scope.n.status = 'published';
                    $scope.n.meta = { 'published_date': $scope.date_now('YYYY-MM-DD'), 'published_time': Date.now() };
                    $scope.n.agency = $scope.global.ops;
                    $scope.n.control_number = uuid.v4();

                    $scope.n.keywords = $scope.n.keywords.filter((value) => {
                        return value != undefined && value.trim() != '';
                    });
                    db.collection('documents').add($scope.n).then((ref) => {
                        if ($scope.last_control_number_id !== '') {

                            db.
                                collection('meta').
                                doc($scope.last_control_number_id).
                                update({ "value": $scope.n.control_number });

                            $scope.last_control_number = $scope.n.control_number;
                        }
                        if (ref.id) {
                            $scope.toast_s("document created!");
                            $scope.n.id = ref.id;
                            $localStorage.data = $scope.n;
                            $scope.set_path(viewPath);
                        } else {
                            $scope.set_path(listPath);
                        }
                    }).
                        catch(error => {
                            console.log(error);
                            $scope.toast_e("Sorry, System Error! Reloading...");
                            $timeout(() => { location.reload(); }, 3000);
                        });
                } else {
                    $scope.toast_e("system error, please activate your account for document network.");
                }
            }
            const time_key = 'created_time';
            const collection = 'documents';
            // const category = 'chainsaw_monitoring';

            $scope.load_data = () => {
                $scope.currentItem = $localStorage.data;
            };

            $scope.ceil = (number) => {
                return Math.ceil(number);
            };

            $scope.load_all = (category, publisher) => {
                $scope.all_items = [];
                $scope.total_query_size = 0;
                $scope.query_limit = 20;
                $scope.pointer_query_array = [];
                let last_query_doc;

                let load_query = (query, decrement, is_initial) => {
                    query.get().then(async (qs) => {
                        if (!qs.empty) {
                            let results = qs.docs.map(d => {
                                let item = d.data();
                                item.id = d.id;
                                return item;
                            });

                            last_query_doc = qs.docs[qs.docs.length - 1];
                            $scope.all_items = results;

                            if (is_initial || !decrement)
                                $scope.pointer_query_array.push(qs.docs[0].data()[time_key]);

                            $scope.$apply();
                        }
                    });
                };

                $scope.next_query_items = () => {
                    let query_set = getNavigationQuery(category, publisher, 'desc')

                    query_set = query_set.
                        limit($scope.query_limit)
                        .startAfter(last_query_doc);
                    load_query(query_set);
                };

                $scope.previus_query_items = () => {
                    let previous_doc = $scope.pointer_query_array[pointer_query_array.length - 2];
                    $scope.pointer_query_array.splice($scope.pointer_query_array.length - 1, 1);
                    let query_set = getNavigationQuery(category, publisher, 'desc');

                    query_set = query_set.
                        limit($scope.query_limit)
                        .startAt(parseInt(previous_doc));
                    load_query(query_set, true);
                };

                function getNavigationQuery(category, publisher, sortOrder){
                    var query = db.collection(collection)
                        .orderBy(time_key, sortOrder)
                        .where('category', '==', category)

                    if(publisher){
                        query = query_set.where('publisher', '==', publisher)
                    }
                    return query;
                }

                let query = db.collection(collection).
                    where('category', '==', category);

                if (publisher) {
                    query = query.where('publisher', '==', publisher)
                }

                query.
                    onSnapshot(qs => {
                        $scope.total_query_size = qs.size;
                        let query_set = db.collection(collection)
                            .where('category', '==', category)
                            .orderBy(time_key, "desc")
                            .limit($scope.query_limit);
                        load_query(query_set, false, true);
                    });
            };

            $scope.listen_document_change = (callBack) => {
                if ($scope.currentItem) {
                    db.collection(collection).doc($scope.currentItem.id).onSnapshot((res) => {
                        let d = res.data();
                        d.id = res.id;
                        triger_linked(d);
                        $scope.currentItem = d;
                        if (callBack) callBack();
                        $scope.$apply();
                    });
                }
            };

            function triger_linked(x) {
                $scope.load_linked('CHAINSAW CERTIFICATE OF REGISTRATION', 'registration_number', x.registration_number);
                // $scope.load_linked('surveillance_report','control_number', x.reference_number);
            }

            $scope.linked = { show: false };
            $scope.load_linked = (category, ref_key, ref_value) => {
                $scope.linked[category] = [];
                db.collection(collection)
                    .where('subject', '==', category)
                    .onSnapshot((qs) => {
                        if (!qs.empty) {
                            let results = qs.docs.map(d => {
                                let item = d.data();
                                item.id = d.id;
                                return item;
                            });
                            $scope.linked[category] = results;
                            $scope.$apply();
                        }
                    });
            };
        });










