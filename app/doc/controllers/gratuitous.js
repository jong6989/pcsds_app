myAppModule.
    controller('GratuitousPermitController', function ($scope, $quillService) {
        var preview = CKEDITOR.replace('terms_preview');
            preview.on('instanceReady', function(event){
                document.getElementById(event.editor.id + '_top').style.display = "none";
                document.getElementById(event.editor.id + '_bottom').style.display = "none";
            });

            $scope.$watch('n.terms', function(newValue, oldValue, scope){
                preview.setData(newValue);
            });
    })
    // controller('EditGratuitousPermitController', function ($scope, $quillService, $controller) {
    //     $quillService.onEditorCreated = (quillEditor) => {
    //         angular.extend(this, $controller('doc_ctrl_draft', { $scope: $scope }));
    //         // ;
    //         var parentPublishDraft = $scope.publishDraft;
    //         $scope.publishDraft = (item, ev) => {
    //             var contents = quillEditor.getContents();
    //             $scope.currentItem.terms = contents.ops;
    //             parentPublishDraft($scope.currentItem, ev);
    //         }
    //         $scope.$watch('currentItem.terms', function (newValue, oldValue, scope) {
    //             var contents = newValue || [];
    //             contents.push({ insert: "\n" });
    //             quillEditor.setContents(contents);
    //         });
    //     }
    //     $scope.editor_container = "editor_container_edit";
    //     $scope.toolbar_container = "toolbar_container_edit";

    // }).
    // controller('PrintGratuitousPermitController', function ($scope, $quillService) {

    //     $quillService.onEditorCreated = (quillEditor) => {
    //         quillEditor.disable();
    //         $scope.$watch('currentItem.terms', function (newValue, oldValue, scope) {
    //             var contents = newValue || [];
    //             contents.push({ insert: "\n" });
    //             quillEditor.setContents(contents);
    //         })
    //     }
    //     $scope.editor_container = "editor_container_print";
    //     $scope.toolbar_container = "toolbar_container_print";

    // }).
    // controller('ViewGratuitousPermitController', function ($scope, $quillService) {

    //     $quillService.onEditorCreated = (quillEditor) => {
    //         quillEditor.disable();
    //         $scope.$watch('currentItem.terms', function (newValue, oldValue, scope) {
    //             var contents = newValue || [] ;
    //             contents.push({ insert: "\n" });
    //             quillEditor.setContents(contents);
    //         })

    //     }
    //     $scope.editor_container = "editor_container_view";
    //     $scope.toolbar_container = "toolbar_container_view";

    // });