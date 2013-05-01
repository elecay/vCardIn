//     ____________
//    |            |    A Javascript parser for vCards
//    |  vCard.js  |    Created by Mattt Thompson, 2008
//    |____________|    Released under the MIT License
//
//                      Extended by Sebastián Rajo - @elecay - May/2013


vCard = {
  initialize: function(_input){
    var vc = {};
    var result_array = [];
    this.parse(_input, vc, result_array);
    
    for (var i = 0; i < result_array.length; i++) {
      each_contact = result_array[i];
      each_contact.prototype = vCard.Base;
      result_array[i] = vCard.extend(each_contact, vCard.SingletonMethods);
    }
    return result_array;
  },
  parse: function(_input, fields, res_array) {
    var regexps = {
      start: /^(BEGIN:VCARD)$/i,
      end: /^(END:VCARD)$/i,
      simple: /^(version|fn|title|org)\:(.+)$/i,
      complex: /^([^\:\;]+);([^\:]+)\:(.+)$/,
      key: /item\d{1,2}\./,
      properties: /((type=)?(.+);?)+/
    }
 
    var lines = _input.split(/\r?\n/);
    for (n in lines) {
      line = lines[n];

      if(regexps['start'].test(line))
      {
        fields = {};
      }

      else if(regexps['end'].test(line))
      {
        res_array.push(fields);
      }
      
      else if(regexps['simple'].test(line))
      {
        results = line.match(regexps['simple']);
        key = results[1].toLowerCase();
        value = results[2];
        
        fields[key] = value;
      }
      
      else if(regexps['complex'].test(line))
      {
        results = line.match(regexps['complex']);
        key = results[1].replace(regexps['key'], '').toLowerCase();
        
        properties = results[2].split(';');
        properties = Array.filter(properties, function(p) { return ! p.match(/[a-z]+=[a-z]+/) });
        properties = Array.map(properties, function(p) { return p.replace(/type=/g, '') });
        
        type = properties.pop() || 'default';
        type = type.toLowerCase();
        
        value = results[3];
        value = /;/.test(value) ? [value.split(';')] : value;

        fields[key] = fields[key] || {};
        fields[key][type] = fields[key][type] || [];
        fields[key][type] = fields[key][type].concat(value);
      }
    }
  },
  SingletonMethods: {
    to_html: function() {
      var output = '<div class="vcard">';
      
      if(this.photo)
      {
        output += '<img class="photo" src="data:image/png;base64,' + this.photo['base64'][0] + '" />';
      }
      
      output += '<span class="fn">' + this.fn + '</span>'; // Required
      
      if(this.title)
      {
        output += '<span class="title">' + this.title + '</span>';
      }
      
      if(this.org)
      {
        output += '<span class="org">' + this.org + '</span>';
      }

      output += '<hr/>'
      
      for(type in this.adr)
      {
        for(n in this.adr[type])
        {
          value = this.adr[type][n];
          
          output += '<address class="adr">';
          output += '<span class="type">' + type + '</span>';
          output += '<div class="content">';
        
          adr_fields = ['post-office-box', 'extended-address', 'street-address', 
                        'locality', 'region', 'postal-code', 'country-name'       ]
          for(field in adr_fields)
          {
            if(value[field])
            {      
              output += '<span class="' + adr_fields[field] + '">';
              output += value[field];
              output += '</span>';
            }
          }
        
          output += '</div>';
          output += '</address>';
        }
      }
      
      for(type in this.tel)
      {
        for(n in this.tel[type])
        {
          value = this.tel[type][n];
          output += '<span class="tel">';
          output += '<span class="type">' + type + '</span>';
          output += '<span class="value">' + value + '</span>';
          output += '</span>';
        }
      }
      
      for(type in this.email)
      {
        for(n in this.email[type])
        {
          value = this.email[type][n];
          output += '<span class="email">';
          output += '<span class="type">' + type + '</span>';
          output += '<a class="value" href="mailto:' + value + '">' + value + '</a>';
          output += '</span>';
        }
      }
      
      for(type in this.url)
      {
        for(n in this.url[type])
        {
          value = this.url[type][n];
          output += '<span class="url">';
          output += '<span class="type">' + type + '</span>';
          output += '<a class="value" href="' + value + '">' + value + '</a>';
          output += '</span>';
        }
      }
      
      output += '</div>';
      output = output.replace(/\\n/g, '<br/>');
      return output;
    }
  },
  extend : function(dest, source) {
    for (var prop in source) dest[prop] = source[prop];
    return dest;
  },
  
  Base: {}
}