myAppModule.
service('$addressService', function(){
    var countries = require('./json/coutries.json');
    var philippineProvinces = require('./json/philippineProvinces.json');

    this.getCountries = () =>{
        return new Promise((resolve, reject) => {
            resolve(countries);
        });
    }

    this.getProvinces = (country) => {
        return new Promise((resolve, reject) => {
            resolve(philippineProvinces);
        });
    }

    this.getMunicipalities = (country, province) => {
        return new Promise((resolve, reject) => {
            var municipalities = [];
            if(country.toUpperCase() == 'PHILIPPINES')
                municipalities =  philippineProvinces[province];
            
            resolve(municipalities);
        })
    }

    this.getBarangays = (country, province, municipality) => {
        return new Promise((resolve, reject) => {
            var barangays = [];
            if(country.toUpperCase() == 'PHILIPPINES')
                barangays = philippineProvinces[province][municipality];
            resolve(barangays);
        })
    }
})