myAppModule.
controller('EvaluationController', function($scope){
    const time_key = 'created_time';
    const collection = 'documents';
    $scope.evaluation_forms = [
        { 
            subject: 'Chainsaw Application Evaluation',
            category: 'chainsaw_application_evaluation',
            template: {
                'create' : 	'./app/templates/templates/chainsaw/evaluation/create.html',
			    'edit' : 	'./app/templates/templates/chainsaw/evaluation/edit.html',
			    'print' : 	'./app/templates/templates/chainsaw/evaluation/print.html',
                'view' : 	'./app/templates/templates/chainsaw/evaluation/view.html',
                'list_view_template': './app/templates/templates/chainsaw/evaluation/listview.html'
            }
        },
        {
            subject: 'Wildlife Special Use Permit Evaluation',
            category: 'wsup_evaluation',
            template: {
                'create' : 	'./app/templates/templates/wsup/evaluation/create.html',
			    'edit' : 	'./app/templates/templates/wsup/evaluation/edit.html',
			    'print' : 	'./app/templates/templates/wsup/evaluation/print.html',
                'view' : 	'./app/templates/templates/wsup/evaluation/view.html',
                'list_view_template': './app/templates/templates/wsup/evaluation/listview.html'
                
            }
        }
    ];
    $scope.n = $scope.evaluation_forms[0];

    var viewPath = "/evaluation/view";
    var listPath = "/evaluation/list/all";

    $scope.setSelectedIndex = (index) =>{
        $scope.n = $scope.evaluation_forms[index];
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

            //from Patrol APP
            if($scope.url.has(static_ops_id)){
                $scope.n.ops_id = $scope.url.get(static_ops_id)
            }
            if($scope.url.has(static_latitude)){
                $scope.n.latitude = $scope.url.get(static_latitude)
            }
            if($scope.url.has(static_longitude)){
                $scope.n.longitude = $scope.url.get(static_longitude)
            }
            // end from PAtrol app

            
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
            if($scope.currentItem == undefined) $scope.set_path('/evaluation/create');  
        }
    };

    $scope.ceil = (number) => {
        return Math.ceil(number);
    };

    $scope.items = [];

    $scope.getSelectedEvaluation = (category) => {
        var index = $scope.evaluation_forms.findIndex(item => item.category == category);
        return $scope.evaluation_forms[index];
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
                query = query.where('publisher', '==', publisher)
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