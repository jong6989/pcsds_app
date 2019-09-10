
myAppModule.
controller('WSUPOtherUsesController', function($scope) {
    var permit = {
        type: "COMMERCIAL",
        use_for: "EDUCATIONAL/DOCUMENTATION",
        specy_kingdom: [ "animal"],
        date_filed: "2019-04-14",
        applicant: {
            full_name: "Juan dela Cruz",
            country: "Philippines",
            citizenship: "Filipino",
            birthdate: "1984-05-05",
            birthplace: "Puerto Princesa City",
            address: "Brgy. Sta. Monica, Puerto Princesa City, Palawan",
            contact_number: "09211234567",
            business: {
                address: "Brgy. Sta. Monica, Puerto Princesa City, Palawan",
                contact_number: "09217654321"
            },
            occupation: "Computer Programmer",
            civil_status: "single",
            spouse: { name: "Gigi Hadid" },
            group_membership: [ "Palawan Developer's Group", ""],
            TIN: "1234-56789-0",
            photo: "img1.jpg",
            age: 25
        },
        species: [
            { kind: "green turtile", quantity: 1 },
            { kind: "red butterfly", quantity: 3 },
            { kind: "yellow moth", quantity: 4 }
        ],
        collection_method: "net and cages",
        payment:{
            application_fee: 1000.00,
            mode: "cash",
        },
        official_receipt:{
            number: "ABC12345",
            date: ""
        }
    }
    
    $scope.application = {
        data: {
            application: {},
            received: {
                staff: "Maria Clara",
                date: "2019-06-12 01:32:43"
            }            
        },
        status: 1
    };

    $scope.set_application = (data)=> {
        $scope.application.data.application = permit;
    }
    $scope.isSpecyKingdomSelected = (specyKingdom) => {
        return permit.specy_kingdom.includes(specyKingdom);
    }

    $scope.getMark = (permitType, userFor, specyKingdomSelected) => {
        var mark = "X";
        if("RESEARCH" == permit.type && permitType == "RESEARCH"){
            return $scope.isSpecyKingdomSelected(specyKingdomSelected) ? mark : "___";
        }

        if(permit.type == "RESEARCH")
            return "___";

        return permit.type == permitType && userFor == permit.use_for && $scope.isSpecyKingdomSelected(specyKingdomSelected) ?
            mark : "___";
    }

    $scope.isMemberOfAGroup = (applicant) => {
        return applicant.group_membership && applicant.group_membership.length > 0;
    }

    $scope.toString = (collection, key) => {
        var values = key ? collection.map(item => item[key]) : collection;
        return values.join(', ');
    }
}).
controller('DummyLTPWildlifeController', ['$scope', '$localStorage',
    function($scope, $localStorage){
        $scope.transport_date = $scope.currentItem.transport_date;
        $scope.issuance_date = $scope.currentItem.issuance_date;
        $scope.paid_date = $scope.currentItem.paid_date;
    // $localStorage.params = {
    //     data:{
    //         application: {},
    //         received: {
    //             staff: "Maria Clara",
    //             date: "2019-06-12 01:32:43"
    //         },
    //         status: 1
    //     },
    //     date: new Date()
    // };

    // $ltpWildlifeInspection.getItem(0, [], null).then(wildlifeInspection => {
    //     $localStorage.params.data.application = wildlifeInspection;
    //     $scope.ltpWildlifeInspectionTable = $scope.ngTable(wildlifeInspection.species);
    // });

    // $scope.set_application = (data) => {
    //     $scope.application = data;        
    // }

    // $scope.set_certificate = (data) => {
    //     $scope.application = data;        
    // }

    // $scope.render_params = { data: {}}
    // $scope.render_params.data = {
    //     application_no : "2019-01-1234",
    //     line1: "This is to certify that the applicant has undertaken the inspection of wildlife/wildlife derivative and by-products which was produced/gathered from Balabac for the purposes of domestication. The species and its quantity of are as follows:",
    //     line2: "This Certification is being issued upon the request of Mr./Ms.Juan dela Cruz to support his/her application for transport of the above-mentioned specimens to Maria Clara which will be transported on September 04, 2019 through van.",
    //     line3: "Issued this 4th day of September, 2019 in Palawan Council for Sustainable Development Staff (PCSDS) Office, Sta. Monica, Puerto Princesa City.",
    //     species: [
    //         { name: "Orthoptera", quantity: "2 heads", description: "Preserved specimen", remarks: "fresh"},
    //         { name: "Blattodea", quantity: "4 heads", description: "Preserved specimen", remarks: "fresh"},
    //         { name: "Odonata", quantity: "2 heads", description: "Preserved specimen", remarks: "fresh"}
    //     ],
    //     paid_amount: "P1,000",
    //     paid_or_number: "ABCD1234",
    //     paid_date: "September 04, 2019",
    //     sign1: {
    //         name: "Arlan T. Asutilla",
    //         designation: "Programmer",
    //         signature: "xxxxxxxxx"
    //     },
    //     sign2: {
    //         name: "Juan dela Cruz",
    //         designation: "Director",
    //         signature: "xxxxxxxxx"
    //     }
    // }
}]).
controller('WildlifeImportCertificationController', ['$scope', '$localStorage',
function($scope, $localStorage){
    var collection = [];
    

    $localStorage.params  = {
        data:{
            application: {},
            received: {
                staff: "Maria Clara",
                date: "2019-06-12 01:32:43"
            },
            status: 1
        },
        date: new Date()
    };
    
    $scope.getLoadingPort = (transportation) => {
        if(transportation.air_cargo)
            return transportation.air_cargo.loading_port;
        if(transportation.sea_cargo)
            return transportation.sea_cargo.loading_port;
        return transportation.postal_cargo.loading_port;
    }

    $scope.pcsd = {
        head: {
            full_name: "Nelson P. Devandera",
            position: "PCSDS Executive Director"
        }
    }

    $scope.toString = (collection, key) => {
        var values = collection.map(item => item[key]);
        return values.join(', ');
    }


    $scope.set_application = (data) => {
        $scope.application = data;
    }

    $scope.render_params ={ data:{
        application_no: '2019-04',
        applicant:{
            last_name: "Asutilla",
            first_name: "Arlan",
            middle_name: "T",
            address: "Sta. Monica, Puerto Princesa City"
        },
        line1: "This is to certify that Pena Dugasan of Brooke's Point, Palawan, is authorized to import from Sandakan, Sabah, Malaysia, the following for commercial purposes only, provided, that a Non-CITES Export Certification or equivalent permit has been secured from CITES Management Authority/Malaysia.",
        line2: "The above-mentioned Edible's Bird Nest, Wild mushroom and Rat's Ear shall be imported by Pena Dugasan on March 15, 2019 via Cargo Vessel at Brooke's Point Port and have been verified as not included in Appendices I, II and III of Convention on International Trade in Endangered Species of Wild Fauna and Flora (CITES).",
        line3: "Certification fee in the amount of Php 360 was paid under the Palawan Council for Sustainable Development (PCSD) Official Receipt No. 2105349 dated March 15, 2019.",
        line4: "This Certification is not valid without the dry seal of the Palawan Council for Sustainable Development or if contains erasures or altercation.",
        line5: "Issued this 15th day of March, 2019 in Palawan Council for Sustainable Development Staff (PCSDS) Office, Sta. Monica, Puerto Princesa City.",
        species: [
            { name: "Edible's Bird Nest", description: "Preserved Specimen", quantity: "13 pcs"},
            { name: "Wild mushroom", description: "Preserved Specimen", quantity: "81 pcs"},
            { name: "Rat's Ear", description: "Preserved Specimen", quantity: "166 pcs"}
        ],
        sign1: {
            name: "Arlan T. Asutilla",
            designation: "Programmer",
            signature: "xxxxxxxxx"
        },
        sign2: {
            name: "Juan dela Cruz",
            designation: "Director",
            signature: "xxxxxxxxx"
        },
        origin: {
            country: "Malaysia",
            address: "Sandakan, Sabah"
        },
        transportation: {
            type: "Aircraft"
        },
        import: {
            date: "2019-08-01"
        },
        destination_port: "Puerto Princesa International Airport",
        issuance_date: "2019-07-28",
        paid_amount: "1000",
        paid_or_number: "ABCD1234",
        paid_date: "2019-07-28"
    }};

    // $scope.n = $scope.render_params.data;
}]).
controller('GratuitousPermitController', ['$scope', 'dummyGratuitousPermitService', "$localStorage",
    function($scope, $gratuitousPermitService, $localStorage){
    var collection = [];

    $localStorage.params  = {
        data:{
            application: {},
            received: {
                staff: "Maria Clara",
                date: "2019-06-12 01:32:43"
        },
        status: 1
        },
        date: new Date()
    };

    $gratuitousPermitService.getItem(0, []).then(permit => {
        $localStorage.params.data.application = permit;
    });

    $scope.set_application = (data) => {
    
    $scope.application = data;
    }
}]).
controller('WildlifeExportControllerdummy', ['$scope', 'dummywildlifeExportCertService', "$localStorage",
function($scope, 
    $wildlifeExportService, 
    $localStorage){
    $localStorage.params  = {
        data:{
            application: {},
            received: {
                staff: "Maria Clara",
                date: "2019-06-12 01:32:43"
            },
            status: 1
        },
        date: new Date()
    };

    $wildlifeExportService.getCertification(0).then(certification => {
        $localStorage.params.data.application = certification;
    });

    $scope.pcsd = {
        head: {
            full_name: "Nelson P. Devandera",
            position: "PCSDS Executive Director"
        }
    }

    $scope.set_application = (data) => {
        $scope.application = data;
        
    }

    $scope.render_params = {data:{}}
    $scope.render_params.data.application_no = "2019-13";
    $scope.render_params.data.line1 = "This is to certify that Jong-Seok Park of Chunbuk National University, is authorized to export sample specimen for research purposes only by virtue of Gratuitous Permit No. 2018-39 to wit:";
    $scope.render_params.data.line2 = "Contained in 27 small vials, 7 medium size of containers and 5 packs of Whirl-Pak.";
    $scope.render_params.data.line3 = "The above specimens shall be transported on June 21, 2019 and valid until July 21, 2019 via Aircraft and have been verified as not included in Appendices I, II and III of the Convention on on International Trade in Endangered Species of Wild Fauna and Flora (CITES).";
    $scope.render_params.data.line4 = "This Certification is not valid without the dry seal of the Palawan Council for Sustainable Development or if contains erasures or altercation.";
    $scope.render_params.data.line5 = "Certification fee in the amount of Php 310 was paid under the Palawan Council for Sustainable Development (PCSD) Official Receipt No. 2108209 dated June 20, 2019.";
    $scope.render_params.data.line6 = "Issued this 20th day of June, 2019 in Palawan Council for Sustainable Development Staff (PCSDS) Office, Sta. Monica, Puerto Princesa City.";
    $scope.render_params.data.species = [
        { name: "Orthoptera", description: "Preserved Specimen", quantity: "13 pcs"},
        { name: "Blattodea", description: "Preserved Specimen", quantity: "81 pcs"},
        { name: "Hymenoptera", description: "Preserved Specimen", quantity: "166 pcs"},
        { name: "Hemiptera", description: "Preserved Specimen", quantity: "84 pcs"},
        { name: "Coleoptera", description: "Preserved Specimen", quantity: "509 pcs"},
        { name: "Phasmatodea", description: "Preserved Specimen", quantity: "5 pcs"}
    ];
    $scope.render_params.data.sign1 = {
        name: "Arlan T. Asutilla",
        designation: "Programmer",
        signature: "xxxxxxxxx"
    }
    
    $scope.render_params.data.sign2 = {
        name: "Juan dela Cruz",
        designation: "Director",
        signature: "xxxxxxxxx"
    }

    $scope.render_params.data.paid_amount = "P1,000";
    $scope.render_params.data.paid_or_number = "ABCD1234";
    $scope.render_params.data.paid_date = "September 04, 2019";
}]).
controller('dummyPrintController', function($scope){
    $scope.render_params = {
        data:{
            subject: "Application for certification",
            created: "x",
            published: "y",
            source: "Hogwartz",
            description: "The quick brown fox",
            files:[
                { name: "abc.xy", path: "/path/to/file"}
            ]
        }
    }

    $scope.api_address ="/api_address";
})
;