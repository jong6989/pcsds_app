myAppModule.
    controller('CreateGratuitousPermitController', function ($scope, $ckeditorService, $localStorage) {
        console.log('CreateGratuitousPermitController')
        $localStorage.currentDocTemplate = {};
        $ckeditorService.editorHasCreated = (editor) => {
            if(editor.name === "gratuitous_permit_terms_preview"){
                $scope.$watch('n.gratuitous_permit.gratuitous_permit_terms', function (newValue, oldValue, scope) {
                    editor.setData(newValue);
                });
            }
        }
    }).controller('EditGratuitousPermitController', function ($scope, $ckeditorService, $localStorage) {
        var editorHasInitialized = false;
        $localStorage.currentDocTemplate = {};
        console.log('EditGratuitousPermitController')

        $ckeditorService.editorHasCreated = (edit_terms_editor) => {
            $scope.$watch('currentItem.gratuitous_permit.gratuitous_permit_terms', function (newValue, oldValue, scope) {
                if (!editorHasInitialized && $scope.currentItem.gratuitous_permit.gratuitous_permit_terms) {
                    edit_terms_editor.setData($scope.currentItem.gratuitous_permit.gratuitous_permit_terms);
                    editorHasInitialized = true;
                }
    
            });
    
            edit_terms_editor.on('change', function () {
                $scope.currentItem.gratuitous_permit.gratuitous_permit_terms = this.getData();
                $scope.updateDocument($scope.currentItem.id, 
                    { 'gratuitous_permit.gratuitous_permit_terms': $scope.currentItem.gratuitous_permit.gratuitous_permit_terms})
            });
        }
    }).
    controller('ViewGratuitousPermitController', function($scope, $ckeditorService, $localStorage){
        $localStorage.currentDocTemplate = {};
        console.log('ViewGratuitousPermitController')
        $ckeditorService.editorHasCreated = (editor) => {
            $scope.$watch('currentItem.gratuitous_permit.gratuitous_permit_terms', function (newValue, oldValue, scope) {
                editor.setData($scope.currentItem.gratuitous_permit.gratuitous_permit_terms);
            });
        }
        
    }).
    controller('testController', function ($scope) {
        $scope.createDraft = (n) => {
            $scope.currentItem = n;
        }
    }).
    service('$ckeditorService', function(){
        this.fireInstanceCreatedListener = (editor) =>{
            this.editorHasCreated(editor);
        }
        this.editorHasCreated = (editor) => {}
    }).
    directive('ckeditor', function ($ckeditorService) {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModel) {
                var ckeditor = CKEDITOR.replace(element[0]);
                if (attr.class && attr.class === "no-toolbar") {
                    ckeditor.on('instanceReady', function (event) {
                        document.getElementById(event.editor.id + '_top').style.display = "none";
                        document.getElementById(event.editor.id + '_bottom').style.display = "none";
                    })
                }

                if(!attr.disabled){
                    ckeditor.on('change', function () {
                        ngModel.$setViewValue(this.getData());
                    });
                }
                
                $ckeditorService.fireInstanceCreatedListener(ckeditor);
            }
        };
    });
    // controller('EditGratuitousPermitController', function ($scope, $quillService, $controller) {
    //     $quillService.onEditorCreated = (quillEditor) => {
    //         angular.extend(this, $controller('doc_ctrl_draft', { $scope: $scope }));
    //         // ;
    //         var parentPublishDraft = $scope.publishDraft;
    //         $scope.publishDraft = (item, ev) => {
    //             var contents = quillEditor.getContents();
    //             $scope.currentItem.gratuitous_permit.terms = contents.ops;
    //             parentPublishDraft($scope.currentItem, ev);
    //         }
    //         $scope.$watch('currentItem.gratuitous_permit.terms', function (newValue, oldValue, scope) {
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
    //         $scope.$watch('currentItem.gratuitous_permit.terms', function (newValue, oldValue, scope) {
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
    //         $scope.$watch('currentItem.gratuitous_permit.terms', function (newValue, oldValue, scope) {
    //             var contents = newValue || [] ;
    //             contents.push({ insert: "\n" });
    //             quillEditor.setContents(contents);
    //         })

    //     }
    //     $scope.editor_container = "editor_container_view";
    //     $scope.toolbar_container = "toolbar_container_view";

    // });