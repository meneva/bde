var port = process.env.PORT || 3036;
var mysql = require('mysql');
var moment = require('moment');
var express = require('express');
var app = express();
var cors = require('cors');
var mongo = require('mongodb');
var unique = require('array-unique');
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
    res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    next();
});

/*var mycon = mysql.createConnection({
    host: "192.168.14.214",
    user: "sct_bangla",
    password: "sctadmin123",
    database: "bde_pze",
    debug: false
});

mycon.connect(function(err) {
    if (err) throw err;
});*/

var MongoClient = require('mongodb').MongoClient;

var url = "mongodb://192.168.14.213:27017/bde_personal";
app.listen(port, function() {
    console.log('Node.js listening on port ' + port);
})


//search person data...
app.get('/person_data/:id/:fromdate/:todate', cors(), function(req, resp) {
	//console.log(req.params);
    var data={
        id_person:req.params.id,
       // start_time:req.params.givenDate,
		fromdate : req.params.fromdate,
       todate : req.params.todate,
    }
   // process_data(data);
	console.log(data);
   //res.send(process_data(data));
   
   MongoClient.connect(url, function(err, db) {
        if (err){throw err;}
        try {
			//var machine_nr;
            var id_person = parseInt(data.id_person);
			var query = {};
			query.id_person = id_person;
			query.start_time = {};
            query.start_time.$gte = moment(data.fromdate,'YYYY-MM-DD hh:mm:ss').format('YYYY-MM-DD HH:mm:ss');
            query.start_time.$lt = moment(data.todate,'YYYY-MM-DD hh:mm:ss').format('YYYY-MM-DD HH:mm:ss');
			
			console.log(query);
			
			// perfect query: db.getCollection('person_data').find({ id_person:1633, start_time: { '$gte': '2018-02-25 18:00:00', '$lte': '2018-02-27 00:00:00' }})
						
			  db.collection("person_data").find(query).toArray(function(err, result) {
				if (err) throw err;
				//console.log(result.length);
				
		      
	
				//console.log(result);
				var person_info = [];
				for(n=0; n<result.length; n++) 
				
				   { 
				   if(result[n].start_time ==null) { result[n].start_time = Date.now(); }
				     if(result[n].end_time ==null) { result[n].end_time = Date.now(); }
					 
					 if(result[n].auftrag.length>0) {
						 var auftrag = '';
						 for(a=0; a<result[n].auftrag.length; a++)
						     {
								auftrag+= result[n].auftrag[a].auf;
								if(a<result[n].auftrag.length-1) { auftrag+='.'; }
							 }
						     
							 //console.log(auftrag);
						 }

 //previous array ....					 			
//person_info.push({"id":result[n]._id, "start":result[n].start_time,"end_date":result[n].end_time, "section_id":result[n].id_location, "text":"text of "+result[n].id_location, "auftrag":result[n].auftrag, "m_count":result[n].m_count});
person_info.push({"id":n,
                  "mongo_id":result[n]._id,
                  "start":result[n].start_time,
                  "end":result[n].end_time,
                  "resourceId":result[n].id_location,
                  "title":"text of "+result[n].id_location,
				  "id_schicht":result[n].id_schicht,
                  "auftrag":auftrag,
                  "id_schicht":result[n].id_schicht,
                  "m_count":result[n].m_count
                 });

				   } //end of mongo_query for loop...

  console.log(person_info);
				   

var main_array = person_info;

//step_1(get duplicate item and make new array called: only_duplicate)
var only_duplicate = [];

main_array.forEach(function(item) {
    if (only_duplicate.length !== 0) {
        var _isPresent = only_duplicate.find(function(secItem) {
            return secItem.auftrag != item.auftrag || secItem.resourceId != item.resourceId
        })
        if (_isPresent == undefined) {
            only_duplicate.push(item)
        }
    } else {
        only_duplicate.push(item)
    }
})
//console.log(only_duplicate);
/////////////////////////
//step_2(get non-duplicate item and make new array called: left_array)
var non_duplicate_array = [];

remove_duplicates(only_duplicate, main_array);

 for (var i = 0, len = main_array.length; i < len; i++) {
     non_duplicate_array.push({
       "id": main_array[i].id,
    "mongo_id": main_array[i].mongo_id,
    "start": main_array[i].start,
    "end": main_array[i].end,
    "resourceId": main_array[i].resourceId, 
	"id_schicht":main_array[i].id_schicht,
	 "title": main_array[i].title,
    "auftrag": main_array[i].auftrag,
    "m_count": main_array[i].m_count
   
     });
 }
//console.log(non_duplicate_array);

function remove_duplicates(a, b) {
    for (var i = 0, len = a.length; i < len; i++) {
        for (var j = 0, len2 = b.length; j < len2; j++) {
            if (a[i].auftrag === b[j].auftrag && a[i].resourceId === b[j].resourceId) {
                b.splice(j, 1);
                len2=b.length;
            }
        }
    }


}


/////////////////
//step_3(get min_start_time and max_end_time from the only_dupliate array created in step_1)


var max = null;
var min = null;

for (var i = 0; i < only_duplicate.length; i++) {
  var current = only_duplicate[i];
  if (max === null || current.end > max.end) {
    max = current;
  }
  if (min === null || current.start < min.start) {
    min = current;
  }
}
//console.log(min.start+'/'+max.end);

// count total machine in the modified time array...
Array.prototype.sum = function (prop) {
    var total = 0
    for ( var i = 0, _len = this.length; i < _len; i++ ) {
        total += this[i][prop]
    }
    return total
}

var total_machine_in_duplicate_array = only_duplicate.sum("m_count");

//step_4(loop through only_duplicate array only once to push newly start_time and end_time)
var modified_time_array = [];
for(x=0; x<only_duplicate.length; x++){
 
  modified_time_array.push({
  
    "id": only_duplicate[x].id+1,
    "mongo_id": only_duplicate[x].mongo_id,
    "start": min.start,
    "end": max.end,
    "resourceId": only_duplicate[x].resourceId,
	"id_schicht":only_duplicate[x].id_schicht,
    "title": only_duplicate[x].title,
    "auftrag": only_duplicate[x].auftrag,
    "m_count": total_machine_in_duplicate_array
  
  
  });
  break;
 
 
}

//console.log(modified_time_array);


////step_5(finally merge step_2 with step_4 and get the final array to pass to frontEnd)

Array.prototype.push.apply(non_duplicate_array,modified_time_array);
var final_array = [];

for(y=0; y<non_duplicate_array.length; y++){
 
  final_array.push({
  
    "id": y+1,
    "mongo_id": non_duplicate_array[y].mongo_id,
    "start": non_duplicate_array[y].start,
    "end": non_duplicate_array[y].end,
    "resourceId": non_duplicate_array[y].resourceId,
	"id_schicht":non_duplicate_array[y].id_schicht,
    "title": non_duplicate_array[y].title,
    "auftrag": non_duplicate_array[y].auftrag,
    "m_count": non_duplicate_array[y].m_count
  
  
  });
  
 
 
}

//console.log(final_array);



				
				console.log(final_array);
				
				db.close();
				
				resp.send(final_array);
			  });
			
        } catch (e) {
            console.log(e);
        }
    });
   
   
   
   
   
})

