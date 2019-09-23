'use strict';

myAppModule.controller('login_controller', function ($scope, $timeout, $utils, $mdDialog, $interval, $http) {
    $scope.reg_view = "app/templates/modals/registration/firebase.html";
    $scope.i_agree = false;
    $scope.user_id = 0;
    $scope.is_loading = false;
    $scope.gov_ids = ["Passport","Drivers License","PRC","GSIS","SSS","Postal ID","Voter's ID","School ID"];

    $scope.registerMethod = 'email';
    var uid = '';

    $http.get("/json/profile/nationalities.json").then(function(data){
        $scope.nationalities = data.data.data; 
    });
    
    $http.get("/json/profile/municipality.json").then(function(data){
        $scope.municipalities = data.data.data; 
    });

    $scope.userLogin = (d)=> {
        $scope.is_loading = true;
        firebase.auth().signInWithEmailAndPassword(d.name, d.password)
        .catch( (error)=>{
            Swal.fire({
                type: 'error',
                title: 'Sorry',
                text: error.message
            });
            $scope.is_loading = false;
        } );
        //reload if nothing happen after a minute
        setTimeout(()=>{
            location.reload();
        },60000)
    }
    
    $scope.register = function(d){
        // $scope.is_loading = true;
        // var q = { 
        //     data : d,
        //     callBack : function(data){
        //         $scope.is_loading = false;
        //         if(data.data.status == 0){
        //             $scope.toast(data.data.error + "  : " + data.data.hint);
        //         }else {
        //             $scope.login_attempt({name: d.user_name, password : d.user_pass});
        //         }
        //     }
        // };
        // $utils.api(q);
    };

    $scope.isumbong = (sumbong)=>{
        $scope.is_loading = true;
        db.collection('sumbong').add({"time": Date.now(),"from":'Unknown',"source":'online',"content":sumbong})
        .then(()=>{
            Swal.fire(
                'Salamat sa iyong sumbong!',
                'Patuloy lang na subaybayan ang mga ilegal na operasyon sa ating kalikasan.',
                'success'
              )
        });
        // var q = { 
        //     data : {
        //         action : "database/intel/add",
        //         data : { report : sumbong, source : "online sumbong" }
        //     },
        //     callBack : function(data){
        //         $scope.is_loading = false;
        //         if(data.data.status == 0){
        //             $scope.toast(data.data.error + "  : " + data.data.hint);
        //         }else {
        //             $scope.sumbong = "";
        //             $mdDialog.cancel();
        //             $scope.toast("Salamat sa inyong sumbong, ito ay aming iimbestigahan agad.");
        //         }
        //     }
        // };
        // $utils.api(q);
    }

    $scope.myDate = new Date();

    $scope.minDate = new Date(
        $scope.myDate.getFullYear() - 90,
        $scope.myDate.getMonth(),
        $scope.myDate.getDate()
    );

    $scope.maxDate = new Date(
        $scope.myDate.getFullYear() - 18,
        $scope.myDate.getMonth(),
        $scope.myDate.getDate()
    );

    $scope.register_via_email = (o)=>{
        firebase.auth().createUserWithEmailAndPassword(o.email, o.password)
        .then( async (res)=> {
            uid = res.user.uid;
            let profileExist = await is_user_exists_from_profile(res.user.uid);
            if(!profileExist){
                $scope.current_view  = window.localStorage['current_view'] = 'app/completeProfile/view.html';
            }
            setTimeout(()=>{$scope.is_loading = false;},1000);
            $scope.$apply();
        }).catch(function(error) {
            console.log(error);
            $scope.is_loading = false;
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: 'Something went wrong!',
                footer: error.message
              });
        });
        $scope.is_loading = true;
    };

    $scope.save_profile = async (data)=>{
        $scope.is_loading = true;
        if(uid != ''){
            data.profile_source = 'online permitting';
            firebase.auth().currentUser.updateProfile({metadata: data});
            await db.collection('profile').doc(uid).set(data);
            $scope.is_loading = false;
            Swal.fire(
                'Profile Saved!',
                'We will redirect you to ONLINE PERMITING DASHBOARD',
                'success'
              )
        }else {
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: 'Authentication failed, please try again.',
                footer: error.message
              });
            $scope.reg_view = "app/templates/modals/registration/firebase.html";
        }
    };

});
