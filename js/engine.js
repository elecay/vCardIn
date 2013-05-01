
    var storage = navigator.getDeviceStorage("sdcard"), 
    cursor = storage.get('contacts.vcf'); 

    cursor.onerror = function() {
        console.error("Error in: ", cursor.error.name);
    };

    cursor.onsuccess = function() { 
      var file = cursor.result;
      oFReader = new FileReader();
      oFReader.readAsText(file);

      oFReader.onload = function (oFREvent) {
        arr = vCard.initialize(oFREvent.target.result);

        for (var i = 0; i < arr.length; i++){
          var contact = new mozContact();
          person = arr[i];

          contact.init(
            {
              name: person.fn,
              givenName: person.fn.split(' ')[0],
              familyName: person.fn.split(' ')[1],
              email: { type: 'INTERNET', value: 'elecay@gmail.com'}
            }
          );
          var request = navigator.mozContacts.save(contact);

          request.onsuccess = function onsuccess() {
            console.log('Contact saved ok!');
          };

          request.onerror = function onerror() {
            console.log('ERROR on saving contact!');
          };
        }

        
      };

       
    };