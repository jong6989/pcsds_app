'use strict';

myAppModule.controller('doc_ctrl_pending', function ($scope, $timeout, $mdToast,$mdDialog, func, $localStorage) {
    
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
                $scope.removeFromPending($scope.currentTransaction.id);
                $scope.toast('Document marked as received!');
            } );
            setTimeout( () => {
                $scope.setCurrentItem($scope.currentItem,'received',$scope.currentTransaction);
            }, 200 );
        },()=>{});
    };

    $scope.declineDocument = (evt) => {
        var confirm = $mdDialog.prompt()
        .title('Declining this request.')
        .textContent('why?')
        .placeholder('reason')
        .ariaLabel('Reason')
        .initialValue('Duplicate')
        .targetEvent(evt)
        .required(true)
        .ok('Confirm')
        .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
            $scope.close_dialog();
            doc.db.collection(doc_transactions).doc($scope.currentTransaction.id).update({
                status : 'declined',
                declined : {
                    date : $scope.date_now(),
                    time : Date.now(),
                    reason : result
                }
            }).then( () => {
                $scope.toast('Document declined!');
            } );
            $scope.removeFromPending($scope.currentTransaction.id);
            setTimeout( () => {
                $scope.setCurrentItem(undefined,'draft',undefined);
            }, 200 );
        }, ()=>{} );
    };
    
});