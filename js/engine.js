
    contactsImported = 0;
    contactsError = 0;

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
        var arr = vCard.initialize(oFREvent.target.result);

        for (var i = 0; i < arr.length; i++){
          var contact = new mozContact();
          var person = arr[i];

          var emails = [];
          var addresses = [];
          var tels = [];
          var urls = [];

          for(type in person.email) {
            for(n in person.email[type]) {
              value = person.email[type][n];
              email = { type: type, value: value };
              emails.push(email);
            }
          }

          for(type in person.tel) {
            for(n in person.tel[type]) {
              value = person.tel[type][n];
              tel = { type: type, value: value };
              tels.push(tel);
            }
          }
          /*
          * According to RFC-2426 (http://www.ietf.org/rfc/rfc2426.txt)
          */
          var POST_OFFICE_BOX = 0;
          var EXTENDED_ADDRESS = 1;
          var STREET_ADDRESS = 2;
          var LOCALITY = 3;
          var REGION = 4;
          var POSTAL_CODE = 5;
          var COUNTRY_NAME = 6;

          for(type in person.adr) {
            for(n in person.adr[type]) {
              value = person.adr[type][n];
              address = {
                type: type,
                streetAddress: value[STREET_ADDRESS],
                locality: value[LOCALITY],
                region: value[REGION],
                postalCode: value[POSTAL_CODE],
                countryName: value[COUNTRY_NAME]
              };
              addresses.push(address);
            }
          }

          for(type in person.url) {
            for(n in person.url[type]) {
              value = person.url[type][n];
              url = { type: type, value: value };
              urls.push(url);
            }
          }

          // leaving just the last value as last name by default
          names = person.fn.split(' ');
          n = "";
          ln = "";
          if (names.length > 1) {
            for (var j = 0; j < names.length - 1; j++){
              n += names[i] + " ";
            }
            ln = names[names.length - 1];
          } else {
            n = names[0] + " ";
          }

          contact.init(
            {
              name: person.fn,
              givenName: n.substring(0, n.length - 1),
              familyName: ln,
              email: emails,
              url: urls,
              tel: tels,
              adr: addresses,
              org: person.org,
              photo: person.photo,
              jobTitle: person.title,
              bday: person.bday
            }
          );

          var request = navigator.mozContacts.save(contact);

          request.onsuccess = function onsuccess() {
            contactsImported++;
            console.log('Contact saved ok!');
            $('#success').text('Contacts imported succefuly: ' + contactsImported);
          };

          request.onerror = function onerror() {
            contactsError++;
            console.log('ERROR on saving contact!');
            $('#error').text('Contacts with errors: ' + contactsError);
          };
        }

      };
    };

