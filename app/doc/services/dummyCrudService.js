var XLSX = require('xlsx');
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
    this.getItems = (collection, objectConverter) => {
        return new Promise((resolve, reject)=>{
            var snapshot = {};
            
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
            }];
            snapshot.data = () => criminalCases;
            snapshot.id = "";
            criminalCases = criminalCases.map(criminalCase => {
                var snapshot = {};
                snapshot.id = "";
                snapshot.data = () => criminalCase;
                return objectConverter(snapshot);
            })
            resolve(criminalCases);
        });
    }
})