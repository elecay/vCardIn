/**
* vCard Contacts Importer for FirefoxOS
*
* Created by Sebastián Rajo, May 2013.
* Released under the MIT License.
*
* References:
* 
*   -Mozilla FirefoxOS WebAPI/ContactsAPI (https://wiki.mozilla.org/WebAPI/ContactsAPI)
*/


(function () {

    DEBUG_MODE = true;
    SDCARD = "sdcard";
    CONTACTS_FILE_NAME = "contacts.vcf";

    /*
     * According to RFC-2426 (http://www.ietf.org/rfc/rfc2426.txt)
     */
    POST_OFFICE_BOX = 0;
    EXTENDED_ADDRESS = 1;
    STREET_ADDRESS = 2;
    LOCALITY = 3;
    REGION = 4;
    POSTAL_CODE = 5;
    COUNTRY_NAME = 6;

    porc = $('#porc');
    progress = $("#progressbar")[0];

    if(DEBUG_MODE) {
      // START CLEANING
      req = navigator.mozContacts.clear();
      req.onsuccess = function(){
        console.log("Contact DB clean");
      }
      req.onerror = function(){
        console.log("Error on delete contacts DB: " + req.error.name);
      }
      // END CLEANING
    }

    function extract(person_attribute){
      var response = [];
      for(type in person_attribute) {
        for(n in person_attribute[type]) {
          value = person_attribute[type][n];
          pref = /pref/i.test(type);
          var t = type.split(",")[0];
          // Improve this!!!
          if(t.toUpperCase() == 'INTERNET' || t.toUpperCase() == 'PREF')
            t = "personal";
          element = { type: t.toLowerCase(), value: value, pref: pref };
          response.push(element);
        }
      }
      return response;
    }

    function showDoneBtn(){
      doneBtn = document.querySelector("#done");
      doneBtn.classList.remove('move-down');
      doneBtn.classList.add('move-up');
    }

    storage = navigator.getDeviceStorage(SDCARD), 
      contacts_file = storage.get(CONTACTS_FILE_NAME); 

    // Importer
    var importer = document.querySelector("#import");
    if (importer) {
        importer.onclick = function() {

          storage = navigator.getDeviceStorage(SDCARD), 
            contacts_file = storage.get(CONTACTS_FILE_NAME); 

          contactsImported = 0;
          contactsError = 0;
          totalToAdd = 0;

          contacts_file.onerror = function() {
            console.error("Error in: ", contacts_file.error.name);
          };

          contacts_file.onsuccess = function() { 
            var file = contacts_file.result;
            oFReader = new FileReader();
            oFReader.readAsText(file);



            oFReader.onload = function (oFREvent) {
              iteration = 0;
              var arr = vCard.initialize(oFREvent.target.result);
              totalToAdd = arr.length;

              for (var i = 0; i < totalToAdd; i++) {
                var contact = new mozContact();
                var person = arr[i];

                var addresses = [];
                var emails = extract(person.email);
                var tels = extract(person.tel);
                var urls = extract(person.url);

                for(type in person.adr) {
                  for(n in person.adr[type]) {
                    value = person.adr[type][n];
                    pref = /pref/i.test(type);
                    var t = type.split(",")[0];
                    // Improve this!!!
                    if(t.toUpperCase() == 'INTERNET' || t.toUpperCase() == 'PREF')
                      t = "personal";
                    address = {
                      type: t.toLowerCase(),
                      streetAddress: value[STREET_ADDRESS],
                      locality: value[LOCALITY],
                      region: value[REGION],
                      postalCode: value[POSTAL_CODE],
                      countryName: value[COUNTRY_NAME],
                      pref: pref
                    };
                    addresses.push(address);
                  }
                }

                // leaving just the last value as last name by default
                person.fn = (person.fn == null) ? "" : person.fn;
                names = person.fn.split(" ");
                n = "";
                ln = "";
                if (names.length > 1) {
                  for (var j = 0; j < names.length - 1; j++){
                    n += names[j] + " ";
                  }
                  ln = names[names.length - 1];
                }
                else {
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

                request.onsuccess = function() {
                  contactsImported++;
                  var times = ((contactsImported / totalToAdd) * 100).toFixed(0);
                  porc.text(times + "%");
                  progress.value = times;
                  if(contactsImported == totalToAdd)
                    showDoneBtn();
                };

                request.onerror = function() {
                  contactsError++;
                  console.log("ERROR on saving contact: " + request.error.name);
                };
              }
            }
          };
        };
    }
})();