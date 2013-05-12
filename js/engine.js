/**
* vCardIn for FirefoxOS v0.1
*
* Copyright Sebastián Rajo 2013.
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*
* References:
* 
*   -Mozilla FirefoxOS WebAPI/ContactsAPI (https://wiki.mozilla.org/WebAPI/ContactsAPI)
*/

(function () {

    DEBUG_MODE = true;
    SDCARD = "sdcard";

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
    filesToImport = [];

    storage = navigator.getDeviceStorage(SDCARD);
    navigator.mozContacts.find({});

    refreshBtn = document.querySelector("#refreshBtn");
    refreshBtn.addEventListener ('click', function () {
      load();
    });

    load();

    function load(){

      importSelectedBtn = document.querySelector("#importSelectedBtn");
      $('#item-list li').remove();

      var all_files = storage.enumerate(""); 
      flagError = true;
      flagOk = true;
      all_files.onsuccess = function() {
        while (all_files.result)  {
           var each_file = all_files.result;
          // If this is a vCard
          if (each_file.name.match(/.vcf$/)) { 
            $("#item-list").append('<li><label><input type="checkbox"><span></span>'
              + '</label>' + each_file.name + '</li>');
          }
          all_files.continue(); 
        }
        
        if($('input[type="checkbox"]').size() == 0){
          if(flagError) {
            $("#item-list").append('<li id="addvCard">Please, add a vCard file in your SDCARD, UNPLUG your phone and refresh.</li>');
            $('#importSelectedBtn').removeClass('accept');
            $('#importSelectedBtn').addClass('disabled');
            $("#pickvCard").remove();
            flagError = false;
          }
        } else {
          if(flagOk){
            flagOk = false;
            $("#item-list").prepend('<li id="pickvCard" class="dark">Please, pick one or more files to import.</li>');
            $("#addvCard").remove();
          }
          $('#importSelectedBtn').removeClass('disabled');
          $('#importSelectedBtn').addClass('accept');
          importSelectedBtn.addEventListener('click', function () {
            Lungo.Router.section("progress");
            var filesToImport = $('input[type="checkbox"]:checked').map(function() {
              return $(this).parent().parent().text();
            }).get();
            importFiles(filesToImport, 0, 0);
          });
        }
      };

      all_files.onerror = function(){
        $('#importSelectedBtn').removeClass('accept');
        $('#importSelectedBtn').addClass('disabled');
      }
    }

    deleteAllBtn = document.querySelector("#deleteAllBtn");
    deleteAllBtn.addEventListener ('click', function () {
      Lungo.Notification.confirm({
        icon: 'user',
        title: 'Delete all contacts',
        description: 'With this action you are going to delete all the contacts in your phone.',
        accept: {
          icon: 'checkmark',
          label: 'Do it!',
          callback: function(){
            req = navigator.mozContacts.clear();
            req.onsuccess = function(){
              var notification = navigator.mozNotification.createNotification(
                "vCard Importer", 
                "All your contacts have been deleted."
              );
              notification.show();
            }
            req.onerror = function(){
              console.log("Error on delete contacts DB: " + req.error.name);
            }
          }
        },
        cancel: {
          icon: 'close',
          label: 'No way!',
          callback: function(){  }
        }
      });
    });

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

    function importFiles(filesToImport, pos, totalAdded) {

      if(pos < filesToImport.length){
          contacts_file = storage.get(filesToImport[pos]); 
          contactsImported = 0;
          contactsError = 0;
          totalToAdd = 0;

          contacts_file.onerror = function() {
            var afterNotification = function(){
              Lungo.Router.section("main");
            };
            Lungo.Notification.error(
              "Sorry!",                                                                                   //Title
              "We can't find a vCard file in your SDCARD (or you have to unplug your phone).",            //Description
              "warning",                                                                                  //Icon
              5,                                                                                          //Time on screen
              afterNotification                                                                           //Callback function
            );
            console.error("Error in: ", contacts_file.error.name);
          };

          contacts_file.onsuccess = function() { 
            file = contacts_file.result;
            oFReader = new FileReader();
            oFReader.readAsText(file);

            oFReader.onload = function (oFREvent) {
              iteration = 0;
              var arr = vCard.initialize(oFREvent.target.result);
              totalToAdd = arr.length;

              if(totalToAdd == 0){
                var afterNotification = function(){
                  Lungo.Router.section("main");
                };
                Lungo.Notification.error(
                  "Sorry!",                                             //Title
                  "Your vCard file is not supported. vCard 3.0 only.",  //Description
                  "warning",                                            //Icon
                  5,                                                    //Time on screen
                  afterNotification                                     //Callback function
                );

              }

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
                  porc.text(times + "% for file " + (pos + 1));
                  progress.value = times;

                  if(contactsImported == totalToAdd){
                    importFiles(filesToImport, pos + 1, totalAdded + contactsImported);
                  }
                  
                };

                request.onerror = function() {
                  contactsError++;
                  console.log("ERROR on saving contact: " + request.error.name);
                };

              }
            };
          };

      }
      else if (pos > 0) {
        var afterNotification = function(){
          var notification = navigator.mozNotification.createNotification(
            "vCard Importer", 
            totalAdded + " contacts added successfully."
          );
          notification.show();
          Lungo.Router.section("main");
        };
        Lungo.Notification.success(
          "Success",                                              //Title
          totalAdded + " contacts added successfully.",           //Description
          "check",                                                //Icon
          3,                                                      //Time on screen
          afterNotification                                       //Callback function
        );

      } else {
        var afterNotification = function(){
          Lungo.Router.section("main");
        };
        Lungo.Notification.error(
          "Error",                                          //Title
          "Please, pick at least one file to import.",      //Description
          "warning",                                        //Icon
          3,                                                //Time on screen
          afterNotification                                 //Callback function
        );
      }
    }

})();