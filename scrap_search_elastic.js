var request = require('request');
var cheerio = require('cheerio');
var $ = require('jquery');
var result_array = []
function googleApi(companyName, placeName, phoneNumber, fn) {
    var result = {};
    //phoneNumber = phoneNumber.replace(/-|\s/g,"");
    request({
        headers: {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
            'Accept-Encoding': 'none',
            'Accept-Language': 'en-US,en;q=0.8',
            'Connection': 'keep-alive'},
        method:'GET',
        uri:'https://maps.googleapis.com/maps/api/place/textsearch/json?query='+companyName+'+'+placeName+'&key=AIzaSyDmGsYe3OKkpzh15Mg3BweDmYRxmVJP4Lw'},function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var body = JSON.parse(response.body);
            for(var i = 0; i < body['results'].length;i++){
                (function(j){
                    var placeID = body['results'][i]['place_id']
                    var  placeURL = 'https://maps.googleapis.com/maps/api/place/details/json?placeid='+placeID+'&key=AIzaSyDmGsYe3OKkpzh15Mg3BweDmYRxmVJP4Lw';
                    request({
                        headers: {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
                            'Accept-Encoding': 'none',
                            'Accept-Language': 'en-US,en;q=0.8',
                            'Connection': 'keep-alive'},
                        method:'GET',
                        uri:placeURL}, function (error, res, html) {
                        if (!error && res.statusCode == 200) {
                            var body = JSON.parse(res.body);
                            if(body['result'].hasOwnProperty('international_phone_number')){
                                    if(body['result']['international_phone_number'].includes(phoneNumber)) {
                                        if (body['result'].hasOwnProperty('name'))
                                            result['COMPANY_NAME'] = body['result']['name']
                                        if (body['result'].hasOwnProperty('formatted_address'))
                                            result['ADDRESS'] = body['result']['formatted_address']
                                            // console.log(body['result']['formatted_address'])
                                        if (body['result'].hasOwnProperty('international_phone_number'))
                                            result['PHONE_NUMBER'] = body['result']['international_phone_number']
                                            //console.log(body['result']['international_phone_number'])
                                        if (body['result'].hasOwnProperty('types'))
                                            result['TYPE'] = body['result']['types']
                                       // console.log(pay)
                                    //console.log(body['result']['types'])
                                    fn(result);
                                }
                            } else {
                                fn(result);
                            }
                        }
                    })
                })(i);
            }
        }
    }) 
}

function justDail(companyName, placeName, phoneNumber, fn) {
    var result, rightPath, contact = { 'phoneNumber': [], 'type': []};
    phoneNumber = phoneNumber.replace(/-|\s/g,"");
    request({
        headers: {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
            'Accept-Encoding': 'none',
            'Accept-Language': 'en-US,en;q=0.8',
            'Connection': 'keep-alive'},
        method:'GET',
        uri:'https://www.justdial.com/'+placeName+'/'+companyName}, function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            $('li.cntanr').each(function(i, element){
                if (element.children[3].children[1].children[3].children[1].children[13].children[1].children[0].children) {
                    result = element.children[3].children[1].children[3].children[1].children[13].children[1].children[0].children[0].data;
                }
                if (result) {
                    result = result.replace(/-|\s/g,"")
                }
                if (phoneNumber && result.indexOf(phoneNumber.trim()) !== -1){
                    rightPath = element.attribs['data-href'];
                    return false;
                }
            });
            request({
                headers: {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
                    'Accept-Encoding': 'none',
                    'Accept-Language': 'en-US,en;q=0.8',
                    'Connection': 'keep-alive'},
                method:'GET',
                uri:rightPath}, function (error, response, html) {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    $('a.tel').each(function(i, element){
                        contact['phoneNumber'].push(element.children[0].data)
                    });
                    $('span.adrstxtr').each(function(i, element){
                        contact['adrstxtr'] = element.children[1].children[1].children[0].data
                    });
                    $('span.comp-text.also-list.more a').each(function(i, element){
                        if (element.attribs.title){
                            contact['type'].push(element.attribs.title);
                        }
                    });
                    fn(contact)
                }
            })
        }
    });
}

function elasticSearch(companyName, placeName,fn) {
    var result = [];
    var elasticsearch = require('elasticsearch');
    var client = new elasticsearch.Client({
        host: 'localhost:9200'
    });

    client.search({
        index: placeName,
        type: 'company',
        body: {
            query: {
                multi_match: {
                    fields:  [ "COMPANY_NAME", "REGISTERED_STATE" ],
                    query:     companyName,
                    fuzziness: "AUTO"
                    }
                }
            }
    }).then(function (resp) {
        var hits = resp.hits.hits;
        for(var i = 0; i < resp.hits.hits.length; i++){
            result.push({COMPANY_NAME: resp.hits.hits[i]._source.COMPANY_NAME, COMPANY_CLASS: resp.hits.hits[i]._source.COMPANY_CLASS, REGISTERED_OFFICE_ADDRESS: resp.hits.hits[i]._source.REGISTERED_OFFICE_ADDRESS, PRINCIPAL_BUSINESS_ACTIVITY_AS_PER_CIN : resp.hits.hits[i]._source.PRINCIPAL_BUSINESS_ACTIVITY_AS_PER_CIN});
    }
    fn(result);
    }, function (err) {
        console.trace(err.message);
    });    
}


function combineResult() {
    result = {}
    companyName = "Intuit"
    placeName = "Bangalore"
    phoneNumber = "4176 9200"

    googleApi(companyName, placeName,phoneNumber, function(value) {
    
        console.log("helllo---")
        if(value) {
            if(JSON.stringify(value) === '{}') {
                console.log("hello");
            } else {
                result = JSON.parse(JSON.stringify(value));
                //console.log(result)
                //console.log(value)
                result_array.push(result);
            
            }

            justDail(companyName, placeName,phoneNumber, function(value) {
            console.log("Intuition-Softwdsfsdfare")
            //console.log(value)
            result_array.push(value);
            //console.log(result_array)
            
              if (value) {
                companyName = "jkk"
                placeName = "bihar"
                elasticSearch(companyName, placeName, function(value) {
                    console.log("elasticsearch")
                    //console.log(value)
                    result_array.push(value)
                    console.log(result_array)
                })
                }
            })
        } 

    })        
}
// companyName = "Intuit"
// placeName = "Bangalore"
// phoneNumber = "4176 9200"

// googleApi(companyName, placeName,phoneNumber, function(value) {
// console.log("Intuition-Soft--")
// console.log(value)
// })
combineResult()




// companyName = "hkk"
// placeName = "bihar"
// elasticSearch(companyName, placeName, function(value) {
//         if(JSON.stringify(value) === '{}') {
//             console.log("hello");
//         } else {
//             result = JSON.parse(JSON.stringify(value));

//     }
//     console.log(result)
// })






var express = require("express"), app = express();
app.use(express.static('src'));

app.get('/company/:companyName/place/:placeName', function (req, res) {
    elasticSearch(req.params['companyName'], req.params['placeName'], function(value) {
        if(JSON.stringify(value) === '{}') {
            console.log("hello");
        } else {
            result = JSON.parse(JSON.stringify(value));

    }
    console.log(result)
    res.send(result)
})
    //console.log(result)
   
    })
app.listen(3000);


