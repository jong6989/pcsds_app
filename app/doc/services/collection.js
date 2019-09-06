myAppModule.
service('$collectionService', function(){
    this.getAllKeyValues = (objectCollection) => {
        let property = {};
        objectCollection.forEach(element => {
            let keys = Object.keys(element);
            keys.forEach(key => {
                if(!property[key])
                    property[key] = new Set();
                if(element[key] && isNaN(element[key]))
                    element[key] = element[key]

                property[key].add(element[key]);
            });
        });

        let propertyKeys = Object.keys(property);
        propertyKeys.forEach(key => {
            property[key] = Array.from(property[key]);
        });

        return property;
    }

    this.convertToDropDownOptions = (keyValues) => {
        let keys = Object.keys(keyValues);
        let dropDownOptions = {};

        keys.forEach(key => {
            dropDownOptions[key] = [];
            for(var i = 0; i < keyValues[key].length; i++){
                dropDownOptions[key] .push({ id: i+1, title: keyValues[key][i]});
            }
        })

        return dropDownOptions;
    }
})