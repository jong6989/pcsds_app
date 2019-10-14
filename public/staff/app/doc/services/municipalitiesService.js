myAppModule.
    service("municipalityService", function ($http) {
        this.getMunicipalities = () => {
            var palawanMunicipalities = Object.keys(municipality_list);

            return new Promise((resolve, reject) => {
                resolve(palawanMunicipalities);
            })
        }

        this.addMunicipality = (municipality) => {

        }

        this.getBarangays = (municipalityName) => {
            return new Promise((resolve, reject) => {
                $http.get('/json/profile/municipality.json').
                    then(result => {
                        var barangays = [];
                        var palawanMunicipalities = result.data;
                        var index = palawanMunicipalities["data"].findIndex(municipality =>
                            municipality.name == municipalityName);
                        if (index >= 0) {
                            barangays = palawanMunicipalities["data"][index]["brgy"].
                                map(barangay => barangay.name);
                        }

                        resolve(barangays)
                    });
            })
        }
    });
document.write('<script src="json/palawanMunicipalities.js"></script>')