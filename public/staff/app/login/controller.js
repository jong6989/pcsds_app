'use strict';

myAppModule.controller('login_controller', function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.is_loading = false;
    
    $scope.staffLogin = async (phone,event)=>{
        $scope.is_loading = true;
        let d = await db.collection('staffs').where('phone','==',phone).limit(1).get();
        if(d.empty){
            $scope.is_loading = false;
            Swal.fire({
                type: 'error',
                title: 'Sorry!',
                text: 'Your number is not registered on our system.',
                footer: 'Visit PCSD HR Department for your account'
              })
        }else {
            $scope.showPrerenderedDialog(event,'phoneVerificationModal');
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
            firebase.auth().signInWithPhoneNumber(phone, window.recaptchaVerifier)
            .then(function (confirmationResult) {
                window.confirmationResult = confirmationResult;
                $scope.close_dialog();
                Swal.fire({
                    title: `Enter the verification code sent to ${phone}`,
                    input: 'text',
                    inputAttributes: {
                      autocapitalize: 'off'
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Verify',
                    showLoaderOnConfirm: false,
                    allowOutsideClick: () => !Swal.isLoading()
                  }).then((result) => {
                    if (result.value) {
                        let code = result.value;
                        window.confirmationResult.confirm(code).then(function (result) {
                            // User signed in successfully.
                            var user = result.user;
                            // ...  
                        }).catch(function (error) {
                            Swal.fire({
                                type: 'error',
                                title: 'Oops...',
                                text: 'Verification code is not valid',
                                footer: 'Try agian...'
                              });
                        });
                    }
                    
                  });
            }).catch(function (error) {
                console.log(error);
            });
        }
    };

});
