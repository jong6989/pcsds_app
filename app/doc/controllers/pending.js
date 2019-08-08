'use strict';

myAppModule.controller('doc_ctrl_pending', function ($scope, $timeout, $utils, $mdToast,$mdDialog, func, $localStorage) {
    
    $scope.receiveDocument = (evt) => {
        var confirm = $mdDialog.confirm()
          .title(`Mark this document as received?`)
          .textContent('are you sure?')
          .ariaLabel('sure')
          .targetEvent(evt)
          .ok('I received this document')
          .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            $scope.close_dialog();
            doc.db.collection(doc_transactions).doc($scope.currentTransaction.id).update({
                status : 'received',
                received : {
                    date : $scope.date_now(),
                    time : Date.now()
                }
            }).then( () => {
                $scope.toast('Document marked as received!');
            } );
            setTimeout( () => {
                $scope.currentClicked = 'received';
                $scope.currentDocSelected = 'received';
            }, 200 );
        },()=>{});
    };
    
});