var apprehensionDataConverter = {
    convertToJSON: function(jsonArray){
        var  observable = Observable.create(observer => {

            var apprehensions = [];
            for(var i = 1; i < jsonArray.length; i++){
                var Control_Number = jsonArray[1];
                var Case_ID = jsonArray[2];
                var Violations = jsonArray[3].split(';');
                var Month = jsonArray[4];
                var Day = jsonArray[5];
                var Year = jsonArray[6];
                var Time = jsonArray[7];
                var AO_Sitio = jsonArray[8];
                var AO_Barangay = jsonArray[9];
                var AO_Municipality = jsonArray[10];
                var PA_Sitio = jsonArray[11];
                var PA_Barangay = jsonArray[12];
                var PA_Municipality = jsonArray[13];
                var Apprehending_Agency = jsonArray[14];
                var Remarks = jsonArray[15];
                var apprehension = {
                    Control_Number,
                    Case_ID,
                    Violations,
                    Month,
                    Day,
                    Year,
                    Time,
                    AO_Sitio,
                    AO_Barangay,
                    AO_Municipality,
                    PA_Sitio,
                    PA_Barangay,
                    PA_Municipality,
                    Apprehending_Agency,
                    Remarks
                }
                apprehensions.push(apprehension);
            }

            observer.next(apprehensions);
        });
        
        return observable;
    }
}

var fileReader = {
    getByteArray: (excelFile) =>{
        var observable = Observable.create(observer => {
            var reader = new FileReader();
            reader.onload = function(e) {
                var data = new Uint8Array(e.target.result);
                observer.next(data);                
            };
            reader.readAsArrayBuffer(excelFile);
        });
        return observable;
    }
}

var apprehensionDataExporter = {
    export: (byteArray) => {
        apprehensionDataConverter.convertToJSON(byteArray).then(apprehensions =>{
            console.log(apprehensions);
        })
    }
}

var uploader = {
    upload = (files, exporter) =>{
        fileReader.getByteArray(file[0]).then(byteArray => {
            exporter.export(byteArray);
        });
    }
}
uploader.upload([''], apprehensionDataExporter);
