'use strict';

myAppModule.controller('summary_of_information_create_controller', function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.is_loading = false;
    $scope.last_control_number = '';
    $scope.last_control_number_id = '';
    $scope.date = $scope.date_now('YYYY-MM-DD');

    $scope.load_last_number = ()=>{
        db.collection('meta').where('key','==','last_no_for_summary_of_information').onSnapshot( qs => {
            let results = qs.docs.map( d => {
                let item = d.data();
                item.id = d.id;
                return item;
            } );
            if(results.length > 0){
                $scope.last_control_number = results[0].value;
                $scope.last_control_number_id = results[0].id;
            }else {
                db.collection('meta').add({key: 'last_no_for_summary_of_information', value : ''}).then(ref => {
                    $scope.last_control_number_id = ref.id;
                });
            }
            $scope.$apply();
        });
    };

    $scope.n = {
        subject : 'SUMMARY OF INFORMATION',
        template : {
			"name" : "Summary of Information",
			"type" : "report",
			"permit" : false,
			"create" : 	"./app/templates/templates/intelligence/summary_of_information/create.html",
			"edit" : 	"./app/templates/templates/intelligence/summary_of_information/edit.html",
			"print" : 	"./app/templates/templates/intelligence/summary_of_information/print.html",
			"view" : 	"./app/templates/templates/intelligence/summary_of_information/view.html"
        },
        created : $scope.date_now('YYYY-MM-DD'),
        published : $scope.date_now('YYYY-MM-DD'),
        date : $scope.date_now('YYYY-MM-DD'),
        category : 'summary_of_information',
        keywords : []
    };

    $scope.create = (user_id) =>{
        if(user_id !== undefined) {
            $scope.is_loading = true;
            let x = $scope.n;
            x.publisher = user_id;
            x.created_time = Date.now();
            x.status = 'published';
            x.meta = {'published_date': $scope.date_now('YYYY-MM-DD'), 'published_time': Date.now() };
            x.agency = $scope.global.ops;

            x.keywords = x.keywords.filter( (value) => { return (value == undefined || value == '' || value == ' ')? false : true; } );

            try {
                db.collection('documents').add(x).then( (ref) => {
                    if($scope.last_control_number_id !== ''){
                        db.collection('meta').doc($scope.last_control_number_id).update({"value": x.control_number});
                        $scope.last_control_number = x.control_number;
                    }
                    if(ref.id){
                        $scope.toast_s("document created!");
                        x.id = ref.id;
                        $localStorage.data = x;
                        $scope.set_path('/operations/summary_of_information/view');
                    }else {
                        $scope.set_path('/operations/summary_of_information/list/single');
                    }
                });
            } catch (error) {
                console.log(error);
                $scope.toast_e("Sorry, System Error! Reloading...");
                $timeout(()=>{location.reload();},3000);
            }
            
        }else {
            $scope.toast_e("system error, please activate your account for document network.");
        }
    };

});
