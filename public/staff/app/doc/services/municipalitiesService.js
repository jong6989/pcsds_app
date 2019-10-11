myAppModule.
    service("municipalityService", function () {
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
                var barangays = [];
                barangays = municipality_list[municipalityName]["barangay_list"];
                resolve(barangays)
            })
        }
    });
    document.write('<script src="json/palawanMunicipalities.js"></script>')