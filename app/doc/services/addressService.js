myAppModule.
service('$addressService', function(){
    var countries = [];
    var philippineRegions = require('./json/philippine_region_provinces_municipalities.json');

    this.getCountries = () =>{
        return new Promise((resolve, reject) => {
            resolve(countries);
        });
    }

    this.getProvinces = (country) => {
        return new Promise((resolve, reject) => {
            var provinces = [];
            for(const region in philippineRegions){
                provinces = provinces.concat(Object.keys(philippineRegions[region]["province_list"]));
            }
           resolve(provinces);
        });
    }

    this.getMunicipalities = (country, province) => {
        return new Promise((resolve, reject) => {
            var municipalities = [];
            for(const region in philippineRegions){
                if(philippineRegions[region]["province_list"][province]){
                    municipalities = Object.keys(philippineRegions[region]["province_list"][province]["municipality_list"]);
                    break;
                }
             }

            resolve(municipalities);
        })
    }

    this.getBarangays = (country, province, municipality) => {
        return new Promise((resolve, reject) => {
            var barangays = [];
            if(country.toUpperCase() == 'PHILIPPINES')
            {
                for(const region in philippineRegions){
                    for(const _province in philippineRegions[region]["province_list"]){
                        if(_province !== province) continue;
    
                        for(const _municipality in philippineRegions[region]["province_list"][province]["municipality_list"]){
                            if(_municipality !== municipality) continue;
                            barangays = philippineRegions[region]["province_list"][province]["municipality_list"][municipality]["barangay_list"];
                            break;
                        }
                        break;
                    }
                 }
            }
            resolve(barangays);
        })
    }
})