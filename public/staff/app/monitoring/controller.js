myAppModule.
controller('MonitoringController', function($scope){
    const time_key = 'created_time';
    const collection = 'documents';
    $scope.monitoring_forms = [
        { 
            subject: 'Chainsaw Monitoring',
            category: 'chainsaw_monitoring',
            template: {
                'create' : 	'./app/templates/templates/monitoring/chainsaw/create.html',
			    'edit' : 	'./app/templates/templates/monitoring/chainsaw/edit.html',
			    'print' : 	'./app/templates/templates/monitoring/chainsaw/print.html',
                'view' : 	'./app/templates/templates/monitoring/chainsaw/view.html',
                'list_view_template': './app/templates/templates/monitoring/chainsaw/listview.html'
            }
        },
        {
            subject: 'SEP Gravel and Sand',
            category: 'sep_gravel_and_sand_monitoring_report',
            template: {
                'create' : 	'./app/templates/templates/monitoring/gravel_and_sand/create.html',
			    'edit' : 	'./app/templates/templates/monitoring/gravel_and_sand/edit.html',
			    'print' : 	'./app/templates/templates/monitoring/gravel_and_sand/print.html',
                'view' : 	'./app/templates/templates/monitoring/gravel_and_sand/view.html',
                'list_view_template': './app/templates/templates/monitoring/gravel_and_sand/listview.html'
                
            }
        },
        {
            subject: 'Wildlife Special Use Permit (RFF)',
            category: 'wsup_rff_monitoring_report',
            template: {
                'create' : 	'./app/templates/templates/monitoring/rff/create.html',
			    'edit' : 	'./app/templates/templates/monitoring/rff/edit.html',
			    'print' : 	'./app/templates/templates/monitoring/rff/print.html',
                'view' : 	'./app/templates/templates/monitoring/rff/view.html',
                'list_view_template': './app/templates/templates/monitoring/rff/listview.html'
                
            }
        },
        {
            subject: 'SEP Gravel and Sand',
            category: 'sep_monitoring_report',
            template: {
                'create' : 	'./app/templates/templates/monitoring/sep/create.html',
			    'edit' : 	'./app/templates/templates/monitoring/sep/edit.html',
			    'print' : 	'./app/templates/templates/monitoring/sep/print.html',
                'view' : 	'./app/templates/templates/monitoring/sep/view.html',
                'list_view_template': './app/templates/templates/monitoring/sep/listview.html'
                
            }
        },
        {
            subject: 'Chainsaw Special Use Permit Monitoring Report',
            category: 'chainsaw_sup_monitoring_report',
            template: {
                'create' : 	'./app/templates/templates/monitoring/sup/create.html',
			    'edit' : 	'./app/templates/templates/monitoring/sup/edit.html',
			    'print' : 	'./app/templates/templates/monitoring/sup/print.html',
                'view' : 	'./app/templates/templates/monitoring/sup/view.html',
                'list_view_template': './app/templates/templates/monitoring/sup/listview.html'
                
            }
        },
        {
            subject: 'Wildlife Special Use Permit Monitoring Report',
            category: 'wsup_monitoring',
            template: {
                'create' : 	'./app/templates/templates/monitoring/wsup_ao_12/create.html',
			    'edit' : 	'./app/templates/templates/monitoring/wsup_ao_12/edit.html',
			    'print' : 	'./app/templates/templates/monitoring/wsup_ao_12/print.html',
                'view' : 	'./app/templates/templates/monitoring/wsup_ao_12/view.html',
                'list_view_template': './app/templates/templates/monitoring/wsup_ao_12/listview.html'
            }
        }
        
    ];
    $scope.n = $scope.monitoring_forms[0];

    var viewPath = "/monitoring/view";
    var listPath = "/monitoring/list/all";

    $scope.setSelectedIndex = (index) =>{
        $scope.n = $scope.monitoring_forms[index];
    }
    $scope.create = (user_id) => {
        if (user_id !== undefined) {
            $scope.is_loading = true;
            $scope.n.publisher = user_id;
            $scope.n.created_time = Date.now();
            $scope.n.status = 'published';
            $scope.n.meta = { 'published_date': $scope.date_now('YYYY-MM-DD'), 'published_time': Date.now() };
            $scope.n.agency = $scope.global.ops;

            $scope.n.keywords = $scope.n.keywords.filter((value) => {
                return value != undefined && value.trim() != '';
            });

            db.collection('documents').add($scope.n).then((ref) => {
                if (ref.id) {
                    $scope.toast_s("document created!");
                    $scope.n.id = ref.id;
                    $scope.url.set('ID', ref.id)
                    $scope.set_path(viewPath);
                } else {
                    $scope.set_path(listPath);
                }
            }).
                catch(error => {
                    $scope.toast_e("Sorry, an error occured. Please try again.");
                });
        } else {
            $scope.toast_e("Please activate your account for document network.");
        }
    }

    $scope.load_data = () => {
        if($scope.url.has('ID')){
            $scope.currentItem = { id : $scope.url.get('ID') };
        }else {
            $scope.currentItem = $localStorage.data;
            if($scope.currentItem == undefined) $scope.set_path('/monitoring/create');  
        }
    };

    $scope.ceil = (number) => {
        return Math.ceil(number);
    };

    $scope.items = [];

    $scope.getSelectedMonitoring = (category) => {
        var index = $scope.monitoring_forms.findIndex(item => item.category == category);
        return $scope.monitoring_forms[index];
    }

    $scope.listen_document_change = (callBack) => {
        if ($scope.currentItem) {
            db.collection(collection).doc($scope.currentItem.id).onSnapshot((res) => {
                let d = res.data();
                d.id = res.id;
                $scope.currentItem = d;
                if (callBack) callBack();
                $scope.$apply();
            });
        }
    };

    $scope.loadItems = (category, publisher) => {
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
                    $scope.items = results;

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
})