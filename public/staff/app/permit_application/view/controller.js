'use strict';

myAppModule.controller('permit_application_transaction_controller', function (
    $scope, $http, $mdDialog, $localStorage) {

    $scope.is_loading = false;
    $scope.is_transaction_selected = false;
    $scope.application = undefined;
    $scope.application_templates = [];
    $scope.permit_application_list = [];
    $scope.total_query_size = 0;
    $scope.query_limit = 10;
    $scope.pointer_query_array = [];
    var last_query_doc;

    $scope.load_permit_applications = (query,decrement,is_initial)=>{
        query.get().then( async (qs) => {
            if(!qs.empty){
                let results = qs.docs.map( d => {
                    let item = d.data();
                    item.id = d.id;
                    return item;
                } );

                last_query_doc = qs.docs[qs.docs.length - 1];
                $scope.permit_application_list = results;

                if(is_initial || !decrement)
                    $scope.pointer_query_array.push(qs.docs[0].data().date);
                
                $scope.$apply();
                //lazy load next items
                if(qs.docs.length == $scope.query_limit){
                    db.collection("transactions")
                    .orderBy("date","desc")
                    .limit($scope.query_limit)
                    .startAfter(last_query_doc)
                    .get();
                }
            }
        });
    };

    db.collection('transactions').onSnapshot( qs => {
        $scope.total_query_size = qs.size;
        let query_set = db.collection("transactions")
        .orderBy("date","desc")
        .limit($scope.query_limit);
        $scope.load_permit_applications(query_set,false,true);
    });

    $scope.next_query_items = ()=>{
        let query_set = db.collection("transactions")
        .orderBy("date","desc")
        .limit($scope.query_limit)
        .startAfter(last_query_doc);
        $scope.load_permit_applications(query_set);
    };

    $scope.previus_query_items = ()=>{
        let previous_doc = $scope.pointer_query_array[$scope.pointer_query_array.length - 2];
        $scope.pointer_query_array.splice($scope.pointer_query_array.length - 1,1);
        let query_set = db.collection("transactions")
        .orderBy("date","desc")
        .limit($scope.query_limit)
        .startAt(parseInt(previous_doc));
        $scope.load_permit_applications(query_set,true);
    };

    $scope.find_application = ()=>{
        let find_result;
        Swal.fire({
            title: 'Enter Transaction Number',
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off',
                minlength: 13,
                maxlength: 15
            },
            inputValidator: (value) => {
                if (!value) {
                    return 'Invalid Number!'
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Open Transaction',
            showLoaderOnConfirm: true,
            preConfirm: async(search) => {
                let qs = await db.collection("transactions").where("date","==",parseInt(search)).get();
                
                if(!qs.empty){
                    find_result = qs.docs[0].data();
                    find_result.id = qs.docs[0].id;
                    $scope.select_transaction(find_result);
                    return undefined;
                }else {
                    Swal.showValidationMessage(
                        `Transaction not found!`
                      )
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        });
    };

    //load json data
    $http.get("/json/permitting/templates.json").then(function(data){
        $scope.application_templates = data.data.data; 
    });

    $scope.select_transaction = (transaction)=> {
        $scope.application = transaction;
        // $scope.application.status = 3;
        $scope.is_transaction_selected = true;
    };

    $scope.clear_selected_transaction = ()=> {
        delete($scope.application);
        $scope.is_transaction_selected = false;
    };

    $scope.hasCompleteRequirements = (attached_documents) => {
        return true;
        // return attached_documents.findIndex(document => document.category == 'certificate_of_no_pending_case' ) > -1 && 
        //     attached_documents.findIndex(document => document.category == 'evaluation') > -1;
    }

    $scope.application_draft_modal = '';
    $scope.n = {};
    $scope.createPermit = (application, event) => {
        $scope.permitTemplate = getTemplate(application.name);
        $scope.n = $scope.permitTemplate.convert(application.data.application);
        $scope.n.id = application.id;
        $scope.showPrerenderedDialog(event, $scope.permitTemplate.selectorID);
    }

    function getTemplate(evaluationTemplateName){
        var permitTemplate = null;
        switch(evaluationTemplateName){
            case 'Application for Wildlife Import Certification':
                permitTemplate = { 
                    selectorID: 'wildlifeImportCertWindow', 
                    path: '/permit_application/permit/wildlife_import/view.html',
                    convert: function(data){
                        var wildlifeImportCert = {
                            applicant: {
                                name: data.applicant,
                                address: data.applicant_address
                            },
                            transportation:{},
                            import: {},
                            species: [],
                            attachments: data.attachments
                        }
        
                        if(data.plane){
                            wildlifeImportCert.transportation.type = 'Air';
                            wildlifeImportCert.import.date = data.date_air;
                            wildlifeImportCert.destination_port = data.port_air;
                        }else if(data.carrier){
                            wildlifeImportCert.transportation.type = 'Courrier';
                            wildlifeImportCert.import.date = data.date_postal;
                            wildlifeImportCert.destination_port = data.port_postal;
                        }else if(data.sea){
                            wildlifeImportCert.transportation.type = 'Sea';
                            wildlifeImportCert.import.date = data.date_sea;
                            wildlifeImportCert.destination_port = data.port_sea;
                        }
        
                        data.species.forEach(function(value, index, species){
                            var specimen = {
                                name: value.scientific_name,
                                quantity: `${value.species_qty} ${value.species}`,
                            }
                            wildlifeImportCert.species.push(specimen);
                        })
                        return wildlifeImportCert;
                    }
                    
                };
                break;
            case 'Application for Wildlife Export/Re Export Certification':
                permitTemplate = { 
                    selectorID: 'wildlifeExportCertWindow', 
                    path: '/permit_application/permit/wildlife_export/view.html',
                    convert: function(data){
                        var wildlifeExportCert = {
                            applicant: {
                                name: data.applicant,
                                address: data.applicant_address
                            },
                            transportation:{},
                            export: {},
                            species: [],
                            attachments: data.attachments
                        }
        
                        if(data.plane){
                            wildlifeExportCert.transportation.type = 'Air';
                            wildlifeExportCert.transportation.date = data.date_air;
                            wildlifeExportCert.destination_port = data.port_air;
                        }else if(data.carrier){
                            wildlifeExportCert.transportation.type = 'Courrier';
                            wildlifeExportCert.transportation.date = data.date_postal;
                            wildlifeExportCert.destination_port = data.port_postal;
                        }else if(data.sea){
                            wildlifeExportCert.transportation.type = 'Sea';
                            wildlifeExportCert.transportation.date = data.date_sea;
                            wildlifeExportCert.destination_port = data.port_sea;
                        }
        
                        data.species.forEach(function(value, index, species){
                            var specimen = {
                                name: value.scientific_name,
                                quantity: `${value.species_qty} ${value.species}`,
                            }
                            wildlifeExportCert.species.push(specimen);
                        })
                        return wildlifeExportCert;
                    }
                    
                };
                break;

                case 'Application for Chainsaw Registration':
                        permitTemplate = { 
                            selectorID: 'chainsawRegistrationCertWindow', 
                            path: '/permit_application/permit/chainsaw_registration/view.html',
                            convert: function(data){
                                var chainsawCertificate = {
                                    applicant: {
                                        name: data.applicant,
                                        address: data.applicant_address
                                    },
                                    attachments: data.attachments,
                                    intended_use: data.purpose,
                                    chainsaw: {}
                                }
                                
                                if(data.chainsaw){
                                    permitTemplate.chainsaw = {
                                        brand: data.chainsaw.brand,
                                        model: data.chainsaw.model,
                                        serial_number: data.chainsaw.serial,
                                        horsepower: data.chainsaw.horsepower,
                                        metal_seal_number: data.chainsaw.metal_seal_number
                                    }
                                }
                                return chainsawCertificate;
                            }
                            
                        };
                    break;
        }
        return permitTemplate;
    }
});


