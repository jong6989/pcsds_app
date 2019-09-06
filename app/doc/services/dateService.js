myAppModule.
service('$dateService', function(){
    $this.convertToJSDate = (firebaseDate) => {
        return new Date(firebaseDate.seconds * 1000);
    }
})