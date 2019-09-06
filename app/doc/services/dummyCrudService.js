var XLSX = require('xlsx');
const uuidv1 = require('uuid/v1');
myAppModule.
service('dummyCrudService', function(){
    let items = [];
    this.getItems = (collection, objectConverter) => {
        // var items = []
        if(!objectConverter)
            objectConverter = defaultObjectConverter;
        
        let promise = new Promise((resolve, reject) => {
            var workbook = XLSX.readFile('./excel/Permit to Sell.xlsx');
            var itemsfromexcel = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet1']).slice(0, 57);
            items = itemsfromexcel.map(element => {
                let snapshot = {};
                if(element.Month_Issued && element.Day_Issued && element.Year_Issued){
                    let date_issued = new Date(`${element.Month_Issued}  ${element.Day_Issued}, ${element.Year_Issued}`);
                    element.Date_Issued = moment(date_issued).format('YYYY-MM-DD');
                }

                snapshot.data = () =>  element ;
                snapshot.id = "";
                
                return objectConverter(snapshot);
            });
            
            resolve(items);
        });

        return promise;
    }

    this.addItem = (itemToAdd, collection) => {
        let promise = new Promise((resolve, reject) => {
            items.push(itemToAdd);
            resolve(itemToAdd);
        })
        return promise;
    }

    this.getItem = (id, collection) => {
        return new Promise((resolve, reject) => {
            resolve(items[0]);
        })
    }

    this.updateItem = (item, collection) => {
        return new Promise((resolve, reject) => {
            console.log(item);
            items[0] = item;
            resolve();
        })
    }

    function defaultObjectConverter(snapshot){
        let item = snapshot.data();
        item.id = snapshot.id;

        return item;
    }
    // convertToChainsawObject = (element) => {
    //     var chainsaw = {
    //         NewCORNumber: element.New_COR_Number || '',
    //         CORNumber: element.COR_Number || '',
    //         Agency: element.Agency || '',
    //         Owner: {
    //             FirstName: element.First_Name || '',
    //             MiddleInitial: element.Middle_Initial || '',
    //             LastName: element.Last_Name || '',
    //             NameExtension: element.Extension_Name || '',
    //             Barangay: element.Barangay || '',
    //             Street: element.Street || '',
    //             Municipality: element.Municipality || ''
    //         },                
    //         MetalSealNumber: element.Metal_Seal_Number || '',
    //         SerialNumber: element.Serial_Number || '',
    //         RegistrationDate: element.Registration_Month && 
    //             element.Registration_Day && element.Registration_Year ? 
    //             new Date(`${element.Registration_Month} ${element.Registration_Day}, ${element.Registration_Year}`) : '',
    //         ExpirationDate: element.Expiration_Month && element.Expiration_Day && element.Expiration_Year ?
    //             new Date(`${element.Expiration_Month} ${element.Expiration_Day}, ${element.Expiration_Year}`): 
    //             '',
    //         LimitationOfUse: element.Limitation_of_Use || '',
    //         Remarks: element.Remarks || '',
    //         Keywords: []
    //     };
        
    //     chainsaw.Keywords = [chainsaw.Owner.FirstName, chainsaw.Owner.MiddleInitial, chainsaw.Owner.LastName, chainsaw.CORNumber].
    //         filter(value =>  value.length > 0);
        
    //     if(chainsaw.RegistrationDate){
    //         chainsaw.Month =  chainsaw.RegistrationDate.getMonth() + 1;
    //         chainsaw.Year = chainsaw.RegistrationDate.getFullYear();
    //         chainsaw.RegistrationDate = chainsaw.RegistrationDate ? moment(chainsaw.RegistrationDate ).format('YYYY-MM-DD'): '' ;
    //     }
    //     chainsaw.ExpirationDate = chainsaw.ExpirationDate ? moment(chainsaw.ExpirationDate ).format('YYYY-MM-DD'): '' ;
    //     return chainsaw;
    // }
}).
service('dummyCriminalCrudService', function(){
    var criminalCases = [{ 
        Criminal_Case_Number: '1234456',
        Date_Filed: "2019-01-01",
        Plaintiff: "People of the Philippines",
        Accused: "Juan dela Cruz et. all",
        NPS_Number: "ABCD1234",
        Search_Warrant: "XYZ987",
        Bail_Amount: "123455.78",
        Complainant: "Batman Inc.",
        Agency_Filed: "Marvel Office",
        Court_Raffled: "Regional Trial Court",
        Respondents: [
            {
                Last_Name: "Potter",
                Middle_Initial: "I",
                First_Name: "Harry",
                Address: "Sesame St., Sta. Monica",
                Municipality: "Hogwartz",
                Province: "Gotham",
                Country: "Atlantis"
            }
        ],
        Violations: "RAPD 1234 Section 456, RAPD 987 Section 3293",
        Apprehended_Items: "3 kg peebles, 5 bakawan trees, 9 heads talking minas",
        Other_Details: "Unlawfully  entered the Philippines Waters with intent to gain and in fact when apprehended they have in their possession, custody and control fishing nets and other fishing equipments",
        Conveyances: "fishing boat with bow. No. 03011",
        Market_Value: "1000000",
        Disposition: "Banned species",
        Apprehension_Address: "Malambunga, Punta Baja Rd.",
        Apprehension_Municipality: "Aborlan",
        Apprehension_Barangay: "Aporawan",
        Apprehension_Date: "2019-02-28",
        Apprehending_Agency: "Philippine National Police",
        Apprehending_Officers: "PO1 Arlan Asutilla, PO2 Boy Langka",
        Form_of_Filing: "Inquest",
        Court_Status: "Pending before RTC",
        Prosecutor_Status: "Preliminary investigation",
        Fiscals_Resolution_Date: "2019-03-31",
        Decision_Date: "2019-03-31",
        Deciding_Agency: "Supreme Court",
        Decision: "Guilty",
        Receipt_Date: "2019-04-1",
        Penalty: "P1,000,000.00"
    },
    { 
        Criminal_Case_Number: '293809',
        Date_Filed: "2019-01-01",
        Plaintiff: "People of the Philippines",
        Accused: "Jong Bautista et. all",
        NPS_Number: "jfksdjf923",
        Search_Warrant: "XYZ987",
        Bail_Amount: "123455.78",
        Complainant: "Batman Inc.",
        Agency_Filed: "Marvel Office",
        Court_Raffled: "Regional Trial Court",
        Respondents: [
            {
                Last_Name: "Potter",
                Middle_Initial: "I",
                First_Name: "Harry",
                Address: "Sesame St., Sta. Monica",
                Municipality: "Hogwartz",
                Province: "Gotham",
                Country: "Atlantis"
            },
            {
                Last_Name: "Hitler",
                Middle_Initial: "Z",
                First_Name: "Adolf",
                Address: "Nazi St., San Rafael",
                Municipality: "Buang",
                Province: "Baliw",
                Country: "Racist"
            }
        ],
        Violations: "RAPD 1234 Section 456, RAPD 987 Section 3293",
        Apprehended_Items: "3 kg peebles, 5 bakawan trees, 9 heads talking minas",
        Other_Details: "constructed and maintained  shanty of about 4 x 5 square meters in size; that Mr. Perfecto Rufino, Jr, brought inside the Sanctuary otorized equipment.",
        Conveyances: "fishing boat with bow. No. 03011",
        Market_Value: "1000000",
        Disposition: "Banned species",
        Apprehension_Address: "Malambunga, Punta Baja Rd.",
        Apprehension_Municipality: "Bataraza",
        Apprehension_Barangay: "Buliluyan",
        Apprehension_Date: "2019-02-28",
        Apprehending_Agency: "Philippine National Police",
        Apprehending_Officers: "PO1 Arlan Asutilla, PO2 Boy Langka",
        Form_of_Filing: "Inquest",
        Court_Status: "Pending before RTC",
        Prosecutor_Status: "Preliminary investigation",
        Fiscals_Resolution_Date: "2019-03-31",
        Decision_Date: "2019-03-31",
        Deciding_Agency: "Supreme Court",
        Decision: "Guilty",
        Receipt_Date: "2019-04-1",
        Penalty: "P1,000,000.00"
    }];;

    this.getItems = (collection, objectConverter) => {
        return new Promise((resolve, reject)=>{
            criminalCases = criminalCases.map(criminalCase => {
                var snapshot = {};
                snapshot.id = uuidv1();
                snapshot.data = () => criminalCase;
                return objectConverter(snapshot);
            })
            resolve(criminalCases);
        });
    }

    this.getItem = (id, collection, objectConverter) => {
        return new Promise((resolve, reject) => {
            var index = criminalCases.findIndex(criminalCase => criminalCase.id == id);
            var snapshot = {};
            snapshot.id = id;
            snapshot.data = () => criminalCases[index];
            var criminalCase = objectConverter(snapshot)

            resolve(criminalCase);
        })
        
    }
    this.addItem = (itemToAdd) => {

        return new Promise((resolve, reject) => {
            criminalCases.push(itemToAdd);
            resolve();
        })
    }

    this.updateItem = (itemToUpdate) => {     
        return new Promise((resolve, reject)=> {
            var index = criminalCases.findIndex(criminalCase => criminalCase.id == itemToUpdate.id);
            criminalCases[index] = itemToUpdate;
            resolve();
        })
    }
    this.updateCounterFor = (item) => {

    }
}).
service('dummyLTPWildlife', function() {
    var wildlifeInspection = {
        purpose: "The quick brown fox",
        origin: "Disneyland",
        species: [
            { name: "turtle", quantity: 100, description: "green turtle", remarks: "Species are mutants"},
            { name: "wild boar", quantity: 34, description: "", remarks: "vegetarian"},
            { name: "peacock", quantity: 12, description: "endangered peacocks", remarks: "Highly radioactive"},
            { name: "anteater", quantity: 92, description: "palawan anteater", remarks: ""} 
        ],
        transporter: {
            name: "Nick Fury",
            address: "Hogwartz"
        },
        consignee: {
            name: "SHIELD",
            address: "Hogwartz"
        },
        recipient:{
            name: "Charles Xavier",
            address: "X Mansion"
        },
        transportation:{
            means: "UFO",
            date: "2023-01-01"
        },
        applicant: {
            TIN: "ABCD1234",
            name: "Juan dela Cruz",
            address: "Missing Rd., Brgy. Binabaha, Dugyot City"
        },
        inspection_date: new Date(),
        certificate_number: "01-01-123456"
    }

    this.getItem = (id, collection, objectConverter) => {
        console.log("Hello")
        return new Promise((resolve, reject) => {
            resolve(wildlifeInspection);
        });
    }
}).
service('dummywildlifeImportService', function() {
    var certification = {
        certification_number: "201-04",
        purpose: "commercial",
        species:[
            {name: "turtle", description: "green turtle", quantity:"3 heads"},
            {name: "eagle", description: "black eagle", quantity:"2 heads"},
            {name: "parrot", description: "yellow parrot", quantity:"7 heads"},
            {name: "snake", description: "red snakes", quantity:"9 heads"},
        ],
        origin: {
            country: "Malaysia"
        },
        destination: {
            city: "Brooke's Point"
        },
        document_attached: "Philippine Constitution",
        import: {
            date: "2010-04-23",
            air_cargo:{ name: "Philippine Airlines", number: "ASD3430", loading_port: "Normandy", loading_date: "2019-05-17"},
            sea_cargo:{  name: "Super Ferry", number: "8909SDFB", loading_port: "NAIA", loading_date: "2019-05-18"},
            postal_cargo:{  name: "LBC", number: "ADS989", loading_port: "ISIS International Airport", loading_date: "2019-06-66"},
        },
        exporter: {
            name: "Juan dela Cruz",
            address: "Missing Rd., Brgy. Binabaha, Dugyot City",
            tin: "29833-334-2902",
            contact_number: "123-456789",
            fax: "987-6423"
        },
        importer: {
            name: "Jon Snow",
            address: "Puerto Princesa City",
            contact_number: "494-3232",
            fax: "499-3299"
        },
        fee: 360.00,
        official_receipt: {
            number: "2105349",
            date: "2019-03-15"
        },
        validator: {
            full_name: "Levita A. Lagrada",
            position: "PDO IV/OIC-EZMED"
        }
    }

    this.getItem = (id, collection, objectConverter) => {
        return new Promise((resolve, reject) => {
            resolve(certification);
        })
    }

    this.getCertification = (certificationNumber) => {
        return new Promise((resolve, reject) => {
            resolve(certification);
        });
    }
}).
service('dummyGratuitousPermitService', function(){
    var gratuitousPermit = {
        applicant:{
            last_name: "dela Cruz",
            first_name: "Juan",
            middle_name: "",
            nationality: "Filipino",
            degree: "BS in Environmental Science",
            employment: {
                agency: "DENR",
                nature: "Government",
                position: "Engineer II",
            },
            cedula: {
                issuance_date: "2019-01-1",
                issuance_address: "Puerto Princesa City",
                number: "CC1234567890"
            },
            photo: "pcsdlogo.png"
        },
            agency: {
                name: "National Geography",
                address: "New York City, USA",
                head: "Donal Trump",
                contact_number: "123456",
                fax_number: "8765432"
            },
        species_to_be_collected: "1 wildboar, 2 red eagle, 3 blue squirrel",
        purpose_of_collection: "Doctoral dissertation",
        places_of_collection: "Aborlan, Narra, Roxas, Puerto Princesa City",
        related_works: "hunting, trekking, diving",
        foriegn_contact: "John Doe",
        local_contact: "Maria Clara"
    };

    this.getItem = (id, collection, objectConverter) =>{
        return new Promise((resolve, reject) => {
            resolve(gratuitousPermit);
        })
    }
}).
service('dummywildlifeExportCertService', function(){
    var wildlifeExportCertification = {
        certification_number: "2019-13",
        applicant: {
            last_name: "Park",
            first_name: "Jong-Seok",
            middle_initial: "",
            agency: "Chungbuk National University"
        },
        gratuitous_permit_number: "2018-39",
        species: [
            { name: "Orthoptera", description: "Preserved Speciment", quantity: "13 pcs"},
            { name: "Blattodea", description: "Preserved Speciment", quantity: "81 pcs"},
            { name: "Hymenoptera", description: "Preserved Speciment", quantity: "166 pcs"},
            { name: "Hemiptera", description: "Preserved Speciment", quantity: "84 pcs"},
            { name: "Coleoptera", description: "Preserved Speciment", quantity: "509 pcs"},
            { name: "Phasmatodea", description: "Preserved Speciment", quantity: "5 pcs"}
        ],
        container: "27 small vials, 7 medium size of containers and 5 packs of Whirl-Pak",
        transportation: {
            valid_from: "2019-06-21",
            valid_until: "2019-07-21",
            type: "Aircraft"
        },
        fee: 310.00,
        official_receipt: {
            number: "2108209",
            date: "2019-06-20"
        },
        issuance_date: "2019-06-21",
        validator: {
            full_name: "Levita A. Lagrada",
            position: "PDO IV/OIC-EZMED"
        }
    };

    wildlifeExportCertification.full_name = `${wildlifeExportCertification.applicant.first_name} 
    ${wildlifeExportCertification.applicant.middle_initial} 
    ${wildlifeExportCertification.applicant.last_name}`;

    this.getCertification = (id) => {
        return new Promise((resolve, reject) => {
            resolve(wildlifeExportCertification);
        });
    }
})