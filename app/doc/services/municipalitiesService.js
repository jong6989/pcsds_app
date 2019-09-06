myAppModule.
service("municipalityService", function(){
    this.getMunicipalities = () =>{
        var palawanMunicipalities = Object.keys(
                require('./json/palawanMunicipalities.json').municipality_list
                );

        return new Promise((resolve, reject)=>{
            resolve(palawanMunicipalities);
        })
    }

    this.addMunicipality = (municipality) => {

    }

    this.getBarangays = (municipalityName) => {
        return new Promise((resolve, reject) => {  
            var palawanMunicipalities = require('./json/profile/municipality.json');
            var barangays = [];
            var index = palawanMunicipalities["data"].findIndex(municipality => 
                    municipality.name == municipalityName);
            if(index >= 0){
                barangays = palawanMunicipalities["data"][index]["brgy"].
                    map(barangay => barangay.name);
            }
            
            resolve(barangays)
        })
    }
})